# Redesign handoff

Updated 2026-11-26. **Phase 3B is implemented on `redesign/phase-3b-participants` from `37dd526`. Web and local authenticated integration verified. Native runtime acceptance is open.**

## Current checkpoint

The user explicitly selected the pushed Phase 2 baseline for 3B. The published baseline contained no 3A implementation. Reconcile any separate creation/scheduling work before combining branches. Only the participant editor, roster and organizer invitation were in scope.

| Finding | Change |
|---|---|
| A roster entry looked complete even when discovery could not locate it. | Both meetup types now use the existing resolver for the mapped count. Rows distinguish a pending origin, a label needing a pin, and an approximate locality center. |
| Name, transport, location and optional constraints competed for attention. A generic Save action obscured which change was being made. | A single sheet leads with identity or shared visibility, followed by the existing place control, transport and smaller one-way limit fields. A persistent, named save action points to invalid fields. Changing the trip explains the effect on entered estimates. |
| A generated invite, the replacement action and clipboard feedback had similar emphasis. | The organizer sees single-use and expiry rules before issue. The selectable code leads to Copy code; replacement is secondary. Copy denial, issuance failure and the end of the sharing window each have a recovery path. |

Implementation checkpoint `8036098`. A locality chosen in search retains its approximate-center label when its saved coordinates match the named catalog center. Moving its pin removes the label. The clipboard follow-up uses the web Clipboard API so a denied write reliably offers manual copy. Native uses Expo Clipboard. The existing services, invitation expiry enforcement, permissions, stored shapes, location input and map-first venue flow remain the source of behavior. No migration, new dependency, API key or hosted service is required by this change.

## Phase 3B evidence

- TypeScript and all 13 existing domain tests passed. Web, Android and iOS bundles exported. The repo has no lint command.
- Guest browser flow covered empty, partial and mapped rosters, invalid coordinates, name and limit feedback, zero fare, setting and editing a pin, persisted limits and per-person estimate invalidation. Changing only a limit retained estimates; changing transport cleared that person’s entered minutes, fares and provider notes.
- Browser checks covered widths 320, 390, 599, 600, 768, 939, 940 and 1280 px, long names, an eight-person roster, 48 px controls and keyboard opening/return. Doubled browser text fit the narrow roster. Selecting a locality result and moving its pin exercised both precision labels.
- Three independent browser sessions used local PostgreSQL/PostgREST with fixture identities. Organizer-only invites, copying, replacement, invalid and already-used codes, personal origin saves, member refresh, issue/save failure and retry, and opening a ready shared meetup on its full-screen map passed. The rollback-only SQL suite also rejected expired codes and verified backend ownership and invalidation. A browser clock advance verified the 24-hour display cutoff, and a denied clipboard write exposed manual copy.
- Screenshots and local QA scripts are in ignored `.expo/redesign/phase3b/`. Native safe areas, software keyboards, OS screen readers and a hosted Supabase deployment were not tested. Map tiles returned the app’s existing load warning during the desktop capture; roster checks and map-first reentry did not require external tiles.

## Resume order

Read `CONTINUITY.md`, `AGENTS.md`, `docs/REDESIGN_PLAN.md`, this handoff and the current Git diff. This checkpoint closes the authorized 3B work. Phase 3A remains unverified here; the planner and voting composition belong to separately scoped 3C.

## Historical Phase 2 checkpoint

## Completed in Phase 2
- Paper application header with coral brand mark, home/account actions, responsive New meetup action, shared spacing and footer. Shell presentation extracted; app entry retains navigation and data ownership.
- Full-width mango welcome with compact Kits on phones; clear Plan a meetup action; active/past plans below. Local/shared scopes have explicit explanations and become two columns at 860px.
- Common meetup summary rows with status, date and available details; shared plans no longer appear as name-only buttons. No invented member counts, travel metrics or venue data. Existing local demo-label behavior retained.
- Active/Past selection survives returning home. Creation, join/account entry and map-first planning handlers preserved.
- Visible font/account/local/shared loading; contextual empty states; local load/save retries and shared refresh recovery. Failed loads do not replace saved data; failed refreshes identify retained summaries.
- Preserved storage keys/account separation, stored data shape, services, calculations, editor/planner behavior, dependencies and assets.

