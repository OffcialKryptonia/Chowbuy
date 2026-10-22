import React from 'react';
import { View } from 'react-native';
import { Button, Page, Txt } from '@/components/ui';
import { Card, Pill } from '@/components/kit';
import { useTheme } from '@/lib/theme';
import { requiredDocs, kycSummary, type DocStatus } from '@/lib/kyc';
import { useRider } from '@/stores/rider';
import { useApply } from '@/stores/apply';

const COLOR = (p: ReturnType<typeof useTheme>, s: DocStatus) => ({ missing: p.mute, pending: p.info, approved: p.ok, declined: p.bad }[s]);
const LABEL: Record<DocStatus, string> = { missing: 'Not added', pending: 'In review', approved: 'Approved', declined: 'Declined' };

/** Document checklist. Uploads and ChowBuy’s approval arrive with the backend; for now a document can be marked as submitted. */
export default function Kyc() {
  const p = useTheme();
  const { type, vehicle, verified } = useApply();
  const { kyc, setKyc } = useRider();
  const docs = requiredDocs(type, vehicle ?? 'motorcycle');
  const status = verified ? Object.fromEntries(docs.map((d) => [d.id, 'approved' as const])) : kyc;
  const k = kycSummary(docs, status);
  return (
    <Page>
      <Txt size={26} weight="display">Documents</Txt>
      <Txt size={14} color={p.mute}>{k.state === 'verified' ? 'You are fully verified.' : `${k.approved} of ${k.total} approved. ChowBuy reviews each document and can also help you upload them.`}</Txt>
      {docs.map((d) => {
        const s = status[d.id] ?? 'missing';
        return (
          <Card key={d.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <Txt size={15} weight="bold" style={{ flex: 1 }}>{d.label}</Txt>
              <Pill label={LABEL[s]} color={COLOR(p, s)} soft />
            </View>
            <Txt size={13} color={p.mute}>{d.help}</Txt>
            {!verified && (s === 'missing' || s === 'declined') ? <Button label={s === 'declined' ? 'Send again' : 'Add document'} variant="soft" onPress={() => setKyc(d.id, 'pending')} /> : null}
          </Card>
        );
      })}
      <Txt size={12} color={p.mute}>Photo upload and approval status sync once the rider backend is connected.</Txt>
    </Page>
  );
}
