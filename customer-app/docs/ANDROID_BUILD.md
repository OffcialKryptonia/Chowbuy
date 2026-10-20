# Building the Android APK

## A. GitHub Actions (no Expo account)
Repo, Actions tab, "Customer Android APK", Run workflow. After ~15 to 25 minutes, open the run and download the artifact:
- `chowbuy-customer-demo-apk`: sample data, no backend.
- `chowbuy-customer-live-apk`: real accounts and orders on the ChowBuy Supabase project.

Unzip the download and install the `.apk` on the phone (allow "install unknown apps" for your browser or file manager). Signed with the Android debug key: for testing only.
Optional repository secrets: `GOOGLE_MAPS_ANDROID_KEY`, `GOOGLE_SERVICES_JSON` (Firebase file, needed for Android push).

## B. EAS Build (Expo cloud)
```bash
cd customer-app
npm ci --legacy-peer-deps
npx eas-cli login            # or set EXPO_TOKEN
npx eas-cli init             # once: creates the Expo project and its id
npx eas-cli build --platform android --profile live      # or --profile apk for the demo build
```
The first build creates and stores an Android keystore on Expo. Keep it: the same key is needed for updates and Play Store.
`app.config.js` reads optional `GOOGLE_SERVICES_JSON`, `GOOGLE_MAPS_ANDROID_KEY`, `EAS_PROJECT_ID`. Set them as EAS secrets or environment variables. Nothing secret belongs in the repo.

## Known limits of a test APK
- Android push needs `google-services.json` and an FCM credential on Expo; without them the app runs and push is simply off.
- Without a Google Maps key the map area may appear blank; ordering still works.
- Parcel booking is disabled in the live build. Sign in with Google needs the Google provider enabled in Supabase; Apple sign-in does not appear on Android.
