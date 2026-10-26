import { ACCOUNT_EXISTS } from '@/lib/signup';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, Txt, useToast } from '@/components/ui';
import { useAuth } from '@/stores/auth';
import { SocialButtons } from '@/components/auth/SocialButtons';
import { useTheme } from '@/lib/theme';
import { success, warn } from '@/lib/sound-effects';

type Mode = 'in' | 'up' | 'reset';

/** Shown instead of the app whenever the backend is live and nobody is signed in. */
export function SignIn() {
  const p = useTheme();
  const toast = useToast();
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const go = async () => {
    setErr(null); setNote(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setErr('Enter a valid email address.'); warn(); return; }
    setBusy(true);
    try {
      if (mode === 'in') { await auth.signIn(email, password); success(); }
      else if (mode === 'up') {
        const r = await auth.signUp({ name, email, phone, password });
        if (r === 'confirm-email') { setNote('Check your email and tap the confirmation link, then sign in.'); setMode('in'); setPassword(''); }
        else success();
      } else { await auth.reset(email); setNote('If that email has an account, a reset link is on its way.'); setMode('in'); }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      if (msg === ACCOUNT_EXISTS) { setMode('in'); setPassword(''); setErr(msg); warn(); return; }
      setErr(msg); warn(); toast(msg, 'bad');
    }
    finally { setBusy(false); }
  };

  const title = mode === 'in' ? 'Welcome back' : mode === 'up' ? 'Create your account' : 'Reset your password';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 14, flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <Txt size={34} weight="displayX" color={p.brand}>ChowBuy</Txt>
          <Txt size={22} weight="display">{title}</Txt>
          {note ? <Txt size={14} color={p.ok}>{note}</Txt> : null}
          {mode !== 'reset' ? <SocialButtons onError={(m) => setErr(m || null)} /> : null}
          {mode === 'up' ? <Field label="Full name" value={name} onChangeText={setName} autoCapitalize="words" textContentType="name" /> : null}
          <Field label="Email" value={email} onChangeText={(v) => { setEmail(v); setErr(null); }} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" />
          {mode === 'up' ? <Field label="Mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0803 000 0000" textContentType="telephoneNumber" /> : null}
          {mode !== 'reset' ? <Field label="Password" value={password} onChangeText={(v) => { setPassword(v); setErr(null); }} secureTextEntry autoCapitalize="none" textContentType={mode === 'up' ? 'newPassword' : 'password'} error={err} /> : err ? <Txt size={13} color={p.bad}>{err}</Txt> : null}
          {mode === 'up' ? <Txt size={12} color={p.mute}>Your mobile number lets friends send you money from their wallet. It is never shown to riders.</Txt> : null}
          <Button loading={busy} label={mode === 'in' ? 'Sign in' : mode === 'up' ? 'Create account' : 'Send reset link'} onPress={go} />
          <View style={{ gap: 4 }}>
            {mode !== 'in' ? <Button variant="ghost" label="Back to sign in" onPress={() => { setMode('in'); setErr(null); }} /> : (
              <>
                <Button variant="ghost" label="New here? Create an account" onPress={() => { setMode('up'); setErr(null); }} />
                <Button variant="ghost" small label="Forgot password?" onPress={() => { setMode('reset'); setErr(null); }} />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
