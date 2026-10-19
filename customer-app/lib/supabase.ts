import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

/**
 * One client for the whole app. Only the anon key ships in the app; every table is behind row-level security and every
 * write goes through a SECURITY DEFINER function, so the anon key alone cannot read or change anyone's data.
 * In demo mode (no SUPABASE_URL) the client is never used.
 */
export const supabase = createClient(SUPABASE_URL || 'http://localhost:54321', SUPABASE_ANON_KEY || 'demo', {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  realtime: { params: { eventsPerSecond: 10 } },
});

export class BackendError extends Error {}

/** Unwraps a PostgREST/RPC result into data or a readable error (the SQL functions raise plain-English messages). */
export function ok<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new BackendError(r.error.message || 'Something went wrong. Please try again.');
  return r.data as T;
}

/** Calls a Supabase Edge Function as the signed-in user. */
export async function fn<T>(name: string, opts: { method?: 'GET' | 'POST'; body?: unknown; query?: Record<string, string> } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const qs = opts.query ? '?' + new URLSearchParams(opts.query).toString() : '';
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}${qs}`, {
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${data.session?.access_token ?? SUPABASE_ANON_KEY}` },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new BackendError(j?.message ?? j?.error ?? 'Something went wrong. Please try again.');
  return j as T;
}
