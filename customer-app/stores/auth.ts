import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as Apple from 'expo-apple-authentication';
import { DEMO } from '@/lib/config';
import { BackendError, fn, supabase } from '@/lib/supabase';
import { normalizeNgPhone } from '@/lib/format';

interface AuthState {
  ready: boolean;
  session: Session | null;
  role: 'customer' | 'merchant' | 'rider' | 'admin' | null;
  init: () => () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (v: { name: string; email: string; phone: string; password: string }) => Promise<'signed-in' | 'confirm-email'>;
  signInGoogle: () => Promise<void>;
  signInApple: () => Promise<void>;
  reset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const friendly = (m: string) =>
  /invalid login/i.test(m) ? 'Email or password is not right.'
  : /already registered|already been registered/i.test(m) ? 'An account with this email already exists. Sign in instead.'
  : /rate limit|too many/i.test(m) ? 'Too many attempts. Please wait a minute and try again.'
  : /password/i.test(m) && /least|short|weak/i.test(m) ? 'Use at least 8 characters for your password.'
  : /network|fetch/i.test(m) ? 'No connection. Check your internet and try again.'
  : m;

export const useAuth = create<AuthState>((set, get) => ({
  ready: DEMO,
  session: null,
  role: null,
  init: () => {
    if (DEMO) return () => {};
    void supabase.auth.getSession().then(({ data }) => set({ session: data.session, ready: true }));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => set({ session, ready: true, ...(session ? {} : { role: null }) }));
    return () => data.subscription.unsubscribe();
  },
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) throw new BackendError(friendly(error.message));
  },
  signUp: async ({ name, email, phone, password }) => {
    const p = normalizeNgPhone(phone);
    if (!p) throw new BackendError('Enter a valid Nigerian mobile number.');
    if (name.trim().length < 2) throw new BackendError('Enter your name.');
    if (password.length < 8) throw new BackendError('Use at least 8 characters for your password.');
    const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { full_name: name.trim(), phone: p } } });
    if (error) throw new BackendError(friendly(error.message));
    return data.session ? 'signed-in' : 'confirm-email';
  },
  /** Google through Supabase OAuth in the system browser; the provider must be enabled in the Supabase dashboard. */
  signInGoogle: async () => {
    const redirectTo = Linking.createURL('auth-callback');
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } });
    if (error || !data?.url) throw new BackendError(friendly(error?.message ?? 'Google sign-in is not available right now.'));
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (res.type !== 'success') return;   // closed or cancelled: not an error
    const u = res.url, frag = new URLSearchParams(u.includes('#') ? u.split('#')[1] : ''), qs = new URLSearchParams(u.includes('?') ? u.split('?')[1].split('#')[0] : '');
    const code = qs.get('code');
    if (code) { const r = await supabase.auth.exchangeCodeForSession(code); if (r.error) throw new BackendError(friendly(r.error.message)); return; }
    const at = frag.get('access_token'), rt = frag.get('refresh_token');
    if (!at || !rt) throw new BackendError(friendly(frag.get('error_description') ?? qs.get('error_description') ?? 'Google sign-in did not finish. Please try again.'));
    const r = await supabase.auth.setSession({ access_token: at, refresh_token: rt });
    if (r.error) throw new BackendError(friendly(r.error.message));
  },
  /** Sign in with Apple, iOS only. Uses the native sheet and exchanges Apple's identity token with Supabase. */
  signInApple: async () => {
    if (Platform.OS !== 'ios') throw new BackendError('Sign in with Apple is only available on iPhone.');
    try {
      const c = await Apple.signInAsync({ requestedScopes: [Apple.AppleAuthenticationScope.FULL_NAME, Apple.AppleAuthenticationScope.EMAIL] });
      if (!c.identityToken) throw new BackendError('Apple did not return a sign-in token. Please try again.');
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: c.identityToken });
      if (error) throw new BackendError(friendly(error.message));
      const nm = [c.fullName?.givenName, c.fullName?.familyName].filter(Boolean).join(' ');   // Apple only sends the name the first time
      if (nm) { await supabase.auth.updateUser({ data: { full_name: nm } }); const { data } = await supabase.auth.getUser(); if (data.user) await supabase.from('profiles').update({ full_name: nm }).eq('id', data.user.id).eq('full_name', ''); }
    } catch (e) {
      if ((e as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return;
      throw e;
    }
  },
  reset: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) throw new BackendError(friendly(error.message));
  },
  signOut: async () => { await supabase.auth.signOut(); set({ session: null, role: null }); },
  deleteAccount: async () => {
    await fn('delete-account', { body: { confirm: true } });
    await get().signOut();
  },
}));
