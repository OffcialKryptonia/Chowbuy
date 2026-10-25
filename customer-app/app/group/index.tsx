import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react-native';
import { Button, Card, Empty, Field, Header, Pill, Row, Screen, SectionTitle, Txt, useToast } from '@/components/ui';
import { useGroups } from '@/hooks/useGroups';
import { groupStatusLabel, joinGroup } from '@/lib/groups';
import { useTheme } from '@/lib/theme';
import { DEMO } from '@/lib/config';
import { success, warn } from '@/lib/sound-effects';

/** Group orders: join a friend's group with its code, or open one of yours. Start a new one from any store page. */
export default function Groups() {
  const p = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const { data: groups } = useGroups();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  if (DEMO) return <Screen><Header title="Group orders" /><Empty icon={Users} title="Group orders need an account" body="Sign in to a live ChowBuy account to order with friends." /></Screen>;

  const join = async () => {
    if (code.trim().length < 4) { toast('Enter the code your friend shared, like GRP-1A2B3C.', 'bad'); return; }
    setBusy(true);
    try {
      const id = await joinGroup(code);
      await qc.invalidateQueries({ queryKey: ['groups'] });
      setCode(''); success(); router.push(`/group/${id}`);
    } catch (e) { warn(); toast(e instanceof Error ? e.message : 'Could not join that group.', 'bad'); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <Header title="Group orders" />
      <Card>
        <Txt size={15} weight="bold">Join a group</Txt>
        <Field label="Group code" value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="GRP-1A2B3C" />
        <Button loading={busy} label="Join" onPress={join} />
      </Card>
      <SectionTitle title="Your groups" />
      {groups.length ? groups.map((g) => (
        <Card key={g.id} onPress={() => router.push(`/group/${g.id}`)}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}><Txt size={15} weight="bold">{g.title}</Txt><Txt size={12} color={p.mute}>{g.merchantName} · {g.members.length} {g.members.length === 1 ? 'person' : 'people'}</Txt></View>
            <Pill label={groupStatusLabel(g.status)} tone={g.status === 'cancelled' ? 'bad' : g.status === 'placed' ? 'ok' : 'brand'} />
          </Row>
        </Card>
      )) : <Empty icon={Users} title="No groups yet" body="Open any store and tap Order with friends to start one." />}
    </Screen>
  );
}
