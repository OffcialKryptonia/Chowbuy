import React, { useMemo, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { Clock, ThumbsUp } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { Chip, Empty, Header, Pill, Row, Screen, Txt } from '@/components/ui';
import { ProductRow } from '@/components/discovery';
import { BasketBar } from '@/components/discovery/BasketBar';
import { useTheme } from '@/lib/theme';
import { useCatalog } from '@/stores/catalog';
import { Store } from 'lucide-react-native';

export default function StoreScreen() {
  const p = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { merchants, products } = useCatalog();
  const m = merchants.find((x) => x.id === id);
  const items = useMemo(() => products.filter((x) => x.merchantId === id), [products, id]);
  const cats = useMemo(() => [...new Set(items.map((i) => i.category))], [items]);
  const [cat, setCat] = useState<string | null>(null);
  if (!m) return <Screen><Header title="Store not found" /><Empty icon={Store} title="We could not find that store" body="It may have closed or moved." /></Screen>;
  const shown = items.filter((i) => !cat || i.category === cat);
  return (
    <Screen footer={<BasketBar />} pad={false}>
      <View>
        <Image source={{ uri: m.image }} style={{ height: 190, width: '100%', backgroundColor: p.fill }} accessibilityIgnoresInvertColors />
        <View style={{ position: 'absolute', top: 12, left: 16 }}><Header title="" /></View>
      </View>
      <View style={{ padding: 16, gap: 14 }}>
        <Txt size={26} weight="displayX">{m.name}</Txt>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          <Pill label={`${m.rating}% (${m.ratingCount})`} tone="ok" icon={ThumbsUp} /><Pill label={`${m.etaMin}-${m.etaMax} min`} tone="brand" icon={Clock} /><Pill label={m.open ? m.hours : 'Closed now'} tone={m.open ? 'neutral' : 'bad'} />
        </Row>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label="All" selected={!cat} onPress={() => setCat(null)} />
          {cats.map((c) => <Chip key={c} label={c} selected={cat === c} onPress={() => setCat(cat === c ? null : c)} />)}
        </ScrollView>
        {shown.length ? shown.map((i) => <ProductRow key={i.id} product={i} merchant={m} />) : <Empty icon={Store} title="Menu coming soon" body="This store has not published items yet." />}
      </View>
    </Screen>
  );
}
