import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import MapView, { AnimatedRegion, Marker, MarkerAnimated, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Crosshair, MapPin, RefreshCw, Store } from 'lucide-react-native';
import * as Location from 'expo-location';
import { RiderMarker } from './RiderMarker';
import { Txt } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { darkMapStyle, lightMapStyle } from '@/lib/mapStyle';
import { tap } from '@/lib/sound-effects';
import type { LatLng } from '@/lib/types';

interface Props {
  merchant: LatLng;
  customer: LatLng;
  route?: LatLng[];
  rider?: { pos: LatLng; heading: number; vehicle: 'Bike' | 'Car' } | null;
  /** Fraction of the route already travelled, used to dim the part behind the rider. */
  progress?: number;
  onSearchArea?: (center: LatLng) => void;
  height?: number | string;
}

export function DeliveryMapView({ merchant, customer, route = [], rider, progress = 0, onSearchArea, height = '100%' }: Props) {
  const p = useTheme();
  const map = useRef<MapView>(null);
  const [moved, setMoved] = useState(false);
  const [center, setCenter] = useState<LatLng>(customer);
  const coord = useRef(new AnimatedRegion({ latitude: rider?.pos.latitude ?? merchant.latitude, longitude: rider?.pos.longitude ?? merchant.longitude, latitudeDelta: 0, longitudeDelta: 0 })).current;
  const [heading, setHeading] = useState(rider?.heading ?? 0);

  // Glide the marker to each new position instead of teleporting, and turn the arrow the short way round.
  useEffect(() => {
    if (!rider) return;
    coord.timing({ latitude: rider.pos.latitude, longitude: rider.pos.longitude, latitudeDelta: 0, longitudeDelta: 0, duration: 900, useNativeDriver: false } as never).start();
    setHeading((h) => { const d = ((rider.heading - h + 540) % 360) - 180; return (h + d + 360) % 360; });
  }, [rider?.pos.latitude, rider?.pos.longitude, rider?.heading, coord, rider]);

  useEffect(() => {
    const pts = [merchant, customer, ...(rider ? [rider.pos] : [])];
    const t = setTimeout(() => map.current?.fitToCoordinates(pts, { edgePadding: { top: 90, right: 60, bottom: 320, left: 60 }, animated: true }), 350);
    return () => clearTimeout(t);
  }, [merchant, customer, route.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const split = useMemo(() => {
    if (!route.length) return { done: [] as LatLng[], todo: [] as LatLng[] };
    const i = Math.min(route.length - 1, Math.max(0, Math.round(progress * (route.length - 1))));
    return { done: route.slice(0, i + 1), todo: route.slice(i) };
  }, [route, progress]);

  const locate = async () => {
    tap();
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return;
    const pos = await Location.getCurrentPositionAsync({});
    map.current?.animateToRegion({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);
  };

  return (
    <View style={{ height: height as number, width: '100%', overflow: 'hidden' }}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        customMapStyle={p.scheme === 'dark' ? darkMapStyle : lightMapStyle}
        initialRegion={{ latitude: customer.latitude, longitude: customer.longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 }}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onRegionChangeComplete={(r, g) => { setCenter({ latitude: r.latitude, longitude: r.longitude }); if (g?.isGesture) setMoved(true); }}
      >
        {split.done.length > 1 ? <Polyline coordinates={split.done} strokeColor={p.mute} strokeWidth={4} /> : null}
        {split.todo.length > 1 ? <Polyline coordinates={split.todo} strokeColor={p.brand} strokeWidth={5} lineCap="round" /> : null}
        <Marker coordinate={merchant} anchor={{ x: 0.5, y: 0.5 }} title="Store" tracksViewChanges={false}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: p.ink, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' }}><Store size={16} color={p.bg} /></View>
        </Marker>
        <Marker coordinate={customer} anchor={{ x: 0.5, y: 1 }} title="Delivery address" tracksViewChanges={false}>
          <View style={{ alignItems: 'center' }}><MapPin size={38} color={p.ok} fill={p.ok} /></View>
        </Marker>
        {rider ? (
          <MarkerAnimated coordinate={coord as never} anchor={{ x: 0.5, y: 0.5 }} flat tracksViewChanges={Platform.OS === 'android' ? true : false} zIndex={10}>
            <RiderMarker vehicle={rider.vehicle} heading={heading} />
          </MarkerAnimated>
        ) : null}
      </MapView>

      {moved && onSearchArea ? (
        <View pointerEvents="box-none" style={{ position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center' }}>
          <Pressable accessibilityRole="button" onPress={() => { tap(); setMoved(false); onSearchArea(center); }}
            style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: p.surface, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: p.line, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 }}>
            <RefreshCw size={15} color={p.brand} /><Txt size={13} weight="bold">Search this area</Txt>
          </Pressable>
        </View>
      ) : null}

      <Pressable accessibilityRole="button" accessibilityLabel="Locate me" onPress={locate}
        style={{ position: 'absolute', right: 14, bottom: 14, width: 46, height: 46, borderRadius: 23, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 }}>
        <Crosshair size={20} color={p.ink} />
      </Pressable>
    </View>
  );
}
