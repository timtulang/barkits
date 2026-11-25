# Continuity ledger

## Snapshot
- 2026-11-26 [USER] Implement Phase 3B on pushed baseline `37dd526`; one named subphase per request. Phase 3A work is absent from this branch.
- 2026-11-26 [CODE] Now: 3B participant sheet, local/shared roster, invitation states and design docs implemented. Existing place control, permissions, trip invalidation and service contracts retained.
- 2026-11-26 [TOOL] First implementation pushed at `8036098` on `redesign/phase-3b-participants`. Web guest and local authenticated acceptance passed.
- 2026-11-26 [USER] Next: stop at the named subphase; reconcile independent 3A work before integrating branches.
- 2026-11-25 [USER] Native hardware acceptance remains open.

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

## Working set
- 2026-11-26 [CODE] `docs/REDESIGN_HANDOFF.md`, `docs/REDESIGN_PLAN.md`, `docs/DESIGN_SYSTEM.md`
- 2026-11-26 [CODE] `src/participant-roster.tsx`, `src/editor.tsx`, `src/invite-friend.tsx`
- 2026-11-26 [CODE] `src/meetup.tsx`, `src/shared-meetup-screen.tsx`, `src/shared-membership.tsx`, `src/locate-friends.ts`
- 2026-11-26 [TOOL] `.expo/redesign/phase3b/`

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
