/**
 * Extends app.json at build time so the same repo builds with or without private credentials.
 * Nothing secret lives in the repo: supply these through EAS / GitHub secrets when you have them.
 *   GOOGLE_SERVICES_JSON      path to Firebase google-services.json (Android push). Omitted: the app still builds, FCM push is off.
 *   GOOGLE_MAPS_ANDROID_KEY   Android Maps SDK key. Omitted: the app's built-in map fallback is used.
 *   GOOGLE_MAPS_IOS_KEY       iOS Maps SDK key.
 *   EAS_PROJECT_ID            Expo project id (set automatically by `eas init`).
 */
const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  const c = JSON.parse(JSON.stringify(config));
  const gs = process.env.GOOGLE_SERVICES_JSON || './google-services.json';
  if (fs.existsSync(path.resolve(__dirname, gs))) c.android.googleServicesFile = gs;
  else delete c.android.googleServicesFile;

  if (process.env.GOOGLE_MAPS_ANDROID_KEY) c.android.config = { ...c.android.config, googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_KEY } };
  if (process.env.GOOGLE_MAPS_IOS_KEY) c.ios.config = { ...c.ios.config, googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_KEY };

  const pid = process.env.EAS_PROJECT_ID || c.extra?.eas?.projectId;
  c.extra = { ...c.extra, eas: { ...c.extra?.eas, projectId: pid && !pid.startsWith('REPLACE') ? pid : undefined } };
  return c;
};
