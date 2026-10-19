import React, { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Clock, Minus, Percent, Plus, Star, ThumbsUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { Button, Card, Chip, Pill, Row, Sheet, Txt, useToast } from '@/components/ui';
import { useTheme, radius } from '@/lib/theme';
import { ngn } from '@/lib/format';
import { tap, tick } from '@/lib/sound-effects';
import { validateMods, unitPrice } from '@/lib/smart-cart';
import { useCart } from '@/stores/cart';
import type { Cat } from '@/lib/icons';
import type { Merchant, ModifierOption, Product } from '@/lib/types';

/** Square vector tile for a category or aisle. Icons are Lucide vectors tinted per category. */
export function CatTile({ cat, onPress, selected, size = 76 }: { cat: Cat; onPress: () => void; selected?: boolean; size?: number }) {
  const p = useTheme();
  const Icon = cat.icon;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={cat.label} accessibilityState={{ selected: !!selected }} onPress={() => { tap(); onPress(); }} style={{ width: size + 8, alignItems: 'center', gap: 6 }}>
      <View style={{ width: size, height: size, borderRadius: radius.lg, backgroundColor: p.scheme === 'dark' ? p.fill : cat.tint + '1F', borderWidth: selected ? 2 : 1, borderColor: selected ? cat.tint : p.line, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={size * 0.44} color={cat.tint} strokeWidth={1.8} />
      </View>
      <Txt size={12} weight="semi" align="center" numberOfLines={2}>{cat.label}</Txt>
    </Pressable>
  );
}

export function CatRail({ cats, selected, onPick }: { cats: Cat[]; selected?: string | null; onPick: (id: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: 16 }}>
      {cats.map((c) => <CatTile key={c.id} cat={c} selected={selected === c.id} onPress={() => onPick(c.id)} />)}
    </ScrollView>
  );
}

export function MerchantCard({ m }: { m: Merchant }) {
  const p = useTheme();
  const [bad, setBad] = useState(false);
  return (
    <Card pad={0} onPress={() => router.push({ pathname: '/store/[id]', params: { id: m.id } })} style={{ overflow: 'hidden' }}>
      <View style={{ height: 150, backgroundColor: p.fill }}>
        {!bad ? <Image source={{ uri: m.image }} onError={() => setBad(true)} style={{ width: '100%', height: '100%' }} accessibilityIgnoresInvertColors /> : null}
        <View style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 6 }}>
          {m.discountPct ? <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: p.brand, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}><Percent size={12} color="#fff" /><Txt size={12} weight="bold" color="#fff">-{m.discountPct}% on some items</Txt></View> : null}
        </View>
        <View style={{ position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: p.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
          <Clock size={12} color={p.ink} /><Txt size={12} weight="bold">{m.etaMin}-{m.etaMax} min</Txt>
        </View>
        {!m.open ? <View style={{ ...({ position: 'absolute', inset: 0 } as object), backgroundColor: p.overlay, alignItems: 'center', justifyContent: 'center' }}><Pill label="Closed" tone="bad" /></View> : null}
      </View>
      <View style={{ padding: 14, gap: 4 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt size={17} weight="display" style={{ flex: 1 }} numberOfLines={1}>{m.name}</Txt>
          <Row gap={4}><ThumbsUp size={14} color={p.ok} /><Txt size={13} weight="bold" color={p.ok}>{m.rating}% ({m.ratingCount})</Txt></Row>
        </Row>
        <Txt size={13} color={p.mute} numberOfLines={1}>{m.cuisine.join(' · ')} · {m.distanceKm.toFixed(1)} km · {m.deliveryFee === 0 ? 'Free delivery' : ngn(m.deliveryFee) + ' delivery'}</Txt>
      </View>
    </Card>
  );
}

export function ProductRow({ product, merchant }: { product: Product; merchant: Merchant }) {
  const p = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`${product.name}, ${ngn(product.price)}`} onPress={() => { tap(); setOpen(true); }}
        style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: p.line, opacity: product.inStock ? 1 : 0.5 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt size={16} weight="bold">{product.name}</Txt>
          <Txt size={13} color={p.mute} numberOfLines={2}>{product.desc}</Txt>
          <Row gap={8}>
            <Txt size={15} weight="bold">{ngn(product.price)}</Txt>
            {product.rx ? <Pill label="Prescription" tone="warn" /> : null}
            {!product.inStock ? <Pill label="Sold out" tone="bad" /> : null}
          </Row>
        </View>
        <Image source={{ uri: product.image }} style={{ width: 88, height: 88, borderRadius: radius.md, backgroundColor: p.fill }} accessibilityIgnoresInvertColors />
        {product.inStock ? <View style={{ position: 'absolute', right: 6, bottom: 18, width: 32, height: 32, borderRadius: 16, backgroundColor: p.brand, alignItems: 'center', justifyContent: 'center' }}><Plus size={18} color="#fff" /></View> : null}
      </Pressable>
      <ProductSheet product={product} merchant={merchant} visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function ProductSheet({ product, merchant, visible, onClose }: { product: Product; merchant: Merchant; visible: boolean; onClose: () => void }) {
  const p = useTheme();
  const toast = useToast();
  const add = useCart((s) => s.add);
  const replaceWith = useCart((s) => s.replaceWith);
  const [picked, setPicked] = useState<ModifierOption[]>(() => product.modifiers.filter((g) => g.required && !g.multi).map((g) => g.options[0]));
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [swap, setSwap] = useState(false);
  const err = validateMods(product.modifiers, picked);

  const toggle = (gid: string, o: ModifierOption, multi: boolean, max: number) => {
    tick();
    const g = product.modifiers.find((x) => x.id === gid)!;
    const others = picked.filter((x) => !g.options.some((y) => y.id === x.id));
    const mine = picked.filter((x) => g.options.some((y) => y.id === x.id));
    if (!multi) return setPicked([...others, o]);
    if (mine.some((x) => x.id === o.id)) return setPicked([...others, ...mine.filter((x) => x.id !== o.id)]);
    if (max > 0 && mine.length >= max) { toast(`Choose up to ${max} for ${g.name}.`, 'info'); return; }
    setPicked([...others, ...mine, o]);
  };

  const submit = () => {
    if (err) { toast(err, 'bad'); return; }
    const r = add(merchant, product, picked, qty, note || undefined);
    if (r === 'mixed') { setSwap(true); return; }
    toast(`${product.name} added to basket.`, 'ok'); onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={product.name} tall>
      <Txt size={14} color={p.mute}>{product.desc}</Txt>
      {product.rx ? <Pill label="Needs a valid prescription at checkout" tone="warn" /> : null}
      {product.modifiers.map((g) => (
        <View key={g.id} style={{ gap: 8 }}>
          <Row style={{ justifyContent: 'space-between' }}><Txt size={16} weight="bold">{g.name}</Txt><Pill label={g.required ? 'Required' : g.multi ? `Up to ${g.max}` : 'Optional'} tone={g.required ? 'brand' : 'neutral'} /></Row>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {g.options.map((o) => <Chip key={o.id} label={o.price ? `${o.name} +${ngn(o.price)}` : o.name} selected={picked.some((x) => x.id === o.id)} onPress={() => toggle(g.id, o, g.multi, g.max)} />)}
          </View>
        </View>
      ))}
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt size={16} weight="bold">Quantity</Txt>
        <Row gap={14}>
          <Pressable accessibilityLabel="Decrease quantity" onPress={() => { tick(); setQty(Math.max(1, qty - 1)); }} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}><Minus size={18} color={p.ink} /></Pressable>
          <Txt size={18} weight="display" style={{ minWidth: 24 }} align="center">{qty}</Txt>
          <Pressable accessibilityLabel="Increase quantity" onPress={() => { tick(); setQty(Math.min(20, qty + 1)); }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: p.brand, alignItems: 'center', justifyContent: 'center' }}><Plus size={18} color="#fff" /></Pressable>
        </Row>
      </Row>
      <Button label={`Add to basket · ${ngn(unitPrice(product.price, picked) * qty)}`} onPress={submit} disabled={!product.inStock} />
      <Sheet visible={swap} onClose={() => setSwap(false)} title="Start a new basket?">
        <Txt size={14} color={p.mute}>Your basket has items from another store. A basket can hold one store at a time.</Txt>
        <Button label={`Clear and add from ${merchant.name}`} onPress={() => { replaceWith(merchant, product, picked, qty, note || undefined); setSwap(false); onClose(); toast('New basket started.', 'ok'); }} />
        <Button label="Keep my current basket" variant="ghost" onPress={() => setSwap(false)} />
      </Sheet>
    </Sheet>
  );
}
