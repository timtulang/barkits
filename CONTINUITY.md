# Continuity ledger

## Snapshot
- 2026-11-26 [USER] Proceed with Phase 3C, the next named subphase on the combined preview branch.
- 2026-11-26 [CODE] Phase 3C implemented from `b4a4d4e`, first checkpoint `634d1fd`. The combined preview includes all Phase 3 subphases.
- 2026-11-26 [CODE] Next named unit is Phase 4A. Native device and hosted authenticated acceptance remain open.

## Decisions
- 2026-11-25 [USER] D001 ACTIVE: one phase/subphase per request; checkpoint and stop. Explicit Phase 2 request supersedes previous lack of authorization, not unavailable native checks.
- 2026-11-25 [USER] D002 ACTIVE: preserve business rules/storage/services; modules under 300 lines; no silent fallbacks, empty catches or unnecessary dependencies.
- 2026-11-25 [CODE] D003 ACTIVE: extend existing theme/StyleSheet architecture behind stable UI exports; NativeWind configuration preserved.
- 2026-11-25 [USER] D004 ACTIVE: accepted warm task-focused direction preserving Kits/Nunito/brand colors.
- 2026-11-25 [CODE] D005 ACTIVE: 3A/3B/3C, 4A/4B and 5A/5B are separate boundaries; see roadmap.
- 2026-11-25 [CODE] D006 ACTIVE: Phase 2 paper header, compact full-width welcome, consistent scope-labeled summaries, retained filter and explicit retries; navigation/data ownership stays in entrypoint.

## Done (recent)
- 2026-11-25 [CODE] Prior milestones: Phase 0 audit; Phase 1 foundation `e2c1d8e`; Phase 2 shell/home `38e826d` and handoff `37dd526`.
- 2026-11-26 [CODE] 3B roster uses mapped starting points, per-person state, group roles and role-specific editing. Counter and approximate labels use existing catalog and coordinates.
- 2026-11-26 [CODE] Editor names its action, explains shared visibility and invalidation, and groups optional one-way limits.
- 2026-11-26 [CODE] Invites prioritize copy, describe replacement/expiry and surface failures. Web clipboard denial has a manual copy path.
- 2026-11-26 [TOOL] Integrated and responsive acceptance receipts in the current handoff. Native runtime and hosted acceptance remain open.

- 2026-11-26 [CODE] Phase 3A includes explicit scope, required names, preserved legacy schedules, Philippine-time display and idempotent shared retry.

- 2026-11-26 [CODE] 3C planner navigation, map-to-shortlist, local/own voting, explicit confirmation, per-member limit feedback and inline pin click fix.

## Working set
- 2026-11-26 [CODE] `docs/REDESIGN_HANDOFF.md`, `docs/REDESIGN_PLAN.md`, `docs/DESIGN_SYSTEM.md`
- 2026-11-26 [CODE] `src/decision-actions.tsx`, `src/venue-decision.tsx`, `src/plan-navigation.tsx`, `src/nearby-places.tsx`
- 2026-11-26 [CODE] `src/shared-ballot.tsx`, `src/shared-meetup-screen.tsx`, `src/map-markers.ts`, `src/meetup.tsx`
- 2026-11-26 [TOOL] `.expo/redesign/phase3c/`

## Receipts
- 2026-11-25 [TOOL] Phase 1–2 historical verification and outstanding native checks retained in the handoff.
- 2026-11-26 [USER] Selected Phase 2 baseline for independent 3B; no 3A present on visible Git refs.
- 2026-11-26 [TOOL] Node 24; existing lockfile and installed dependencies. TypeScript and 13 domain tests passed; no lint script configured.
- 2026-11-26 [TOOL] Web, Android and iOS exports passed. Mobile exports are bundle checks only.
- 2026-11-26 [TOOL] Browser checked local empty/partial/ready and persisted name/origin/mode/limit updates, invalid inputs, estimate retention/invalidation per member.
- 2026-11-26 [TOOL] Tested 320–1280 px, long names, eight-person roster, 48 px targets and keyboard return to the edit action.
- 2026-11-26 [TOOL] Three local PostgREST sessions verified personal origin edits, invitation copying/replacement, consumed-code rejection and map-first reentry.
- 2026-11-26 [TOOL] Failed code issuance and failed origin save both recovered on retry. Clipboard denial and simulated 24-hour sharing window tested.
- 2026-11-26 [TOOL] Local migrated PostgreSQL ran `scripts/check-shared-meetups.sql` through ROLLBACK, including expired invites and group permissions.
- 2026-11-26 [TOOL] Original external tile service showed its load warning in the shared desktop capture. Tiles and hosted authentication remain unverified.
- 2026-11-26 [TOOL] 3A first checkpoint `c5c9a9d`. Web, Android and iOS exports, TypeScript and 15 tests passed.
- 2026-11-26 [TOOL] Browser verified create/edit/draft/start/reload, legacy preservation and replacement, incomplete date/time correction/clear and six viewport widths.
- 2026-11-26 [TOOL] Local shared integration exercised busy double-submit, 400 rejection and 502 after actual commit; one persisted group opened on retry.
- 2026-11-26 [TOOL] Los Angeles browser verified the same Philippine schedule in list and details. Native runtime and hosted authenticated testing remain open.
- 2026-11-26 [TOOL] 3C types, 15 unit tests, local rollback SQL and all three platform exports passed.
- 2026-11-26 [TOOL] Browser checked map/voter/trip and persisted destination; shared organizer/member votes and bounded estimates passed against local PostgREST.
- 2026-11-26 [TOOL] Reproduced inline map focus moving on mouse-down. After fixing marker handling, both full-screen and inline pin-to-decision paths passed.
