# Barkits

Barkits helps a Metro Manila barkada compare meetup spots and decide where to get together. Plan on this device or sign in with Google to invite friends to a shared meetup. Demo routes are labeled.

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

For a static web export, run `npm run build:web`. Device-local meetups open at `/meetups/[id]` and can be refreshed or reopened on the same browser or app installation under the same account. The included Vercel rewrite serves `index.html` for meetup routes. Configure the same fallback on other static hosts.

Run `npm start` with compatible Expo Go or a development build. Build locally with `npx expo run:android` using the Android SDK or `npx expo run:ios` using macOS and Xcode. Both use the development identifier `com.timtulang.barkits`. A development build can open `barkits://meetups/demo`. Confirm app IDs and signing before registering production credentials.

To prepare HTTPS links for a dedicated domain, set `BARKITS_LINK_HOST` to its hostname at native build time. Publish the Android `assetlinks.json` and Apple `apple-app-site-association` files under `/.well-known/`, with the matching signing identities and iOS path `/meetups/*`. Verify both signed builds on devices. [Android App Links](https://docs.expo.dev/linking/android-app-links/) · [iOS Universal Links](https://docs.expo.dev/linking/ios-universal-links/)

Open the Saturday catch-up demo and choose **Where → Compare** to try the four ranking modes. Open a place to check estimates, cast votes, and select it for Review. A new meetup starts with an empty group.

Once a venue with a map pin is confirmed, reopen the meetup at Review and choose **Get directions** to route to that spot in Google Maps. **View venue map** opens the checked pin and the same directions action. Both work without a Google Cloud key.

## Try trip options

Open **Saturday catch-up → Where → Compare**, choose a place, then open **Trip estimates → Edit trip** for a friend. Under **Compare ride fares**, enter the prices shown for the same trip in Angkas and Grab, choose one, and save the trip. In a shared meetup, open the shortlist and choose your own trip estimate. The saved fare shows its provider and when the estimate was saved. Live provider prices require approved access.

With a starting pin and a destination near different LRT-1 stations, **Check your trip** suggests boarding and exit stations, direction and the regular single-journey fare. You can also use **LRT-1 fares** to search any two stations. Enter the full one-way amount when connecting by jeepney, bus or another paid leg. **Transit directions** opens the selected trip in Google Maps without a Google Cloud key.

## Enable Google sign-in and shared meetups

The web build and the Barkits API share one HTTPS origin. The API verifies Google identity and connects to Neon over HTTPS. Guests can plan on their device without configuring the API.

1. Set up a fresh Neon database or use the intended Barkits development database. Follow the [database guide](docs/DATABASE.md#apply-and-verify) to apply the migrations and verify the pooled runtime login.
2. In Google Auth Platform, register a **Web application** OAuth client for the Barkits deployment. Register its exact HTTPS callback URL, `https://your-barkits-host/api/auth/google/callback`, and add test users while the app is in Testing. [Google OAuth setup](docs/GOOGLE_CLOUD.md#configure-development-first)
3. In Vercel, select Node.js 24, use `npm ci` and `npm run build:web`, and set the output directory to `dist`. Use the same fixed deployment origin for `BARKITS_ORIGIN` and the public build variable `EXPO_PUBLIC_BARKITS_API_URL`. Set `DATABASE_URL` to the pooled runtime connection string. Store `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, and a unique secret of at least 32 characters as `BARKITS_AUTH_SECRET` in the server environment.
4. In the preview, sign in as two Google test accounts. Verify invite and shared planning access, app sign-out, and session expiry. Native development builds need the same `EXPO_PUBLIC_BARKITS_API_URL` and the `barkits` scheme. After authenticating in the system browser, select **Open Barkits**.

A Google account creates a new Barkits account on first sign-in. On-device guest plans stay in the same browser or app installation. Accounts and shared meetups from the old Supabase prototype are outside this fresh start.

### Shared meetups and invite codes

1. Sign in and choose **Plan a meetup → With friends**. Add a meetup name and the display name your friends will see. Schedule and notes are optional.
2. In **Who**, choose **Create invite code** and copy the code to send to one friend. It expires after 24 hours. Creating another code replaces any unused one.
3. On another device, the friend chooses **Join with code** from Home and signs in if needed. The group can see each member’s display name and the starting point and preferences they choose to save.
4. Each member selects **Add my starting point**. Use **Refresh group** to see new members and updated origins. Once every origin is located, Barkits calculates nearby venues for the group.
5. Select **Add to shortlist** beside a suggestion. Every member can vote for one venue, change their vote, or withdraw it. Use **Refresh group** to see other members’ changes.
6. Use **My trip estimate** on a shortlisted venue to enter your own one-way minutes and optional fare. Members with a fare or duration limit need a matching estimate within that limit for the organizer to finalize the venue. Changing your starting point or transportation mode clears your previous estimates.
7. The organizer chooses **Choose this spot → Finalize location**. Members can reopen the meetup to see the confirmed venue and its map.

8. After the gathering, the organizer selects **Mark completed → Confirm completion**. In **Write a recap**, choose **Only me** or **Meetup members** before saving. Ratings are optional. Organizers can archive the meetup. Find completed and archived plans under **Past meetups**. Authors can still make a recap private or remove a recap or rating after archiving.

For database verification on a disposable migrated PostgreSQL database, run `node db/cli.mjs shell < scripts/check-shared-meetups.sql`. Its test accounts, sessions and shared plans are rolled back.

Guest planning, the form improvements, and offline venue search work without Google OAuth or a Google Maps key.

See [design system](docs/DESIGN_SYSTEM.md), [product and integration decisions](docs/PRODUCT.md), and [cost audit](docs/COST_AUDIT.md).

See the [architecture roadmap](docs/ARCHITECTURE.md), [Google Cloud setup guide](docs/GOOGLE_CLOUD.md), and [Neon database setup and recovery](docs/DATABASE.md).

## Google street maps on a Vercel preview

Barkits uses Leaflet for the pin picker, group map and final venue map. Web builds can display Google's 2D roadmap in all three. Leaving the preview key unset selects OpenStreetMap. The **Open in Google Maps** action on a suggested or chosen venue works on web and native without a key.

1. In a billing-enabled Google Cloud project, enable the **Map Tiles API**. For a ₱0 trial, check how much of the billing account's monthly free allowance other projects use first.
2. In Google Cloud Console → Google Maps Platform → Quotas, lower the **daily 2D tile request quota** to **3,000 or less** before distributing the preview. At 3,000 per day, this project can use up to 93,000 requests in a 31-day month. Lower it further if other projects share the allowance. Budget alerts only send notifications. [Cost controls](https://developers.google.com/maps/billing-and-pricing/manage-costs)
3. Create a browser API key. Apply **Websites** restrictions for your exact Vercel branch alias (for example, `https://your-preview.example.com/*`) and **API** restrictions for **Map Tiles API** only. Use the allowed alias when testing. The browser key is public by design.
4. In Vercel → Project Settings → Environment Variables, add `EXPO_PUBLIC_GOOGLE_MAP_TILES_KEY` for **Preview**, scoped to `barkits-prototype`. Redeploy using `npm run build:web`. For a local web build, use a key restricted to your localhost origin in `.env.local`.
5. Open **Saturday catch-up** to see the full-screen map. Look for the Google Maps credit, zoom or pan, and select a numbered pin to open the venue details. Select **Show starting points** to include the group. In **Add friend → Choose on map**, tapping a location should update the coordinates. A rejected key or exhausted quota shows an error with a retry action. Manual coordinate entry and the offline directory remain available.

## Verify the planning journey

Use Node 24 and the installed project dependencies for `npx tsc --noEmit` and `npm test`. Browser acceptance scripts use Python’s standard library plus an installed Chromium/Chrome and matching ChromeDriver; they do not install browser packages.

Export the normal app, serve the directory, and run ChromeDriver in separate terminals:

```sh
EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 npx expo export --platform all --clear --output-dir .expo/redesign/check/guest
python3 scripts/serve-web.py .expo/redesign/check/guest --port 5179
chromedriver --port=9515 --allowed-ips=127.0.0.1
```

Then run `python3 scripts/check-planning-browser.py guest --app http://127.0.0.1:5179/`. Each run creates an isolated temporary browser profile. Screenshots go to ignored `.expo/redesign/phase45d/`. This checks setup, scheduling, place/trip comparison, corrections, confirmation, resume, save failure/retry, unsaved-edit protection and small/wide layouts. Repeat with `--reduced-motion` to check the same journey with motion disabled.

Run `python3 scripts/check-redesign-browser.py --app http://127.0.0.1:5179/` to check web landmarks, dialog names, keyboard focus and Escape behavior, place selection during a tile outage, and the friend editor at a 320 CSS px reflow viewport.

For synthetic shared-role UI checks, export a fixture build and serve it with the local fixture API on the same origin:

```sh
EXPO_PUBLIC_BARKITS_API_URL=http://127.0.0.1:5180 EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 npx expo export --platform web --clear --output-dir .expo/redesign/check/shared
python3 scripts/planning-fixture.py .expo/redesign/check/shared
```

Run `python3 scripts/check-planning-browser.py shared --app http://127.0.0.1:5180/` to verify organizer and member views, trip estimates, voting, and confirmation retry. Run `python3 scripts/check-shared-lifecycle.py --app http://127.0.0.1:5180/` for sign-in handoff, invites, recap visibility, and archiving. The fixture simulates accounts and API responses. Use a configured preview and signed devices for live Google, Neon, and native sign-in checks.
