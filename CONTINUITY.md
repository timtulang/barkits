# Continuity ledger

## Snapshot
- 2026-11-28 [USER] Production promotion is authorized and accepted: Google sign-in and creation of a shared meetup succeeded at https://barkits.vercel.app. Corrected both production URLs in the existing Google Web client after a redirect_uri_mismatch; browser retest reached Google identifier screen.
- 2026-11-28 [TOOL] Prototype was merged/pushed to main as a729412 and deployed READY (dpl_GLVRrzGnzNZnt8rY4TKF4udR1J3C). Follow-up receipt bf1a411 deployed READY (dpl_BjVux9Ryn7VrR1WEC58rsWXeprWt) with production alias/API verified. Main is Vercel's Production branch; staging domain tracks barkits-prototype.
- 2026-11-28 [USER] D016 exception: production and staging intentionally share Barkits/disposable/neondb and the restricted barkits_api login for now, including accounts and shared meetups. Do not reset the branch as disposable test data. Guest plans stay on their devices; no Supabase account/shared-data migration.
- 2026-11-28 [TOOL] Owner target reverified read-only: neondb_owner/neondb, project falling-cloud-86903061, branch br-sweet-recipe-bixuu2dm. All eight migrations through 0008_api_ip_budget are applied; pooled barkits_api runtime permissions passed. Restricted pre-security backup is outside Git, located by /tmp/barkits-security-backup-location.
- 2026-11-28 [TOOL] Six Production variables configured for https://barkits.vercel.app. Four server variables are sensitive and Production-only; staging has branch-specific overrides. Separate generated Production session secret saved privately. No automation bypass credentials remain active.
- 2026-11-28 [TOOL] Credential audit found zero known-secret/credential-pattern matches in 668 reachable Git history blobs; no env files tracked, .env.local ignored with mode 600. Local web artifacts and 10 hosted responses (~5.24 MB) contain no saved secrets. Production API origin is embedded correctly; owner URL, Google secret, session secrets and Vercel token stay outside public bundles.
- 2026-11-28 [CODE] Database-backed API/IP/auth/account quotas, 429 Retry-After feedback, streaming/deadline bounds, security headers/CSP and 30-second API cap are deployed. No new dependencies/services. TypeScript, 28 tests and web export passed; prior local SQL/core/shared/abuse and 20-connection quota checks passed.
- 2026-11-28 [TOOL] Hosted production root/session return 200; anonymous shared access is 401, foreign origins 403, responses no-store, OAuth start 303 with exact callback/PKCE/Secure HttpOnly cookie. Browser app renders with no CSP violations. User-confirmed real callback/shared creation supersedes earlier UNCONFIRMED status.
- 2026-11-28 [TOOL] Vercel firewall v2 enabled with valid 120 API requests/IP/minute deny rule. Native edge 429 enforcement remains UNCONFIRMED. Hosted application limiter was verified on staging with 120 successful session reads then 10 JSON 429 responses/Retry-After; no production load fixtures were run.
- 2026-11-28 [USER] Use this local checkout and ignored .env.local; Codex Cloud setup is incorrect. Standing authorization covers committing/pushing finished work. Preserve Nunito, Kits, theme/map-first flows and guest storage; native signed-device acceptance remains separate.
- 2026-11-28 [CODE] Now: production release accepted; record final receipt and verify the ledger-only deployment. Next: continue feature work on a feature/preview branch. Open questions: none blocking this release; split the shared production/staging database before destructive staging work.

## Integrations and initialization
- 2026-11-26 [TOOL] Ponytail/Impeccable skills read; context succeeded using `docs/PRODUCT.md`. Existing `docs/DESIGN_SYSTEM.md` remains visual authority. Supersedes initial no-hook observation: later UI edits received automatic design-hook reports. Latest AGENTS makes optional tools targeted, not mandatory initialization.
- 2026-11-26 [TOOL] Supersedes initial availability: Graphify 0.9.120 skill and CLI appeared at `~/.local/bin/graphify`; user explicitly invoked indexing. Local extraction started; SQL parser/CSS coverage incomplete. Paused for urgent 4.5A; final graph status UNCONFIRMED. OmniRoute absent; no routing/provider changes.
- 2026-11-26 [TOOL] Native session skill discovery available; `.agents/` and `.codex/` exist but are empty/read-only. No repository-scoped Agent Skills or `ai-agent-skills` executable found; no duplicate collection installed.
- 2026-11-26 [CODE] Expo 54 / React Native 0.81 / Expo Router / strict TypeScript verified in package/config. Supabase operations live in `src/services/`; actual UI uses theme/StyleSheet with NativeWind configured (D003 preserves this variance). No initialization changes to application code.

