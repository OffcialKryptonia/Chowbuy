import { AwsClient } from 'npm:aws4fetch@1.0.20';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
import { admin, secret } from './util.ts';

export interface EmailSettings {
  provider: 'smtp' | 'resend' | 'sendgrid' | 'brevo' | 'mailgun' | 'postmark' | 'ses';
  fromName: string; fromEmail: string; replyTo?: string;
  smtp?: { host: string; port: number; secure?: boolean; user: string };
  mailgun?: { domain: string; region?: 'us' | 'eu' };
  ses?: { region: string };
}
export interface Mail { to: string; subject: string; text: string; html: string }

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Plain text in, branded HTML out. Everything is escaped; blank lines become paragraphs. */
export function renderEmail(subject: string, body: string, footer: string): { html: string; text: string } {
  const paras = body.trim().split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px;line-height:1.55">${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  const html = `<!doctype html><html><body style="margin:0;background:#FFF8F3;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1F1A17">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#FF5A1F;color:#fff;padding:18px 24px;font-size:22px;font-weight:800">ChowBuy</td></tr>
<tr><td style="padding:24px"><h1 style="margin:0 0 16px;font-size:20px">${esc(subject)}</h1>${paras}</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #EADFD7;color:#6B625D;font-size:12px;line-height:1.5">${esc(footer)}</td></tr>
</table></td></tr></table></body></html>`;
  return { html, text: `${body.trim()}\n\n--\n${footer}` };
}

type Sender = (m: Mail) => Promise<void>;

async function check(r: Response, who: string) {
  if (!r.ok) { const t = await r.text().catch(() => ''); throw new Error(`${who} ${r.status} ${t.slice(0, 120)}`); }
}

/** Builds a sender for the configured provider. Credentials come from platform_secrets (saved from Admin), never from the request. */
export async function makeSender(s: EmailSettings): Promise<{ send: Sender; close: () => Promise<void> }> {
  const from = `${s.fromName} <${s.fromEmail}>`;
  const noop = async () => {};
  switch (s.provider) {
    case 'resend': {
      const key = await need('resend_api_key');
      return { close: noop, send: async (m) => check(await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [m.to], subject: m.subject, html: m.html, text: m.text, reply_to: s.replyTo || undefined }) }), 'Resend') };
    }
    case 'sendgrid': {
      const key = await need('sendgrid_api_key');
      return { close: noop, send: async (m) => check(await fetch('https://api.sendgrid.com/v3/mail/send', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalizations: [{ to: [{ email: m.to }] }], from: { email: s.fromEmail, name: s.fromName }, reply_to: s.replyTo ? { email: s.replyTo } : undefined, subject: m.subject,
          content: [{ type: 'text/plain', value: m.text }, { type: 'text/html', value: m.html }] }) }), 'SendGrid') };
    }
    case 'brevo': {
      const key = await need('brevo_api_key');
      return { close: noop, send: async (m) => check(await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: { name: s.fromName, email: s.fromEmail }, to: [{ email: m.to }], replyTo: s.replyTo ? { email: s.replyTo } : undefined, subject: m.subject, htmlContent: m.html, textContent: m.text }) }), 'Brevo') };
    }
    case 'mailgun': {
      const key = await need('mailgun_api_key'); const d = s.mailgun?.domain; if (!d) throw new Error('Mailgun domain is not set.');
      const host = s.mailgun?.region === 'eu' ? 'api.eu.mailgun.net' : 'api.mailgun.net';
      return { close: noop, send: async (m) => check(await fetch(`https://${host}/v3/${d}/messages`, { method: 'POST', headers: { Authorization: 'Basic ' + btoa('api:' + key) },
        body: new URLSearchParams({ from, to: m.to, subject: m.subject, text: m.text, html: m.html, ...(s.replyTo ? { 'h:Reply-To': s.replyTo } : {}) }) }), 'Mailgun') };
    }
    case 'postmark': {
      const key = await need('postmark_server_token');
      return { close: noop, send: async (m) => check(await fetch('https://api.postmarkapp.com/email', { method: 'POST', headers: { 'X-Postmark-Server-Token': key, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ From: from, To: m.to, Subject: m.subject, HtmlBody: m.html, TextBody: m.text, ReplyTo: s.replyTo || undefined, MessageStream: 'broadcast' }) }), 'Postmark') };
    }
    case 'ses': {
      const accessKeyId = await need('ses_access_key_id'), secretAccessKey = await need('ses_secret_access_key'); const region = s.ses?.region || 'eu-west-1';
      const aws = new AwsClient({ accessKeyId, secretAccessKey, region, service: 'ses' });
      return { close: noop, send: async (m) => check(await aws.fetch(`https://email.${region}.amazonaws.com/v2/email/outbound-emails`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ FromEmailAddress: from, Destination: { ToAddresses: [m.to] }, ReplyToAddresses: s.replyTo ? [s.replyTo] : undefined,
          Content: { Simple: { Subject: { Data: m.subject, Charset: 'UTF-8' }, Body: { Html: { Data: m.html, Charset: 'UTF-8' }, Text: { Data: m.text, Charset: 'UTF-8' } } } } }) }), 'Amazon SES') };
    }
    case 'smtp': {
      const c = s.smtp; if (!c?.host || !c.user) throw new Error('SMTP host and username are required.');
      const pass = await need('smtp_password');
      const client = new SMTPClient({ connection: { hostname: c.host, port: c.port, tls: c.secure ?? c.port === 465, auth: { username: c.user, password: pass } } });
      return { send: async (m) => { await client.send({ from, to: m.to, replyTo: s.replyTo || undefined, subject: m.subject, content: m.text, html: m.html }); }, close: async () => { try { await client.close(); } catch { /* already closed */ } } };
    }
    default: throw new Error('Choose an email provider in Admin first.');
  }
}

