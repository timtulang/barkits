# Barkits production guardrails

## Request limits

The Vercel project firewall limits `/api` traffic to 120 requests per IP per minute before functions run. The prefix covers public routes and `/api/entry?__barkits_route=...`. The reproducible rule is in `security/vercel-api-rate-limit.json`; it must also be configured in the Vercel project. Changing this JSON alone does not publish a firewall rule. Preserve existing firewall rules when configuring another project.

Migrations `0007_abuse_limits` and `0008_api_ip_budget` add atomic PostgreSQL counters shared across function instances. There is no in-memory fallback. An unavailable limiter returns an error rather than allowing the action.

| Scope | Limit |
| --- | --- |
| All API requests, per IP | 120 / minute |
| Google sign-in starts, per IP | 10 / 10 minutes |
| Google callbacks, per IP | 30 / 10 minutes |
| Native sign-in claims, per IP | 20 / 10 minutes |
| Shared reads, per account | 120 / minute |
| Shared and profile writes, per account | 60 / minute |
| Meetup creation, per account | 10 / hour |
| Invite redemption attempts, per account | 10 / 10 minutes |
| Invite issuance, per account | 20 / hour |

Limits use fixed windows, so a boundary can allow two adjacent windows' budgets in a short interval. Account limits aggregate all sessions for the same verified user. Quota consumption commits before a mutation begins, so failed invite guesses and rejected writes still count. Rejected requests return HTTP 429 and `Retry-After`; the app also handles non-JSON edge throttling responses.

IP limits trust only Vercel's overwritten `x-vercel-forwarded-for` header when the server environment has `VERCEL=1`. Other forwarding headers are ignored. Missing or invalid trusted addresses fail closed. Localhost development uses a single loopback budget. Another hosting platform requires an explicit trusted address adapter before authentication will work.

Only HMAC digests of IP addresses are stored, using the server auth secret; raw addresses are not retained in application counters. Account counters use the internal user ID. Each subject/action has one reusable row. Every quota call removes up to 100 counters whose expiry is over a day old; cleanup resumes with traffic after inactivity. Runtime SQL cannot read/change counters directly or choose its own limits.

## Other protections

- Google state, nonce, PKCE, secure HttpOnly cookies and native handoff proof remain enforced.
- Shared operations retain transactional session authorization, membership checks and organizer/author boundaries. All API SQL parameters remain bound, with an allowlisted operation map.
- Foreign browser origins are rejected; cookie-authenticated writes require the app origin. Native writes require a valid bearer session or the proof-bound claim flow.
- JSON bodies have a 16 KiB streaming and declared-length limit plus a five-second read deadline. Unsupported methods and URLs over 8 KiB are rejected. Vercel caps each API invocation at 30 seconds.
- `vercel.json` applies CSP, frame denial, MIME sniffing protection, HSTS, no-referrer and camera/microphone/payment restrictions. Geolocation and the existing OpenStreetMap/Google tile hosts remain allowed. Inline styles remain necessary for React Native Web; inline scripts and `eval` are not allowed.
- Account settings and dashboard reads use session-bound SQL functions and existing account quotas; settings revisions and username uniqueness prevent concurrent overwrites. Deletion requires a Google-authenticated session no older than 15 minutes, an unchanged membership review and explicitly chosen replacement organizers. See `docs/DATABASE.md` for deletion/retention behavior.
- API responses disable caching. Secrets remain server-only and outside Git and client bundles.

## Verify before production

1. Apply the migrations required by the release (through 0012 for R1 account completion) to the confirmed production database **before** deploying this server. Current operator decision (2026-11-28): production and staging intentionally share the single Barkits/production/neondb target and the restricted barkits_api login. Use isolated local PostgreSQL for development checks. Both sites see the same accounts and shared meetups. Session secrets remain separate. Any branch reset, deletion or migration affects both environments.
2. Configure Production `DATABASE_URL`, `BARKITS_ORIGIN`, `EXPO_PUBLIC_BARKITS_API_URL`, Google client credentials and `BARKITS_AUTH_SECRET`. Both origins must match the actual production host. Register that host's exact `/api/auth/google/callback` in the corresponding Google Web client.
3. Confirm the active project firewall contains the API deny/rate-limit rule. For a new Vercel project, recreate it from the tracked JSON. Vercel DDoS mitigation is already platform-managed. Review current plan allowances and usage; no plan upgrade or paid add-on is required by the code.
4. Run `npm test`, `npx tsc --noEmit`, a web export and live Google/shared-meetup acceptance. Check maps and geolocation under the enforced CSP. Signed native builds remain a separate acceptance step.
5. Review Vercel's 429/denial metrics and Neon usage after launch. Tune limits against real group traffic, especially shared Wi-Fi/mobile carrier IPs. Do not distribute automation bypass credentials: they bypass firewall protections as well as deployment authentication.

Against a disposable local migrated PostgreSQL database with an operator able to SET ROLE, run `psql -X -v ON_ERROR_STOP=1 -f db/test-abuse.sql` and `node scripts/check-rate-limit-concurrency.mjs` with explicit `PGHOST`/`PGDATABASE`. The SQL suite rolls back fixtures; the concurrency script cleans up its own local fixture. Do not run load or concurrency fixtures against production.

Rate limiting reduces bursts, guessing and individual-account spam; it does not replace abuse monitoring or stop coordinated attackers with many accounts/IPs. The current shared-database exception is recorded above; real Google sign-in and shared-plan creation still require signed-in acceptance.

References: [Vercel trusted IP headers](https://vercel.com/docs/headers/request-headers), [WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [official firewall template](https://github.com/vercel/firewall-templates/blob/main/api-rate-limit/rule.json).