## Decisions
- 2026-11-27 [USER] D009 ACTIVE: Neon is the sole target database and Google is the sole target identity provider. Supabase retirement follows replacement acceptance and a decision about existing data.
- 2026-11-25 [USER] D001 ACTIVE: one phase/subphase per request; checkpoint and stop. Explicit Phase 2 request supersedes previous lack of authorization, not unavailable native checks.
- 2026-11-25 [USER] D002 ACTIVE: preserve business rules/storage/services; modules under 300 lines; no silent fallbacks, empty catches or unnecessary dependencies.
- 2026-11-25 [CODE] D003 ACTIVE: extend existing theme/StyleSheet architecture behind stable UI exports; NativeWind configuration preserved.
- 2026-11-25 [USER] D004 ACTIVE: accepted warm task-focused direction preserving Kits/Nunito/brand colors.
- 2026-11-25 [CODE] D005 ACTIVE: 3A/3B/3C, 4A/4B and 5A/5B are separate boundaries; see roadmap.
- 2026-11-25 [CODE] D006 ACTIVE: Phase 2 paper header, compact full-width welcome, consistent scope-labeled summaries, retained filter and explicit retries; navigation/data ownership stays in entrypoint.
- 2026-11-26 [USER] D007 SUPERSEDED for this request by D008: 4.5A primary path, 4.5B locations/transport, 4.5C review/correction/confirmation, 4.5D realistic UX validation were separate requests; reopen relevant 3/4 surfaces, preserve functionality.

- 2026-11-26 [USER] D008 ACTIVE: explicitly authorized B then C then D in one request, with commits at every boundary. Do not advance to 5/6 while 4.5 acceptance gates remain open.

- 2026-11-27 [CODE] D009 ACTIVE: retain Nunito, Kits and map-first planning. Use stronger mango, coral and grape-purple roles. Represent real progress with labeled route stops and a checked venue pin after confirmation.
- 2026-11-27 [CODE] D010 ACTIVE: guest discovery keeps the map as the default and offers Places and Compare above it. Rankings reuse eligibility rules. Review leads with the venue, blockers or directions according to confirmation state.

- 2026-11-27 [CODE] D011 ACTIVE: keep the invite action through sign-in, reuse map-first browsing and arrival layouts for shared plans, and default shared recap drafts to private. Retain organizer and author boundaries.
- 2026-11-27 [CODE] D012 ACTIVE: stage motion affects only the heading. The checked pin and Kits animate once after confirmed saves and respect reduced motion. Save feedback stays near the task and preserves drafts on failure.
- 2026-11-27 [CODE] D013 ACTIVE: name editor and map dialogs, expose web workspace landmarks, and let Escape offer two levels only when search results are visible. Ship Kits at 3× the largest rendered size and keep the source artwork.

- 2026-11-28 [USER] D014 ACTIVE: fresh Neon staging with Google only; do not migrate Supabase accounts/shared meetups or move guest plans. Verify direct owner target and migrations plus branch-scoped Vercel Preview settings before the authorized merge/push.

- 2026-11-28 [CODE] D015 ACTIVE: use atomic existing-Neon quotas plus Vercel edge rules; no per-instance fallback or new rate-limit provider. Reject limiter failures and count rejected mutations separately.
- 2026-11-28 [USER] D016 ACTIVE: promote prototype to main and reuse the verified staging database for production for now, overriding the separate-production-target recommendation. Preserve environment-specific origins/session secrets and Production-only secret scope. The user corrected Google registration for https://barkits.vercel.app/api/auth/google/callback; browser retest passed and user confirmed real production sign-in/shared meetup creation.

