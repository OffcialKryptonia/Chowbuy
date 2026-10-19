import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/lib/theme';

export default function OrdersLayout() {
  const p = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.bg }, animation: 'slide_from_right' }} />;
}
