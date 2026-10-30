import { admin, handle, HttpError, json, requireAdmin } from '../_shared/util.ts';

const ALLOWED_SECRETS = new Set([
  'korapay_secret_key', 'korapay_encryption_key', 'pocketfi_secret_key',
  'livekit_api_key', 'livekit_api_secret', 'agora_app_certificate', 'fcm_service_account', 'onesignal_rest_key', 'proxy_call_api_key', 'twilio_auth_token',
  'google_directions_key', 'google_geocoding_key',
  // email providers (smtp_password for SMTP) and push
  'smtp_password', 'resend_api_key', 'sendgrid_api_key', 'brevo_api_key', 'mailgun_api_key', 'postmark_server_token', 'ses_access_key_id', 'ses_secret_access_key', 'expo_access_token',
]);
const mask = (v: string) => (v.length >= 12 ? v.slice(0, 4) + '••••' + v.slice(-4) : '••••••••');

/**
 * Admin Console saves credentials here. Admins only.
 * GET  : { hints } the masked previews of saved secrets. Secret values are never returned.
 * POST { public?: object, secrets?: { name: value } } : merges public settings (what /config/public serves) and stores secrets in platform_secrets.
 */
Deno.serve(handle(async (req) => {
  if (req.method !== 'GET' && req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
  await requireAdmin(req);
  const db = admin();
  if (req.method === 'GET') {
    const [{ data, error: secretsError }, { data: templateRow, error: templatesError }] = await Promise.all([
      db.from('platform_secrets').select('key,hint,updated_at'),
      db.from('platform_settings').select('value,updated_at').eq('key', 'email_templates').maybeSingle(),
    ]);
    if (secretsError || templatesError) throw new HttpError(500, 'Could not load admin settings.');
    return json({ hints: Object.fromEntries((data ?? []).map((r) => [r.key, { hint: r.hint, updatedAt: r.updated_at }])), templates: templateRow?.value ?? null, templatesUpdatedAt: templateRow?.updated_at ?? null });
  }
  const b = await req.json().catch(() => { throw new HttpError(400, 'Request body must be valid JSON.'); });
  if (b.public && typeof b.public === 'object') {
    const { data: cur } = await db.from('platform_settings').select('value').eq('key', 'public').maybeSingle();
    const merged = deepMerge(cur?.value ?? {}, b.public);
    const { error } = await db.from('platform_settings').upsert({ key: 'public', value: merged, updated_at: new Date().toISOString() });
    if (error) throw new HttpError(500, 'Could not save public settings.');
  }
  // Non-secret email settings (provider, sender, host/port, region). Admin-only table row; never part of the public config.
  if (b.email && typeof b.email === 'object') {
    const e = b.email;
    if (!['smtp', 'resend', 'sendgrid', 'brevo', 'mailgun', 'postmark', 'ses'].includes(e.provider)) throw new HttpError(400, 'Choose an email provider.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e.fromEmail ?? ''))) throw new HttpError(400, 'Enter a valid sender email address.');
    const { error } = await db.from('platform_settings').upsert({ key: 'email', value: e, updated_at: new Date().toISOString() });
    if (error) throw new HttpError(500, 'Could not save email settings.');
  }
  if (b.emailTemplates && typeof b.emailTemplates === 'object') {
    const templates = b.emailTemplates;
    if (!Array.isArray(templates.items) || templates.items.length > 100) throw new HttpError(400, 'Email template collection is invalid.');
    const ids = new Set<string>();
    for (const t of templates.items) {
      if (!t || typeof t.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(t.id) || ids.has(t.id) || typeof t.subject !== 'string' || typeof t.html !== 'string' || typeof t.text !== 'string' || typeof t.enabled !== 'boolean') throw new HttpError(400, 'Each template needs a unique valid ID, subject, HTML, text and enabled status.');
      ids.add(t.id);
      if (t.subject.length > 180 || t.html.length > 30000 || t.text.length > 10000) throw new HttpError(400, 'A template exceeds the allowed length.');
    }
    const { error } = await db.from('platform_settings').upsert({ key: 'email_templates', value: templates, updated_at: new Date().toISOString() });
    if (error) throw new HttpError(500, 'Could not save email templates.');
  }
  const saved: string[] = [];
  for (const [k, v] of Object.entries(b.secrets ?? {})) {
    if (!ALLOWED_SECRETS.has(k)) throw new HttpError(400, `Unknown setting ${k}.`);
    if (typeof v !== 'string' || v.length < 8) throw new HttpError(400, `${k} looks too short.`);
    await db.from('platform_secrets').upsert({ key: k, value: v, hint: k === 'fcm_service_account' ? 'service account saved' : mask(v), updated_at: new Date().toISOString() });
    saved.push(k);
  }
  await db.from('audit_log').insert({ action: 'settings.update', meta: { public: !!b.public, email: !!b.email, secrets: saved } });   // names only, never values
  return json({ ok: true, saved });
}));

function deepMerge(a: any, b: any): any {
  if (typeof a !== 'object' || a === null || Array.isArray(a) || typeof b !== 'object' || b === null || Array.isArray(b)) return b;
  const out = { ...a }; for (const k of Object.keys(b)) out[k] = k in a ? deepMerge(a[k], b[k]) : b[k]; return out;
}
