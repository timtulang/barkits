# Barkits redesign plan

## Current brief · Phase 5 personality and interaction polish

**Checkpoint · 27 November 2026.** The route gives confirmed milestones more emphasis. Save and recovery feedback stays beside the task that produced it.

- **Planning and confirmation.** The heading moves 3 points over 150 ms when switching stops. The body and controls stay in place. The selected pin settles over 220 ms after confirmation succeeds. With reduced motion, the checked pin and confirmation text appear immediately.
- **Setup and recovery.** The roster gives an explicit first step and shows when the group can look for places. Votes show a text status. Trip validation sits beside the time or fare field, and a failed save keeps the open entry available for retry. Shared organizers see failed proposal saves in the review.
- **Completion and memories.** Kits takes one short hop after a newly completed meetup is saved, with no replay on reopening. Local recaps report when changes are saved to the device and expose an inline retry on failure. Shared recaps confirm the resulting audience or removal after the service responds. Reduced motion keeps the same text and status cues.

### Phase 5 validation

- Chromium guest journeys cover four planning widths from 320 to 1440 px with standard and reduced motion, including confirmation recovery, field validation, trip and recap retries, and reopening a completed meetup. Captures cover the confirmed route, recap save and retry on phones, and confirmed and shared memory layouts on desktop.
- The local shared fixture covers organizer and member behavior, confirmation and recap retries, and private and published feedback. TypeScript, 18 planner tests, Python syntax and Expo web, Android and iOS exports passed. Device behavior, screen readers, hosted Auth and database policies, and working map tiles remain open.

**Next approval gate · Phase 6, Validation and refinement.** Carry out cross-app journey checks, performance measurement and the final comparison against the starting screens.

## Phase 4 checkpoint · Remaining screens and workflows

**Checkpoint · 27 November 2026.** Phase 4 carries the Phase 3 layout into account and invite entry, shared planning, and memories.

- **Account and invites.** Join with code opens the invite sheet after email verification. Validation stays beside the affected field, and retryable service errors stay in the sheet. The organizer sees the single-use code, Philippine-time expiration and copy fallback in Who.
- **Shared planning.** The map opens first. Places and the shortlist are available above it, with side-by-side browsing on wide screens. Members can edit their own estimates and change their vote. Review leads with travel blockers, the proposed venue or directions. Confirmation, completion and archiving remain organizer actions.
- **Memories.** Both modes show Kits, the venue and schedule. Local recaps say On this device and protect unsaved changes on exit. A new shared recap starts at Only me and shows the audience beside the saved post. Archived meetups reopen from Past meetups. Shared authors can still make a recap private or remove their own recap or rating.

Implementation covers `app/index.tsx`, the account and invite sheets, shared list, ballot and planner, and local and shared memories. `src/meetup-arrival.tsx` and `src/memory-ui.tsx` share presentation across both modes. The design system, README and continuity ledger describe the updated flow.

### Phase 4 validation

- Guest Chromium checks passed across the four planning widths. They cover explicit completion, keeping an unsaved recap when returning to the editor, saving and rating on-device, archiving, and reopening from Past meetups.
- The shared planning and lifecycle suites passed against the localhost fixture. They cover email-code handoff, invalid and replaced invite codes, copy fallback, member and organizer controls, travel limit checks, confirmation and recap retry, private and published visibility, ratings, and archive reopening and withdrawal. The fixture sends no email.
- Phone and desktop captures show the join sheet, invite code, member arrival, private recap editor and archived view. At 320 px, the recap audience choices and save action fit in the sheet. TypeScript, 18 planner tests, Python syntax, and Expo web, Android and iOS exports passed. Native-device behavior, screen readers, hosted Auth and database policies, and working map tiles remain unverified.

### Updated screen scores

Scores reflect the browser walkthroughs and captures. Map tile failure limits shared discovery. Native behavior and assistive technology remain open for validation.

| Criterion | Account and invites | Shared planning | Memories |
|---|---:|---:|---:|
| Recognizable personality | 7 | 8 | 9 |
| Purpose is obvious | 9 | 8 | 9 |
| Visual hierarchy | 8 | 8 | 8 |
| Intentional composition | 8 | 8 | 8 |
| Necessary containers only | 8 | 8 | 8 |
| Typography supports the brand | 8 | 8 | 8 |
| Purposeful palette | 8 | 8 | 8 |
| Obvious next action | 9 | 8 | 9 |
| Features discoverable | 8 | 8 | 8 |
| Enjoyable to use | 7 | 8 | 8 |
| Accessible and responsive | 8 | 7 | 8 |
| Recognizable without logo | 7 | 8 | 9 |

**Phase 4 handoff · Phase 5, Personality and interaction polish.** Refine motion and feedback for setup, errors, decisions and memories within the existing design direction.

## Phase 3 checkpoint · Primary experience redesign

**Checkpoint · 27 November 2026.** Phase 3 delivered the guest vertical slice before the Phase 4 redesign.

- **Home and setup.** The first visit keeps Kits and the welcome. After someone makes a plan, Home leads with their plans, newest first, and retains the labeled demo. The compact header gives setup more room, Add friend leads the empty roster, and schedule copy explains when Next skips the optional date and time.
- **Discovery and comparison.** Where opens at the map. Places and Compare are available above it, and a wide screen keeps the map beside the active view. Map pins, list rows and comparison results open the same detail sheet. Balanced, Fairest, Fastest and Cheapest use the existing ranking and limit rules. Results show one-way group minutes, trip gap, fares, and estimate sources. Places that need more data or exceed limits remain available for correction. The selected ranking survives a trip edit within the same plan.
- **Review and arrival.** The venue and its blockers precede general meetup details. Users can change the place or edit its trips before explicitly confirming. Review shows a pending save when local persistence fails. After success, a checked route and Get directions lead for venues with saved coordinates. Map, completion and memories remain available.

