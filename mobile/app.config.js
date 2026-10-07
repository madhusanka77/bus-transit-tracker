module.exports = ({ config }) => ({
  ...config,
  extra: { ...config.extra, serverUrl: process.env.EXPO_PUBLIC_SERVER_URL || config.extra?.serverUrl },
});

