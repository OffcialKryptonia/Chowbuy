import React, { useMemo, useState } from 'react';
import { Image, ScrollView, TextInput, View } from 'react-native';
import { Clock, Search, ThumbsUp } from 'lucide-react-native';
import { Card, Chip, Empty, Pill, Row, Screen, SectionTitle, Txt } from '@/components/ui';
import { CatTile, ProductRow } from '@/components/discovery';
import { BasketBar } from '@/components/discovery/BasketBar';
import { useTheme, radius } from '@/lib/theme';
import { MART_AISLES, adminCat } from '@/lib/icons';
import { useCatalogConfig } from '@/hooks/useCatalogConfig';
import { brandNames, shapeCats } from '@/lib/catalog-config';
import { useCatalog } from '@/stores/catalog';

export default function Grocery() {
  const p = useTheme();
  const { merchants, products } = useCatalog();
  const store = merchants.find((m) => m.vertical === 'grocery');
  const [q, setQ] = useState('');
  const [aisle, setAisle] = useState<string | null>(null);
  const { data: cfg } = useCatalogConfig();
  const aisles = useMemo(() => shapeCats(MART_AISLES, cfg, 'grocery', adminCat('grocery')), [cfg]);
  const brands = useMemo(() => brandNames(cfg, 'grocery'), [cfg]);
  const label = aisles.find((a) => a.id === aisle)?.label;
  const items = useMemo(() => products.filter((x) => store && x.merchantId === store.id && (!label || x.category === label) && (!q.trim() || (x.name + x.desc).toLowerCase().includes(q.trim().toLowerCase()))), [products, store, label, q]);

  if (!store) return <Screen><Empty icon={Search} title="ChowBuy Mart is not open yet" body="Check back soon." /></Screen>;

  return (
    <Screen footer={<BasketBar />}>
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <Image source={{ uri: store.image }} style={{ height: 120, width: '100%', backgroundColor: p.fill }} accessibilityIgnoresInvertColors />
        <View style={{ padding: 14, gap: 6 }}>
          <Txt size={20} weight="display">{store.name}</Txt>
          <Row gap={10} style={{ flexWrap: 'wrap' }}>
            <Pill label={store.hours} icon={Clock} />
            <Pill label={`${store.rating}%`} tone="ok" icon={ThumbsUp} />
            <Pill label={`${store.etaMin}-${store.etaMax} min`} tone="brand" />
          </Row>
        </View>
      </Card>
      <Row style={{ backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, borderRadius: radius.pill, paddingHorizontal: 16, height: 52 }} gap={10}>
        <Search size={18} color={p.mute} />
        <TextInput accessibilityLabel="Search in ChowBuy Mart" value={q} onChangeText={setQ} placeholder="Search in ChowBuy Mart..." placeholderTextColor={p.mute} style={{ flex: 1, color: p.ink, fontSize: 16 }} />
      </Row>
      {brands.length ? (
        <>
          <SectionTitle title="Featured brands" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {brands.map((b) => <Chip key={b} label={b} selected={q.trim().toLowerCase() === b.toLowerCase()} onPress={() => setQ(q.trim().toLowerCase() === b.toLowerCase() ? '' : b)} />)}
          </ScrollView>
        </>
      ) : null}
      <SectionTitle title="Shop by aisle" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, justifyContent: 'space-between' }}>
        {aisles.map((a) => <CatTile key={a.id} cat={a} selected={aisle === a.id} onPress={() => setAisle(aisle === a.id ? null : a.id)} size={72} />)}
      </View>
      <SectionTitle title={label ?? 'Popular today'} />
      {items.length ? items.map((x) => <ProductRow key={x.id} product={x} merchant={store} />) : <Empty icon={Search} title="No items here yet" body="Try another aisle or clear the search." />}
    </Screen>
  );
}
