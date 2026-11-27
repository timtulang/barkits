# Barkits

Barkits helps a Metro Manila barkada compare meetup spots and decide where to get together. Plan on this device or use Supabase to invite friends to a shared meetup. Demo routes are labeled.

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

## Existing Supabase prototype

Google sign-in and Neon are the target account and database services. The setup below applies to the existing shared-meetup prototype until that migration is complete. See [Neon setup and runtime verification](docs/DATABASE.md) and [Google sign-in setup](docs/GOOGLE_CLOUD.md).

Barkits supports guest planning immediately. When email sign-in is enabled, choose **Sign in**, enter your email, then enter the code from your inbox. Choosing **Join with code** opens the invite form after sign-in. On-device meetups are saved separately for guests and each account. Signing out restores the guest list.

### On Vercel

For the Expo web project, use Node.js 24, `npm ci` to install, `npm run build:web` to build, and `dist` as the output directory.

1. In your Supabase project, enable the Email provider, allow new users to sign up, and enable email confirmation.
2. In Authentication → Email Templates, set the body of both **Confirm signup** and **Magic Link** to the supplied [sign-in code template](supabase/templates/sign-in-code.html). Both emails need `{{ .Token }}` so first-time and returning participants can enter their code in Barkits.
3. In Vercel → Project Settings → Environment Variables, set `EXPO_PUBLIC_SUPABASE_URL` to your Supabase project URL and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to its `sb_publishable_…` key. Select **Preview** for the prototype branch and **Production** if required. Expo embeds these public values at build time. Keep secret and service-role keys server-side.
4. Redeploy the branch with the new settings. Test sign-in with a Supabase project team member’s email. Supabase’s default mail service limits recipients and sending rates. For other testers, configure your own SMTP sender and check its free allowance. [Supabase email delivery](https://supabase.com/docs/guides/auth/auth-smtp)

Email sign-in uses Supabase Auth directly.

### Shared meetups and invite codes

Apply the SQL migrations in `supabase/migrations` in timestamp order to the same Supabase project as Auth. With a linked development project, `supabase db push --dry-run` previews the pending migrations and `supabase db push` applies them. For an existing project, apply only its pending migrations, including the shared decisions, shared memories and fare sources migrations. Use the publishable key already configured for the app.

1. Sign in and choose **Plan a meetup → With friends**. Add a meetup name and the display name your friends will see. Schedule and notes are optional.
2. In **Who**, choose **Create invite code** and copy the code to send to one friend. It expires after 24 hours. Creating another code replaces any unused one.
3. On another device, the friend chooses **Join with code** from Home and signs in if needed. The group can see each member’s display name and the starting point and preferences they choose to save.
4. Each member selects **Add my starting point**. Use **Refresh group** to see new members and updated origins. Once every origin is located, Barkits calculates nearby venues for the group.
5. Select **Add to shortlist** beside a suggestion. Every member can vote for one venue, change their vote, or withdraw it. Use **Refresh group** to see other members’ changes.
6. Use **My trip estimate** on a shortlisted venue to enter your own one-way minutes and optional fare. Members with a fare or duration limit need a matching estimate within that limit for the organizer to finalize the venue. Changing your starting point or transportation mode clears your previous estimates.
7. The organizer chooses **Choose this spot → Finalize location**. Members can reopen the meetup to see the confirmed venue and its map.

8. After the gathering, the organizer selects **Mark completed → Confirm completion**. In **Write a recap**, choose **Only me** or **Meetup members** before saving. Ratings are optional. Organizers can archive the meetup. Find completed and archived plans under **Past meetups**. Authors can still make a recap private or remove a recap or rating after archiving.

For database verification against a migrated local Supabase database, run `psql "$SUPABASE_DATABASE_URL" -f scripts/check-shared-meetups.sql`. The script uses temporary fixtures inside a rolled-back transaction.

Guest planning, the form improvements, and offline venue search work without Supabase or a Google Maps key.

### With a local Supabase stack

From the repo root, start Docker and run `supabase start` with the Supabase CLI. Copy the API URL and publishable key from `supabase status` into the corresponding variables in `.env.local`, then restart Expo. Open the local mail inbox URL printed by the CLI to retrieve codes. The checked-in Supabase configuration sets both local email templates.

See [design system](docs/DESIGN_SYSTEM.md), [product and integration decisions](docs/PRODUCT.md), and [cost audit](docs/COST_AUDIT.md).

The collaborative platform work includes the [Phase 0 architecture and migration plan](docs/ARCHITECTURE.md), [Google Cloud setup guide](docs/GOOGLE_CLOUD.md), and [Phase 2 Neon database setup and recovery](docs/DATABASE.md). The prototype still uses Supabase for its existing shared meetups.

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

For synthetic shared-role UI checks, export a separate fixture build. `--clear` is required when switching these build-time public environment values, because Metro can retain inlined values:

```sh
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:5180 EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_fixture_only EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 npx expo export --platform web --clear --output-dir .expo/redesign/check/shared
python3 scripts/planning-fixture.py
python3 scripts/serve-web.py .expo/redesign/check/shared --port 5178
```

Keep the fixture API and static server running in separate terminals, then run `python3 scripts/check-planning-browser.py shared --app http://127.0.0.1:5178/`. It checks organizer and member views, own-trip editing, missing and at-limit estimates, voting and confirmation retry. Run `python3 scripts/check-shared-lifecycle.py --app http://127.0.0.1:5178/` for sign-in handoff, invite replacement, private and published recaps, and archive behavior. Both scripts use synthetic accounts and send no email. Real Supabase authentication, hosted database policies, and native-device behavior require separate validation. Build the normal app again with its intended environment and `--clear` after switching away from fixtures.