Implementation includes `src/home.tsx`, `src/app-shell.tsx`, `src/planning-schedule.tsx`, `src/meetup.tsx`, `src/nearby-places.tsx`, `src/suggested-places.tsx`, `src/place-rankings.tsx`, `src/destination-review.tsx`, and `src/planning-journey.tsx`. The browser suite, design system, README and continuity ledger record the updated flow.

### Phase 3 validation

- Chromium guest coverage includes first and returning Home, setup and schedule correction, list and full-screen map navigation, four ranking modes, zero and unknown fares, per-person drafts, voting, pending review and correction, injected save failures and retries, venue directions, reload and completion. Directions were checked against the saved coordinates.
- Screen captures cover 320, 390, 768 and 1440 px. The narrow comparison keeps a visible Rank by control and the leading result above the footer. The four planning stages retain labels, 48-point targets and a fixed footer. The shared organizer and member regression suite passed against a localhost fixture.
- TypeScript, all 18 planner tests, and Expo exports for web, Android and iOS passed. Native devices, screen readers and hosted shared permissions remain unverified. The browser showed the map tile failure state, and pins, attribution, and the independent place list remained available.

### Updated guest screen scores

Scores reflect the browser walkthrough and captures. The observed tile failure and unavailable native and screen-reader checks limit the scores for discovery and accessibility.

| Criterion | Home | Setup | Where and Compare | Review and directions |
|---|---:|---:|---:|---:|
| Recognizable personality | 8 | 7 | 8 | 8 |
| Purpose is obvious | 9 | 9 | 8 | 9 |
| Visual hierarchy | 8 | 8 | 8 | 9 |
| Intentional composition | 8 | 7 | 8 | 8 |
| Necessary containers only | 8 | 8 | 8 | 8 |
| Typography supports the brand | 8 | 8 | 8 | 8 |
| Purposeful palette | 8 | 8 | 8 | 8 |
| Obvious next action | 9 | 8 | 8 | 9 |
| Features discoverable | 8 | 8 | 8 | 8 |
| Enjoyable to use | 8 | 7 | 7 | 8 |
| Accessible and responsive | 8 | 7 | 7 | 8 |
| Recognizable without logo | 8 | 7 | 8 | 8 |

**Phase 3 handoff · Phase 4, Remaining screens and workflows.** Extend the design to account and invite entry, organizer and member planning, and local and shared completion and memories. Verify role-specific actions, recap audience, and archived states.

## Phase 2 checkpoint · Visual identity and design foundations

**Checkpoint · 27 November 2026.** The approved direction brings more color and a clearer sense of progress to Barkits. Phase 2 applied the foundations and exercised them on Home and in the existing planning flow before the Phase 3 redesign.

- **Color and type.** Mango leads the welcome and current stop. Coral marks people. Grape-purple gives primary actions a consistent, high-contrast color. Cream and paper support dense content. The shared Nunito scale gives page titles more presence while retaining aligned numeric text and readable form labels.
- **Shape and motion.** Shared fields retain 48-point targets and 12-point corners. Panels use 16-point corners, with elevation reserved for sheets. Named timing and easing values govern stage reveals and Kits’ short celebration. The system reduced-motion setting skips both.
- **Progress.** Local and shared planning use the same labeled route with an outlined current stop, a check for completed work, and a venue-shaped endpoint. Skipping time leaves its stop open. Opening Review leaves the endpoint unchecked until the venue is confirmed. For a local plan, the endpoint waits for the save to succeed. Existing navigation, readiness, voting and persistence rules provide the state.

The implementation lives in `src/theme.ts`, `global.css`, `src/planning-route.tsx`, `src/planning-journey.tsx`, `src/home.tsx`, `src/kits.tsx`, `src/meetup.tsx`, and `src/shared-meetup-screen.tsx`. `scripts/check-planning-browser.py` now expects visible stage labels, one current step and minimum target sizes. The token and component contracts are in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), and the checkpoint is in [CONTINUITY.md](../CONTINUITY.md).

### Phase 2 validation

- Contrast checks passed for 20 text pairs and 9 control pairs. The lowest measured ratios were 5.50:1 for text and 3.37:1 for controls. All five mirrored CSS color values matched the theme.
- Chromium captures cover phone and desktop Home and planning, including validation, empty setup, discovery and confirmed arrival. Guest planning passed at 320, 390, 768 and 1440 px with visible stage names, one active stage, 48-point targets, a fixed footer and no horizontal page overflow. Keyboard focus and reduced motion passed. An injected local save failure kept the arrival pin unchecked until retry succeeded.
- TypeScript, all 18 planner tests and Expo exports for web, Android and iOS passed. The shared Chromium check passed member voting, organizer-only confirmation, busy feedback and refreshed arrival using a localhost fixture. Native device behavior, screen readers, hosted shared permissions and map tiles remain open.

**Phase 2 handoff · Phase 3, Primary experience redesign.** Build the guest vertical slice around Home, setup, map-first discovery, cross-place rankings, review and directions. Bring the place list and comparison within reach without losing the map or the fixed step actions. Lead review with the proposed or confirmed venue.

## Phase 1 baseline · Design and UX audit

**Checkpoint · 27 November 2026.** The audit covers the map-first implementation at `2d0348e` on `barkits-prototype`. This brief has its own six-phase sequence. The earlier roadmap below is historical and retains its open native and hosted acceptance items.

