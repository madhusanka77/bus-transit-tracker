# Deploy the website and Android APK

The same Expo app has two targets: Android uses native Google Maps; the website
uses Leaflet/OpenStreetMap. Both connect directly to the same Socket.io backend.
Netlify hosts the website. It cannot host this persistent WebSocket server.

## 1. Host the backend first

Deploy `backend/` as a Node web service on a host that supports WebSockets, such
as Render. For Render, upload this project to your Git repository, connect it to
a new Web Service, and set:

| Setting | Value |
| --- | --- |
| Root directory | `backend` |
| Build command | `npm install` |
| Start command | `npm start` |
| Health check | `/health` |
| Node version | `22` |

Use the assigned HTTPS service URL. Verify that `<URL>/health` returns
`{"status":"ok",...}`. No trailing `/api` or `/socket.io` is needed in the URL.
The server already binds to `0.0.0.0` and uses the host's `PORT`.

History needs persistent storage: mount a disk and set `HISTORY_FILE` to a file
on that disk, for example `/data/location_history.json`. Without a persistent
disk, history can disappear when the service restarts or redeploys. Use one
server instance with this file-backed store. A backend Dockerfile is also
included for hosts that use containers. Choose a hosting plan yourself; no paid
service has been provisioned by this setup.

## 2. Publish to Netlify

In Netlify, import the repository. The root `netlify.toml` provides:

- Base directory: `mobile`
- Build command: `npm run build:web`
- Publish directory: `mobile/dist` from the repository root (`dist` relative to base)
- Node.js: 22

Add `EXPO_PUBLIC_SERVER_URL` to the Netlify build environment with your backend's
HTTPS URL, then deploy. Changing this variable requires rebuilding the website.
The web map does not need a Google Maps API key.

Alternatively, build locally in PowerShell and upload the **contents of the
generated dist folder** using Netlify's manual deployment page:

```powershell
cd mobile
npm install
$env:EXPO_PUBLIC_SERVER_URL = 'https://YOUR-ACTUAL-BACKEND'
npm run build:web
```

The included `public/_redirects` is copied into the export for manual uploads.
Do not upload the raw source directory as a static site.

## 3. Build an installable Android APK

Use Node.js 22. From `mobile/`:

```powershell
npm install
npx expo install --check
npm test
npx eas-cli@latest login
npx eas-cli@latest init
```

`eas init` links this app to your Expo account and adds `extra.eas.projectId`
to `app.json`. The dynamic `app.config.js` preserves that value.
In the Expo project's **Environment variables**, select the **preview**
environment and add:

| Name | Value |
| --- | --- |
| `EXPO_PUBLIC_SERVER_URL` | Your backend's HTTPS URL |
| `GOOGLE_MAPS_ANDROID_API_KEY` | Your key with Maps SDK for Android enabled |

These values are embedded in the application. They are not private server
secrets. Restrict the Google key to package `com.transittracker.app` and the
SHA-1 certificate fingerprint of the EAS signing key; obtain it with
`npx eas-cli@latest credentials --platform android`. Use a value available to
EAS config evaluation (plain text or sensitive visibility).

Then run:

```powershell
npx eas-cli@latest build --platform android --profile preview
```

If EAS requests Git initialization, initialize a local repository when prompted.
Choose an existing signing key or let EAS generate one on the first build.
The `preview` profile creates a directly installable `.apk`; the `production`
profile creates a Play Store `.aab`. Follow EAS's build URL to download the APK.
The build hook rejects missing production configuration and non-HTTPS backend
URLs. A valid, reachable backend and correctly restricted Maps key still need
to be verified on a device.

For local development, copy `mobile/.env.example` to `mobile/.env` and fill in
the values. EAS uses its configured environment; local `.env` files are excluded
from the build upload. Release Android builds require HTTPS. Expo Go can be
used for local HTTP development.

## 4. Verify on devices

1. Open the Netlify website and confirm route 177 and bus stops appear.
2. Install the APK on an Android phone. Confirm its native map loads.
3. Select Driver, start broadcasting, and grant location permission.
4. Keep the app open. On another device select Passenger and confirm bus
   location, speed, next halt, and connection status update.
5. Stop broadcasting and confirm the passenger shows signal loss after 15 seconds.

This app currently tracks only while the driver keeps it in the foreground;
background or screen-off tracking is not implemented. Browser GPS requires
HTTPS (or localhost). The existing backend allows anyone with its URL to send
bus positions and read location history; add driver authentication before
using it as a trusted public transit service. Route coordinates are approximate.

## References

- [Expo web deployment](https://docs.expo.dev/guides/publishing-websites/)
- [Expo APK builds](https://docs.expo.dev/build-reference/apk/)
- [Render Node services](https://render.com/docs/deploy-node-express-app)
- [Netlify WebSocket limitation](https://answers.netlify.com/t/does-netlify-support-websocket-programming/4213/2)
