import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Button, Field, Page, Txt } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { passwordOk, passwordRules } from '@/lib/validation';
import { useApply } from '@/stores/apply';
import { useState } from 'react';

/** Apply, step 2: create a password. The checklist turns green as each rule is met. */
export default function ApplyPassword() {
  const p = useTheme();
  const r = useRouter();
  const a = useApply();
  const [confirm, setConfirm] = useState('');
  const rules = passwordRules(a.password);
  const match = confirm.length > 0 && confirm === a.password;
  const ok = passwordOk(a.password) && match;
  return (
    <Page footer={
      <>
        <Txt size={14}>By continuing you agree to our <Txt size={14} weight="bold" color={p.ok}>privacy policy</Txt> and cookies</Txt>
        <Button label="Create account" disabled={!ok} onPress={() => r.push('/apply/type')} />
      </>
    }>
      <Txt size={26} weight="display">Create password</Txt>
      <Field label="Enter password" value={a.password} onChangeText={(v) => a.set({ password: v })} secure autoCapitalize="none" textContentType="newPassword" />
      <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secure autoCapitalize="none" textContentType="newPassword" error={confirm.length > 0 && !match ? 'Passwords do not match' : null} />
      <Txt size={15} style={{ marginTop: 4 }}>Password must contain:</Txt>
      <View style={{ gap: 12 }}>
        {rules.map((rule) => (
          <View key={rule.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: rule.ok ? p.ok : p.line }}>
              <Check color="#FFFFFF" size={14} strokeWidth={3.5} />
            </View>
            <Txt size={16} color={rule.ok ? p.ink : p.mute} style={{ flex: 1 }}>{rule.label}</Txt>
          </View>
        ))}
      </View>
    </Page>
  );
}
