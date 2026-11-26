# Redesign handoff

Updated 2026-11-26. **Original roadmap paused. Phase 4.5A primary planning path is implemented and validated for local web; native/authenticated shared acceptance remains open. User subsequently authorized 4.5B, C and D with separate commits. Phases 5/6 are blocked until all Phase 4.5 acceptance criteria pass.**

## Phase 4.5C · review, corrections and confirmation

B checkpoint: `74c04b6`. Choosing a destination now goes to Review rather than confirming from a place card. Review shows people, optional schedule, pending destination, participant travel evidence, named vote totals and members who have not voted. Votes do not choose a winner automatically. Cancellation returns to places while preserving votes, retained places and estimates; a reviewed place is a temporary UI choice, not a newly persisted group decision.

Local confirmation rechecks current eligibility and waits for successful device persistence. Unsaved schedule or per-context trip edits are identified and block confirmation until saved or cleared. Trip entry exposes links to resume each unsaved draft. Changing origins/modes still invalidates the affected person’s estimates under existing rules. Existing no-limit confirmation behavior is retained; unknown figures are not treated as verified data.

Shared confirmation remains organizer-only, uses the existing finalize RPC, rechecks limit blockers and is disabled during mutation/refresh or a failed refresh. Members see their vote and the organizer’s confirmation responsibility. Failed requests keep the proposal available for correction/retry. Confirmed plans reopen in read-only Review, with directions/map and existing lifecycle actions.

Validation: types, 18 tests and web export pass. Browser checks covered review/cancel without status change, unsaved schedule/trip gates, changed time limit blocking and correction, explicit confirmation persistence and read-only reopen. Test helper needed a render wait before typing a newly mounted trip field; no application failure was observed. Native runtime and live authenticated shared acceptance remain open. Next: authorized 4.5D realistic combined validation.

## Phase 4.5B · connect places and transportation

Where now has Explore places and Compare places & vote. A mapped suggestion can be retained and compared as a destination, with a consistent summary of group time, longest one-way trip and group fare. Incomplete and over-limit options stay visible with their missing data or limit issues; the existing ranking formula and confirmation eligibility remain unchanged. Each person’s origin, transport, time/fare sources, provider timestamps and limits sit with the corresponding place. Missing fares stay unavailable, including a distinction between zero and unknown.

Trip entry opens for the selected person and destination within Where; saved estimates return to the comparisons. Unsaved drafts remain per visited person/place while switching contexts. Changing origin or mode resets the affected draft and retains the existing stored estimate invalidation. Ride/LRT/directions tools remain in this trip context. Shared shortlists use the same summaries/breakdowns, show members lacking estimates, and allow only the current member to edit their own trip or starting point.

Validation: TypeScript, 17 tests and web export passed. Chromium checked summaries, demo labels, contextual edit, unsaved drafts across people, saved zero fare, all four ranking modes, stage transitions and 320/390/768/1440 px. Shared evidence fixtures cover missing members, unknown fares, limits and provider sources; authenticated shared UI/native acceptance remains open. Receipts: ignored `.expo/redesign/phase45b/`. No dependencies, schema, providers or storage-format changes. Next authorized unit: 4.5C.

## Phase 4.5A · reconstruct the primary planning path

Implementation checkpoint: `96a7366`. Safe baseline: `214e732` (`feat: phase 4`) on `barkits-prototype`. This correction deliberately reopens Phase 3/4 interfaces; visual polish was not evidence that planning was understandable.

### Focused journey audit

| Problem in the actual path | Evidence at baseline | Bounded A repair |
|---|---|---|
| Ready plans immediately open a full-screen map, hiding planning context | `meetup.tsx` fullMap initializer; shared entry effect | Open the planning workspace at missing setup or Where; map becomes an explicit tool with Back to planning. |
| Component tabs explain tools rather than the whole task | Nearby places / Travel rankings / Trip details, roster alongside, schedule hidden in the pencil action | One Who / When / Where / Review structure for local/shared plans; named current step, readiness and freely revisitable stages. |
| Creation asks optional details before the group exists | Activity, multiline notes and schedule occupy the creation form | Name/scope lead; optional details disclosed explicitly; Create meetup & add friends says where the action goes. Save draft remains. |
| Setup and scheduling have no obvious continuation | Roster and details editor are disconnected from comparing | Who explains required origins/optional limits; Review meetup time leads to optional inline When, then Choose meeting places. |
| Navigation can discard unsaved trip fields | Conditional TripPlanning mount by tab | Retain schedule and trip components across planning-stage/tool navigation; saved records retain their original contracts. |
| Saved state is asserted before storage succeeds | Static Saved on this device label | Track local persistence acknowledgment; distinguish saving, saved plan/form edits and failed save with existing retry. |
| People cannot see what is still undecided | Chosen-place and roster information are separate | Basic Review summary reports people/mapped origins, optional time and unconfirmed destination; links back to stages. Detailed correction/confirmation belongs to C. |

