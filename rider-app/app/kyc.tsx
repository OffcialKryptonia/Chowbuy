import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, Page, Txt } from '@/components/ui';
import { Card, Pill } from '@/components/kit';
import { useTheme } from '@/lib/theme';
import { requiredDocs, kycSummary, type DocStatus } from '@/lib/kyc';
import { useRider } from '@/stores/rider';
import { useApply } from '@/stores/apply';
import { LIVE } from '@/lib/config';
import * as live from '@/lib/live';
import { msg } from '@/lib/supabase';

const COLOR = (p: ReturnType<typeof useTheme>, s: DocStatus) => ({ missing: p.mute, pending: p.info, approved: p.ok, declined: p.bad }[s]);
const LABEL: Record<DocStatus, string> = { missing: 'Not added', pending: 'In review', approved: 'Approved', declined: 'Declined' };

/** Document checklist. Uploads and ChowBuy’s approval arrive with the backend; for now a document can be marked as submitted. */
export default function Kyc() {
  const p = useTheme();
  const { type, vehicle, verified } = useApply();
  const { kyc, setKyc } = useRider();
  const [busyDoc, setBusyDoc] = useState<string | null>(null);
  const docs = requiredDocs(type, vehicle ?? 'motorcycle');
  const status = verified && !LIVE ? Object.fromEntries(docs.map((d) => [d.id, 'approved' as const])) : kyc;
  const k = kycSummary(docs, status);
  const add = async (docId: string) => {
    if (!LIVE) { setKyc(docId as never, 'pending'); return; }
    try {
      const Picker = require('expo-image-picker') as typeof import('expo-image-picker');
      const perm = await Picker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Photos needed', 'Allow photo access so you can choose the document.'); return; }
      const pick = await Picker.launchImageLibraryAsync({ mediaTypes: Picker.MediaTypeOptions.Images, quality: 0.7 });
      if (pick.canceled || !pick.assets[0]) return;
      setBusyDoc(docId);
      const uid = await live.userId();
      if (!uid) throw new Error('Sign in again to send documents.');
      await live.submitDoc(uid, docId, pick.assets[0].uri);
      setKyc(docId as never, 'pending');
      const m = await live.me(); if (m) useRider.getState().hydrateMe(m);
    } catch (e) { Alert.alert('Could not send the document', msg(e)); } finally { setBusyDoc(null); }
  };
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
            {!verified && (s === 'missing' || s === 'declined') ? <Button label={busyDoc === d.id ? 'Sending…' : s === 'declined' ? 'Send again' : 'Add document'} variant="soft" disabled={busyDoc != null} onPress={() => void add(d.id)} /> : null}
          </Card>
        );
      })}
      <Txt size={12} color={p.mute}>{LIVE ? 'Choose a clear photo of each document. ChowBuy reviews it and the status updates here.' : 'Preview build: photo upload and approval status work in the live app.'}</Txt>
    </Page>
  );
}
