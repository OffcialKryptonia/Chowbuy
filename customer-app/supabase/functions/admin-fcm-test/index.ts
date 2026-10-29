import { handle, HttpError, json, requireAdmin, secret } from '../_shared/util.ts';

const enc = new TextEncoder();
const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

function pemToBytes(pem: string): Uint8Array {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const raw = atob(body);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Admin-only live credential check. Obtains a short-lived Google OAuth token but never sends a notification. */
Deno.serve(handle(async (req) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
  await requireAdmin(req);

  const body = await req.json().catch(() => { throw new HttpError(400, 'Request body must be valid JSON.'); });
  const projectId = String(body.projectId ?? '').trim();
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId)) {
    throw new HttpError(400, 'Enter a valid Firebase project ID.');
  }

  const raw = await secret('fcm_service_account');
  if (!raw) throw new HttpError(400, 'No Firebase service account is saved on the server. Paste it in Admin > Settings > Realtime & push, then save settings.');
  let account: { project_id?: string; client_email?: string; private_key?: string; token_uri?: string };
  try { account = JSON.parse(raw); } catch { throw new HttpError(400, 'The saved Firebase service account is not valid JSON. Re-enter it and save.'); }

  if (!account.project_id || !account.client_email || !account.private_key) {
    throw new HttpError(400, 'The saved service account is missing project_id, client_email or private_key.');
  }
  if (account.project_id !== projectId) {
    throw new HttpError(400, 'The Firebase project ID does not match the saved service-account JSON project_id.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = b64url(enc.encode(JSON.stringify({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: account.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 300,
  })));
  const unsigned = header + '.' + claims;
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      'pkcs8',
      pemToBytes(account.private_key),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    );
  } catch {
    throw new HttpError(400, 'The saved Firebase private key could not be read. Re-download the service-account JSON and save it again.');
  }
  const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(unsigned)));
  const assertion = unsigned + '.' + b64url(signature);

  let response: Response;
  try {
    response = await fetch(account.token_uri || 'https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });
  } catch {
    throw new HttpError(502, 'Could not reach Google OAuth. Check the Supabase Edge Function network and try again.');
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.access_token) {
    console.error('FCM OAuth test failed', response.status, result.error || 'unknown');
    const status = response.status === 401 || response.status === 403 ? 400 : 502;
    throw new HttpError(status, 'Google rejected the saved service-account credentials. Confirm the key is active and Firebase Cloud Messaging API is enabled for this project.');
  }

  return json({
    ok: true,
    projectId,
    serviceAccount: account.client_email.replace(/^(.{3}).*(@.*)$/, '$1••••$2'),
    message: 'Google OAuth authentication succeeded. This validates server credentials only; no device notification was sent.',
  });
}));
