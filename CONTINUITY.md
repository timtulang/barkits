# Continuity ledger

## Snapshot
- 2026-11-27 [USER] Start fresh on Neon without carrying Supabase accounts or shared meetup records over. Approved `@neondatabase/serverless` and `google-auth-library`.
- 2026-11-27 [CODE] The replacement branch uses Neon for account sessions and shared meetups, with Google as the only sign-in provider. Guest plans retain the same device storage. The historical Supabase migrations remain in Git.
- 2026-11-27 [TOOL] PostgreSQL migration and rollback checks, server and domain tests, synthetic shared browser flows, and a read-only transaction against the live pooled Neon endpoint passed. New migrations have only been applied to disposable local PostgreSQL. Hosted Google OAuth and native device sign-in await a configured preview.
- 2026-11-27 [USER] Use Neon as the sole database and Google as the sole sign-in provider for Barkits.
- 2026-11-27 [TOOL] Live Neon has the Phase 2 identity table. The configured runtime login passed the pooled HTTPS permissions check and the elevated operator failed it. Codex Cloud could not open PostgreSQL TCP port 5432. The saved runtime URL still uses the direct hostname. Google OAuth configuration and the disposition of existing Supabase data are UNCONFIRMED.
- 2026-11-27 [CODE] Added `node db/cli.mjs check --https` for the same runtime role checks over port 443. The prototype’s Supabase flows are still serving existing users during the transition.
- 2026-11-27 [USER] Merge collaborative platform phases 0, 1, and 2 into `barkits-prototype` and review the phase documentation for functional parity.
- 2026-11-27 [CODE] The phases are stacked through `42100d3`. The merge preserves the redesigned local and Supabase shared flows and adds the phase roadmaps, account-scoped local meetup URLs, native link configuration, and the portable Neon foundation.
- 2026-11-27 [TOOL] TypeScript, 20 domain tests, web/Android/iOS bundles, Chromium guest and synthetic shared flows, and PostgreSQL 17/PgBouncer migration, runtime role and backup recovery checks passed. Live Neon, signed native builds, and device link verification remain open.
- 2026-11-27 [USER] Approved Phase 6, the final phase in the current UI/UX brief.
- 2026-11-27 [CODE] Phase 6 delivered browser accessibility fixes, a display-sized Kits asset and a final comparison against the starting screens. No further redesign phase is pending. Actual native devices, real screen readers, hosted sign-in and database configuration, and live map tiles remain open for release acceptance. See `docs/REDESIGN_PLAN.md`.
- 2026-11-27 [USER] Standing authorization: commit and push finished Barkits changes to the branch being worked on at the end of each task.
- 2026-11-27 [CODE] Planning now has a fixed Back/Next footer, a map-first place step with initials and fullscreen control, named voter avatars, and a shorter review. Trip estimates remain available per place. Native device and map tile rendering checks remain open.
- 2026-11-27 [USER] Prior `barkits-prototype` scope authorized story-inspired progress for four-stage meetup creation and fixes to mobile inputs.
- 2026-11-27 [CODE] Local and shared plans use four tappable stops, one task heading per stage, and brief reduced-motion-aware transitions. Compact web editors follow the keyboard viewport and keep the focused input in view.
- 2026-11-26 [USER] Prior request authorized sequential 4.5B/C/D with a commit at each boundary; original roadmap remains paused. Task clarity leads hierarchy, efficiency, consistency and decoration.
- 2026-11-26 [TOOL] Checkpoints: pre-reconstruction `214e732`, A `96a7366`, B `74c04b6`, C `4fce554`; D checkpoint `0958b7a` contains preservation fixes and repeatable browser validation.
- 2026-11-26 [CODE] B integrates place/person travel comparisons; C connects pending review, votes, corrections and explicit confirmation; D restores group-map/time-gap visibility and guards leaving unsaved forms. Business rules, service/storage contracts, providers and brand preserved; no new dependencies.
- 2026-11-26 [TOOL] Types, 18 tests, Python syntax, final design scan, web/Android/iOS exports, guest browser journeys and synthetic organizer/member UI sessions pass. Four widths: 320/390/768/1440 px.
- 2026-11-26 [USER] Next: commit D and STOP. Phases 5/6 and original 4B remain paused until open Phase 4.5 acceptance is closed or explicitly changed by the user.
- 2026-11-26 [TOOL] Open: actual Android/iOS and hosted authenticated/RLS acceptance. Synthetic UI fixtures do not validate real auth/policies; local rollback SQL was not run because OS user has no PostgreSQL role. No roles/schema provisioned; no lint script or docs/DATABASE.md.
- 2026-11-26 [TOOL] Node 24.15.0 restored in temporary cache. Graphify indexing remains paused/incomplete. README documents repeatable browser tests and environment-separated fixture exports.

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