A keeps existing transport selectors, limits, map search, rankings, trip entry, ride/LRT tools, voter ownership, shared invitations, shortlist, confirmation and lifecycle controls. Shared members still edit only their own origin. Shared schedule editing is unsupported in the existing services and is stated plainly; no new API or schema was introduced. Earlier origin/mode changes retain the existing per-person estimate invalidation rules. Confirmed plans are read-only where existing rules require it.

Initial stages derive from real state: empty/partial origins or a draft → Who; ready planning → Where; decided → Review. Scheduling is optional and is not a gate to comparison. The step sequence is navigation, not a forced wizard. Unsaved schedule/trip fields survive stage/tool changes within an open meetup; only explicitly saved data survives leaving/reload. Optional creation details and invitations retain state while collapsed or on another stage.

### Phase 4.5A verification and next action

TypeScript, 16 domain/readiness tests and web/Android/iOS Expo exports pass for this checkpoint. Chromium has verified creation validation, empty/ready setup, incomplete schedule recovery, schedule/trip draft retention across stages and tool tabs, persisted estimates, four widths (320/390/768/1440), and home/reload resume. Inspection found excessive mobile header height; compact stage navigation and contextual metadata now keep the task/action nearer the first viewport. Final checks after correction passed responsive stage navigation, actual storage rejection/retry, explicit map/back, confirmation to Review, confirmed map/back, draft-to-planning, partial origins and no-catalog-match recovery. No page overflow occurred at 320, 390, 768 or 1440 px. These are browser scenario checks, not a usability study or whole-4.5 acceptance.

Receipt files: ignored `.expo/redesign/phase45a/`. No lint script is configured. Native-device and authenticated shared acceptance are open; platform bundles and source inspection do not close those checks. Remaining B/C/D work: cohesive transportation comparison, fuller review/corrections and realistic end-to-end acceptance. STOP after A; no 4.5B, 5 or 6 work is authorized.

## Phase 4A · place search and maps

Search explains its Philippine catalog coverage, announces result counts, labels approximate locality centers and keeps ambiguous queries unselected. Search controls use shared focus and field tokens. Arrow keys, Enter and Escape support selection and reopening. The place input shows the selected pin and adjacent coordinate validation; denied location access has explicit feedback while manual entry remains available.

Map navigation sits above the map and wraps around long titles on narrow screens. The collapsed place tray, numbered list/pin equivalence, origin visibility control and confirmed destination remain. Venue sheets explain straight-line distance and confirmed directions explain where to choose a starting point. Provider attribution has a separate visible strip. Zoom and group markers have 44-point targets, and map colors inherit theme tokens.

OpenStreetMap tile failures expose Retry map. Browser testing caught missing markers after retry when React batched the ready flag; readiness now tracks the map instance so each new instance gets its pins. Google’s existing retry and provider selection remain intact. No ranking formulas, storage formats, permissions, schema or service contracts changed; no dependencies added.

### Phase 4A verification

Node 24.15.0 was provisioned in a temporary cache and existing lockfile dependencies restored. TypeScript, the 15 domain tests, and web/Android/iOS exports pass. No lint script is configured. Browser acceptance is in progress; receipts live under ignored `.expo/redesign/phase4a/`. Native device and hosted authenticated acceptance remain open. Implementation checkpoint: `214e732`; no push or deployment performed by this session.

## Phase 3C · planner navigation, voting and confirmation

At baseline `b4a4d4e`, the shared shortlist followed the full nearby list, and the map gave no direct way to reach it after nomination. The local map sheet hid the active voter's identity. A shared travel-limit warning identified the person but left the organizer to infer which estimate needed attention.

