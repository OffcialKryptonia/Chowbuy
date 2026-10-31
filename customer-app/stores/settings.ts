import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '@/lib/types';

interface SettingsState {
  theme: ThemeMode;
  sounds: boolean;
  haptics: boolean;
  pushOneSignal: boolean;
  /** Notification sound id from lib/sounds.ts (a plain string here so the store has no audio dependency). */
  notifSound: string;
  onboarded: boolean;
  set: (p: Partial<Omit<SettingsState, 'set'>>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      sounds: true,
      haptics: true,
      pushOneSignal: false,
      notifSound: 'dingtone',
      onboarded: false,
      set: (p) => set(p),
    }),
    { name: 'cb-settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

/** True once the saved settings have been read from storage (so the first-run intro is not flashed at returning users). */
export function useSettingsHydrated(): boolean {
  const [done, setDone] = useState(() => useSettings.persist.hasHydrated());
  useEffect(() => {
    if (useSettings.persist.hasHydrated()) { setDone(true); return; }
    return useSettings.persist.onFinishHydration(() => setDone(true));
  }, []);
  return done;
}
