import React, { useEffect, useMemo, useState } from 'react';
import { Image, View } from 'react-native';
import { Camera, ClipboardList, ImagePlus, Package, Pill } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Chip, Empty, Field, Pill as PillTag, Row, Screen, SectionTitle, Txt, useToast } from '@/components/ui';
import { CatRail, ProductRow } from '@/components/discovery';
import { BasketBar } from '@/components/discovery/BasketBar';
import { useTheme } from '@/lib/theme';
import { HEALTH_CATS, adminCat } from '@/lib/icons';
import { useCatalogConfig } from '@/hooks/useCatalogConfig';
import { shapeCats } from '@/lib/catalog-config';
import { useCatalog } from '@/stores/catalog';
import { useAuth } from '@/stores/auth';
import { uploadRx } from '@/lib/backend';
import { useRx } from '@/stores/rx';
import { useSession } from '@/stores/session';
import { useCart } from '@/stores/cart';
import { parcelFare, validateParcel } from '@/lib/courier';
import { normalizeNgPhone, ngn } from '@/lib/format';
import { DEMO } from '@/lib/config';
import { success } from '@/lib/sound-effects';
import type { Product } from '@/lib/types';

const RX_TONE = { pending: 'warn', clarify: 'brand', verified: 'ok', rejected: 'bad' } as const;
const RX_TEXT = { pending: 'With pharmacist', clarify: 'Pharmacist has a question', verified: 'Verified', rejected: 'Rejected' } as const;

export default function Retail() {
  const { tab: t } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<'pharmacy' | 'courier'>(t === 'courier' ? 'courier' : 'pharmacy');
  useEffect(() => { if (t === 'courier') setTab('courier'); }, [t]);
  return (
    <Screen footer={<BasketBar />}>
      <Row gap={8}><Chip icon={Pill} label="Pharmacy" selected={tab === 'pharmacy'} onPress={() => setTab('pharmacy')} /><Chip icon={Package} label="Send a parcel" selected={tab === 'courier'} onPress={() => setTab('courier')} /></Row>
      {tab === 'pharmacy' ? <Pharmacy /> : <Courier />}
    </Screen>
  );
}

function Pharmacy() {
  const p = useTheme();
  const toast = useToast();
  const { merchants, products } = useCatalog();
  const store = merchants.find((m) => m.vertical === 'pharmacy');
  const { list, add, push, setStatus } = useRx();
  const uid = useAuth((s) => s.session?.user.id);
  const name = useSession((s) => s.name);
  const [cat, setCat] = useState<string | null>(null);
  const { data: cfg } = useCatalogConfig();
  const healthCats = useMemo(() => shapeCats(HEALTH_CATS, cfg, 'pharmacy', adminCat('pharmacy')), [cfg]);
  const items = store ? products.filter((x) => x.merchantId === store.id) : [];

  const upload = async (camera: boolean) => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { toast(camera ? 'Allow camera access to photograph your prescription.' : 'Allow photo access to choose your prescription.', 'bad'); return; }
    const r = camera ? await ImagePicker.launchCameraAsync({ quality: 0.7 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (r.canceled || !r.assets[0]) return;
    if (!DEMO) {
      if (!uid) return;
      try { push(await uploadRx(uid, r.assets[0].uri, name)); toast('Prescription uploaded. A pharmacist will review it shortly.', 'ok'); }
      catch (e) { toast(e instanceof Error ? e.message : 'Could not upload the photo.', 'bad'); }
      return;
    }
    const rx = add(r.assets[0].uri, name);
    toast('Prescription uploaded. A pharmacist will review it shortly.', 'ok');
    setTimeout(() => { setStatus(rx.id, 'verified'); success(); }, 12000);
  };

  return (
    <>
      <Card style={{ gap: 12 }}>
        <Row gap={10}><ClipboardList size={22} color={p.brand} /><Txt size={18} weight="display">Prescription upload</Txt></Row>
        <Txt size={14} color={p.mute}>Upload a clear photo of your prescription. A licensed pharmacist checks it, then you get a payment link for the exact items.</Txt>
        <Row gap={10}><View style={{ flex: 1 }}><Button label="Take photo" icon={Camera} onPress={() => upload(true)} /></View><View style={{ flex: 1 }}><Button label="Choose photo" icon={ImagePlus} variant="soft" onPress={() => upload(false)} /></View></Row>
      </Card>
      {list.length ? (
        <>
          <SectionTitle title="Your prescriptions" />
          {list.map((r) => (
            <Card key={r.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Image source={{ uri: r.uri }} style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: p.fill }} accessibilityIgnoresInvertColors />
              <View style={{ flex: 1, gap: 4 }}><Txt size={15} weight="bold">{r.id}</Txt><PillTag label={RX_TEXT[r.status]} tone={RX_TONE[r.status]} /></View>
              {r.status === 'verified' ? <Button label="Pay" small full={false} onPress={() => { const rxItem = items.find((i) => i.rx) ?? items[0]; if (!store || !rxItem) return; useCart.getState().replaceWith(store, rxItem as Product, [], 1); router.push('/checkout'); }} /> : null}
            </Card>
          ))}
        </>
      ) : null}
      <SectionTitle title="Health & personal care" />
      <CatRail cats={healthCats} selected={cat} onPick={(id) => setCat(cat === id ? null : id)} />
      {store && items.length ? items.map((x) => <ProductRow key={x.id} product={x} merchant={store} />) : <Empty icon={Pill} title="No items" body="Nothing to show yet." />}
    </>
  );
}

