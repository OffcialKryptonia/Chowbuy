import { create } from 'zustand';
import { DEMO } from '@/lib/config';
import { MERCHANTS, PRODUCTS } from '@/lib/mock';
import type { Merchant, Product } from '@/lib/types';

interface CatalogState {
  merchants: Merchant[];
  products: Product[];
  loaded: boolean;
  set: (merchants: Merchant[], products: Product[]) => void;
}

/** Stores and menus. Demo mode uses the bundled sample data; live mode fills this from Supabase (see lib/backend.ts). */
export const useCatalog = create<CatalogState>((set) => ({
  merchants: DEMO ? MERCHANTS : [],
  products: DEMO ? PRODUCTS : [],
  loaded: DEMO,
  set: (merchants, products) => set({ merchants, products, loaded: true }),
}));
