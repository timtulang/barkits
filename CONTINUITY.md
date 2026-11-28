# Continuity ledger

## Snapshot
- 2026-11-28 [USER] Continue staging cutover in this local checkout; do not use the incorrect Codex Cloud setup. Merge codex/barkits-neon-google into barkits-prototype only after database and Vercel checks pass; push is authorized then.
- 2026-11-28 [USER] Start fresh on Neon with Google sign-in. Guest plans stay on their devices; skip Supabase account/shared meetup migration. Target project Barkits, branch disposable, database neondb; barkits and barkits_meta are schemas.
- 2026-11-28 [USER] Staging origin is https://barkits-staging.vercel.app; both origin variables must match. Exact Google callback is /api/auth/google/callback on that origin.
- 2026-11-28 [TOOL] Merged source 5e555bb into prototype and pushed no-ff merge 24ea3b9. Vercel deployment dpl_4e29jVTk3e2ttkXAc1CRioevrbF7 is READY; staging alias verified on that exact commit.
- 2026-11-28 [TOOL] User said ready after the request to confirm Neon IDs; treated as confirmation. Direct neondb_owner connection guard verified neondb, project falling-cloud-86903061, branch br-sweet-recipe-bixuu2dm before writes.
- 2026-11-28 [TOOL] Private pre-migration schema backup created outside Git; /tmp/barkits-cutover-location points to its restricted directory. Applied source commit migrations through 0006_shared_api; second run skipped all six. Core/shared SQL checks passed and rolled back. Users/meetups remain zero.
- 2026-11-28 [TOOL] Shared test initially could not SET ROLE barkits_runtime; rerun added temporary owner membership inside the fixture transaction. Final rollback verified operator SET membership false; no lasting privilege grant.
- 2026-11-28 [TOOL] Vercel project barkits verified in timtulang/barkits; staging domain tracks prototype. Build npm run build:web, install npm ci, output dist, Node 26.x. Deployment protection requires Vercel login.
- 2026-11-28 [TOOL] Supersedes empty Preview settings: configured all six required variables for Preview scoped to barkits-prototype. Both origins match staging exactly; DB/Google/auth values saved as sensitive. Production settings preserved. Staging domain is verified and explicitly assigned to prototype.
- 2026-11-28 [TOOL] Pooled barkits_api TCP/HTTPS role checks, types, 23 tests, staging web build and artifact credential scan passed. Hosted session returns HTTP 200/user null; Google start returns HTTP 303 with expected client, exact callback, PKCE S256 and secure HttpOnly flow cookie. Fresh browser reached Google identifier screen without redirect mismatch.
- 2026-11-28 [TOOL] Real sign-in failed because the client ID was copied into the client secret field. User corrected .env.local; Google token probe now returns expected invalid_grant for a deliberately invalid code, superseding invalid_client. Corrected branch-scoped Preview secret saved. Now: redeploy and retry real Google sign-in/shared creation. Native signed-device acceptance remains outside this staging check.
- 2026-11-27 [USER] Standing authorization: commit and push finished Barkits changes to the branch being worked on at task end; current cutover gates take precedence.
- 2026-11-27 [CODE] UI redesign phases 1–6 and collaborative foundation phases 0–2 complete. Existing theme, Nunito, Kits, map-first planning and guest storage retained; see phase documentation and historical receipts.

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

## Done (recent)
- 2026-11-28 [TOOL] Live staging migrations through 0006_shared_api and idempotent rerun passed. Core and shared SQL fixtures rolled back; zero users/meetups and no retained test privilege grant. SSH and Vercel API access restored; Preview configuration blocks merge.
- 2026-11-27 [CODE] Phase 6 refined web navigation and focus behavior, removed the decorative footer and reduced the initial Kits download by 72%. Assessed the final six surfaces against the Phase 1 ratings.
- 2026-11-27 [CODE] Phase 5 polished the route, roster, trip entry, decisions and recaps. Local and shared milestone animations wait for persistence, and saved recaps reopen without replaying the celebration.
- 2026-11-27 [CODE] Phase 4 added invite continuation after sign-in, map and shortlist navigation, explicit completion and archive actions, and audience-aware recaps. Shared phase checks use local synthetic data.
- 2026-11-27 [CODE] Phase 3 restored four ranking modes with consistent evidence, moved saved plans up on returning Home, and added venue-first review and direct directions. The guest flow and validation are recorded in the redesign plan.
- 2026-11-27 [CODE] Phase 2 implemented richer color roles, shared type and motion values, and the reusable local/shared route. Guest and synthetic shared UI evidence is recorded in the redesign plan.
- 2026-11-27 [CODE] Documented Phase 1 journey findings, starting screen scores, creative direction and implementation roadmap. The local cross-place ranking UI is absent at `2d0348e`; the ranking rules and tests remain.

## Working set
- 2026-11-27 [CODE] `docs/REDESIGN_PLAN.md`, `docs/DESIGN_SYSTEM.md`, `app/index.tsx`
- 2026-11-27 [CODE] `src/editor-dialog.tsx`, `src/fullscreen-place-map.tsx`, `src/place-search-field.tsx`
- 2026-11-27 [CODE] `assets/ui/kits.png`, `scripts/check-redesign-browser.py`, `scripts/check-shared-meetups.sql`
- 2026-11-27 [CODE] `scripts/check-planning-browser.py`, `scripts/check-shared-lifecycle.py`, `global.css`

## Receipts
- 2026-11-26 [TOOL] D guest suite also passed: failed save/retry, keep/discard leaving guard, pending review/cancel/confirm, hard-reload resume, map/back, completion and all four viewport widths.
- 2026-11-26 [TOOL] D synthetic shared sessions passed: own-member editing, missing/at-limit estimates, vote/move/withdraw, organizer review, injected 503 before finalization/retry and confirmed venue visible after member refresh. Not hosted auth/RLS validation.
- 2026-11-26 [TOOL] D final types, 18 tests, Python syntax, all platform exports and final planning-surface detector pass. Native CLIs absent from PATH; local SQL suite unavailable (no current-user DB role).
- 2026-11-26 [TOOL] Ignored receipts: .expo/redesign/phase45b/, phase45c/, phase45d/. Metro required --clear to switch embedded fixture env; normal final export contains no fixture environment. No external model/provider changes.
- 2026-11-26 [TOOL] D committed `0958b7a`; B `74c04b6`, C `4fce554`. Final normal export excludes fixture configuration. Stop at documented native/live-backend acceptance gates; no Phase 5/6 work or deployment.
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
