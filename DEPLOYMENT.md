# Netlify website and Android APK

## Current deployment targets

- Private source: https://github.com/madhusanka77/bus-transit-tracker
- Netlify project: https://app.netlify.com/projects/route177-bus-tracker
- Website/API: https://route177-bus-tracker.netlify.app
- Expo project: https://expo.dev/accounts/prathums-team/projects/bus-transit-tracker
- Android package: `com.transittracker.app`

These links identify the configured targets; check each dashboard for successful build status.

## Netlify

The root `netlify.toml` selects `mobile` as base, Node 22, `npm run build:web`,
`dist` output, and `mobile/netlify/functions` for the backend.
Git pushes to main trigger deploys.

The function uses site-scoped Netlify Blobs with strong consistency and conditional writes.
Netlify supplies storage credentials automatically; do not add storage tokens to the app.
The site works without a separate backend account or map API key.

Endpoints:
- GET /api/health
- GET /api/location (latest BUS-01 position or null)
- POST /api/location (busId BUS-01, route 177, latitude, longitude, speed in m/s, heading)
- GET /api/history?limit=100 (maximum 1,000 retained fixes)

The web app uses its own origin. Android defaults to the Netlify URL in app.json.
An optional EXPO_PUBLIC_SERVER_URL override requires a rebuild.

A manual static-folder upload alone does not deploy the backend. Use repository deployment
or Netlify CLI with function bundling.

## Android APK

The Expo project is connected to GitHub with base directory `/mobile`.
Use the Builds dashboard to build branch `main`, platform Android, profile `preview`.
The first build needs an Android signing keystore; let EAS generate one or supply your own.

Alternatively:
```powershell
cd mobile
npm install
npx eas-cli@latest login
npm run build:apk
```

The preview profile produces a directly installable APK. Production produces an AAB for
Google Play. Download the completed APK from its EAS build page and install it on Android.
No Google Maps key or billing setup is needed: the native map uses Leaflet in a WebView
and OpenStreetMap tiles over HTTPS. Both map assets and tiles require an internet connection.

## Verification

1. Confirm /api/health returns status ok.
2. Open the website and confirm the route and stops appear.
3. Install the APK, select Driver, grant GPS access, and start broadcasting.
4. Open Passenger on another device and verify updates.
5. Stop broadcasting; the passenger should show Signal lost after about 20 seconds.

## Limits

This is a foreground tracking prototype, not a background or screen-off tracker.
The public demo API does not authenticate drivers. Protect writes before treating bus
positions as authoritative. Netlify usage allowances apply to polling and storage, so
continuous use by many passengers can exhaust the free allowance. Historical storage is
limited to the most recent 1,000 fixes (about 50 minutes at continuous 3-second updates).

Render was not deployed because this account requested card verification; the original
backend folder is preserved for reference and is not used by the current client.