## Files affected
- Modified: `app/index.tsx`, `app/_layout.tsx`, `src/home.tsx`, `src/shared-membership.tsx` (SharedList extraction only).
- Added: `src/app-shell.tsx`, `src/meetup-list-item.tsx`, `src/shared-meetup-list.tsx`.
- Documentation: `docs/DESIGN_SYSTEM.md`, `docs/REDESIGN_PLAN.md`, this file, `CONTINUITY.md`.
- Temporary `app/__phase2.tsx` removed before exports; no incomplete source edits. Its illustrative fixture is retained only in ignored validation artifacts.

## Validation receipts
| Check | Result |
|---|---|
| `npx tsc --noEmit` | Passed after final exports and fixture removal |
| `npm test` | All 13 domain tests passed |
| `npm run build:web` | Passed |
| Expo Android / iOS exports | Both passed separately, including DOM/WebView bundles; not native runtime validation |
| Guest browser navigation | Passed account entry, Active/Past, creation validation/save draft, retained filter on return, demo map/details/home |
| Local storage failures | Malformed saved data remained intact; corrected data loaded on retry. Simulated save failure displayed and retry recovered |
| Shared presentation fixture | Loading/disabled refresh, error/stale summaries/retry, empty, active/past, open/account callbacks and real join-dialog entry passed; no backend writes |
| Responsive / keyboard | Home/shared at 320/390/1440; home also 600/859/860/1280. No overflow; controls at least 48px; keyboard row focus/Enter opens map. At 320px, a 160-character name and doubled browser text fit without horizontal text/control overflow; not native font-scaling validation |
| Scoped visual review | Independent reviewer: **ship** for Phase 2 web presentation/implementation checkpoint; no material UI findings in supplied captures |
| Source hygiene / detector | `git diff --check` passes; all app/src modules under 300 lines; detector returned `[]` (not native verification) |
| Lint | No configured lint command; not run |
| Native / authenticated integration | Unavailable; safe areas, native font scaling/keyboard, VoiceOver/TalkBack and live shared sessions remain unverified |

First browser pass found a squeezed primary button at 320px; moving mobile Kits beside the title fixed it. Stacked groups now use natural heights rather than equal flex heights. Verification scripts initially used incorrect close labels, disabled-state assertion and CDP injection/key-event setup; these were corrected before the associated checks passed.

## Recovery and evidence
Ignored `.expo/redesign/phase2/` contains browser scripts, illustrative fixture, screenshots, detector output, web/Android/iOS/type logs and native export artifacts. These survive ordinary workspace restarts but are not Git checkpoints. Browser check receipts are split across `browser-checks.log`, `browser-rest.log`, `browser-shared.log`, `responsive.log`; early script failures are retained, with final successful checks recorded above. Source and documentation are the durable checkpoint.

Node 24 executable: `/tmp/barkits-runtime/node_modules/node-linux-x64/bin/node`; prefix commands with `PATH=/tmp/barkits-runtime/node_modules/node-linux-x64/bin:$PATH`. If `/tmp` is cleared, restore Node 24; system Node 20 cannot run the type-stripping tests. Dependencies remain installed from the unchanged lockfile. Run export and typechecking sequentially because the existing TS include scans generated `dist` files.

Existing Leaflet CSS asset warnings, tooling color/deprecation warnings and Node module-type warning remain; tests/exports succeed. No new known implementation blocker. Impeccable's previously reported product metadata drift remains outside scope; existing project docs are authoritative.

## Git checkpoint
Starting tree was clean at `bcb6722`, following foundation `e2c1d8e`. Phase 2 implementation committed successfully as `38e826d` — `refactor(ui): redesign application shell and meetup home`. Working tree was clean after that commit. This receipt is saved in a following documentation-only commit; verify current status when resuming. No push or deployment performed.

## Historical next action after Phase 2
Phase 2 was checkpointed. Report and STOP. On a later explicit authorization, resume **Phase 3A — meetup creation/editing and scheduling**; preserve completed surfaces. Native and authenticated acceptance remain open, not implied by exports or presentation fixtures. See the master roadmap for phase boundaries.
