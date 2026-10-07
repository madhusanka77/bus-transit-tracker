// Run on EAS after dependency installation, before an unusable APK is built.
if (process.env.EAS_BUILD_PROFILE !== 'development') {
  const errors = [];
  try {
    const url = new URL(process.env.EXPO_PUBLIC_SERVER_URL || require('../app.json').expo.extra.serverUrl);
    if (url.protocol !== 'https:') throw new Error();
  } catch {
    errors.push('Set EXPO_PUBLIC_SERVER_URL to the public HTTPS backend URL in the EAS environment.');
  }
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
}
