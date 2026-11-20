const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (config) => {
    if (config.modResults.manifest.application && config.modResults.manifest.application[0]) {
      const app = config.modResults.manifest.application[0];
      app.$['android:usesCleartextTraffic'] = 'true';
      app.$['android:largeHeap'] = 'true';

      // Ensure meta-data exists and inject Google Maps API key to prevent fatal startup crash
      app['meta-data'] = app['meta-data'] || [];
      const hasGeoKey = app['meta-data'].some(
        (m) => m.$ && m.$['android:name'] === 'com.google.android.geo.API_KEY'
      );
      if (!hasGeoKey) {
        app['meta-data'].push({
          $: {
            'android:name': 'com.google.android.geo.API_KEY',
            'android:value': process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDummyKeyPreventCrashOnStartup',
          },
        });
      }
    }
    return config;
  });
};
