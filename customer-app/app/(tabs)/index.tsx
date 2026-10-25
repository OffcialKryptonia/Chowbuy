import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { ChevronDown, MapPin, Search, SlidersHorizontal, Percent, Zap, Star, Navigation } from 'lucide-react-native';
import { router } from 'expo-router';
import { Chip, Empty, Row, Screen, SectionTitle, Txt } from '@/components/ui';
import { CatRail, MerchantCard } from '@/components/discovery';
import { AddressPicker } from '@/components/discovery/AddressPicker';
import { BasketBar } from '@/components/discovery/BasketBar';
import { useTheme, radius } from '@/lib/theme';
import { BANNERS } from '@/lib/mock';
import { useCatalog } from '@/stores/catalog';
import { FOOD_CATS, VERTICALS, adminCat } from '@/lib/icons';
import { useCatalogConfig } from '@/hooks/useCatalogConfig';
import { shapeCats } from '@/lib/catalog-config';
import { filterMerchants, merchantsWithDish, type Sort } from '@/lib/discovery';
import { useSession } from '@/stores/session';
import { tap } from '@/lib/sound-effects';
import type { Vertical } from '@/lib/types';

const SORTS: { id: Sort; label: string; icon: typeof Zap }[] = [
  { id: 'fastest', label: 'Fastest delivery', icon: Zap }, { id: 'rating', label: 'Top rated', icon: Star }, { id: 'distance', label: 'Distance', icon: Navigation },
];

export default function Home() {
  const p = useTheme();
  const { width } = useWindowDimensions();
  const { addresses, activeAddressId, vertical, setVertical } = useSession();
  const { merchants: MERCHANTS, products: PRODUCTS } = useCatalog();
  const addr = addresses.find((a) => a.id === activeAddressId) ?? addresses[0] ?? { id: '', label: 'Home' as const, line: 'Add a delivery address', area: '', location: { latitude: 6.45, longitude: 3.42 } };
  const [pick, setPick] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [offers, setOffers] = useState(false);
  const [sort, setSort] = useState<Sort>('recommended');
  const { data: cfg } = useCatalogConfig();
  const foodCats = useMemo(() => shapeCats(FOOD_CATS, cfg, 'restaurant', adminCat('restaurant')), [cfg]);

  const list = useMemo(() => {
    const base = filterMerchants(MERCHANTS, { vertical, q: '', cat, offersOnly: offers, sort });
    if (!q.trim()) return base;
    const byName = filterMerchants(MERCHANTS, { vertical, q, cat, offersOnly: offers, sort });
    const byDish = merchantsWithDish(MERCHANTS, PRODUCTS, q).filter((m) => (!vertical || m.vertical === vertical));
    return [...new Map([...byName, ...byDish].map((m) => [m.id, m])).values()];
  }, [MERCHANTS, PRODUCTS, vertical, q, cat, offers, sort]);

  const go = (v: Vertical) => {
    tap();
    if (v === 'grocery') return router.push('/grocery');
    if (v === 'pharmacy') return router.push('/retail');
    if (v === 'package') return router.push({ pathname: '/retail', params: { tab: 'courier' } });
    setVertical(v);
  };
  const bw = Math.min(width - 48, 340);

  return (
    <Screen footer={<BasketBar />}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Delivering to ${addr.label}. Change address`} onPress={() => { tap(); setPick(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: p.brandSoft, alignItems: 'center', justifyContent: 'center' }}><MapPin size={20} color={p.brand} /></View>
        <View style={{ flex: 1 }}>
          <Txt size={12} color={p.mute} weight="semi">Deliver to</Txt>
          <Row gap={4}><Txt size={16} weight="display" numberOfLines={1} style={{ flexShrink: 1 }}>{addr.label} · {addr.line}</Txt><ChevronDown size={18} color={p.ink} /></Row>
        </View>
      </Pressable>

      <Row style={{ backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, borderRadius: radius.pill, paddingHorizontal: 16, height: 52 }} gap={10}>
        <Search size={18} color={p.mute} />
        <TextInputBare value={q} onChangeText={setQ} placeholder="Try with pizza, jollof, amala..." />
      </Row>

      <Row style={{ justifyContent: 'space-between' }}>
        {VERTICALS.map((v) => {
          const on = v.id === 'restaurant';
          const I = v.icon;
          return (
            <Pressable key={v.id} accessibilityRole="button" accessibilityLabel={v.label} onPress={() => go(v.id)} style={{ alignItems: 'center', gap: 6, width: 78 }}>
              <View style={{ width: 62, height: 62, borderRadius: 22, backgroundColor: on ? v.tint : v.tint + '1F', alignItems: 'center', justifyContent: 'center' }}><I size={28} color={on ? '#fff' : v.tint} /></View>
              <Txt size={12} weight="semi" align="center" numberOfLines={1}>{v.label}</Txt>
            </Pressable>
          );
        })}
      </Row>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={bw + 12} decelerationRate="fast" contentContainerStyle={{ gap: 12 }}>
        {BANNERS.map((b) => (
          <View key={b.id} style={{ width: bw, height: 120, borderRadius: radius.xl, backgroundColor: b.tint, padding: 18, justifyContent: 'center', gap: 4 }}>
            <Txt size={20} weight="displayX" color="#fff">{b.title}</Txt><Txt size={13} color="#fff">{b.sub}</Txt>
          </View>
        ))}
      </ScrollView>

      <CatRail cats={foodCats} selected={cat} onPick={(id) => setCat(cat === id ? null : id)} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip icon={Percent} label="Offers (-20%)" selected={offers} onPress={() => setOffers(!offers)} />
        {SORTS.map((s) => <Chip key={s.id} icon={s.icon} label={s.label} selected={sort === s.id} onPress={() => setSort(sort === s.id ? 'recommended' : s.id)} />)}
        <Chip icon={SlidersHorizontal} label="Reset" onPress={() => { setCat(null); setOffers(false); setSort('recommended'); setQ(''); }} />
      </ScrollView>

      <SectionTitle title="Best in your city" />
      {list.length ? list.map((m) => <MerchantCard key={m.id} m={m} />) : <Empty icon={Search} title="Nothing matched" body="Try another dish or clear your filters." />}
      <AddressPicker visible={pick} onClose={() => setPick(false)} />
    </Screen>
  );
}

import { TextInput } from 'react-native';
function TextInputBare(props: React.ComponentProps<typeof TextInput>) {
  const p = useTheme();
  return <TextInput accessibilityLabel="Search" placeholderTextColor={p.mute} returnKeyType="search" {...props} style={{ flex: 1, color: p.ink, fontSize: 16, minWidth: 0 }} />;
}
