# Continuity ledger

## Snapshot
- 2026-11-27 [USER] Current brief starts a separate six-phase UI/UX overhaul and authorizes only Phase 1. Wait for approval before each subsequent phase.
- 2026-11-27 [CODE] Phase 1 audited current map-first baseline `2d0348e`. Next is Phase 2, Visual identity and design foundations, pending approval. Open acceptance includes native, assistive technology, hosted shared flows and working map tiles. See `docs/REDESIGN_PLAN.md`.
- 2026-11-27 [USER] Standing authorization: commit and push finished Barkits changes to the branch being worked on at the end of each task.
- 2026-11-27 [CODE] Planning now has a fixed Back/Next footer, a map-first place step with initials and fullscreen control, named voter avatars, and a shorter review. Trip estimates remain available per place. Native device and map tile rendering checks remain open.
- 2026-11-27 [USER] Prior `barkits-prototype` scope authorized story-inspired progress for four-stage meetup creation and fixes to mobile inputs.
- 2026-11-27 [CODE] Local and shared plans use four tappable progress bars, one task heading per stage, and brief reduced-motion-aware transitions. Compact web editors follow the keyboard viewport and keep the focused input in view. Native device and hosted acceptance remain open.
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
- 2026-11-25 [USER] D001 ACTIVE: one phase/subphase per request; checkpoint and stop. Explicit Phase 2 request supersedes previous lack of authorization, not unavailable native checks.
- 2026-11-25 [USER] D002 ACTIVE: preserve business rules/storage/services; modules under 300 lines; no silent fallbacks, empty catches or unnecessary dependencies.
- 2026-11-25 [CODE] D003 ACTIVE: extend existing theme/StyleSheet architecture behind stable UI exports; NativeWind configuration preserved.
- 2026-11-25 [USER] D004 ACTIVE: accepted warm task-focused direction preserving Kits/Nunito/brand colors.
- 2026-11-25 [CODE] D005 ACTIVE: 3A/3B/3C, 4A/4B and 5A/5B are separate boundaries; see roadmap.
- 2026-11-25 [CODE] D006 ACTIVE: Phase 2 paper header, compact full-width welcome, consistent scope-labeled summaries, retained filter and explicit retries; navigation/data ownership stays in entrypoint.
- 2026-11-26 [USER] D007 SUPERSEDED for this request by D008: 4.5A primary path, 4.5B locations/transport, 4.5C review/correction/confirmation, 4.5D realistic UX validation were separate requests; reopen relevant 3/4 surfaces, preserve functionality.

- 2026-11-26 [USER] D008 ACTIVE: explicitly authorized B then C then D in one request, with commits at every boundary. Do not advance to 5/6 while 4.5 acceptance gates remain open.

- 2026-11-27 [CODE] D009 PROPOSED: retain Barkits colors, Nunito, Kits and map-first planning. Give the current task a clear focal point and make the group convergence motif a functional stage and confirmation cue.

## Done (recent)
- 2026-11-27 [CODE] Documented Phase 1 journey findings, starting screen scores, creative direction and implementation roadmap. The local cross-place ranking UI is absent at `2d0348e`; the ranking rules and tests remain.
- 2026-11-26 [CODE] Earlier milestones retained: Phase 1 `e2c1d8e`, Phase 2 `38e826d`/`37dd526`, 3A `c5c9a9d`, merged 3B/3C and 4A `214e732`; historical evidence remains in handoff.
- 2026-11-26 [CODE] A `96a7366`: state-aware Who/When/Where/Review, optional schedule, explicit map entry and actual saved/saving/error states. Required features and shared permissions retained.
- 2026-11-26 [CODE] B `74c04b6`: consistent place/person totals, unknown/zero/source/limit distinctions, visible incomplete options and per-context trip drafts; shared own-trip editing remains scoped to the member.
- 2026-11-26 [CODE] C `4fce554`: pending destination review with vote totals, correction links, unsaved-form and persistence gates; current local/shared limit checks precede explicit confirmation.
- 2026-11-26 [CODE] D: restored comparison group map and trip-time gap; protected unsaved local forms on back/home with keep/discard choices. Saved records survive explicit discard.
- 2026-11-26 [TOOL] Repeatable standard-library WebDriver guest and synthetic shared-role scripts pass; fixture API binds only localhost and sends no email. Native/backend policy acceptance remains open.

## Working set
- 2026-11-26 [CODE] `docs/REDESIGN_PLAN.md`, `docs/REDESIGN_HANDOFF.md`
- 2026-11-27 [CODE] `src/meetup.tsx`, `src/shared-meetup-screen.tsx`, `src/suggested-places.tsx`
- 2026-11-26 [CODE] `src/trip-comparison.tsx`, `src/trip-evidence.ts`, `src/destination-eligibility.ts`, `src/destination-review.tsx`
- 2026-11-26 [CODE] `scripts/check-planning-browser.py`, `scripts/planning_webdriver.py`, `scripts/planning-fixture.py`

## Receipts
- 2026-11-26 [TOOL] Reproduced inline map focus moving on mouse-down. After fixing marker handling, both full-screen and inline pin-to-decision paths passed.
- 2026-11-26 [TOOL] 4.5A: npx tsc --noEmit and 16 domain/readiness tests pass; Expo web/Android/iOS exports pass. No lint script; native exports are not device tests.
- 2026-11-26 [TOOL] Chromium: new-name validation, empty/ready Who, optional/incomplete schedule correction, retained unsaved schedule/trips across stages/tabs, persisted estimates, home/reload resume passed.
- 2026-11-26 [TOOL] Chromium: storage rejection/retry, explicit map/back, confirmation to Review, confirmed map/back, draft-to-planning, partial origins and empty remote discovery passed.
- 2026-11-26 [TOOL] Responsive 320/390/768/1440 px stage navigation passed with no page overflow. Two batched visual inspections; mobile task controls now visible earlier. Screenshots/logs in ignored .expo/redesign/phase45a/.
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