function Courier() {
  const toast = useToast();
  const store = useCatalog((s) => s.merchants.find((m) => m.vertical === 'package'));
  const addr = useSession((s) => s.addresses.find((a) => a.id === s.activeAddressId) ?? s.addresses[0]);
  const [v, setV] = useState({ from: addr ? `${addr.line}, ${addr.area}` : '', to: '', recipient: '', phone: '', km: '5', kg: '1' });
  const [fragile, setFragile] = useState(false);
  const [express, setExpress] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fare = parcelFare({ km: parseFloat(v.km) || 0, kg: parseFloat(v.kg) || 0, express, fragile });
  const set = (k: keyof typeof v) => (t: string) => { setV({ ...v, [k]: t }); setErr(null); };

  const go = () => {
    if (!DEMO) { setErr('Parcel booking is not available in the live app yet. Food, groceries and pharmacy orders work normally.'); return; }   // fares are priced by the client here; the server only accepts catalogue items
    if (!store) { setErr('Courier is not available right now.'); return; }
    const e = validateParcel(v);
    if (e) { setErr(e); return; }
    const phone = normalizeNgPhone(v.phone);
    if (!phone) { setErr('Enter a valid Nigerian phone number, e.g. 0803 555 0142.'); return; }
    const prod: Product = { id: 'parcel-' + Date.now(), merchantId: store.id, name: `Parcel to ${v.recipient.trim()}`, desc: `${v.km} km, ${v.kg} kg${express ? ', express' : ''}${fragile ? ', fragile' : ''}. To ${v.to.trim()}. Recipient ${phone}.`, price: fare, image: store.image, category: 'Courier', modifiers: [], inStock: true };
    useCart.getState().replaceWith({ ...store, deliveryFee: 0 }, prod, [], 1);
    toast('Parcel added. Review and pay to dispatch a rider.', 'ok');
    router.push('/checkout');
  };

  return (
    <Card style={{ gap: 14 }}>
      <Txt size={18} weight="display">Send a parcel</Txt>
      <Field label="Pickup address" value={v.from} onChangeText={set('from')} />
      <Field label="Drop-off address" value={v.to} onChangeText={set('to')} placeholder="15 Awolowo Road, Ikoyi" />
      <Field label="Recipient name" value={v.recipient} onChangeText={set('recipient')} autoCapitalize="words" />
      <Field label="Recipient phone" value={v.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="0803 555 0142" />
      <Row gap={10}><View style={{ flex: 1 }}><Field label="Distance (km)" value={v.km} onChangeText={set('km')} keyboardType="decimal-pad" /></View><View style={{ flex: 1 }}><Field label="Weight (kg)" value={v.kg} onChangeText={set('kg')} keyboardType="decimal-pad" /></View></Row>
      <Row gap={8}><Chip label="Fragile (+₦300)" selected={fragile} onPress={() => setFragile(!fragile)} /><Chip label="Express (+30%)" selected={express} onPress={() => setExpress(!express)} /></Row>
      {err ? <Txt size={13} color="#D92D20">{err}</Txt> : null}
      <Row style={{ justifyContent: 'space-between' }}><Txt size={15} color="#6B625D">Courier fare</Txt><Txt size={22} weight="display">{ngn(fare)}</Txt></Row>
      <Button label="Continue to payment" onPress={go} />
    </Card>
  );
}
