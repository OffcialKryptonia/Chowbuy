import React from 'react';
import { Tabs } from 'expo-router';
import { Home, ListChecks, Wallet, UserRound } from 'lucide-react-native';
import { useTheme, fonts } from '@/lib/theme';
import { useApply } from '@/stores/apply';

export default function TabsLayout() {
  const p = useTheme();
  const type = useApply((s) => s.type);
  return (
    <Tabs screenOptions={{
      headerShown: false, tabBarActiveTintColor: p.brand, tabBarInactiveTintColor: p.mute,
      tabBarStyle: { backgroundColor: p.surface, borderTopColor: p.line, height: 62, paddingBottom: 8, paddingTop: 6 },
      tabBarLabelStyle: { fontFamily: fonts.semi, fontSize: 11 },
    }}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="deliveries" options={{ title: 'Deliveries', tabBarIcon: ({ color, size }) => <ListChecks color={color} size={size} /> }} />
      <Tabs.Screen name="wallet" options={{ title: type === 'fleet' ? 'My shifts' : 'Wallet', tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }} />
    </Tabs>
  );
}
