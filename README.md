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

For a static web export, run `npm run build:web`. Run `npm start` to use a compatible Expo Go client or an existing development build. Native device verification is pending.

Open the Saturday catch-up demo to compare four friends' trips, try ranking modes, cast votes, finalize a venue, complete the meetup, and save a recap or optional ratings. A new meetup starts with an empty group.

See [design system](docs/DESIGN_SYSTEM.md), [product and integration decisions](docs/PRODUCT.md), and [cost audit](docs/COST_AUDIT.md).
