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

/** Supabase email links return tokens in the URL fragment or a PKCE code in the query. */
async function consumeAuthCallback(url: string) {
  if (!url || !url.startsWith('chowbuy://')) return;
  const parsed = Linking.parse(url);
  if (!String(parsed.path ?? '').startsWith('auth-callback')) return;

  const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0] : '';
  const fragmentParams = new URLSearchParams(hash);
  const queryParams = new URLSearchParams(query);
  const callbackError = fragmentParams.get('error_description') ?? queryParams.get('error_description') ?? fragmentParams.get('error') ?? queryParams.get('error');
  if (callbackError) throw new BackendError(friendly(decodeURIComponent(callbackError.replace(/\+/g, ' '))));

  const code = queryParams.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw new BackendError(friendly(error.message));
    return;
  }

  const access_token = fragmentParams.get('access_token');
  const refresh_token = fragmentParams.get('refresh_token');
  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw new BackendError(friendly(error.message));
  }
}

export const useAuth = create<AuthState>((set, get) => ({
  ready: DEMO,
  session: null,
  role: null,
  init: () => {
    if (DEMO) return () => {};
    let disposed = false;
    const { data } = supabase.auth.onAuthStateChange((_e, session) => set({ session, ready: true }));
    const linkSubscription = Linking.addEventListener('url', ({ url }) => {
      void consumeAuthCallback(url).catch((e) => {
        // Keep the sign-in screen available; do not log callback URLs or tokens.
        set({ ready: true });
      });
    });
    void (async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) await consumeAuthCallback(initialUrl);
      } catch {
        // Invalid/expired links are handled by returning to the sign-in screen.
      }
      const { data: sessionData } = await supabase.auth.getSession();
      if (!disposed) set({ session: sessionData.session, ready: true });
    })();
    return () => {
      disposed = true;
      data.subscription.unsubscribe();
      linkSubscription.remove();
    };
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
    const emailRedirectTo = Linking.createURL('auth-callback');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { emailRedirectTo, data: { full_name: name.trim(), phone: p } },
    });
    if (error) throw new BackendError(friendly(error.message));
    return data.session ? 'signed-in' : 'confirm-email';
  },
  /** Google through Supabase OAuth in the system browser; the provider must be enabled in the Supabase dashboard. */
  signInGoogle: async () => {
    const redirectTo = Linking.createURL('auth-callback');
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } });
    if (error || !data?.url) throw new BackendError(friendly(error?.message ?? 'Google sign-in is not available right now.'));
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (res.type !== 'success') return;
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
      const nm = [c.fullName?.givenName, c.fullName?.familyName].filter(Boolean).join(' ');
      if (nm) { await supabase.auth.updateUser({ data: { full_name: nm } }); const { data } = await supabase.auth.getUser(); if (data.user) await supabase.from('profiles').update({ full_name: nm }).eq('id', data.user.id).eq('full_name', ''); }
    } catch (e) {
      if ((e as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return;
      throw e;
    }
  },
  reset: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: Linking.createURL('auth-callback') });
    if (error) throw new BackendError(friendly(error.message));
  },
  signOut: async () => { await supabase.auth.signOut(); set({ session: null, role: null }); },
  deleteAccount: async () => {
    await fn('delete-account', { body: { confirm: true } });
    await get().signOut();
  },
}));