## Done (recent)
- 2026-11-28 [TOOL] Authorized production merge a729412 pushed and deployed READY; Production-only sensitive secrets and separate session secret configured, public artifact scan/API authorization/security-header checks passed. Google callback registration was subsequently corrected and real sign-in/shared creation accepted by the user.
- 2026-11-28 [CODE] Added production guardrails, distributed quotas, request bounds/security headers, local abuse/concurrency tests and a production runbook; staging migrations through 0008 applied.
- 2026-11-28 [TOOL] Live staging migrations through 0006_shared_api and idempotent rerun passed. Core and shared SQL fixtures rolled back; zero users/meetups and no retained test privilege grant. SSH and Vercel API access restored; Preview configuration blocks merge.
- 2026-11-27 [CODE] Phase 6 refined web navigation and focus behavior, removed the decorative footer and reduced the initial Kits download by 72%. Assessed the final six surfaces against the Phase 1 ratings.
- 2026-11-27 [CODE] Phase 5 polished the route, roster, trip entry, decisions and recaps. Local and shared milestone animations wait for persistence, and saved recaps reopen without replaying the celebration.
- 2026-11-27 [CODE] Phase 4 added invite continuation after sign-in, map and shortlist navigation, explicit completion and archive actions, and audience-aware recaps. Shared phase checks use local synthetic data.
- 2026-11-27 [CODE] Phase 3 restored four ranking modes with consistent evidence, moved saved plans up on returning Home, and added venue-first review and direct directions. The guest flow and validation are recorded in the redesign plan.

## Working set
- 2026-11-28 [CODE] server/api.mjs
- 2026-11-28 [CODE] server/http.mjs
- 2026-11-28 [CODE] server/shared.mjs
- 2026-11-28 [CODE] server/rate-limit.mjs
- 2026-11-28 [CODE] db/migrate.sql
- 2026-11-28 [CODE] db/migrations/0007_abuse_limits.sql
- 2026-11-28 [CODE] db/migrations/0008_api_ip_budget.sql
- 2026-11-28 [CODE] db/test-abuse.sql
- 2026-11-28 [CODE] server/security.test.mjs
- 2026-11-28 [CODE] security/vercel-api-rate-limit.json
- 2026-11-28 [CODE] vercel.json
- 2026-11-28 [CODE] docs/SECURITY.md

