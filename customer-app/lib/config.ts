import Constants from 'expo-constants';

/** Demo mode runs the full app against an in-app simulator so it works without a backend. */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
/** Explicit EXPO_PUBLIC_DEMO wins. Otherwise the app goes live as soon as a Supabase project is configured. */
export const DEMO = process.env.EXPO_PUBLIC_DEMO != null ? process.env.EXPO_PUBLIC_DEMO === '1' : !SUPABASE_URL;
/** Public sponsor page that opens a payment link (static page on Cloudflare Pages calling the payment-link function). */
export const PAY_URL = process.env.EXPO_PUBLIC_PAY_URL ?? 'https://pay.chowbuy.ng';
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.chowbuy.ng';
export const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? API_URL.replace(/^http/, 'ws') + '/realtime';
/**
 * Maps SDK keys live in app.json (restricted by bundle id / package). The Directions API key must stay on the
 * server: the app calls `${API_URL}/maps/directions`. A client key is accepted only for local development.
 */
export const DEV_DIRECTIONS_KEY = process.env.EXPO_PUBLIC_DEV_DIRECTIONS_KEY ?? '';
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export const FALLBACK_CONFIG = {
  gateways: {
    korapay: { enabled: true, publicKey: 'pk_test_demo', live: false },
    pocketfi: { enabled: true, live: false },
    cod: { enabled: true, maxAmount: 20000 },
    wallet: { enabled: true },
  },
  realtime: { provider: 'livekit' as const, livekitUrl: 'wss://chowbuy.livekit.cloud' },
  push: { onesignalAppId: '', fcmEnabled: true },
  maps: { directionsViaProxy: true },
  loyalty: { reviewPoints: 50 },
  auth: { google: { enabled: false }, apple: { enabled: false } },   // off until Admin switches them on
};