async function need(key: string): Promise<string> {
  const v = await secret(key);
  if (!v) throw new Error(`The ${key.replace(/_/g, ' ')} is not saved yet. Add it in Admin, Settings, Email.`);
  return v;
}

/**
 * Sends an enabled Admin-managed template. Missing settings/templates are a no-op so
 * email configuration never blocks a verified payment or other business transaction.
 * Template variables are escaped for HTML; action_url is restricted to HTTPS.
 */
export async function sendTemplateEmail(
  templateId: string,
  to: string | null | undefined,
  variables: Record<string, string | number | null | undefined> = {},
): Promise<'sent' | 'skipped'> {
  if (!to || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(to)) return 'skipped';
  const db = admin();
  const [{ data: settingsRow, error: settingsError }, { data: templatesRow, error: templatesError }] = await Promise.all([
    db.from('platform_settings').select('value').eq('key', 'email').maybeSingle(),
    db.from('platform_settings').select('value').eq('key', 'email_templates').maybeSingle(),
  ]);
  if (settingsError || templatesError) throw new Error('Email settings could not be loaded.');
  const settings = settingsRow?.value as EmailSettings | undefined;
  const templates = templatesRow?.value as { items?: Array<{ id: string; subject: string; html: string; text: string; enabled: boolean }> } | undefined;
  const template = templates?.items?.find((item) => item.id === templateId);
  if (!settings?.provider || !settings.fromEmail || !template?.enabled) return 'skipped';

  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(variables)) {
    let str = value == null ? '' : String(value);
    if (key === 'action_url') {
      try { const url = new URL(str); str = url.protocol === 'https:' ? url.toString() : ''; }
      catch { str = ''; }
    }
    values[key] = str;
  }
  const replace = (source: string, html: boolean) => source.replace(/\\{\\{([a-zA-Z0-9_]+)\\}\\}/g, (_match, key: string) => {
    const value = values[key] ?? '';
    return html ? esc(value) : value;
  });
  const message: Mail = {
    to,
    subject: replace(template.subject, false).slice(0, 180),
    text: replace(template.text, false).slice(0, 10000),
    html: replace(template.html, true).slice(0, 30000),
  };
  const sender = await makeSender(settings);
  try { await sender.send(message); }
  finally { await sender.close(); }
  return 'sent';
}
