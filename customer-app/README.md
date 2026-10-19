# ChowBuy Customer App (iOS and Android)

Expo SDK 51, React Native 0.74, Expo Router 3, TypeScript strict, Zustand + AsyncStorage, TanStack Query, react-native-maps (Google), livekit-client, Lucide icons.

## Run
```
npm install --legacy-peer-deps
npx expo start --dev-client        # needs a development build (maps, LiveKit, OneSignal are native)
eas build --profile development --platform all
```
Demo mode needs no backend: orders, rider movement, chat replies, payments and the payment-link webhook are simulated (`lib/simulator.ts`).

## Before a real release
1. `app.json`: replace the Google Maps iOS/Android key placeholders (restrict by bundle id / package + SHA-1) and the bundle ids if needed.
2. Backend: **Supabase** (schema, functions and setup in `supabase/` and `docs/SUPABASE.md`). Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`; the app leaves demo mode automatically. (`docs/API.md` describes the original REST design and is superseded.)
3. Push: FCM (`google-services.json`, APNs key in EAS) or OneSignal (set the App ID in Admin and `onesignal-expo-plugin` in app.json).
4. Calls: LiveKit works through `/calls/token`. Agora is a documented extension point only (`lib/voip.ts`).
5. iOS Live Activities / Dynamic Island need a native widget extension (ActivityKit) and are not included.
6. Product photos are hotlinked Unsplash URLs for demo; serve your own.

## Theme
Light, Dark or System (Profile > Appearance), persisted. NativeWind is configured but screens use a `useTheme()` palette with inline styles.

## Port to Flutter
`lib/*` (pure logic, API contract, realtime schema) and `stores/*` are UI-free and map 1:1 to Dart services and providers.

## Checks
`npm run typecheck` and `npm test` (cart, fees, courier fare, phone formatting, area search).

## Build a test APK (Android)
```
npm install --legacy-peer-deps
npx eas-cli login            # free Expo account
npx eas-cli build:configure  # first time only, accept defaults
npx eas-cli build --platform android --profile apk
```
EAS builds in the cloud and returns a download link / QR for the .apk. The `apk` profile runs in demo mode (no backend); the `live` profile talks to your Supabase project (fill in `eas.json` first). For the map to render, put a Google Maps Android key in `app.json` (`android.config.googleMaps.apiKey`) first.
