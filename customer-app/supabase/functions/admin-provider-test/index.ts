import { admin, handle, HttpError, json, requireAdmin, secret } from '../_shared/util.ts';

const enc = new TextEncoder();
const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

async function liveKitCheck(url: string, apiKey: string, apiSecret: string) {
  let base: URL;
  try {
    base = new URL(url);
    if (base.protocol !== 'wss:' && base.protocol !== 'https:') throw new Error('protocol');
  } catch {
    throw new HttpError(400, 'LiveKit server URL must be a valid wss:// or https:// URL.');
  }
  const httpBase = 'https://' + base.host;
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const claims = b64url(enc.encode(JSON.stringify({
    iss: apiKey, nbf: now - 5, exp: now + 60,
    video: { roomList: true },
  })));
  const unsigned = header + '.' + claims;
  const key = await crypto.subtle.importKey('raw', enc.encode(apiSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(unsigned)));
  const token = unsigned + '.' + b64url(sig);
  let res: Response;
  try {
    res = await fetch(httpBase + '/twirp/livekit.RoomService/ListRooms', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
  } catch {
    throw new HttpError(502, 'Could not reach the LiveKit server. Check the URL and network access.');
  }
  if (!res.ok) {
    console.error('LiveKit credential test rejected', res.status);
    throw new HttpError(res.status === 401 || res.status === 403 ? 400 : 502,
      res.status === 401 || res.status === 403
        ? 'LiveKit rejected the API key/secret or the key lacks room-list permission.'
        : 'LiveKit returned an unexpected response. Check the server URL and project status.');
  }
  return { status: 'verified', message: 'LiveKit authenticated the server-side request successfully.' };
}

async function oneSignalCheck(appId: string, restKey: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appId)) {
    throw new HttpError(400, 'OneSignal App ID must be a UUID.');
  }
  let res: Response;
  try {
    res = await fetch('https://api.onesignal.com/apps/' + encodeURIComponent(appId), {
      headers: { Authorization: 'Key ' + restKey, Accept: 'application/json' },
    });
  } catch {
    throw new HttpError(502, 'Could not reach OneSignal. Try again later.');
  }
  if (!res.ok) {
    console.error('OneSignal credential test rejected', res.status);
    throw new HttpError(res.status === 401 || res.status === 403 ? 400 : 502,
      res.status === 401 || res.status === 403
        ? 'OneSignal rejected the REST API key or it does not have access to this App ID.'
        : 'OneSignal returned an unexpected response. Confirm the App ID and try again.');
  }
  return { status: 'verified', message: 'OneSignal accepted the credentials and returned the configured app.' };
}

/** Provider-specific credential checks. Secrets are read only from the server vault. */
Deno.serve(handle(async (req) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
  await requireAdmin(req);
  const b = await req.json().catch(() => { throw new HttpError(400, 'Request body must be valid JSON.'); });
  const provider = String(b.provider ?? '');
  if (provider === 'livekit') {
    const apiKey = await secret('livekit_api_key');
    const apiSecret = await secret('livekit_api_secret');
    if (!apiKey || !apiSecret) throw new HttpError(400, 'Save the LiveKit API key and secret in Admin settings first.');
    if (typeof b.url !== 'string' || !b.url.trim()) throw new HttpError(400, 'Enter the LiveKit server URL.');
    return json({ provider, ...(await liveKitCheck(b.url.trim(), apiKey, apiSecret)) });
  }
  if (provider === 'onesignal') {
    const restKey = await secret('onesignal_rest_key');
    if (!restKey) throw new HttpError(400, 'Save the OneSignal REST API key in Admin settings first.');
    return json({ provider, ...(await oneSignalCheck(String(b.appId ?? ''), restKey) ) });
  }
  if (provider === 'agora') {
    const appId = String(b.appId ?? '');
    const certificate = await secret('agora_app_certificate');
    if (!/^[0-9a-f]{32}$/i.test(appId)) throw new HttpError(400, 'Agora App ID must contain 32 hexadecimal characters.');
    if (!certificate || !/^[0-9a-f]{32}$/i.test(certificate)) throw new HttpError(400, 'Save a valid 32-character Agora App Certificate first.');
    return json({ provider, status: 'locally_validated', message: 'App ID and certificate formats are valid. Agora does not provide a credential-validation endpoint for this certificate alone, so this is not a remote authentication test.' });
  }
  if (provider === 'proxy') {
    const selected = String(b.selectedProvider ?? '');
    const apiKey = await secret('proxy_call_api_key');
    if (!apiKey) throw new HttpError(400, 'Save the selected masked-call provider API key in Admin settings first.');
    if (selected === 'termii') {
      let res: Response;
      try {
        res = await fetch('https://api.ng.termii.com/api/get-balance?api_key=' + encodeURIComponent(apiKey));
      } catch {
        throw new HttpError(502, 'Could not reach Termii. Try again later.');
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.code === 'invalid_api_key' || data.message?.toLowerCase?.().includes('invalid api')) {
        console.error('Termii credential test rejected', res.status);
        throw new HttpError(res.status === 401 || res.status === 403 ? 400 : 502, 'Termii rejected the API key or returned an unexpected response. Confirm the key and regional API base URL.');
      }
      return json({ provider, selectedProvider: selected, status: 'verified', message: 'Termii accepted the API key and returned an account response. This verifies API access, not that a masked voice number is provisioned.' });
    }
    if (selected === 'at') throw new HttpError(400, 'Africa’s Talking requires its username and voice-enabled account configuration in addition to the API key. Add those fields before enabling a live provider test.');
    if (selected === 'twilio') throw new HttpError(400, 'Twilio Proxy requires an Account SID, Auth Token and Proxy Service SID. The current single API-key field is insufficient to verify a working proxy service.');
    throw new HttpError(400, 'Select a supported masked-call provider.');
  }
  throw new HttpError(400, 'Unsupported provider test.');
}));
