import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Field, Page, Txt } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { isEmail } from '@/lib/validation';
import { useApply } from '@/stores/apply';

export default function SignIn() {
  const p = useTheme();
  const r = useRouter();
  const saved = useApply((s) => s.email);
  const [email, setEmail] = useState(saved);
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const ok = isEmail(email) && password.length > 0;
  return (
    <Page footer={<Button label="Continue" disabled={!ok} onPress={() => r.replace('/home')} />}>
      <Txt size={26} weight="display">Sign in</Txt>
      <Field label="Email" value={email} onChangeText={setEmail} onBlur={() => setTouched(true)} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" error={touched && email && !isEmail(email) ? 'Enter a valid email address' : null} />
      <Field label="Password" value={password} onChangeText={setPassword} secure autoCapitalize="none" textContentType="password" />
      <Pressable accessibilityRole="button" hitSlop={8} onPress={() => Alert.alert('Reset password', 'Password reset is available once rider accounts go live. Contact rider support if you are locked out.')}>
        <Txt size={15} weight="bold" color={p.ok}>Forgot password?</Txt>
      </Pressable>
      <View style={{ flex: 1 }} />
    </Page>
  );
}
