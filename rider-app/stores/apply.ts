import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RiderType, Vehicle } from '@/lib/validation';

interface ApplyState {
  name: string; plate: string;
  email: string; phone: string; type: RiderType | null; vehicle: Vehicle | null;
  /** Held in memory only, never written to storage. */
  password: string;
  submitted: boolean;
  /** True for the built-in demo riders: they skip approval. */
  verified: boolean;
  set: (p: Partial<Omit<ApplyState, 'set'>>) => void;
  reset: () => void;
}

const empty = { name: '', plate: '', email: '', phone: '', type: null, vehicle: null, password: '', submitted: false, verified: false } as const;

export const useApply = create<ApplyState>()(
  persist(
    (set) => ({ ...empty, set: (p) => set(p), reset: () => set({ ...empty }) }),
    { name: 'cb-rider-apply', storage: createJSONStorage(() => AsyncStorage), partialize: ({ password: _pw, ...rest }) => rest as ApplyState },
  ),
);
