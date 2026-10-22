const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  const c = JSON.parse(JSON.stringify(config));
  const key = process.env.GOOGLE_MAPS_ANDROID_KEY;
  c.plugins = [...(c.plugins || [])].filter((plugin) => !(Array.isArray(plugin) && plugin[0] === 'react-native-maps'));
  if (key) {
    c.plugins.push(['react-native-maps', { androidGoogleMapsApiKey: key }]);
  }
  const googleServices = process.env.GOOGLE_SERVICES_JSON || './google-services.json';
  if (fs.existsSync(path.resolve(__dirname, googleServices))) c.android.googleServicesFile = googleServices;
  else delete c.android.googleServicesFile;
  return c;
};
