# Bus Transit Tracker

Route 177 (Kaduwela–Kollupitiya) tracking for Android and the web.

- Website and HTTPS API: https://route177-bus-tracker.netlify.app
- Android APK: Expo EAS project `prathums-team/bus-transit-tracker`.
- Both maps use OpenStreetMap. No Google key, Render account, or separate server is required.
- The driver grants foreground GPS permission and sends fixes every 3 seconds.
- Passengers poll every 3 seconds and show signal loss after 20 seconds without a stored update.
- Netlify Functions + Blobs retain the latest fix and last 1,000 records with conditional writes.

See [DEPLOYMENT.md](DEPLOYMENT.md) for builds and limitations.

## Develop and test

```powershell
cd mobile
npm install
npm test
npx expo start
```

The default client URL points to the hosted API. Set `EXPO_PUBLIC_SERVER_URL` to override it.
For a local full-stack web environment, run Netlify CLI from the repository root.
`npm run web` alone serves only the frontend.

## Structure

- `mobile/`: shared Expo Android/web app.
- `mobile/netlify/functions/`: deployed Netlify API.
- `mobile/netlify/lib/`: validated API implementation.
- `backend/`: original Socket.io server, retained as reference; the current app uses HTTPS instead.

Tracking is foreground-only. Route coordinates are approximate.
The API is a demonstration endpoint without driver authentication: anyone with the URL can
submit bus locations or read the history. Netlify usage limits apply.

