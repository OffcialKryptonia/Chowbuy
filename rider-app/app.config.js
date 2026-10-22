const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  const c = JSON.parse(JSON.stringify(config));
  const key = process.env.GOOGLE_MAPS_ANDROID_KEY;
  if (key) {
    c.android = { ...c.android, config: { ...c.android?.config, googleMaps: { apiKey: key } } };
  }
  const googleServices = process.env.GOOGLE_SERVICES_JSON || './google-services.json';
  if (fs.existsSync(path.resolve(__dirname, googleServices))) c.android.googleServicesFile = googleServices;
  else delete c.android.googleServicesFile;
  return c;
};
