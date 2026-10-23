import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Field, Page, Txt } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { isEmail } from '@/lib/validation';
import { useApply } from '@/stores/apply';
import { matchDemo } from '@/lib/demo';
import { LIVE } from '@/lib/config';
import * as live from '@/lib/live';
import { startSession } from '@/lib/live-session';
import { msg, supabase } from '@/lib/supabase';

export default function SignIn() {
  const p = useTheme();
  const r = useRouter();
  const saved = useApply((s) => s.email);
  const setApply = useApply((s) => s.set);
  const [email, setEmail] = useState(saved);
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const ok = isEmail(email) && password.length > 0 && !busy;
  const go = async () => {
    if (!LIVE) { const d = matchDemo(email, password); setApply(d ? { email: d.email, type: d.type, verified: true } : { email: email.trim() }); r.replace('/home'); return; }
    setBusy(true);
    try { await live.signIn(email, password); await startSession(email.trim()); r.replace('/home'); }
    catch (e) { Alert.alert('Could not sign in', msg(e)); } finally { setBusy(false); }
  };
  return (
    <Page footer={<Button label={busy ? 'Signing in…' : 'Continue'} disabled={!ok} onPress={go} />}>
      <Txt size={26} weight="display">Sign in</Txt>
      <Field label="Email" value={email} onChangeText={setEmail} onBlur={() => setTouched(true)} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" error={touched && email && !isEmail(email) ? 'Enter a valid email address' : null} />
      <Field label="Password" value={password} onChangeText={setPassword} secure autoCapitalize="none" textContentType="password" />
      <Pressable accessibilityRole="button" hitSlop={8} onPress={() => { if (!LIVE) { Alert.alert('Reset password', 'Password reset is available once rider accounts go live. Contact rider support if you are locked out.'); return; } if (!isEmail(email)) { Alert.alert('Reset password', 'Enter your email above first.'); return; } supabase.auth.resetPasswordForEmail(email.trim()).then(() => Alert.alert('Check your email', 'If that address has a rider account, we sent a link to reset the password.')).catch(() => Alert.alert('Reset password', 'Could not send the email. Try again in a minute.')); }}>
        <Txt size={15} weight="bold" color={p.ok}>Forgot password?</Txt>
      </Pressable>
      <View style={{ flex: 1 }} />
    </Page>
  );
}
