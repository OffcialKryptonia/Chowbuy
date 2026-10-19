import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SavedAddress, Vertical, WalletTx } from '@/lib/types';
import { DEFAULT_ADDRESSES } from '@/lib/mock';
import { DEMO } from '@/lib/config';

interface SessionState {
  name: string;
  email: string;
  phone: string;
  points: number;
  wallet: number;
  txs: WalletTx[];
  addresses: SavedAddress[];
  activeAddressId: string;
  vertical: Vertical;
  setVertical: (v: Vertical) => void;
  addAddress: (a: Omit<SavedAddress, 'id'>) => SavedAddress;
  removeAddress: (id: string) => void;
  setActiveAddress: (id: string) => void;
  topUp: (amount: number) => string | null;
  send: (amount: number, to: string) => string | null;
  spend: (amount: number, title: string) => string | null;
  award: (points: number) => void;
  update: (p: Partial<Pick<SessionState, 'name' | 'email' | 'phone'>>) => void;
  /** Live mode: the server is the source of truth for these. */
  setAccount: (a: Pick<SessionState, 'name' | 'email' | 'phone' | 'points' | 'wallet' | 'txs' | 'addresses'>) => void;
  clear: () => void;
}

const tx = (title: string, amount: number, dir: 1 | -1): WalletTx => ({ id: 'T' + Date.now() + Math.floor(Math.random() * 99), title, amount, dir, at: Date.now() });

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      ...(DEMO ? {
        name: 'Chiamaka Eze', email: 'chiamaka@example.ng', phone: '+234 803 555 0142', points: 120, wallet: 18500,
        txs: [
          { id: 'T1', title: 'Wallet top-up', amount: 20000, dir: 1 as const, at: Date.now() - 3 * 86400000 },
          { id: 'T2', title: 'Order #CB-84811', amount: 1500, dir: -1 as const, at: Date.now() - 2 * 86400000 },
        ],
        addresses: DEFAULT_ADDRESSES, activeAddressId: 'a1',
      } : { name: '', email: '', phone: '', points: 0, wallet: 0, txs: [] as WalletTx[], addresses: [] as SavedAddress[], activeAddressId: '' }),
      vertical: 'restaurant',
      setVertical: (vertical) => set({ vertical }),
      addAddress: (a) => {
        const n = { ...a, id: 'a' + Date.now() };
        set({ addresses: [...get().addresses, n], activeAddressId: n.id });
        return n;
      },
      removeAddress: (id) => {
        const left = get().addresses.filter((a) => a.id !== id);
        if (!left.length) return;
        set({ addresses: left, activeAddressId: get().activeAddressId === id ? left[0].id : get().activeAddressId });
      },
      setActiveAddress: (activeAddressId) => set({ activeAddressId }),
      topUp: (amount) => {
        if (!(amount >= 500)) return 'Minimum top-up is ₦500.';
        if (amount > 500000) return 'Maximum single top-up is ₦500,000.';
        set({ wallet: get().wallet + amount, txs: [tx('Wallet top-up', amount, 1), ...get().txs] });
        return null;
      },
      send: (amount, to) => {
        if (!(amount >= 100)) return 'Minimum transfer is ₦100.';
        if (amount > get().wallet) return 'That is more than your wallet balance.';
        set({ wallet: get().wallet - amount, txs: [tx('Sent to ' + to, amount, -1), ...get().txs] });
        return null;
      },
      spend: (amount, title) => {
        if (amount > get().wallet) return 'Your wallet balance is too low for this order.';
        set({ wallet: get().wallet - amount, txs: [tx(title, amount, -1), ...get().txs] });
        return null;
      },
      award: (points) => set({ points: get().points + points }),
      update: (p) => set(p),
      setAccount: (a) => {
        const keep = a.addresses.some((x) => x.id === get().activeAddressId) ? get().activeAddressId : a.addresses[0]?.id ?? '';
        set({ ...a, activeAddressId: keep });
      },
      clear: () => set({ name: '', email: '', phone: '', points: 0, wallet: 0, txs: [], addresses: [], activeAddressId: '' }),
    }),
    { name: 'cb-session', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
