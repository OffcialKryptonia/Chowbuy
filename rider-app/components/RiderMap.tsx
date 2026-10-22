import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { Txt } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { darkMapStyle, lightMapStyle } from '@/lib/mapStyle';

export interface LL { lat: number; lng: number }
interface Props { pickup?: LL | null; drop?: LL | null; rider?: LL | null; height?: number; zoneRings?: { at: LL; label: string }[] }

/** True when the build was made with a Google Maps key. Without one the native map would crash, so a drawn map is used instead. */
export const hasMapsKey = (): boolean => Boolean((Constants.expoConfig?.extra as { hasMapsKey?: boolean } | undefined)?.hasMapsKey);

export function RiderMap(props: Props) {
  return hasMapsKey() ? <NativeMap {...props} /> : <DrawnMap {...props} />;
}

function NativeMap({ pickup, drop, rider, height = 260, zoneRings = [] }: Props) {
  const p = useTheme();
  // Loaded only when a key exists, so builds without one never touch the native map module.
  const Maps = require('react-native-maps') as typeof import('react-native-maps');
  const ref = useRef<import('react-native-maps').default | null>(null);
  const pts = [pickup, drop, rider].filter(Boolean) as LL[];
  useEffect(() => {
    if (!pts.length) return;
    const t = setTimeout(() => ref.current?.fitToCoordinates(pts.map((x) => ({ latitude: x.lat, longitude: x.lng })), { edgePadding: { top: 60, right: 50, bottom: 60, left: 50 }, animated: true }), 400);
    return () => clearTimeout(t);
  }, [pickup?.lat, drop?.lat, rider?.lat]); // eslint-disable-line react-hooks/exhaustive-deps
  const { default: MapView, Marker, Polyline, Circle: MCircle, PROVIDER_GOOGLE } = Maps;
  const c = rider ?? pickup ?? drop ?? { lat: 6.4474, lng: 3.4723 };
  return (
    <View style={{ height, borderRadius: 18, overflow: 'hidden', borderWidth: 1.5, borderColor: p.line }}>
      <MapView ref={ref} style={StyleSheet.absoluteFill} provider={PROVIDER_GOOGLE} customMapStyle={p.scheme === 'dark' ? darkMapStyle : lightMapStyle}
        initialRegion={{ latitude: c.lat, longitude: c.lng, latitudeDelta: 0.06, longitudeDelta: 0.06 }} showsUserLocation toolbarEnabled={false}>
        {pickup && drop ? <Polyline coordinates={[{ latitude: pickup.lat, longitude: pickup.lng }, { latitude: drop.lat, longitude: drop.lng }]} strokeColor={p.brand} strokeWidth={5} /> : null}
        {pickup ? <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} title="Pickup" pinColor="#F59E0B" /> : null}
        {drop ? <Marker coordinate={{ latitude: drop.lat, longitude: drop.lng }} title="Drop-off" pinColor="#10B981" /> : null}
        {rider ? <Marker coordinate={{ latitude: rider.lat, longitude: rider.lng }} title="You" pinColor="#3B82F6" /> : null}
        {zoneRings.map((z) => <MCircle key={z.label} center={{ latitude: z.at.lat, longitude: z.at.lng }} radius={900} strokeColor="#FF5A1F" fillColor="rgba(255,90,31,.18)" />)}
      </MapView>
    </View>
  );
}

/** A simple drawn map used when no Google Maps key is set. Shows the same pickup, drop-off and rider dots. */
function DrawnMap({ pickup, drop, rider, height = 260, zoneRings = [] }: Props) {
  const p = useTheme();
  const all = [pickup, drop, rider, ...zoneRings.map((z) => z.at)].filter(Boolean) as LL[];
  const minLat = Math.min(...all.map((x) => x.lat), 6.41), maxLat = Math.max(...all.map((x) => x.lat), 6.46);
  const minLng = Math.min(...all.map((x) => x.lng), 3.40), maxLng = Math.max(...all.map((x) => x.lng), 3.49);
  const W = 320, H = 200, pad = 28;
  const X = (l: number) => pad + ((l - minLng) / Math.max(maxLng - minLng, 1e-6)) * (W - 2 * pad);
  const Y = (l: number) => H - pad - ((l - minLat) / Math.max(maxLat - minLat, 1e-6)) * (H - 2 * pad);
  const dark = p.scheme === 'dark';
  return (
    <View style={{ height, borderRadius: 18, overflow: 'hidden', borderWidth: 1.5, borderColor: p.line, backgroundColor: dark ? '#1D2536' : '#EFE9E4' }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <Rect x={0} y={0} width={W} height={H} fill={dark ? '#1D2536' : '#EFE9E4'} />
        <Path d={`M0 ${H * 0.72} C ${W * 0.3} ${H * 0.55}, ${W * 0.6} ${H * 0.9}, ${W} ${H * 0.68} L ${W} ${H} L 0 ${H} Z`} fill={dark ? '#173048' : '#CFE3F2'} />
        {[0.2, 0.45, 0.7].map((f) => <Line key={f} x1={0} y1={H * f} x2={W} y2={H * (f - 0.08)} stroke={dark ? '#2A3550' : '#FFFFFF'} strokeWidth={5} />)}
        {[0.25, 0.55, 0.8].map((f) => <Line key={f} x1={W * f} y1={0} x2={W * (f + 0.06)} y2={H} stroke={dark ? '#2A3550' : '#FFFFFF'} strokeWidth={4} />)}
        {zoneRings.map((z) => <Circle key={z.label} cx={X(z.at.lng)} cy={Y(z.at.lat)} r={22} fill="rgba(255,90,31,.2)" stroke="#FF5A1F" strokeWidth={1.5} />)}
        {pickup && drop ? <Line x1={X(pickup.lng)} y1={Y(pickup.lat)} x2={X(drop.lng)} y2={Y(drop.lat)} stroke="#FF5A1F" strokeWidth={4} strokeDasharray="8 6" strokeLinecap="round" /> : null}
        {pickup ? <Circle cx={X(pickup.lng)} cy={Y(pickup.lat)} r={9} fill="#F59E0B" stroke="#fff" strokeWidth={3} /> : null}
        {drop ? <Circle cx={X(drop.lng)} cy={Y(drop.lat)} r={9} fill="#10B981" stroke="#fff" strokeWidth={3} /> : null}
        {rider ? <Circle cx={X(rider.lng)} cy={Y(rider.lat)} r={9} fill="#3B82F6" stroke="#fff" strokeWidth={3} /> : null}
      </Svg>
      <View style={{ position: 'absolute', left: 10, bottom: 8, backgroundColor: p.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Txt size={11} color={p.mute}>Preview map · Google map needs a Maps key</Txt>
      </View>
    </View>
  );
}
