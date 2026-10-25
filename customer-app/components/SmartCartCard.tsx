import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Sparkles, X } from 'lucide-react-native';
import { Button, Card, Row, Txt } from '@/components/ui';
import { useCart } from '@/stores/cart';
import { useCatalog } from '@/stores/catalog';
import { useOrders } from '@/stores/orders';
import { useCatalogConfig } from '@/hooks/useCatalogConfig';
import { useTheme } from '@/lib/theme';
import { flagOn, freeFrom } from '@/lib/catalog-config';
import { suggest, type Suggestion } from '@/lib/suggestions';
import { supabase } from '@/lib/supabase';
import { DEMO } from '@/lib/config';
import { subtotal } from '@/lib/smart-cart';
import { tap } from '@/lib/sound-effects';
import type { Merchant } from '@/lib/types';

/** Fire-and-forget: reports shown / accepted / dismissed so the Admin Smart Cart page has real numbers. Never blocks checkout. */
const track = (kind: string, rec: string) => {
  if (DEMO) return;
  void Promise.resolve(supabase.rpc('smart_cart_track', { p_kind: kind, p_rec: rec })).catch(() => undefined);
};

/** Basket suggestions: free-delivery top-up, cheaper equivalent, and "the usual". Each one is optional and one tap to undo by changing the basket. */
export function SmartCartCard({ merchant, onChange }: { merchant: Merchant; onChange: () => void }) {
  const p = useTheme();
  const { lines, add, qty } = useCart();
  const products = useCatalog((s) => s.products);
  const orders = useOrders((s) => s.orders);
  const { data: cfg } = useCatalogConfig();
  const [gone, setGone] = useState<string[]>([]);
  const shown = useRef<Set<string>>(new Set());

  const list = useMemo(() => {
    const sub = subtotal(lines);
    return suggest({
      lines, products, merchantId: merchant.id, subtotal: sub, deliveryFee: merchant.deliveryFee, freeFrom: freeFrom(cfg),
      past: orders.map((o) => o.lines), on: (k) => flagOn(cfg, k), max: 3,
    }).filter((s) => !gone.includes(s.id));
  }, [lines, products, orders, cfg, merchant, gone]);

  useEffect(() => {
    list.forEach((s) => { if (!shown.current.has(s.id)) { shown.current.add(s.id); track('opened', s.kind); } });
  }, [list]);

  if (!list.length) return null;

  const accept = (s: Suggestion) => {
    tap();
    if (s.swap) { qty(s.swap.lineKey, 0); add(merchant, s.swap.to, [], s.swap.qty); }
    else if (s.add) add(merchant, s.add, [], 1);
    track('accepted', s.kind);
    onChange();
  };
  const dismiss = (s: Suggestion) => { tap(); track('dismissed', s.kind); setGone((g) => [...g, s.id]); };

  return (
    <Card>
      <Row gap={8}><Sparkles size={18} color={p.brand} /><Txt size={15} weight="bold">Smart suggestions</Txt></Row>
      {list.map((s) => (
        <View key={s.id} style={{ marginTop: 10, gap: 6 }}>
          <Row gap={8} style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Txt size={14} weight="semi">{s.title}</Txt>
              <Txt size={12} color={p.mute}>{s.detail}</Txt>
            </View>
            <Pressable accessibilityLabel="Dismiss suggestion" hitSlop={10} onPress={() => dismiss(s)}><X size={16} color={p.mute} /></Pressable>
          </Row>
          <Button full={false} variant="soft" label={s.swap ? 'Switch' : 'Add'} onPress={() => accept(s)} />
        </View>
      ))}
    </Card>
  );
}
