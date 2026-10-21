import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { Button, Field, Page, Txt } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { isEmail, isNigerianMobile, nationalPhone } from '@/lib/validation';
import { useApply } from '@/stores/apply';

/** Apply, step 1: email and phone number. */
export default function ApplyContact() {
  const p = useTheme();
  const r = useRouter();
  const a = useApply();
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const phoneBad = phoneTouched && a.phone.length > 0 && !isNigerianMobile(a.phone);
  const ok = isEmail(a.email) && isNigerianMobile(a.phone);
  return (
    <Page footer={
      <>
        <Button label="Next" disabled={!ok} onPress={() => r.push('/apply/password')} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          <Txt size={15} weight="bold">Already a rider?</Txt>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => r.replace('/sign-in')}><Txt size={15} weight="bold" color={p.ok}>Sign in</Txt></Pressable>
        </View>
      </>
    }>
      <Txt size={28} weight="display">We’re excited to have you on board with <Txt size={28} weight="displayX" color={p.brand}>ChowBuy</Txt>!</Txt>
      <Txt size={16} color={p.mute}>Enter your email and phone number to create account</Txt>
      <Field label="Email" value={a.email} onChangeText={(v) => a.set({ email: v })} onBlur={() => setEmailTouched(true)} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress"
        error={emailTouched && a.email && !isEmail(a.email) ? 'Enter a valid email address' : null} />
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <View style={{ width: 104, height: 56, borderRadius: 14, borderWidth: 1.5, borderColor: p.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }} accessibilityLabel="Country code +234">
          <Txt size={16}>+234</Txt><ChevronDown color={p.ink} size={18} />
        </View>
        <Field label="8136320187" value={a.phone} onChangeText={(v) => a.set({ phone: v })} onBlur={() => setPhoneTouched(true)} keyboardType="phone-pad" textContentType="telephoneNumber" maxLength={14}
          error={phoneBad ? 'Enter a valid phone number' : null} />
      </View>
      {a.phone && isNigerianMobile(a.phone) ? <Txt size={12} color={p.mute}>We’ll use +234 {nationalPhone(a.phone)}</Txt> : null}
    </Page>
  );
}
