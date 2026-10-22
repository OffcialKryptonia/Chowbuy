# ChowBuy Rider app (Expo SDK 51)

Onboarding preview: animated welcome (rider on a ChowBuy motorbike), Sign in, and Apply (email + phone, password rules, Fleet / Partner and vehicle). It is **not connected to the backend yet**: the apply flow stores the draft on the device (never the password) and Sign in opens a placeholder home.

Vehicles follow the rider type: Fleet = Motorcycle, Bicycle. Partner = Motorcycle, Bicycle, Car, Truck and Van (truck and van are dispatch only).

```
cd rider-app && npm ci --legacy-peer-deps
npm run typecheck && npm test
npx expo start --dev-client
```

An installable test APK is built by the **Rider Android APK** GitHub workflow (Actions tab, Run workflow). It also launches the APK on an emulator, opens Apply now and fails on a crash.

## Launch screen and icons

The approved helmet artwork is `brand/chowbuy-helmet-logo.png` (never redrawn; only resized in proportion). `brand/launch-screen-sample.png` is the design reference and is not shipped as the splash, because one flattened image cannot stay correct across phones, tablets and foldables.

| What | How |
| --- | --- |
| Android launch screen | `android.splash`, `resizeMode: native`: the logo is a fixed 160 dp wide at every density (`assets/splash/*`), centred on white, so it is never stretched or oversized on tablets or unfolded foldables. |
| iOS launch screen | `splash`, `resizeMode: contain`: `assets/splash-icon.png` is a square canvas with the logo at 34% width, white background. |
| Android 12+ | The system shows the adaptive launcher icon (helmet on white) first; Expo SDK 51 then shows the splash above. Both are white with the same helmet, so the hand-off is seamless. SDK 51 has no separate Android 12 splash-icon setting. |
| App icon | `assets/icon.png` (helmet on white, 84% of 1024), adaptive foreground `assets/adaptive-icon.png` (inside the 66% safe zone) on white. |
| Dark mode | The splash stays white in dark mode: the supplied logo has a white outline that would show on a dark background. |

Layout after launch: Welcome switches to two columns at 720 dp wide or more (tablet, unfolded foldable, landscape) and all forms are capped at 560 dp wide. The rider app allows rotation (`orientation: default`).

Still needs a real-device check: Android 12+ splash hand-off, a tablet, an unfolded foldable, landscape, and iOS (not built here).

## Order ring (new)

- `lib/rings.ts`: seven ring tones (Classic, Horn, Siren, Bell, Pulse, Gong, Afrobeat), looped via expo-av with a repeating vibration.
- `lib/ring-controller.ts`: the ring logic (start, stop, replace). Unit-tested in `tests/ring.test.ts`.
- `app/offer.tsx`: incoming order screen. The ring plays until the rider **accepts**, **declines**, the 30 s offer **times out**, or the app leaves the foreground.
- `app/home.tsx`: pick and preview a ring, toggle vibration, and "Simulate an incoming order".
- Fleet riders see no fares on an offer (salaried). Partner riders see base, distance, surge, waiting and the total they earn.
- Limit: the ring plays while the app is open. Ringing when the app is closed needs a high-priority push or a foreground service, which comes with the backend hookup.

## Admin additions (this release)

Admin → **Customers** (wallet top-up/deduct with reason, points adjust, history), **Points** (earn rate, value, tiers, cost calculator) and Riders → **Pay** (Fleet salary, Partner per ride). Database: `customer-app/supabase/migrations/20261021000001_admin_customers_points.sql` (not yet applied to the live project; apply it via the Supabase SQL editor or `supabase db push`).

## Delivery map preview

- `app/map.tsx` adds a Google map preview with sample Lekki pickup/drop-off markers, a route line, and foreground device location.
- Set the GitHub Actions repository secret `GOOGLE_MAPS_ANDROID_KEY` to a restricted Android Maps SDK key. Without it, the APK can build but Google map tiles may not render.
- The map is currently a UI/location preview. Live order assignment, live route geometry, and delivery status require the backend integration phase; the screen labels this clearly.
