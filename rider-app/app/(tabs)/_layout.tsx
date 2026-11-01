import { LIVE } from '@/lib/config';
import React from 'react';
import { Tabs } from 'expo-router';
import { Home, ListChecks, Wallet, UserRound } from 'lucide-react-native';
import { useTheme, fonts } from '@/lib/theme';
import { useApply } from '@/stores/apply';
import { useLiveSync } from '@/lib/live-sync';
import { useChatUnread } from '@/lib/chat-unread';

export default function TabsLayout() {
  const p = useTheme();
  const type = useApply((s) => s.type);
  useLiveSync();
  const unread = useChatUnread();
  return (
    <Tabs screenOptions={{
      headerShown: false, tabBarActiveTintColor: p.brand, tabBarInactiveTintColor: p.mute,
      tabBarStyle: { backgroundColor: p.surface, borderTopColor: p.line, height: 62, paddingBottom: 8, paddingTop: 6 },
      tabBarLabelStyle: { fontFamily: fonts.semi, fontSize: 11 },
    }}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined, tabBarBadgeStyle: { backgroundColor: '#E5362B', color: '#fff' }, tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="deliveries" options={{ title: 'Deliveries', tabBarIcon: ({ color, size }) => <ListChecks color={color} size={size} /> }} />
      <Tabs.Screen name="wallet" options={{ title: type === 'fleet' ? 'My shifts' : type === 'flex' && LIVE ? 'Earnings' : 'Wallet', tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }} />
    </Tabs>
  );
}
