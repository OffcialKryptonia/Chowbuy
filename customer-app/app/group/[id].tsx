import React, { useState } from 'react';
import { Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, Share2, Users } from 'lucide-react-native';
import { Button, Card, Empty, Header, Pill, Row, Screen, SectionTitle, Txt, useToast } from '@/components/ui';
import { useGroups } from '@/hooks/useGroups';
import { cancelGroup, groupStatusLabel, leaveGroup, setGroupStatus } from '@/lib/groups';
import { useCatalog } from '@/stores/catalog';
import { useTheme } from '@/lib/theme';
import { ngn } from '@/lib/format';
import { success, tap, warn } from '@/lib/sound-effects';

/** One group order: invite code, who is in, and the host's controls. Payment between friends happens outside the app. */
export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const { data: groups } = useGroups();
  const merchants = useCatalog((s) => s.merchants);
  const [busy, setBusy] = useState(false);
  const g = groups.find((x) => x.id === id);
  if (!g) return <Screen><Header title="Group order" /><Empty icon={Users} title="Group not found" body="It may have been cancelled, or you are not a member." action={<Button full={false} label="All groups" onPress={() => router.replace('/group')} />} /></Screen>;

  const live = g.status === 'open' || g.status === 'locked';
  const act = async (fn: () => Promise<void>, msg: string) => {
    setBusy(true);
    try { await fn(); await qc.invalidateQueries({ queryKey: ['groups'] }); success(); toast(msg, 'ok'); }
    catch (e) { warn(); toast(e instanceof Error ? e.message : 'That did not work. Please try again.', 'bad'); }
    finally { setBusy(false); }
  };
  const merchant = merchants.find((m) => m.id === g.merchantId);

  return (
    <Screen>
      <Header title={g.title} />
      <Card>
        <Row style={{ justifyContent: 'space-between' }}><Txt size={13} color={p.mute}>{g.merchantName}</Txt><Pill label={groupStatusLabel(g.status)} tone={g.status === 'cancelled' ? 'bad' : g.status === 'placed' ? 'ok' : 'brand'} /></Row>
        <Txt size={12} color={p.mute} style={{ marginTop: 10 }}>Invite code</Txt>
        <Txt size={28} weight="displayX">{g.code}</Txt>
        <Row gap={8} style={{ marginTop: 8 }}>
          <View style={{ flex: 1 }}><Button small variant="ghost" icon={Copy} label="Copy" onPress={async () => { await Clipboard.setStringAsync(g.code); tap(); toast('Code copied.', 'ok'); }} /></View>
          <View style={{ flex: 1 }}><Button small variant="ghost" icon={Share2} label="Share" onPress={() => void Share.share({ message: `Join my ChowBuy group order "${g.title}" with code ${g.code}. Open the app, go to Profile > Group orders.` })} /></View>
        </Row>
      </Card>

      <SectionTitle title={`In this group (${g.members.length})`} />
      <Card>
        {g.members.map((m, i) => (
          <Row key={m.userId} style={{ justifyContent: 'space-between', paddingTop: i ? 10 : 0 }}>
            <Txt size={14}>{m.you ? 'You' : m.host ? 'Host' : `Friend ${i}`}{m.you && m.host ? ' (host)' : ''}</Txt>
            {g.status === 'placed' ? <Txt size={14} weight="semi">{ngn(m.amount)}</Txt> : null}
          </Row>
        ))}
      </Card>

      {g.status === 'placed' ? (
        <Card>
          <Txt size={14}>The order was placed{g.total != null ? ` for ${ngn(g.total)}` : ''}. Split as shown above; settle up with the host directly.</Txt>
          {g.orderId ? <Button full={false} variant="soft" label="Track order" onPress={() => router.push(`/orders/${g.orderId}/track`)} /> : null}
        </Card>
      ) : null}

      {g.isHost && live ? (
        <>
          {g.status === 'open'
            ? <Button loading={busy} label="Lock group" onPress={() => void act(() => setGroupStatus(g.id, 'locked'), 'Group locked. No one else can join.')} />
            : <>
                <Button label={merchant ? 'Go to the store and add items' : 'Add items'} onPress={() => router.push(`/store/${g.merchantId}`)} />
                <Button loading={busy} variant="ghost" label="Reopen group" onPress={() => void act(() => setGroupStatus(g.id, 'open'), 'Group reopened.')} />
              </>}
          <Txt size={12} color={p.mute}>Once locked, add the items at the store and choose "Split with group" at checkout. The cost is shared equally; any odd naira stays with you.</Txt>
          <Button loading={busy} variant="danger" small label="Cancel group" onPress={() => void act(() => cancelGroup(g.id), 'Group cancelled.')} />
        </>
      ) : null}
      {!g.isHost && live ? <Button loading={busy} variant="ghost" label="Leave group" onPress={() => void act(async () => { await leaveGroup(g.id); router.replace('/group'); }, 'You left the group.')} /> : null}
    </Screen>
  );
}
