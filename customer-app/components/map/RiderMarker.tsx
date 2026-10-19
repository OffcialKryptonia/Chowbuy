import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Bike, CarFront, Package } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';

/**
 * Rider pin: a vehicle glyph in a brand disc with a heading arrow that rotates towards the direction of travel.
 * Rotation is applied to the arrow ring, so the vehicle icon always stays upright and readable.
 */
export function RiderMarker({ vehicle, heading }: { vehicle: 'Bike' | 'Car'; heading: number }) {
  const p = useTheme();
  const Glyph = vehicle === 'Car' ? CarFront : Bike;
  return (
    <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Rider location">
      <View style={{ position: 'absolute', width: 64, height: 64, transform: [{ rotate: `${heading}deg` }] }}>
        <Svg width={64} height={64} viewBox="0 0 64 64"><Path d="M32 2 L42 16 L22 16 Z" fill={p.brand} /></Svg>
      </View>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: p.brand, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 5 }}>
        <Glyph size={20} color="#fff" />
        <View style={{ position: 'absolute', right: -6, bottom: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: p.ink, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' }}>
          <Package size={9} color={p.bg} />
        </View>
      </View>
    </View>
  );
}