- Local planning keeps map-first entry. Each eligible place sheet lets the user select the friend whose vote they are recording. Map and ranking actions identify the voter and support casting, moving and withdrawing that person’s vote. Compare trips opens the selected place. An empty ranking offers a path to enter trip details.
- Shared planning has adjacent Nearby places and Shortlist sections. Adding a place from a pin exposes View shortlist. The shortlist shows the member’s current vote and each candidate’s total. Only the organizer sees Choose destination. A second action names the venue and explains that confirmation closes voting.
- A blocked shortlist entry names the member and the missing or over-limit time or fare. Members can update their own estimates. The organizer can confirm at the exact limit. After a failed refresh, voting and confirmation wait for a successful reload.
- An inline pin could lose a mouse click when Leaflet focused the surrounding map on mouse-down, shifting it between press and release. Interactive pins now keep that event within the marker. Keyboard activation still works.
- Ranking formulas, trip estimate fields, stored votes, RPCs, schema and provider integrations retain their existing contracts. No migrations or dependencies were added.

### Phase 3C verification

Guest browser flows covered draft to planning, local vote selection/move/withdraw across two voters, keyboard pin activation, inline map and trip entry, hard-limit recovery, cancel/confirm and reopening a decided meetup. Navigation controls were checked across eight viewport widths from 320 to 1280 px.

Organizer and member browser sessions used local authenticated PostgreSQL/PostgREST. Checks covered an empty shortlist, nominating two venues, returning to the shortlist, vote ownership and counts, rejected vote and retry, missing and exceeded travel limits, estimates at the exact limits, cancellation and confirmation, and the destination visible to the member on reopen.

TypeScript, 15 domain tests, the rollback-only shared SQL suite and Expo exports for web, Android and iOS passed. No lint script is configured. Screenshots and browser fixtures are in ignored `.expo/redesign/phase3c/`. Native device interactions and the hosted authenticated backend remain unverified.

## Phase 3A · meetup creation, editing and scheduling

The Phase 2 editor could already create drafts, start planning, edit local details and create authenticated groups. The 3A work began at the verified 3B commit `e84307e`; the first 3A implementation was pushed at `c5c9a9d`.

| Gap in the existing flow | Current behavior |
|---|---|
| The scope chips did not explain whose device stores the meetup or who adds origins. | The name leads. The scope choice explains manual entry on this device or invite-code participation. Shared organizers enter their display name. Local drafts, immediate planning and editing retain their original actions. |
| Schedule errors could be out of view. A partially typed browser date could look filled while its stored value was empty. | Field-level messages and a short footer prompt identify the missing or incomplete date/time. Clear schedule resets both controls, including unfinished browser input. Existing free-text schedules survive unrelated edits and can be explicitly replaced or cleared. |
| The shared list used device time while details used Philippine time. Native picker defaults depended on the device zone. | Pickers, local summaries and shared lists/details use the Philippine clock. The existing local string and server timestamp formats are preserved. |
| Only the shared submit button was disabled during creation. A lost response left it unclear whether another attempt would create a second group. | One submission is accepted per attempt. Pending shared requests lock the fields. A definite rejection retains editable inputs. A lost response offers a retry with the same details and request ID, so the original group opens. |

### Phase 3A verification

- TypeScript, all 15 domain tests (including leap dates, legacy schedules and the Philippine midnight boundary), and web, Android and iOS exports passed. The project has no lint script.
- Guest browser checks covered draft and immediate creation, edits/cancel, promotion to planning, required and optional inputs, date-only/time-only validation, incomplete typed segments, clearing and replacing schedules, and reload. Editing existing plans retained roster and votes.
- Layout and controls checked at 320, 390, 599, 600, 768 and 1280 px. Browser flows included keyboard entry, a 160-character meetup name and a desktop/phone screenshot review.
- With a local authenticated PostgreSQL/PostgREST group, the test double-clicked submit during a pending request, recovered from a rejected submission, then simulated a gateway failure *after the real creation committed*. Retry returned one group. The list and detail showed the same Jan 1 Philippine time in a browser set to Los Angeles. The existing rollback-only SQL regression suite passed.
- Screens and browser scripts are stored in ignored `.expo/redesign/phase3a/`. Native keyboard, safe area, screen readers and OS date-picker interactions require real-device testing. Authenticated tests used local fixture sessions; hosted Supabase remains unverified.

## Historical Phase 3B checkpoint

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

## Resume order recorded after 3B

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
