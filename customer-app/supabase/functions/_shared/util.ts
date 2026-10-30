import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',   // set to your Cloudflare Pages domains in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
export class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }

/** Wraps a handler: CORS preflight, JSON errors, no stack traces or secrets in responses. */
export const handle = (fn: (req: Request) => Promise<Response>) => async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try { return await fn(req); }
  catch (e) {
    if (e instanceof HttpError) return json({ message: e.message }, e.status);
    console.error('unhandled', e instanceof Error ? e.message : e);
    return json({ message: 'Something went wrong. Please try again.' }, 500);
  }
};

const URL_ = Deno.env.get('SUPABASE_URL')!;
/** Service-role client. Bypasses RLS. Only used server-side after the caller has been authenticated. */
export const admin = (): SupabaseClient => createClient(URL_, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
/** Client that acts as the caller, so RLS and the RPC rules apply to everything it does. */
export const asUser = (req: Request): SupabaseClient =>
  createClient(URL_, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } }, auth: { persistSession: false } });

export async function requireUser(req: Request) {
  const db = asUser(req);
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new HttpError(401, 'Sign in to continue.');
  return { db, user: data.user };
}
export async function requireAdmin(req: Request) {
  const u = await requireUser(req);
  const { data } = await u.db.rpc('is_admin');
  if (data !== true) throw new HttpError(403, 'Admins only.');
  return u;
}

/** Reads a server secret saved from Admin (platform_secrets), falling back to an environment variable of the same name upper-cased. */
export async function secret(key: string): Promise<string | null> {
  const { data } = await admin().from('platform_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value ?? Deno.env.get(key.toUpperCase()) ?? null;
}
export async function publicSettings(): Promise<Record<string, any>> {
  const { data } = await admin().rpc('get_public_config');
  return (data ?? {}) as Record<string, any>;
}

export const hmacHex = async (key: string, msg: string, hash: 'SHA-256' | 'SHA-512' = 'SHA-256') => {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg)))].map((b) => b.toString(16).padStart(2, '0')).join('');
};
export const safeEq = (a: string, b: string) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };
export const newRef = (p: string) => `${p}${Date.now().toString(36).toUpperCase()}${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