Barkits helps friends in Metro Manila agree on a place they can all reach. An organizer needs to see who is ready, how a venue affects each person's trip, and what is still preventing a decision. A shared participant needs to join, give only their own starting point and trip details, vote, and find the confirmed venue. The experience should start with the anticipation of making plans, build confidence through legible travel evidence, and end with the relief of having somewhere to meet.

### Journey audit

| Journey | Observed behavior and opportunity |
|---|---|
| Start or resume | Home offers a clear **Plan a meetup** action and a labeled practice plan. On a phone the welcome panel is the largest block ahead of saved plans. The shared invite-code entry is farther down the page. Give a ready-to-resume plan greater priority when one exists and keep the practice plan recognizable. |
| Set up friends and time | Local creation validates the name and folds away optional details. Starting-place search resolves a labeled locality center, and date and time can be skipped. The progress bars hide stage names visually, the narrow planner header wraps before the task, and the disabled **Next** competes with **Add friend** in an empty plan. Show the stage names, distinguish optional from completed states, and give the first setup action primary weight. |
| Find and compare places | The map and list open the same place detail, and the map has labeled pins and retry feedback. At 390 px the map consumes the first viewport and pushes the equivalent list, filters and shared shortlist below the fixed footer. Expanding trip estimates can push the vote and selection out of view. Put a visible **Places** / **Shortlist** entry beside the map, make the comparison reachable in one action, and keep distances, estimates, votes and selection visibly distinct. |
| Decide and attend | Local and shared reviews keep confirmation explicit and communicate that voting will close. The proposed or confirmed place sits below the general meetup summary, and votes can precede venue directions even after confirmation. Lead with the venue and the decision state, position blockers and correction links beside the affected evidence, and give **Get directions** priority once the plan is set. |
| Sign in, join and coordinate | Account and shared list are separate entry points. The signed-in organizer sees invite expiry and shared members can vote without organizer controls. Invite-code entry competes with home content, while the invite action sits below the organizer's roster. Keep device and group scope clear, give join and invite controls a predictable location, and preserve member ownership. |
| Complete and remember | Local completion leads to a recap prompt with Kits. The shared recap editor exposes private and group publication choices in source. Give completion a distinct visual moment, then emphasize one next action with the recap's audience beside its save or publish action. |

### Changes in priority order

| Priority | Evidence | Design response |
|---|---|---|
| High | The map-first commit deleted `LocalPlaceComparison`. The four modes still exist in `planner.ts` and are covered by tests, but Where exposes per-place estimates only. The trip editor and README still mention rankings. | Restore a visible **Compare places** entry in the map-first step and reuse the existing ranking and eligibility rules. Show minutes, trip-time gap and one-way fare with provenance and eligibility together. |
| High | All four progress controls render without visible text. The browser exposes names and an active step, but the bar changes thickness and color to carry visual state. | Keep the four tappable steps and fixed thumb-reachable footer. Give every step a visible name and use distinct selected, incomplete and done states with text or symbols. Use action-specific footer labels where intent is ambiguous. |
| High | On phone, the map failure still leaves a tall gray area while the list remains below the fold. Desktop puts the same workflow in a full-width stack. | Keep the map as the spatial focal point. Give its equivalent list an above-the-fold entry on phones and a companion column on wide screens. Keep attribution and map retry available. |
| Medium | Home, planning and review repeat full-width rounded panels, heavy Nunito headings and similar button weight. Confirmed Review buries the main outcome. | Use containers where they group controls or evidence, and use alignment and separators for repeated plan, person and venue rows. Make each screen's focal element obvious even with the logo hidden. |
| Medium | The local completed view describes recap storage as demo-only even when the plan is user-created. The account dialog describes all signed-in meetups as device-local. | Match existing behavior in the copy. Label device plans, shared plans, and recap audience at the point of action, with short, literal wording. |

### Creative direction

Three directions were explored. The playful approach used Kits and sticker-like place marks to make discovery social. The bold editorial approach used oversized destination names, asymmetrical columns and compact lists to make decisions easy to scan. The unconventional approach used a simplified diagram of friends converging to show progress and tie the decision to the product's purpose. The first approach suits the welcome and recap but would compete with trip evidence. The second organizes dense data but needs a recognizably Barkits element. The third supplies that element and works best with the second approach's hierarchy.

