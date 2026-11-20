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

## Enable email sign-in

Barkits supports guest planning immediately. When email sign-in is enabled, open the account icon, enter your email, then enter the code from your inbox. Guest meetups and each account’s meetups are saved separately on the current device. Signing out restores the guest list.

### On Vercel

For the Expo web project, use Node.js 24, `npm ci` to install, `npm run build:web` to build, and `dist` as the output directory.

1. In your Supabase project, enable the Email provider, allow new users to sign up, and enable email confirmation.
2. In Authentication → Email Templates, set the body of both **Confirm signup** and **Magic Link** to the supplied [sign-in code template](supabase/templates/sign-in-code.html). Both emails need `{{ .Token }}` so first-time and returning participants can enter their code in Barkits.
3. In Vercel → Project Settings → Environment Variables, set `EXPO_PUBLIC_SUPABASE_URL` to your Supabase project URL and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to its `sb_publishable_…` key. Select **Preview** for the prototype branch and **Production** if required. Expo embeds these public values at build time. Keep secret and service-role keys server-side.
4. Redeploy the branch with the new settings. Test sign-in with a Supabase project team member’s email. Supabase’s default mail service limits recipients and sending rates. For other testers, configure your own SMTP sender and check its free allowance. [Supabase email delivery](https://supabase.com/docs/guides/auth/auth-smtp)

Email sign-in uses Supabase Auth directly. The meetup database migration is needed for future shared planning.

### With a local Supabase stack

From the repo root, start Docker and run `supabase start` with the Supabase CLI. Copy the API URL and publishable key from `supabase status` into the corresponding variables in `.env.local`, then restart Expo. Open the local mail inbox URL printed by the CLI to retrieve codes. The checked-in Supabase configuration sets both local email templates.

See [design system](docs/DESIGN_SYSTEM.md), [product and integration decisions](docs/PRODUCT.md), and [cost audit](docs/COST_AUDIT.md).
