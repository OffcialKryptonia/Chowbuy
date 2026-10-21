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
