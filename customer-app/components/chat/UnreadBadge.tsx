import React from 'react';
import { View } from 'react-native';
import { Txt } from '@/components/ui';

/** Live red count of messages you have not read. Hidden at zero; "99+" past 99. */
export function UnreadBadge({ count, size = 20 }: { count: number; size?: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? '99+' : String(count);
  return (
    <View accessible accessibilityLabel={`${count} unread ${count === 1 ? 'message' : 'messages'}`}
      style={{ minWidth: size, height: size, borderRadius: size / 2, paddingHorizontal: 6, backgroundColor: '#E5362B', alignItems: 'center', justifyContent: 'center' }}>
      <Txt size={11} weight="bold" color="#fff">{label}</Txt>
    </View>
  );
}
