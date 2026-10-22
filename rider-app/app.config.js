// Adds the Google Maps key at build time (secret GOOGLE_MAPS_ANDROID_KEY). Without it the app draws its own map instead of crashing.
module.exports = ({ config }) => {
  const key = process.env.GOOGLE_MAPS_ANDROID_KEY || '';
  return {
    ...config,
    android: { ...config.android, ...(key ? { config: { googleMaps: { apiKey: key } } } : {}) },
    extra: { ...(config.extra || {}), hasMapsKey: Boolean(key) },
  };
};
