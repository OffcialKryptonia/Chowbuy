import { useEffect, useRef } from 'react';
import { gpsIntervalMs, speedKmh } from '@/lib/telemetry';
import { useRider } from '@/stores/rider';
import { TRACKING_TASK } from '@/lib/location-task';

/**
 * While the rider is online and not on break, watches their position at the interval the throttle engine asks for,
 * and keeps an Android foreground-service notification running so tracking survives with the screen off.
 * Everything is wrapped so a missing permission or module never crashes the app.
 */
export function useTracking(atStore: boolean) {
  const online = useRider((s) => s.online);
  const onBreak = useRider((s) => s.onBreak);
  const setPos = useRider((s) => s.setPos);
  const sub = useRef<{ remove: () => void } | null>(null);
  const speed = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const stop = async () => {
      sub.current?.remove(); sub.current = null;
      try {
        const Location = require('expo-location') as typeof import('expo-location');
        if (await Location.hasStartedLocationUpdatesAsync(TRACKING_TASK)) await Location.stopLocationUpdatesAsync(TRACKING_TASK);
      } catch { /* nothing to stop */ }
    };
    const run = async () => {
      const interval = gpsIntervalMs({ online, onBreak, atStore, speedKmh: speed.current });
      if (interval == null) { await stop(); return; }
      try {
        const Location = require('expo-location') as typeof import('expo-location');
        const fg = await Location.requestForegroundPermissionsAsync();
        if (!fg.granted || cancelled) return;
        sub.current?.remove();
        sub.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: interval, distanceInterval: 5 },
          (loc) => { speed.current = speedKmh(loc.coords.speed); setPos(loc.coords.latitude, loc.coords.longitude); },
        );
        const bg = await Location.requestBackgroundPermissionsAsync();
        if (bg.granted && !(await Location.hasStartedLocationUpdatesAsync(TRACKING_TASK))) {
          await Location.startLocationUpdatesAsync(TRACKING_TASK, {
            accuracy: Location.Accuracy.High, timeInterval: interval, distanceInterval: 10,
            foregroundService: { notificationTitle: 'ChowBuy Rider is online', notificationBody: 'Sharing your location while you are online.', notificationColor: '#FF5A1F' },
          });
        }
      } catch { /* permission denied or unsupported: the app keeps working without live tracking */ }
    };
    void run();
    return () => { cancelled = true; if (!online || onBreak) void stop(); sub.current?.remove(); sub.current = null; };
  }, [online, onBreak, atStore, setPos]);
}
