// EAS and Expo load .env before evaluating this file.
module.exports = ({ config }) => {
  const mapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        ...(mapsKey ? { googleMaps: { apiKey: mapsKey } } : {}),
      },
    },
    extra: {
      ...config.extra,
      serverUrl: process.env.EXPO_PUBLIC_SERVER_URL || config.extra?.serverUrl || '',
    },
  };
};
