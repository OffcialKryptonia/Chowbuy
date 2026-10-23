/**
 * Live mode talks to the ChowBuy backend (Supabase). Demo mode runs the whole app on built-in sample data.
 * The build sets EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (the anon key is public by design: every table sits behind
 * row-level security and every write is a SECURITY DEFINER function). EXPO_PUBLIC_DEMO=1 forces demo mode.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const LIVE = !!SUPABASE_URL && !!SUPABASE_ANON_KEY && process.env.EXPO_PUBLIC_DEMO !== '1';
