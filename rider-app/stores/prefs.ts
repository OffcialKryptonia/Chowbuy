import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_RING } from '@/lib/rings';

interface PrefsState {
  ring: string;
  vibrate: boolean;
  set: (p: Partial<Omit<PrefsState, 'set'>>) => void;
}

export const usePrefs = create<PrefsState>()(
  persist((set) => ({ ring: DEFAULT_RING, vibrate: true, set: (p) => set(p) }), { name: 'cb-rider-prefs', storage: createJSONStorage(() => AsyncStorage) }),
);
