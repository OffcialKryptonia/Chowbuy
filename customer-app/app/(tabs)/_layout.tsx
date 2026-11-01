import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Pill, Receipt, ShoppingBasket, UserRound } from 'lucide-react-native';
import { useTheme, fonts } from '@/lib/theme';
import { useOrders, isActive } from '@/stores/orders';
import { tick } from '@/lib/sound-effects';
import { useTotalUnread } from '@/hooks/useDriverChat';

export default function TabsLayout() {
  const p = useTheme();
  const active = useOrders((s) => s.orders.filter(isActive).length);
  const unread = useTotalUnread();
  const icon = (I: typeof Home) => ({ color, size }: { color: string; size: number }) => <I color={color} size={size} />;
  return (
    <Tabs
      screenListeners={{ tabPress: () => tick() }}
      screenOptions={{
        headerShown: false, tabBarActiveTintColor: p.brand, tabBarInactiveTintColor: p.mute,
        tabBarStyle: { backgroundColor: p.surface, borderTopColor: p.line, height: 64, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: fonts.semi, fontSize: 11 },
        tabBarBadgeStyle: { backgroundColor: p.brand, color: '#fff' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon(Home) }} />
      <Tabs.Screen name="grocery" options={{ title: 'Mart', tabBarIcon: icon(ShoppingBasket) }} />
      <Tabs.Screen name="retail" options={{ title: 'Pharmacy', tabBarIcon: icon(Pill) }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: icon(Receipt), tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : active > 0 ? active : undefined, tabBarBadgeStyle: { backgroundColor: unread > 0 ? '#E5362B' : p.brand, color: '#fff' } }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon(UserRound) }} />
    </Tabs>
  );
}
