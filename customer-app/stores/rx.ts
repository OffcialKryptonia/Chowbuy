import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Rx { id: string; uri: string; patient: string; status: 'pending' | 'clarify' | 'verified' | 'rejected'; note?: string; at: number }
interface RxState {
  list: Rx[];
  add: (uri: string, patient: string) => Rx;
  push: (r: Rx) => void;
  replace: (list: Rx[]) => void;
  setStatus: (id: string, status: Rx['status'], note?: string) => void;
}
export const useRx = create<RxState>()(
  persist(
    (set, get) => ({
      list: [],
      add: (uri, patient) => {
        const r: Rx = { id: 'RX-' + (3400 + get().list.length + 1), uri, patient, status: 'pending', at: Date.now() };
        set({ list: [r, ...get().list] });
        return r;
      },
      push: (r) => set({ list: [r, ...get().list.filter((x) => x.id !== r.id)] }),
      replace: (list) => set({ list }),
      setStatus: (id, status, note) => set({ list: get().list.map((r) => (r.id === id ? { ...r, status, note } : r)) }),
    }),
    { name: 'cb-rx', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
