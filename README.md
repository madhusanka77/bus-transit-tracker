# BusTransitTracker

Real-time public transit tracking for **Route 177 (Kaduwela – Kollupitiya)**.

```
backend/   Node.js + Express + Socket.io (JSON-file persistence)
mobile/    React Native (Expo managed) – Driver & Passenger app, EAS APK build
```

For Netlify hosting and Android APK deployment, follow **[DEPLOYMENT.md](DEPLOYMENT.md)**.
The website uses Leaflet; Android uses native Google Maps. Both need the separately hosted backend.

## 1. Backend

```bash
cd backend
npm install
npm start          # or: npm run dev  (nodemon)
```

Listens on `0.0.0.0:5000`.

| Interface | Description |
|---|---|
| Socket `updateLocation` (in) | `{ busId, route, latitude, longitude, speed (m/s), heading }` from the driver |
| Socket `busLocation:<busId>` (out) | Broadcast immediately to every client, includes server `timestamp` |
| `GET /api/history` | Recorded locations. Optional `?busId=BUS-01&limit=100` |
| `GET /health` | Liveness probe |

History is saved to `backend/location_history.json` through an in-memory queue with
single-flight, atomic (temp file + rename) writes, so concurrent updates never race or corrupt the file.
It keeps the newest `MAX_HISTORY` records (default 10 000, env-configurable) and is flushed on SIGINT/SIGTERM.

## 2. Mobile app

```bash
cd mobile
npm install
npx expo install --check     # optional: verifies SDK-compatible versions
npm test                     # Haversine / ETA / halt-tracking unit tests
npx expo start
```

### Configure before building

1. **Server URL** – set `EXPO_PUBLIC_SERVER_URL` to your public HTTPS backend URL in
   Netlify and the EAS preview environment. For local development, copy
   `mobile/.env.example` to `mobile/.env`. Release builds require HTTPS.
2. **Google Maps API key** – set `GOOGLE_MAPS_ANDROID_API_KEY` in EAS with
   *Maps SDK for Android* enabled. Restrict it to the Android package and signing
   certificate. `app.config.js` injects it during the build. The web map needs no key.

### How it works

- **Driver**: toggle to *Driver* → *Start Broadcast*. Uses `Location.watchPositionAsync`
  (`BestForNavigation`, 3 s) and emits `updateLocation` for `BUS-01`.
- **Passenger**: listens to `busLocation:BUS-01` and shows speed (`m/s × 3.6` km/h), Moving/Stopped,
  next halt, Haversine distance and ETA.
- **Halt switching**: the next halt advances when the bus is within 300 m of the current one; direction is
  detected automatically and reverses at the terminus. ETA uses live speed (20 km/h fallback when stopped).

## 3. Build the standalone APK (EAS)

```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest init                  # first time only – links the Expo project
# Add the environment variables described in DEPLOYMENT.md before building.
npm run build:apk
```

The `preview` profile in `eas.json` sets `android.buildType = "apk"`, so EAS returns a directly
installable `.apk` download link. (`production` with no override produces an `.aab` for Play Store.)

Package name: `com.transittracker.app`.