**Selected direction · Meet in the middle.** Friendly, plainspoken and precise when the group needs to make a choice. An original convergence motif takes the existing coral initials and numbered venue pins into a small diagram of individual paths meeting at one checked pin. Use it to orient users through stages and mark a confirmed decision. Use text and shape with color so the state reads at a glance. Keep the motif schematic, separate from actual map paths, and avoid implying routing or travel estimates. Transport wayfinding demonstrates how consistent station symbols and simplified paths can express a real task. The route motif and assets will be original to Barkits. [London Transport Museum on the diagrammatic Tube map](https://library.ltmuseum.co.uk/portal/Default/en-GB/RecordView/Index/106)

| Element | Direction |
|---|---|
| Typography | Keep licensed Nunito. Use one prominent title and a strong venue-name role. Give labels and provenance quieter weights, and align tabular minutes and pesos for comparison. Allow long names and enlarged text to wrap. |
| Color and shape | Keep cream, paper and deep ink as the reading surfaces. Use mango for current action or progress, coral for people and brand moments, plum for selected controls, and existing semantic roles for feedback. Use the pin silhouette and circular initials for map-linked information. Keep field and button shapes familiar and reserve elevation for sheets. |
| Composition | Use an asymmetric map and place-list split on desktop, with a single phone column and a quick path to the list. Set forms in a narrower reading column. Let repeated rows align without individual card borders. Use a larger, quieter venue block to give confirmation its own focal point. |
| Illustration, icons and voice | Keep the original Kits in welcome, empty and memory moments. Use familiar Feather icons with visible action labels for key controls. Write actions in short, plain English and use Filipino-English warmth in greetings and recaps. |
| Motion and states | Keep press response immediate and use brief shared transitions, starting with the existing 180 ms timing. Move the relevant selection or progress state together, and keep changes immediate with reduced motion. Pair waiting, error and retry feedback with the affected control and keep confirmation explicit. |

### Baseline screen scores

Scores are a design review of the rendered starting point, on a 1–10 scale. Criteria follow the brief. Access scores reflect the browser spot checks. Hosted, native and assistive-technology coverage remains open.

| Criterion | Home | Create and setup | Map and compare | Review and attend | Shared ballot | Local memories |
|---|---:|---:|---:|---:|---:|---:|
| Recognizable personality | 8 | 6 | 6 | 5 | 5 | 7 |
| Purpose is obvious | 8 | 8 | 7 | 7 | 7 | 8 |
| Visual hierarchy | 7 | 7 | 5 | 5 | 6 | 6 |
| Intentional composition | 7 | 6 | 5 | 5 | 5 | 6 |
| Necessary containers only | 7 | 7 | 6 | 5 | 5 | 6 |
| Typography supports the brand | 8 | 7 | 7 | 6 | 6 | 7 |
| Purposeful palette | 8 | 7 | 7 | 7 | 7 | 7 |
| Obvious next action | 8 | 6 | 5 | 6 | 6 | 7 |
| Features discoverable | 7 | 7 | 4 | 6 | 6 | 7 |
| Enjoyable to use | 7 | 6 | 5 | 6 | 6 | 7 |
| Accessible and responsive | 7 | 6 | 5 | 6 | 6 | 6 |
| Recognizable without logo | 8 | 5 | 6 | 4 | 4 | 7 |

The home and memory scores reflect visible Kits artwork and the direct language of the next actions. Setup loses clarity at the unlabeled progress controls and disabled footer. Place discovery loses discoverability because the list is below the map and cross-place ranking is absent. Review and the shared ballot use similar large white panels for venue, general details and evidence, which gives them less visual distinction and slows scanning.

### Implementation roadmap

| Phase | Scope and checkpoint |
|---|---|
| **2 · Visual identity and design foundations** | Extend `theme.ts`, existing UI primitives, `global.css` and `DESIGN_SYSTEM.md` with explicit color, type, spacing, shape, surface, elevation, icon, motion and interaction roles. Prototype the original convergence motif in one reusable presentation component. Validate contrast, 48-point shared targets, focus, disabled and busy states, and reduced motion. Checkpoint before broad screen changes. |
| **3 · Primary experience redesign** | Build the guest vertical slice from Home through Who, When, map-first Where, Compare, Review and directions. Restore the four ranking controls using the existing algorithms and preserve the list/map entry, inline corrections, save guards and explicit confirmation. Validate at phone and desktop widths before reuse. |
| **4 · Remaining screens and workflows** | Apply the language to shared account, invite/join, organizer and member planning, and local/shared completion and memories. Confirm scope, invitation expiry, role actions, publication audience, archived state and responsive layout. |
| **5 · Personality and interaction polish** | Refine purposeful motion and recovery, and check Kits use in empty and memory states. Apply the convergence motif at confirmation, and verify reduced motion and retained form state. |
| **6 · Validation and refinement** | Re-run guest, organizer and member flows with keyboard, enlarged text and narrow/wide screenshots. Check assistive tech, native devices, working map tiles, real authorized shared auth and database policy behavior. Measure baseline and revised cold loads before choosing asset work. Score each changed screen again and fix regressions. |

The implementation uses the existing Expo, React Native and Supabase boundaries. Protect saved data, voting and organizer permissions, trip limit semantics, unknown versus zero fares, fare source labels, map attribution and available transport tools. Phase 3 keeps the recent map-first layout and fixed planner footer as established behavior.

### Validation record

- The normal Expo web export, TypeScript check, and all 18 planner tests passed for the baseline. The guest export bundled about 5.46 MB of JavaScript and 1.4 MB of Kits PNG artwork before transport compression. These are build output sizes. Cold-load timing remains open.
- Chromium guest inspection covered Home, create/name validation, the empty roster, starting-place selection, optional time, map discovery, per-place estimates, voting, review, directions entry, completion and recap. Shared Chromium inspection used the repository's local fixture to observe organizer tools, member voting, organizer-only confirmation and the member's refreshed result.
- Captures were reviewed at 390 and 1440 px. All four stages had a fixed footer, 48 px high stage controls and no page-width overflow at 320, 390, 768 and 1440 px. Tabbing from Where to Review displayed a 3 px focus outline. The environment's OpenStreetMap tile requests failed. The map retained pins and exposed retry, and venue details remained reachable.
- Native devices, screen readers, real email/code redemption, hosted database policies and successful map tile rendering remain unverified. The Impeccable launcher was unavailable, so the audit used project context, screenshots, browser interaction and source inspection.

**Files affected** · `docs/REDESIGN_PLAN.md` and the canonical `CONTINUITY.md`.

**Next approval gate** · Phase 2, Visual identity and design foundations, using the direction above.

---

## Earlier redesign roadmap

Updated 2026-11-26. **Phase 4.5A–C are implemented; 4.5D browser validation is checkpointed with native and live shared acceptance still open. Original roadmap remains paused. Phases 5/6 remain blocked until those checks close; Phase 4B remains paused.**

## Priority override: Phase 4.5 — Planning UX Reconstruction

User direction on 2026-11-26 supersedes the previous next-phase order and map-first entry requirement. Task clarity > information hierarchy > interaction efficiency > visual consistency > decoration. Reopen relevant Phase 3/4 surfaces; retain implemented features, storage, calculations, permissions and external contracts. Checkpoint before substantial changes: `214e732` (`feat: phase 4`).

| Subphase | Scope | Status / stop boundary |
|---|---|---|
| **4.5A** | Audit primary journey; cohesive Who / When / Where / Review navigation, readiness, required/optional hierarchy, explicit next actions, saved state | Implemented and validated for local web; native/authenticated shared acceptance open. Historical A boundary; subsequent user authorization covers B, C and D with separate commits. |
| **4.5B** | Integrate discovery and supported transportation comparisons into the journey; explain evidence and tradeoffs | Implemented; local browser and evidence tests pass. Native/authenticated shared acceptance open. |
| **4.5C** | Review, corrections, confirmation and supported group-decision states | Implemented; local review/correction/confirmation browser checks pass; shared/native acceptance remains open. |
| **4.5D** | Realistic complete-flow validation, incomplete/error states, corrections and preservation | Browser acceptance and repeatable scripts complete; native/runtime and live authenticated backend acceptance remain OPEN. Do not declare whole-4.5 acceptance or resume 5/6 yet. |

Overall 4.5 acceptance: first-time start is obvious; sequence/current stage/purpose/action are clear; required and optional inputs differ; relevant features are discoverable; locations and trips can be compared efficiently; earlier decisions can change without unnecessary loss; incomplete/unconfirmed status is explicit; narrow mobile layouts remain understandable; required functionality is preserved. A establishes the path, but does **not** certify all ten criteria or replace B–D.

Focused A audit and evidence are in `REDESIGN_HANDOFF.md`. The original phase table below records historical scope, not current authorization. Phases 5/6 remain blocked; 4B is paused pending the reconstruction.

## Authority and preserved requirements

One request authorizes exactly one phase or named subphase. “Continue” means only the next incomplete unit. Complete, validate, checkpoint, report, and stop. This roadmap does not authorize implementation or release.

Requirements recovered from [AGENTS.md](../AGENTS.md), [README](../README.md), [product requirements](PRODUCT.md), [existing design system](DESIGN_SYSTEM.md), and [cost constraints](COST_AUDIT.md). Their historical “Phase 1” means the prototype, not this redesign. The earlier chat-only overhaul brief is unavailable; additional requirements from it are UNCONFIRMED. This plan covers implemented functionality, not the product backlog.

Preserve these constraints throughout:

- React Native + Expo, strict TypeScript, Expo Router, NativeWind configuration and platform-specific implementations. Extend existing styling; no competing system or new dependencies planned.
- Functional components, stable entrypoints, code files under 300 lines, services outside presentation. No silent default fallbacks or empty catches. Ask before selecting a new library if one becomes necessary.
- Guest/account local storage separation and data compatibility; optional Supabase auth/shared meetups; no schema or service-contract changes. `docs/DATABASE.md`, required before schema changes, is absent; such work requires a separate review and recovered schema documentation.
- Local Draft → Planning → Decided → Completed → Archived lifecycle; shared organizer/member permissions and supported lifecycle. Preserve local/shared capability differences rather than inventing parity.
- Shared single changeable vote per member, explicit organizer confirmation, time/fare checks and invalidation when origins or transport modes change. Votes never automatically select the destination.
- Offline discovery/search, ranking formulas, fixture boundaries, approximate locality centers, unknown fares, units, provider timestamps, map attribution and directions endpoints. No new live-price, traffic, geocoding or routing claims.
- User-initiated foreground location, group visibility disclosure before origin saves, private/group recap actions and existing archive restrictions.
- Mobile-first safe areas, keyboard behavior, responsive web and accessible controls. No paid provisioning, release, unrelated features or unnecessary dependencies.

## Product and primary journeys

Audience: a Metro Manila barkada coordinating a place to meet. Organizers need to see what is ready and what remains; members need to enter their starting point and assess their own trip. This is a task interface, with brand expression supporting the work.

| Journey | Current sequence and branches | Ownership |
|---|---|---|
| Return/start | Home → active/past → local/shared meetup; create → local draft/planning or signed-in shared creation | 2, 3A |
| Local preparation | Details → add/edit friends → starting place/pin → transportation and optional limits → save; draft can start planning | 3A–3B, 4A |
| Shared preparation | Email code → create group or join by code → organizer invitation → members save own origins/preferences → refresh roster | 3A–3B, 5A |
| Discover | Ready planning meetup opens full-screen map → numbered pin or matching list row → venue sheet; missing origins lead to setup; details returns to planner | 3C, 4A |
| Compare | Nearby place → retain for comparison → person/destination trip entry → optional ride/LRT tools → save → ranking mode → individual trips | 4B |
| Decide/attend | Local vote-as-person or shared shortlist/own vote → explicit confirmation → decided venue → reopen confirmed map → directions | 3C, 4A, 5B |
| Remember | Complete → optional local recap/ratings or shared private/published recap → archive → Past meetups; authors retain supported withdrawal/removal actions | 5B |

No separate profile, settings, notifications or onboarding screens are implemented. Account UI is a dialog; onboarding consists of welcome/empty states and inline explanations. Do not invent screens to fill the roadmap. Shared meetup detail editing is not currently exposed.

## Architecture and reusable components

| Area | Evidence / affected files | Implication |
|---|---|---|
| Entry/navigation | `app/_layout.tsx` loads fonts/Expo Stack; `app/index.tsx` owns account/local storage and switches home/local/shared with React state | Keep route and storage keys stable. Extract shell presentation as needed. Browser history/deep links are not presently guaranteed behavior. |
| Styling | `src/theme.ts`, `src/ui.tsx`, `src/form-controls.tsx`; mostly inline/StyleSheet styles; NativeWind setup in global CSS/Babel/Tailwind | Extend the actual token/primitive architecture; avoid wholesale utility-class migration. Keep `ui.tsx` exports stable when splitting internals. |
| Shared layout | `workspace-layout.tsx`, `editor-dialog.tsx`, `plan-navigation.tsx` | Reuse columns, responsive sheet and section navigation. Distinct sheet/home/workspace breakpoints have distinct purposes. |
| Local planning | `meetup.tsx`, `meetup-editor.tsx`, `editor.tsx`, `nearby-places.tsx`, `venue-decision.tsx` | Extract cohesive view modules as touched; preserve calculations and stored shapes. |
| Shared planning | `shared-meetup-screen.tsx`, `shared-membership.tsx`, `shared-ballot.tsx`, `use-shared-data.ts`, services | Share presentation where appropriate, not permission/mutation handlers. Retain pending guards and refresh behavior. |
| Locations | `place-input.tsx`, `place-search-field.tsx`, `suggested-places.tsx`, `fullscreen-place-map.tsx`, `confirmed-place-map.tsx`, `planning-map.tsx` | Improve search, selected place, map/list and venue sheet as a coherent unit. |
| Map boundary | `place-map.tsx`, `place-map-view.tsx`, `map-markers.ts`, `map-markers.css`, `google-roadmap.tsx`, map providers | Native DOM/WebView and web Leaflet need separate validation. Preserve attribution, selection bridge and coordinates. |
| Comparisons | `venue-summary.tsx`, `trip-planning.tsx`, `trip-options.tsx`, shared estimate editor in `shared-ballot.tsx` | Reuse metric/trip presentation; preserve local ranking versus shared ballot semantics. |
| Supporting flows | `account-dialog.tsx`, `shared-memories.tsx`, local memories in `meetup.tsx`, `kits.tsx` | Preserve email codes, recap audience and reduced-motion behavior. |
| Protected domain | `planner.ts`, discovery/search/geo/transport modules, services, `planner.test.mts`, `scripts/check-shared-meetups.sql` | Existing domain tests do not verify rendered UI. Avoid domain changes during redesign. |

Existing strengths to retain: role-based typography, tabular numeric text, 44-point shared controls, explicit labels, web focus styling, keyboard-aware sheets, search combobox keyboard handling, map/list equivalence, status text/icons, reusable fare/distance presentation and original Kits artwork.

## Prioritized source audit

Evidence is from baseline `423481e`. No running UI or current screenshot fixtures were available. These are code findings and design risks, not measured usability outcomes or claims of visual/a11y compliance.

| ID / priority | Evidence and user impact | Response |
|---|---|---|
| A01 / high | `theme.ts` has brand colors but no semantic feedback/surface/elevation/state contract. `ui.tsx` uses plum for selected controls and errors | Semantic roles and text/icon feedback; contrast checks in 1 |
| A02 / high | Button has pressed/disabled but no common busy state; Chip lacks explicit pressed treatment. Account/storage/location/trip messages often use plain Label, while other forms use alerts | Shared feedback/state primitives in 1; surface adoption in later phases; preserve global focus and duplicate-submit guards |
| A03 / high | Local home cards show status/date/roster; `SharedList` shows group-name buttons | Equivalent scannable hierarchy using available data; clear storage scope and resume/create/join actions in 2; no invented summary fields |
| A04 / high | Local planner has Nearby/Rankings/Details and vote-as selector; shared planner stacks nearby/shortlist/roster | Shared task hierarchy with clear local voter/shared ownership; retain capability differences in 3B–3C |
| A05 / high | Map-first entry has a closed place tray; search-another-place jumps into Trip details; discovery, shortlist and confirmation cross surfaces | Preserve map-first behavior; clarify list/details/back and search intent in 3C/4A/4B; keep selected destination through transitions |
| A06 / high | Metrics say “Unknown”, shared estimates “Fare unknown”, other views “Fare unavailable”; person/time/fare/source often concatenate into long text | Consistent aligned figures and source labels in 4B; unknown never becomes zero; retain budget semantics |
| A07 / medium | Home/memories/dialogs override sizes, spacing and radii; map/global CSS and marker code repeat hex colors | Token contract in 1, per-phase adoption, map style synchronization in 4A; obsolete-style cleanup only after migration in 6 |
| A08 / high | Field labels inputs and alerts errors but has no explicit error/input relationship; async announcements vary. Dialog focus return and map keyboard behavior unverified | Semantic relationships in 1; focus, announcements, keyboard and dismissal checks in each adopting phase and 6 |
| A09 / medium | Button icon/text row has no wrapping text container; map topbar combines title and text action; headings share rows with controls | Explicit long-name/enlarged-text/narrow-phone cases; actual clipping remains unverified |
| A10 / medium | Account copy describes device-local storage despite shared groups; local/shared recaps have different persistence/audience models | Accurate account scope in 5A and recap/lifecycle clarity in 5B without changing behavior |
| A11 / medium | StatusMark maps unknown status to planning; font loading returns null; local storage loading lacks a dedicated content indicator | Explicit known-state handling and loading/failure presentation when touched in 1–2; no additional silent fallbacks |

## Accepted visual direction

**A warm, clear meetup workspace.** Keep Kits, Nunito, Filipino-English social voice and the cream/ink/coral/mango identity. Replace repetitive heavy panels and scattered heading sizes with stronger task hierarchy, quieter content rows and deliberate emphasis. The user accepted the summary and authorized Phase 1 on 2026-11-25.

- **First viewport:** identity/status, the next useful action and real plans or readiness. Keep home welcome art compact on phones so returning users reach plans quickly. No invented bottom tabs or marketing sections.
- **Color:** cream page, paper surface, ink text/primary action, plum selection. Mango/coral for welcome and occasional brand emphasis. Separate semantic feedback/focus roles; color alone never communicates an error or success.
- **Type:** retain Nunito 600/800/900 and page/section/item/body/value/label/detail roles. Fewer one-off sizes, restrained heavy headings, readable supporting text and aligned tabular figures. Permit viewport scaling and system text enlargement.
- **Spacing/shape:** existing 4/8/12/16/24/36 scale and control/card/hero radii start the contract. Containers distinguish tasks; repeated people/venues use whitespace/separators. Elevation distinguishes sheets rather than decorating every item.
- **Forms:** name/place first; visible optional schedule/notes/limits; coordinates remain a labeled alternative. Adjacent errors, labeled units and a consistent sheet footer action. Validation preserves input.
- **Planning:** identity/status → readiness/next action → places/comparisons → roster/support. One strongest action per task region. Voting stays distinct from confirmation, with active local voter and shared organizer authority visible.
- **Comparison:** align person, one-way minutes and pesos; provenance stays beside figures. Explain active ranking and missing data. Straight-line distance is not travel time; rail fare is not the total trip fare.
- **Maps:** preserve map-first entry, initially closed list, numbered plum pins, coral origins and checked confirmed destination. Clear details/back, equivalent list selection and unobstructed attribution. No drag-only essential action.
- **Icons/motion:** existing Feather system; words for decisions/prices/permissions. Kits stays in welcome, empty and memory contexts. Immediate control feedback; optional reduced-motion-aware celebration; no elaborate animation framework.
- **Accessibility targets:** minimum 44-point controls, aim for 48 on Android; normal text contrast at least 4.5:1, large text/essential control boundaries at least 3:1. Verify focus, non-color cues, labels, error associations and announcements.

`DESIGN_SYSTEM.md` now documents the implemented Phase 1 tokens and shared component contracts. Screen composition changes remain in their later phases.

## Implementation roadmap

Every unit requires a scoped diff, applicable type/domain checks, affected-flow verification, updated handoff, and a stop. Native/shared checks that cannot run remain explicit open acceptance items; source inspection alone does not validate an implementation phase.

| Unit / status | Scope and affected areas | Completion criteria | Dependency |
|---|---|---|---|
| **0 — Complete** | Requirements, architecture/journeys, audit, direction, roadmap/handoff/ledger | Documents saved; implemented/absent features mapped; dependencies and criteria defined; baseline/limits recorded; no UI files changed | `423481e` |
| **1 — Implemented; acceptance partial** | Semantic colors, type/spacing/shape/surface/elevation; `theme.ts`, `ui.tsx`, form controls, shared dialog/status styling, focus CSS, design docs | Implementation, contrast, browser controls/flows, types, 13 tests and web/Android/iOS exports pass. Native device/accessibility/keyboard/safe-area checks remain open; user confirms no native environment. No screen redesign | Authorized, 0 |
| **2 — Implemented; acceptance partial** | Shell/home, shared list presentation, headers/navigation; app entry/layout, `home.tsx`, SharedList | Guest/account, active/past, local/shared entry, create/join/account/back work; loading/error states; responsive hierarchy; storage keys/map entry preserved | 1 |
| **3A — Implemented; native acceptance open** | Meetup creation/edit, draft/planning/shared creation, schedule; `meetup-editor.tsx`, schedule variants | Clear optional/required fields; validation, async failure/retry, duplicate-submit guard, paired date/time and schedule persistence preserved | 2 |
| **3B — Implemented; native acceptance open** | Participant editor, roster readiness, invitations, origin disclosure; `editor.tsx`, roster views, InviteFriend | Empty/partial/ready rosters; local add/edit and shared own-origin save; invitation expiry/replacement/copy; limits/invalidation preserved. Use incumbent place input until 4A | 3A in original sequence; user authorized independent 3B on `37dd526` |
| **3C — Implemented; native acceptance open** | Planner organization/navigation, vote/shortlist/confirmation; meetup screens, `plan-navigation.tsx`, `venue-decision.tsx`, ballot presentation | Local voter/shared ownership clear; supported vote/change/withdraw; confirmation and limit blockers; draft/planning/decided transitions; map/trip entry intact. Detailed metrics/estimate editor stay with 4B | 3B |
| **4A — Implemented; verification in progress** | Search/input, maps, venue list/sheet, confirmed map, pins and attribution | Search/keyboard selection, ambiguous/no result, coordinates, location denial, map failure; list/pin equivalence; details/home/back and confirmed directions; narrow-screen attribution; no provider changes | 3C |
| **4B — Not started** | Rankings, individual trips/estimates, ride comparison/LRT; venue summary, trip modules, ranking/shared estimate views | Four local ranking modes unchanged; clear sources/units/unknowns; missing/over-limit and demo/manual cases; provider timestamps/clearing; local/shared estimates and directions verified | 4A |
| **5A — Not started** | Account/email code, join dialog, contextual onboarding | Unconfigured auth, validation, sending, resend cooldown, bad/expired code, join failure/retry, sign-out return; accurate local/shared scope; no new profile/settings/notifications | 4B |
| **5B — Not started** | Decided summary/lifecycle, local/shared completion, recaps, ratings/archive | Audience/publication/withdrawal/deletion correct; optional ratings/archive restrictions; empty/success/failure states; no old styling on completed surfaces | 5A |
| **6 — Not started** | Cross-app consistency/accessibility/responsive QA, obsolete-style cleanup, final docs | Journey/state checks closed or explicitly blocking acceptance; types/tests/web export pass; native/shared acceptance verified; docs match code; no unrelated logic/features | All above |

Historical 3A/3B/3C, 4A/4B and 5A/5B are separate boundaries. User explicitly authorized sequential 4.5B/C/D with a commit at each boundary; this supersedes the earlier one-unit limit for this request only. Phase 3 is complete only after all its subphases. If another unit proves too large, record a smaller boundary before implementation and finish only that increment.

## Dependency and verification strategy

Foundation → shell/home → creation → roster → planning/decisions → locations → comparisons → account/join → memories → final QA. Shared primitives affect every screen; inspect representative home/form/comparison usage when changing them. Share presentation without merging permissions/persistence.

- Before a unit: read ledger/handoff/relevant plan section/instructions; inspect status and relevant changes only. Record intended edits before substantial work; preserve unrelated user changes.
- After meaningful increments: targeted validation and checkpoint files/completed/remaining/limits. Use scoped commits if permitted; otherwise name the uncommitted checkpoint and baseline. Never stage unrelated work or reset it.
- After TypeScript edits: `npx tsc --noEmit` and `npm test`. No lint command is configured; do not claim lint passed. No dependency needed just for Phase 0 documentation.
- Visual pass: narrow phones (320/390), tablet, wide web (~1280), and actual user viewport if known. Test native changes on both OSes. Inspect existing 600/860/940 thresholds on either side; they serve different layout purposes. Batch fixes and confirm once instead of repeated aesthetic exploration.
- State fixtures: empty, four-friend demo, eight-person group, 160-character meetup name/long place names/notes, missing/approximate origins, no venues, missing time/fare, exceeded limits, busy/error/retry, location denial, failed tiles, guest/organizer/member and all lifecycle states.
- Accessibility: enlarged text, focus traversal/return from sheets, keyboard search/list/map, screen-reader labels and announcements, touch sizes, safe areas, software keyboard, reduced motion.
- Shared integration: authorized local/test Supabase and two sessions for organizer/member acceptance. Do not provision services or send messages to others without authorization. Existing SQL regression script applies if shared behavior changes, not automatically for style-only work.
- Web export once for meaningful shell/platform changes and final QA; avoid per-tweak builds. Native checks are additional evidence, not implied by web export.

## Phase 0 verification and open evidence

Historical baseline below. Phase 1 supersedes the runtime blockers: Node 24 dependencies are installed; types, 13 tests and all three platform exports pass. Targeted browser controls/flows and 14 contrast pairs passed before the laptop shutdown; temporary captures were lost, but their recorded outcomes survived in the handoff. Native runtime checks remain unavailable. A build/typecheck overlap briefly caused a missing generated `dist` file; rerunning types after web export passed. Run these sequentially in future. See the handoff for the exact current checkpoint.

- Initial tree clean at `423481e`. Requirements/architecture/journeys inspected. No audited app/src/scripts code file exceeded 250 lines.
- `npm test` could not start: Node v20.20.2 rejects `--experimental-strip-types`. Thirteen domain tests are defined; none executed here.
- `npm run typecheck` could not start: `tsc` absent, no `node_modules`. npm 12.2.2 warns about Node 20 compatibility; README requires Node 24.
- No lint script. Web/native builds and rendered/accessibility tests not run. No screenshot/golden fixtures found in the repository inventory; no browser tool available in this session.
- Hosted Supabase configuration, native/test-backend access and earlier external requirements remain UNCONFIRMED. Do not log secrets or assume access.
- Phase 0 is complete as analysis/documentation. Before Phase 1 implementation: prepare documented Node 24/dependencies, establish baseline tests/types and inspect representative rendered UI. Separate baseline failures from redesign regressions.

### Phase 2 checkpoint — 2026-11-25
Explicitly authorized after Phase 1. Implemented paper shell, compact full-width welcome, consistent local/shared summaries, retained Active/Past selection, loading/empty/error states and storage/shared-refresh retries. Existing tokens/controls, storage keys, map-first entry and service/domain contracts preserved. Types, 13 tests and web/Android/iOS exports pass. Browser navigation, narrow/wide presentation and failure recovery pass; shared presentation uses illustrative fixtures. Independent review: ship at the scoped web checkpoint. Native runtime and live authenticated acceptance remain open. See `REDESIGN_HANDOFF.md` for receipts and exact Git checkpoint. STOP before separately authorized 3A.


### Phase 3B checkpoint — 2026-11-26

The user chose the pushed baseline for Phase 3B. This branch adds the participant, roster and invitation changes independently of 3A. Continue to track 3A separately. See the current handoff for browser, backend and native evidence. The scope ends at 3B.


### Phase 3A checkpoint — 2026-11-26

Authorized after 3B and implemented on top of `e84307e`. The editor clarifies local/shared participation, protects creation retries and keeps date/time handling consistent across creation, editing and display. Existing local schedules and shared RPC contracts are preserved. See the current handoff for cross-time-zone, browser and integration receipts.
