import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { ArrowLeft, Crosshair, MapPin, Navigation, Store } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Button, Page, Txt, tap } from '@/components/ui';
import { useTheme } from '@/lib/theme';
type LatLng = { latitude: number; longitude: number };
const darkMapStyle = [{ elementType: 'geometry', stylers: [{ color: '#18202d' }] }, { elementType: 'labels.text.fill', stylers: [{ color: '#aeb8c8' }] }, { elementType: 'labels.text.stroke', stylers: [{ color: '#18202d' }] }, { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#303a4c' }] }];
const lightMapStyle = [{ elementType: 'geometry', stylers: [{ color: '#f3f5f8' }] }, { elementType: 'labels.text.fill', stylers: [{ color: '#525e70' }] }, { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] }];

const pickup: LatLng = { latitude: 6.4312, longitude: 3.4241 }; // Lekki Phase 1 demo location
const dropoff: LatLng = { latitude: 6.4281, longitude: 3.4219 };
const fallbackRegion: Region = { ...pickup, latitudeDelta: 0.035, longitudeDelta: 0.035 };

export default function RiderMap() {
  const p = useTheme();
  const router = useRouter();
  const map = useRef<MapView>(null);
  const [rider, setRider] = useState<LatLng | null>(null);
  const [locationState, setLocationState] = useState<'loading' | 'ready' | 'denied' | 'unavailable'>('loading');

  const route = useMemo(() => rider ? [rider, pickup, dropoff] : [pickup, dropoff], [rider]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!mounted) return;
        if (!permission.granted) { setLocationState('denied'); return; }
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!mounted) return;
        setRider({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationState('ready');
      } catch {
        if (mounted) setLocationState('unavailable');
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const points = rider ? [rider, pickup, dropoff] : [pickup, dropoff];
    const timer = setTimeout(() => map.current?.fitToCoordinates(points, {
      edgePadding: { top: 80, right: 50, bottom: 100, left: 50 }, animated: true,
    }), 500);
    return () => clearTimeout(timer);
  }, [rider]);

  const locate = async () => {
    tap();
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Location permission needed', 'Allow location access in Android Settings to show your current position.');
        setLocationState('denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const point = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setRider(point);
      setLocationState('ready');
      map.current?.animateToRegion({ ...point, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 450);
    } catch {
      setLocationState('unavailable');
      Alert.alert('Location unavailable', 'Check that device location is turned on and try again.');
    }
  };

  return (
    <Page back={false} footer={<><Button label="Simulate incoming order" variant="brand" onPress={() => router.push('/offer')} /><Button label="Back to rider home" variant="soft" onPress={() => router.replace('/home')} /></>}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: p.fill }}>
          <ArrowLeft color={p.ink} size={21} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Txt size={23} weight="display">Delivery map</Txt>
          <Txt size={12} color={p.mute}>Preview route · Lekki Phase 1</Txt>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Locate rider" onPress={locate} style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: p.fill }}>
          <Crosshair color={p.brand} size={21} />
        </Pressable>
      </View>

      <View style={{ height: 390, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: p.line }}>
        <MapView ref={map} style={{ flex: 1 }} provider={PROVIDER_GOOGLE} initialRegion={fallbackRegion}
          customMapStyle={p.scheme === 'dark' ? darkMapStyle : lightMapStyle}
          showsUserLocation={locationState === 'ready'} showsMyLocationButton={false} toolbarEnabled={false}>
          <Polyline coordinates={route} strokeColor={p.brand} strokeWidth={5} lineCap="round" />
          <Marker coordinate={pickup} title="Mama Put Kitchen" description="Demo pickup · Lekki Phase 1">
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: p.ink, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' }}><Store size={18} color={p.bg} /></View>
          </Marker>
          <Marker coordinate={dropoff} title="Customer drop-off" description="Demo destination">
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: p.ok, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' }}><MapPin size={20} color="#fff" /></View>
          </Marker>
          {rider ? <Marker coordinate={rider} title="Your current location" description="Device location"><View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#247BFF', borderWidth: 4, borderColor: '#fff' }} /></Marker> : null}
        </MapView>
      </View>

      <View style={{ padding: 14, borderRadius: 16, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Navigation size={16} color={p.brand} /><Txt size={15} weight="bold">Demo route preview</Txt></View>
        <Txt size={13} color={p.mute}>This map currently uses sample pickup and drop-off points. Live order routing and dispatch will be connected in the backend integration phase.</Txt>
        <Txt size={12} color={locationState === 'ready' ? p.ok : p.mute}>{locationState === 'ready' ? 'Device location available' : locationState === 'denied' ? 'Location permission denied — tap the crosshair to retry' : locationState === 'unavailable' ? 'Could not read device location' : 'Checking device location…'}</Txt>
      </View>
    </Page>
  );
}
