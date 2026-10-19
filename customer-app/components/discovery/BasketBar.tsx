import React from 'react';
import { Pressable, View } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { router } from 'expo-router';
import { Txt } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useCart } from '@/stores/cart';
import { itemCount, subtotal } from '@/lib/smart-cart';
import { ngn } from '@/lib/format';
import { tap } from '@/lib/sound-effects';

/** Floating basket shortcut shown on any screen when the basket has items. */
export function BasketBar() {
  const p = useTheme();
  const lines = useCart((s) => s.lines);
  const m = useCart((s) => s.merchant);
  if (!lines.length) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: 12 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`View basket, ${itemCount(lines)} items`} onPress={() => { tap(); router.push('/checkout'); }}
        style={{ backgroundColor: p.brand, borderRadius: 999, paddingHorizontal: 20, height: 56, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.25)', alignItems: 'center', justifyContent: 'center' }}><Txt size={13} weight="bold" color="#fff">{itemCount(lines)}</Txt></View>
        <View style={{ flex: 1 }}><Txt size={15} weight="bold" color="#fff">View basket</Txt>{m ? <Txt size={11} color="#fff" numberOfLines={1}>{m.name}</Txt> : null}</View>
        <ShoppingBag size={18} color="#fff" />
        <Txt size={15} weight="bold" color="#fff">{ngn(subtotal(lines))}</Txt>
      </Pressable>
    </View>
  );
}
