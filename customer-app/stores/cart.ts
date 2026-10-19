import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartLine, Merchant, ModifierOption, Product } from '@/lib/types';
import { addLine, setQty, mixesStores } from '@/lib/smart-cart';

interface CartState {
  merchant: Merchant | null;
  lines: CartLine[];
  promo: { code: string; pct: number } | null;
  /** Returns 'mixed' when the basket belongs to another store so the UI can ask before replacing it. */
  add: (m: Merchant, p: Product, mods: ModifierOption[], qty: number, note?: string) => 'ok' | 'mixed';
  replaceWith: (m: Merchant, p: Product, mods: ModifierOption[], qty: number, note?: string) => void;
  qty: (key: string, q: number) => void;
  applyPromo: (code: string) => string | null;
  setPromo: (p: { code: string; pct: number } | null) => void;
  clear: () => void;
}

const PROMOS: Record<string, number> = { LUNCH15: 15, WELCOME10: 10, CHOW20: 20 };

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      merchant: null,
      lines: [],
      promo: null,
      add: (m, p, mods, qty, note) => {
        const s = get();
        if (mixesStores(s.lines, m.id)) return 'mixed';
        set({ merchant: m, lines: addLine(s.lines, p, mods, qty, note) });
        return 'ok';
      },
      replaceWith: (m, p, mods, qty, note) => set({ merchant: m, promo: null, lines: addLine([], p, mods, qty, note) }),
      qty: (key, q) => {
        const lines = setQty(get().lines, key, q);
        set({ lines, merchant: lines.length ? get().merchant : null, promo: lines.length ? get().promo : null });
      },
      applyPromo: (code) => {
        const c = code.trim().toUpperCase();
        if (!c) return 'Enter a promo code.';
        const pct = PROMOS[c];
        if (!pct) return 'That code is not valid or has expired.';
        set({ promo: { code: c, pct } });
        return null;
      },
      setPromo: (promo) => set({ promo }),
      clear: () => set({ merchant: null, lines: [], promo: null }),
    }),
    { name: 'cb-cart', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