## Receipts
- 2026-11-27 [TOOL] Typecheck, 18 planner tests, web/Android/iOS exports, guest acceptance at 320/390/768/1440 px and synthetic shared acceptance passed. Chromium also verified form entry with a simulated keyboard viewport, touch, keyboard navigation and reduced motion.
- 2026-11-27 [TOOL] Map-first follow-up passed types, 18 tests, four-width guest and synthetic shared journeys, including the fixed footer and overlapping origins. Cloud proxy returned HTTP 403 for OpenStreetMap tiles.
- 2026-11-27 [TOOL] Current Phase 1 audited Chromium guest and synthetic organizer/member journeys, four planning widths, keyboard focus and mobile/desktop captures. Baseline types, 18 planner tests and web export passed. Map tiles failed.
- 2026-11-27 [TOOL] Phase 2 passed 29 contrast pairs, TypeScript, 18 planner tests, all Expo exports, Chromium guest and synthetic shared flows, 320/390/768/1440 px, keyboard focus, reduced motion and save retry.
- 2026-11-27 [TOOL] Phase 3 passed TypeScript, 18 planner tests, all Expo exports, guest Chromium at 320/390/768/1440 px, confirmation save retry, directions coordinates and synthetic shared organizer/member checks.
- 2026-11-27 [TOOL] Phase 4 passed TypeScript, 18 planner tests, all Expo exports, guest Chromium, synthetic sign-in and invite, shared role and review checks, and private, published and archived recap checks. Captures cover phone and desktop.
- 2026-11-27 [TOOL] Phase 5 passed TypeScript, 18 planner tests, Python syntax, Expo exports and Chromium guest journeys with standard and reduced motion. Local shared fixtures passed planning and recap checks. Captures are in `/workspace/work/barkits-phase5/`.
- 2026-11-27 [TOOL] Phase 6 passed browser guest and shared suites, accessibility and narrow reflow checks, TypeScript, 18 tests, all Expo exports, and the shared SQL rollback suite on isolated PostgreSQL 17.12. Screens and logs are in `/workspace/work/barkits-phase6/`.
- 2026-11-28 [TOOL] Cutover preflight: clean local branch; fetch rejected by GitHub SSH; required environment/auth absent even outside sandbox; staging protected by Vercel login. Only ledger updated; no migration, merge, push or deployment performed.
- 2026-11-28 [TOOL] .env.local loaded without printing credentials; live direct owner read-only inspection succeeded. Applied ledger contains 0001_core only. Asked user to verify server project/branch IDs and provide local Vercel authentication plus unlock SSH. Database changes and merge remain gated.
- 2026-11-28 [TOOL] Fetched source 5e555bb and prototype f58ce31. Target-guarded live migration, skip rerun, core/shared rollback tests passed. Vercel API confirms staging alias on prototype; Preview/shared env lists empty, only Production DATABASE_URL present. Generated local auth secret; awaiting pooled URL and Google client credentials. No merge/push.
- 2026-11-28 [TOOL] Pooled target and TCP/HTTPS role checks passed; six branch-scoped Preview variables configured/verified. npm ci, npx tsc --noEmit, 23 tests and web export passed. Temporary protected-preview automation credential stored outside Git; revoke after hosted verification. No new application code authored for cutover.
- 2026-11-28 [TOOL] Merge 24ea3b9 pushed and deployed READY at staging. Verified alias SHA, hosted anonymous session, exact Google callback/client/PKCE/cookie, and real browser navigation to accounts.google.com/v3/signin/identifier. Opened Firefox for user Google sign-in and test shared creation; awaiting outcome.
- 2026-11-28 [TOOL] Callback failure diagnosis: users/identities/sessions/meetups all zero; runtime can execute start_google_session and invalid digest probe correctly rolls back. Google token endpoint rejects client pair with HTTP 401 invalid_client. Confirmed GOOGLE_OAUTH_CLIENT_SECRET equals GOOGLE_OAUTH_CLIENT_ID; user copied client ID into both fields. Asked user for the actual matching client secret. Temporary protected-preview test token revoked after hosted checks.
- 2026-11-28 [USER] Corrected GOOGLE_OAUTH_CLIENT_SECRET privately. [TOOL] Client pair probe now returns HTTP 400 invalid_grant for the intentionally invalid authorization code; updated sensitive Preview secret. Application code unchanged. Pushing this ledger checkpoint triggers a deployment with the corrected settings.
- 2026-11-28 [TOOL] Corrected-secret deployment dpl_FGpmBhbrrQ8Cis67XPUjT6DYHTSu READY at 377d06c; staging alias, anonymous session and exact Google redirect/client passed. Temporary automation credential revoked; Firefox reopened for user acceptance retry. Application code unchanged.
- 2026-11-28 [TOOL] Guardrails checkpoint: local SQL suites/concurrent requests passed; target-guarded staging migrations 0007/0008 applied with private backup; live runtime quota transaction rolled back and role checks passed. CSP guest/map browser check had no violations. Active WAF v2 valid but edge 429 not observed; application global IP budget covers the API.
- 2026-11-28 [TOOL] ae19689 deployed READY at staging: CSP/frame headers and anonymous trusted-IP/API limiter passed; Google start uses exact callback. Bounded hosted application probe returned 120 successful session reads then 10 JSON 429s with Retry-After. Automation bypass revoked. No production code deployment/merge. Edge rule configured active/valid, but native edge 429 remains unverified on a routed production API.
- 2026-11-28 [TOOL] Production a729412 deployed READY (dpl_GLVRrzGnzNZnt8rY4TKF4udR1J3C); alias SHA verified. Root/session 200, shared anonymous 401, foreign origin 403, no-store, CSP/frame/MIME/referrer headers and OAuth start 303 with exact production callback/PKCE/Secure HttpOnly cookie passed. Public JS/CSS/root/source/env-path responses scanned: zero saved secret matches. Browser app renders without CSP violations, but Google returns redirect_uri_mismatch; user asked to correct the existing Web client and Firefox opened to Google Auth clients.
- 2026-11-28 [USER] Saved production Google redirect URI and JavaScript origin; [TOOL] browser retest reached accounts.google.com/v3/signin/identifier and Firefox opened production sign-in. [USER] Confirmed both Google sign-in and shared meetup creation succeeded. Production acceptance complete; prior callback blocker resolved.
