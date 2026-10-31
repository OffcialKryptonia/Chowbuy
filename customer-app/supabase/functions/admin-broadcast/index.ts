import { admin, handle, HttpError, json, requireAdmin, secret } from '../_shared/util.ts';
import { makeSender, renderEmail, type EmailSettings } from '../_shared/mail.ts';

const ROLES = new Set(['customer', 'rider', 'merchant']);
const PAGE = 300;          // recipients handled per request; the Admin page keeps calling with the returned cursor until done
const CONCURRENCY = 6;

/**
 * Admin only. POST {
 *   kind: 'email' | 'push', roles: ['customer'|'rider'|'merchant'], subject (email subject or push title), body,
 *   test?: true   -> sends only to the calling admin, nothing is logged as a campaign,
 *   broadcastId?, cursor?  -> continue a campaign already started
 * }
 * Returns { broadcastId, sent, failed, done, cursor }. Opted-out people (profiles.marketing_email / marketing_push) are never contacted.
 */
Deno.serve(handle(async (req) => {
  const { user } = await requireAdmin(req);
  const b = await req.json().catch(() => ({}));
  const kind = b.kind === 'push' ? 'push' : b.kind === 'email' ? 'email' : '';
  if (!kind) throw new HttpError(400, 'Choose email or push.');
  const roles: string[] = Array.isArray(b.roles) ? [...new Set<string>(b.roles)].filter((r) => ROLES.has(r)) : [];
  if (!roles.length) throw new HttpError(400, 'Choose who should receive this.');
  const subject = String(b.subject ?? '').trim(), body = String(b.body ?? '').trim();
  if (subject.length < 3 || subject.length > (kind === 'email' ? 150 : 65)) throw new HttpError(400, kind === 'email' ? 'The subject must be 3 to 150 characters.' : 'The title must be 3 to 65 characters.');
  if (body.length < 3 || body.length > (kind === 'email' ? 20000 : 178)) throw new HttpError(400, kind === 'email' ? 'Write the message body.' : 'Push messages are limited to 178 characters.');
  const db = admin();
  const test = b.test === true;

  // Recipients: a keyset page of opted-in users (or just the admin for a test send).
  let rows: { id: string; email: string | null; full_name: string; push_token: any }[] = [];
  if (test) {
    const { data } = await db.from('profiles').select('id,email,full_name,push_token').eq('id', user.id);
    rows = data ?? [];
  } else {
    let q = db.from('profiles').select('id,email,full_name,push_token').in('role', roles).order('id').limit(PAGE + 1);
    q = kind === 'email' ? q.eq('marketing_email', true).not('email', 'is', null) : q.eq('marketing_push', true).not('push_token', 'is', null);
    if (b.cursor) q = q.gt('id', String(b.cursor));
    const { data, error } = await q;
    if (error) throw new HttpError(500, 'Could not load recipients.');
    rows = data ?? [];
  }
  const more = !test && rows.length > PAGE; if (more) rows = rows.slice(0, PAGE);
  const cursor = more ? rows[rows.length - 1].id : null;

  let broadcastId: string | null = b.broadcastId ? String(b.broadcastId) : null;
  if (!test && !broadcastId) {
    const { count } = await db.from('profiles').select('id', { count: 'exact', head: true }).in('role', roles).eq(kind === 'email' ? 'marketing_email' : 'marketing_push', true);
    const { data } = await db.from('broadcasts').insert({ kind, roles, subject, body, total: count ?? 0, created_by: user.id }).select('id').single();
    broadcastId = data?.id ?? null;
  }

  let sent = 0, failed = 0; const errors: string[] = [];
  if (kind === 'email') {
    const { data: set } = await db.from('platform_settings').select('value').eq('key', 'email').maybeSingle();
    const cfg = set?.value as EmailSettings | undefined;
    if (!cfg?.provider || !cfg.fromEmail) throw new HttpError(400, 'Set up your email provider in Admin, Settings, Email first.');
    let sender; try { sender = await makeSender(cfg); } catch (e) { throw new HttpError(400, e instanceof Error ? e.message : 'Email is not configured.'); }
    const footer = 'You are receiving this because you have a ChowBuy account. To stop promotional emails, open the ChowBuy app, then Profile, then Notifications.';
    const queue = rows.filter((r) => r.email);
    const worker = async () => {
      for (let r = queue.shift(); r; r = queue.shift()) {
        const first = (r.full_name || '').split(' ')[0] || 'there';
        const personal = (t: string) => t.replaceAll('{{first_name}}', first);
        const { html, text } = renderEmail(personal(subject), personal(body), footer);
        try { await sender.send({ to: r.email!, subject: (test ? '[Test] ' : '') + personal(subject), html, text }); sent++; }
        catch (e) { failed++; if (errors.length < 3) errors.push(e instanceof Error ? e.message : 'send failed'); }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    await sender.close();
  } else {
    const { data: set } = await db.from('platform_settings').select('value').eq('key', 'public').maybeSingle();
    const provider = set?.value?.push?.provider === 'onesignal' ? 'onesignal' : 'expo';
    const tokens = rows.map((r) => ({ id: r.id, token: r.push_token?.token as string | undefined, sound: (r.push_token?.sound as string | undefined) ?? 'dingtone' })).filter((t) => t.token);
    if (provider === 'onesignal') {
      const key = await secret('onesignal_rest_key'), appId = set?.value?.push?.onesignalAppId;
      if (!key || !appId) throw new HttpError(400, 'OneSignal is selected but the App ID or REST key is missing in Admin, Settings, Realtime & push.');
      const r = await fetch('https://api.onesignal.com/notifications', { method: 'POST', headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: appId, target_channel: 'push', include_aliases: { external_id: rows.map((x) => x.id) }, headings: { en: subject }, contents: { en: body }, data: { type: 'promo' } }) });
      if (r.ok) sent = rows.length; else { failed = rows.length; errors.push('OneSignal ' + r.status); }
    } else {
      const access = await secret('expo_access_token');   // optional: only needed if you turned on "enhanced security" for push in your Expo account
      for (let i = 0; i < tokens.length; i += 100) {
        const chunk = tokens.slice(i, i + 100);
        const r = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(access ? { Authorization: `Bearer ${access}` } : {}) },
          body: JSON.stringify(chunk.map((t) => ({ to: t.token, title: subject, body, sound: t.sound === 'default' ? 'default' : `notif_${t.sound}.wav`, channelId: `orders_${t.sound}`, data: { type: 'promo' } }))) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !Array.isArray(j.data)) { failed += chunk.length; if (errors.length < 3) errors.push('Expo ' + r.status); continue; }
        j.data.forEach((t: any, k: number) => {
          if (t.status === 'ok') sent++; else { failed++; if (t.details?.error === 'DeviceNotRegistered') void db.from('profiles').update({ push_token: null }).eq('id', chunk[k].id); }
        });
      }
    }
  }

  if (broadcastId) {
    const { data: cur } = await db.from('broadcasts').select('sent,failed').eq('id', broadcastId).single();
    await db.from('broadcasts').update({ sent: (cur?.sent ?? 0) + sent, failed: (cur?.failed ?? 0) + failed, ...(more ? {} : { status: 'done', finished_at: new Date().toISOString() }) }).eq('id', broadcastId);
  }
  if (!test) await db.from('audit_log').insert({ actor: user.id, action: `broadcast.${kind}`, meta: { roles, sent, failed } });
  return json({ broadcastId, sent, failed, done: !more, cursor, errors });
}));
