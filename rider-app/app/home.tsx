import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Page, Txt } from '@/components/ui';
import { useTheme } from '@/lib/theme';

/** Placeholder landing after sign-in. The live map, offers and deliveries arrive in the next build. */
export default function Home() {
  const p = useTheme();
  const r = useRouter();
  return (
    <Page back={false} footer={<Button label="Sign out" variant="soft" onPress={() => r.replace('/')} />}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <Txt size={26} weight="display" align="center">You’re signed in</Txt>
        <Txt size={15} color={p.mute} align="center">Preview build: onboarding only. Rider accounts, shifts and deliveries are not connected to the backend yet.</Txt>
      </View>
    </Page>
  );
}
