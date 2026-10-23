import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

/** One client for the whole app. In demo mode it is never called. */
export const supabase = createClient(SUPABASE_URL || 'http://localhost:54321', SUPABASE_ANON_KEY || 'demo', {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

export class BackendError extends Error {}

const friendly = (m: string) =>
  /invalid login/i.test(m) ? 'Email or password is not right.'
  : /already registered|already been registered/i.test(m) ? 'An account with this email already exists. Sign in instead.'
  : /rate limit|too many/i.test(m) ? 'Too many attempts. Please wait a minute and try again.'
  : /network|fetch failed|failed to fetch/i.test(m) ? 'No connection. Check your internet and try again.'
  : /email not confirmed/i.test(m) ? 'Confirm your email first. Check your inbox for the link we sent.'
  : m;

/** Unwraps a PostgREST/RPC result into data, or throws a readable message (the SQL functions raise plain-English errors). */
export function ok<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new BackendError(friendly(r.error.message || 'Something went wrong. Please try again.'));
  return r.data as T;
}
export const msg = (e: unknown) => (e instanceof Error ? friendly(e.message) : 'Something went wrong. Please try again.');
