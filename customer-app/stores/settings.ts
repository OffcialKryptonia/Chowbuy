import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '@/lib/types';

interface SettingsState {
  theme: ThemeMode;
  sounds: boolean;
  haptics: boolean;
  pushOneSignal: boolean;
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
      onboarded: false,
      set: (p) => set(p),
    }),
    { name: 'cb-settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