## Done (recent)
- 2026-11-27 [CODE] Phase 6 refined web navigation and focus behavior, removed the decorative footer and reduced the initial Kits download by 72%. Assessed the final six surfaces against the Phase 1 ratings.
- 2026-11-27 [CODE] Phase 5 polished the route, roster, trip entry, decisions and recaps. Local and shared milestone animations wait for persistence, and saved recaps reopen without replaying the celebration.
- 2026-11-27 [CODE] Phase 4 added invite continuation after sign-in, map and shortlist navigation, explicit completion and archive actions, and audience-aware recaps. Shared phase checks use local synthetic data.
- 2026-11-27 [CODE] Phase 3 restored four ranking modes with consistent evidence, moved saved plans up on returning Home, and added venue-first review and direct directions. The guest flow and validation are recorded in the redesign plan.
- 2026-11-27 [CODE] Phase 2 implemented richer color roles, shared type and motion values, and the reusable local/shared route. Guest and synthetic shared UI evidence is recorded in the redesign plan.
- 2026-11-27 [CODE] Documented Phase 1 journey findings, starting screen scores, creative direction and implementation roadmap. The local cross-place ranking UI is absent at `2d0348e`; the ranking rules and tests remain.
- 2026-11-26 [CODE] Earlier milestones retained: Phase 1 `e2c1d8e`, Phase 2 `38e826d`/`37dd526`, 3A `c5c9a9d`, merged 3B/3C and 4A `214e732`; historical evidence remains in handoff.

## Working set
- 2026-11-27 [CODE] `docs/REDESIGN_PLAN.md`, `docs/DESIGN_SYSTEM.md`, `app/index.tsx`
- 2026-11-27 [CODE] `src/editor-dialog.tsx`, `src/fullscreen-place-map.tsx`, `src/place-search-field.tsx`
- 2026-11-27 [CODE] `assets/ui/kits.png`, `scripts/check-redesign-browser.py`, `scripts/check-shared-meetups.sql`
- 2026-11-27 [CODE] `scripts/check-planning-browser.py`, `scripts/check-shared-lifecycle.py`, `global.css`

## Receipts
- 2026-11-26 [USER] Existing commit authorization persists: checkpoint A only; no push/deployment or work on 4.5B/5/6.
- 2026-11-26 [TOOL] Committed Phase 4.5A as `96a7366`; baseline `214e732` remains recoverable. No push or deployment. Stopped before 4.5B.
- 2026-11-26 [CODE] 4.5B implemented: contextual place/person comparisons with evidence/limits, visible incomplete options, per-context trip drafts and shared own-trip editing; original ranking and confirmation rules preserved.
- 2026-11-26 [TOOL] B types, 17 tests, web export and local browser comparisons/draft/zero-fare/ranking/4-width checks pass; authenticated shared/native acceptance open. Next: commit B, implement C, then D.
- 2026-11-26 [TOOL] B committed `74c04b6`; C implemented with pending destination review, vote ownership/totals, correction links, dirty-form/persistence guards and current eligibility recheck.
- 2026-11-26 [TOOL] C types, 18 tests, web export and local review/cancel/dirty-form/changed-limit/correction/confirm/reopen browser scenarios passed. Next: commit C then perform authorized D validation; native/live shared acceptance open.
- 2026-11-26 [TOOL] D final guest suite passed: create/incomplete setup, paired schedule recovery, discovery → comparison, zero/unknown fares, per-person draft switching, ride fare selection/clearing, LRT controls and directions.
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
