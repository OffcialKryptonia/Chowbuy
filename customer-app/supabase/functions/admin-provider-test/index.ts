import { pocketfiBase, pocketfiHeaders } from '../_shared/pocketfi.ts';
import { admin, handle, HttpError, json, publicSettings, requireAdmin, secret } from '../_shared/util.ts';

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
    if (selected === 'at') {
      const username = String(b.username ?? '').trim();
      if (!username) throw new HttpError(400, 'Enter the Africa’s Talking username.');
      let res: Response;
      try {
        res = await fetch('https://api.africastalking.com/version1/user?username=' + encodeURIComponent(username), {
          headers: { apiKey, Accept: 'application/json' },
        });
      } catch {
        throw new HttpError(502, 'Could not reach Africa’s Talking. Try again later.');
      }
      if (!res.ok) {
        console.error('Africa’s Talking credential test rejected', res.status);
        throw new HttpError(res.status === 401 || res.status === 403 ? 400 : 502,
          res.status === 401 || res.status === 403
            ? 'Africa’s Talking rejected the API key. Confirm the username and account API key.'
            : 'Africa’s Talking returned an unexpected response.');
      }
      const data = await res.json().catch(() => ({}));
      if (data.errorMessage) throw new HttpError(400, 'Africa’s Talking returned an account error. Confirm the username and API key.');
      return json({ provider, selectedProvider: selected, status: 'verified', message: 'Africa’s Talking accepted the API key and username. This verifies account API access, not that voice calling is enabled or a masked number is provisioned.' });
    }
    if (selected === 'twilio') {
      const accountSid = String(b.accountSid ?? '').trim();
      const serviceSid = String(b.serviceSid ?? '').trim();
      const authToken = await secret('twilio_auth_token');
      if (!/^AC[0-9a-f]{32}$/i.test(accountSid)) throw new HttpError(400, 'Enter a valid Twilio Account SID beginning with AC.');
      if (!/^KS[0-9a-f]{32}$/i.test(serviceSid)) throw new HttpError(400, 'Enter a valid Twilio Proxy Service SID beginning with KS.');
      if (!authToken) throw new HttpError(400, 'Save the Twilio Auth Token first.');
      const authorization = 'Basic ' + btoa(accountSid + ':' + authToken);
      let accountRes: Response;
      try {
        accountRes = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + encodeURIComponent(accountSid) + '.json', { headers: { Authorization: authorization } });
      } catch {
        throw new HttpError(502, 'Could not reach Twilio. Try again later.');
      }
      if (!accountRes.ok) {
        console.error('Twilio account credential test rejected', accountRes.status);
        throw new HttpError(accountRes.status === 401 || accountRes.status === 403 ? 400 : 502,
          accountRes.status === 401 || accountRes.status === 403 ? 'Twilio rejected the Account SID/Auth Token.' : 'Twilio account check returned an unexpected response.');
      }
      let serviceRes: Response;
      try {
        serviceRes = await fetch('https://proxy.twilio.com/v1/Services/' + encodeURIComponent(serviceSid), { headers: { Authorization: authorization } });
      } catch {
        throw new HttpError(502, 'Could not reach the Twilio Proxy API.');
      }
      if (!serviceRes.ok) {
        console.error('Twilio Proxy service test rejected', serviceRes.status);
        throw new HttpError(serviceRes.status === 401 || serviceRes.status === 403 ? 400 : 502,
          serviceRes.status === 404 ? 'Twilio authenticated, but the Proxy Service SID was not found in this account.' : serviceRes.status === 401 || serviceRes.status === 403 ? 'Twilio credentials do not have access to this Proxy Service.' : 'Twilio Proxy returned an unexpected response.');
      }
      return json({ provider, selectedProvider: selected, status: 'verified', message: 'Twilio authenticated and the Proxy Service was found. This does not verify that a phone number is assigned or that a live call will complete.' });
    }
    throw new HttpError(400, 'Select a supported masked-call provider.');
  }
  if (provider === 'korapay') {
    const key = await secret('korapay_secret_key');
    if (!key) throw new HttpError(400, 'Save the Korapay secret key first.');
    const live = b.live === true;
    if (!key.startsWith(live ? 'sk_live_' : 'sk_test_')) throw new HttpError(400, `This secret key does not look like a ${live ? 'live (sk_live_…)' : 'sandbox (sk_test_…)'} key. Check the mode you selected.`);
    let res: Response;
    try { res = await fetch('https://api.korapay.com/merchant/api/v1/balances', { headers: { Authorization: 'Bearer ' + key, Accept: 'application/json' } }); }
    catch { throw new HttpError(502, 'Could not reach Korapay. Try again later.'); }
    if (!res.ok) {
      console.error('Korapay credential test rejected', res.status);
      throw new HttpError(res.status === 401 || res.status === 403 ? 400 : 502, res.status === 401 || res.status === 403 ? 'Korapay rejected the secret key.' : 'Korapay returned an unexpected response. Try again.');
    }
    return json({ provider, status: 'verified', message: `Korapay accepted the secret key (${live ? 'live' : 'sandbox'}). This does not prove the webhook URL is set in the Korapay dashboard.` });
  }
  if (provider === 'pocketfi') {
    const key = await secret('pocketfi_secret_key');
    const ps = await publicSettings().catch(() => ({} as Record<string, any>));
    const businessId = String(b.businessId || ps?.gateways?.pocketfi?.businessId || '').trim();
    const live = b.live !== undefined ? !!b.live : !!ps?.gateways?.pocketfi?.live;
    if (!key) throw new HttpError(400, 'Save the Pocketfi secret key (API token) first.');
    if (!businessId) throw new HttpError(400, 'Save your Pocketfi business ID first.');
    let res: Response;
    try { res = await fetch(`${pocketfiBase(live)}/virtual-accounts/fetch?businessId=${encodeURIComponent(businessId)}`, { headers: pocketfiHeaders(key) }); }
    catch { throw new HttpError(502, 'Could not reach the Pocketfi API.'); }
    if (res.status === 401 || res.status === 403) throw new HttpError(400, `Pocketfi rejected the API token (${live ? 'live' : 'sandbox'}).`);
    if (res.ok) return json({ provider, status: 'verified', message: `Pocketfi accepted the API token and business ID (${live ? 'live' : 'sandbox'}). This does not prove the webhook URL is set in the Pocketfi dashboard.` });
    return json({ provider, status: 'reachable', message: `Pocketfi answered HTTP ${res.status}. Check the business ID and that the token matches the ${live ? 'live' : 'sandbox'} environment.` });
  }
  if (provider === 'google') {
    const out: Record<string, string> = {};
    const check = async (name: string, secretName: string, url: (k: string) => string) => {
      const k = await secret(secretName);
      if (!k) { out[name] = 'not saved'; return; }
      try {
        const r = await fetch(url(k)); const j = await r.json().catch(() => ({}));
        out[name] = j.status === 'OK' || j.status === 'ZERO_RESULTS' ? 'verified' : 'rejected: ' + (j.error_message || j.status || r.status);
      } catch { out[name] = 'could not reach Google'; }
    };
    // Directions: Routes API (the successor to the legacy Directions API, which new Google projects cannot enable).
    const dk = await secret('google_directions_key');
    if (!dk) out.directions = 'not saved';
    else {
      try {
        const r = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', { method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': dk, 'X-Goog-FieldMask': 'routes.distanceMeters' },
          body: JSON.stringify({ origin: { location: { latLng: { latitude: 6.4281, longitude: 3.4219 } } }, destination: { location: { latLng: { latitude: 6.4474, longitude: 3.4723 } } }, travelMode: 'DRIVE' }) });
        const j = await r.json().catch(() => ({}));
        out.directions = r.ok && j?.routes?.length ? 'verified (Routes API)' : 'rejected: ' + (j?.error?.message || r.status);
      } catch { out.directions = 'could not reach Google'; }
    }
    // Geocoding: nothing on the server uses this key yet. A key locked to websites is correct for browser use, so that is reported, not failed.
    await check('geocoding', 'google_geocoding_key', (k) => `https://maps.googleapis.com/maps/api/geocode/json?latlng=6.4281,3.4219&key=${encodeURIComponent(k)}`);
    if (/referer restrictions/i.test(out.geocoding ?? '')) out.geocoding = 'saved, restricted to websites (fine for browser use; cannot be tested from the server)';
    const ps = await publicSettings().catch(() => ({} as Record<string, any>));
    const js = String(b.jsKey || ps?.maps?.jsKey || '');
    out.javascript = /^AIza[0-9A-Za-z_-]{35}$/.test(js) ? 'format valid (browser keys cannot be tested from the server)' : 'not saved or invalid format';
    const failed = Object.values(out).filter((v) => v.startsWith('rejected') || v === 'could not reach Google');
    if (failed.length) throw new HttpError(400, 'Google: ' + Object.entries(out).map(([k, v]) => `${k} ${v}`).join('; '));
    if (out.directions === 'not saved' && out.geocoding === 'not saved') throw new HttpError(400, 'Save the Directions or Geocoding key first.');
    return json({ provider, status: 'verified', message: 'Google: ' + Object.entries(out).map(([k, v]) => `${k} ${v}`).join('; ') + '.' });
  }
  throw new HttpError(400, 'Unsupported provider test.');
}));
