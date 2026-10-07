// Run on EAS after dependency installation, before an unusable APK is built.
if (process.env.EAS_BUILD_PROFILE !== 'development') {
  const errors = [];
  try {
    const url = new URL(process.env.EXPO_PUBLIC_SERVER_URL);
    if (url.protocol !== 'https:') throw new Error();
  } catch {
    errors.push('Set EXPO_PUBLIC_SERVER_URL to the public HTTPS backend URL in the EAS environment.');
  }
  if (process.env.EAS_BUILD_PLATFORM === 'android' &&
      !process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim()) {
    errors.push('Set GOOGLE_MAPS_ANDROID_API_KEY in the EAS environment (Maps SDK for Android).');
  }
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
}
