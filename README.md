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

For a static web export, run `npm run build:web`. Run `npm start` to use a compatible Expo Go client or an existing development build. Native device verification is pending.

Open the Saturday catch-up demo to compare four friends' trips, try ranking modes, cast votes, finalize a venue, complete the meetup, and save a recap or optional ratings. A new meetup starts with an empty group.

## Enable email sign-in

Barkits supports guest planning immediately. When email sign-in is enabled, open the account icon, enter your email, then enter the code from your inbox. On-device meetups are saved separately for guests and each account. Signing out restores the guest list.

### On Vercel

For the Expo web project, use Node.js 24, `npm ci` to install, `npm run build:web` to build, and `dist` as the output directory.

1. In your Supabase project, enable the Email provider, allow new users to sign up, and enable email confirmation.
2. In Authentication → Email Templates, set the body of both **Confirm signup** and **Magic Link** to the supplied [sign-in code template](supabase/templates/sign-in-code.html). Both emails need `{{ .Token }}` so first-time and returning participants can enter their code in Barkits.
3. In Vercel → Project Settings → Environment Variables, set `EXPO_PUBLIC_SUPABASE_URL` to your Supabase project URL and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to its `sb_publishable_…` key. Select **Preview** for the prototype branch and **Production** if required. Expo embeds these public values at build time. Keep secret and service-role keys server-side.
4. Redeploy the branch with the new settings. Test sign-in with a Supabase project team member’s email. Supabase’s default mail service limits recipients and sending rates. For other testers, configure your own SMTP sender and check its free allowance. [Supabase email delivery](https://supabase.com/docs/guides/auth/auth-smtp)

Email sign-in uses Supabase Auth directly.

### Shared meetups and invite codes

Apply both SQL files in `supabase/migrations` in timestamp order to the same Supabase project as Auth. With a linked development project, `supabase db push --dry-run` previews the pending migrations and `supabase db push` applies them. Projects that previously applied the initial schema only need the new shared-meetups migration. Use the publishable key already configured for the app.

1. Sign in and choose **Plan a meetup → With friends**. Add a meetup name and the display name your friends will see. Schedule and notes are optional.
2. Open **Create invite code** and copy the code to send to one friend. It expires after 24 hours. Creating another code replaces any unused one.
3. On another device, the friend signs in and chooses **Shared meetups → Join with code**. The group can see each member’s display name and the starting point and preferences they choose to save.
4. Each member selects **Add my starting point**. Use **Refresh group** to see new members and updated origins. Once every origin is located, Barkits calculates nearby venues for the group. Shared voting and final venue selection are future steps.

Guest planning, the form improvements, and offline venue search work without Supabase or a Google Maps key.

### With a local Supabase stack

From the repo root, start Docker and run `supabase start` with the Supabase CLI. Copy the API URL and publishable key from `supabase status` into the corresponding variables in `.env.local`, then restart Expo. Open the local mail inbox URL printed by the CLI to retrieve codes. The checked-in Supabase configuration sets both local email templates.

See [design system](docs/DESIGN_SYSTEM.md), [product and integration decisions](docs/PRODUCT.md), and [cost audit](docs/COST_AUDIT.md).

## Google street maps on a Vercel preview

Barkits uses Leaflet for the pin picker, group map and final venue map. Web builds can display Google's 2D roadmap in all three. Leaving the preview key unset selects OpenStreetMap. The **Open in Google Maps** action on a suggested or chosen venue works on web and native without a key.

1. In a billing-enabled Google Cloud project, enable the **Map Tiles API**. For a ₱0 trial, check how much of the billing account's monthly free allowance other projects use first.
2. In Google Cloud Console → Google Maps Platform → Quotas, lower the **daily 2D tile request quota** to **3,000 or less** before distributing the preview. At 3,000 per day, this project can use up to 93,000 requests in a 31-day month. Lower it further if other projects share the allowance. Budget alerts only send notifications. [Cost controls](https://developers.google.com/maps/billing-and-pricing/manage-costs)
3. Create a browser API key. Apply **Websites** restrictions for your exact Vercel branch alias (for example, `https://your-preview.example.com/*`) and **API** restrictions for **Map Tiles API** only. Use the allowed alias when testing. The browser key is public by design.
4. In Vercel → Project Settings → Environment Variables, add `EXPO_PUBLIC_GOOGLE_MAP_TILES_KEY` for **Preview**, scoped to `barkits-prototype`. Redeploy using `npm run build:web`. For a local web build, use a key restricted to your localhost origin in `.env.local`.
5. Open **Saturday catch-up → Show group map**. Look for the Google Maps credit, zoom or pan, and select a marker. In **Add friend → Choose on map**, tapping a location should update the coordinates. A rejected key or exhausted quota shows an error with a retry action. Manual coordinate entry and the offline directory remain available.
