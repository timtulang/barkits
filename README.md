# Barkits

Barkits helps a Metro Manila barkada compare meetup spots and decide where to get together. The Expo prototype stores meetups on the current device and uses clearly labeled demo routes.

## Run locally

Use Node.js 24 and npm. From the repository root, run:

```sh
npm ci
npm run web
npm run typecheck
npm test
```

In the managed cloud shell, use a writable npm cache and run Expo without home-directory writes:

```sh
npm_config_cache=/tmp/barkits-npm-cache npm ci
EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 npm run web
```

For a web export, run `npm run build:web`. Configure the static host to serve existing assets normally and return `index.html` for meetup routes such as `/meetups/demo`. The export uses Expo Router's single-page output so device-local meetups can load by ID after a refresh or direct visit. These links open records stored in the current browser or app installation.

Run `npm start` with compatible Expo Go or an existing development build. Build locally with `npx expo run:android` using the Android SDK or `npx expo run:ios` using macOS and Xcode. The app identifiers currently use `com.timtulang.barkits` for development on both platforms. Confirm naming and signing identities before registering production credentials. The native app scheme is `barkits://`, with `barkits://meetups/demo` as a development-build link. Native device verification is pending.

When the dedicated Barkits HTTPS domain is ready, set `BARKITS_LINK_HOST` to its hostname at native build time. This configures Android App Links for `/meetups/` and the iOS associated domain. Before using HTTPS links in release builds, serve the matching Android `assetlinks.json` and Apple `apple-app-site-association` files under `/.well-known/`. Use the SHA-256 fingerprints of the signing certificates and the Apple team ID and app identifier. Scope the Apple association to `/meetups/*` and test both signed builds against the deployed host. [Expo Android App Links](https://docs.expo.dev/linking/android-app-links/), [Expo iOS Universal Links](https://docs.expo.dev/linking/ios-universal-links/)

Open the Saturday catch-up demo to compare four friends' trips, try ranking modes, cast votes, finalize a venue, complete the meetup, and save a recap or optional ratings. A new meetup starts with an empty group.

See [design system](docs/DESIGN_SYSTEM.md), [product and integration decisions](docs/PRODUCT.md), and [cost audit](docs/COST_AUDIT.md).

The collaborative platform migration begins with the [audit and architecture plan](docs/ARCHITECTURE.md), [Neon database runbook](docs/DATABASE.md), and [Google Cloud setup guide](docs/GOOGLE_CLOUD.md).
