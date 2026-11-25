# Barkits redesign plan

Updated: 2026-11-25 · **Phase 0 complete. Phase 1 implemented; acceptance partial pending native-device checks. Phases 2–6 not started.**

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
| **2 — Not started** | Shell/home, shared list presentation, headers/navigation; app entry/layout, `home.tsx`, SharedList | Guest/account, active/past, local/shared entry, create/join/account/back work; loading/error states; responsive hierarchy; storage keys/map entry preserved | 1 |
| **3A — Not started** | Meetup creation/edit, draft/planning/shared creation, schedule; `meetup-editor.tsx`, schedule variants | Clear optional/required fields; validation, async failure/retry, duplicate-submit guard, paired date/time and schedule persistence preserved | 2 |
| **3B — Not started** | Participant editor, roster readiness, invitations, origin disclosure; `editor.tsx`, roster views, InviteFriend | Empty/partial/ready rosters; local add/edit and shared own-origin save; invitation expiry/replacement/copy; limits/invalidation preserved. Use incumbent place input until 4A | 3A |
| **3C — Not started** | Planner organization/navigation, vote/shortlist/confirmation; meetup screens, `plan-navigation.tsx`, `venue-decision.tsx`, ballot presentation | Local voter/shared ownership clear; supported vote/change/withdraw; confirmation and limit blockers; draft/planning/decided transitions; map/trip entry intact. Detailed metrics/estimate editor stay with 4B | 3B |
| **4A — Not started** | Search/input, maps, venue list/sheet, confirmed map, pins and attribution | Search/keyboard selection, ambiguous/no result, coordinates, location denial, map failure; list/pin equivalence; details/home/back and confirmed directions; narrow-screen attribution; no provider changes | 3C |
| **4B — Not started** | Rankings, individual trips/estimates, ride comparison/LRT; venue summary, trip modules, ranking/shared estimate views | Four local ranking modes unchanged; clear sources/units/unknowns; missing/over-limit and demo/manual cases; provider timestamps/clearing; local/shared estimates and directions verified | 4A |
| **5A — Not started** | Account/email code, join dialog, contextual onboarding | Unconfigured auth, validation, sending, resend cooldown, bad/expired code, join failure/retry, sign-out return; accurate local/shared scope; no new profile/settings/notifications | 4B |
| **5B — Not started** | Decided summary/lifecycle, local/shared completion, recaps, ratings/archive | Audience/publication/withdrawal/deletion correct; optional ratings/archive restrictions; empty/success/failure states; no old styling on completed surfaces | 5A |
| **6 — Not started** | Cross-app consistency/accessibility/responsive QA, obsolete-style cleanup, final docs | Journey/state checks closed or explicitly blocking acceptance; types/tests/web export pass; native/shared acceptance verified; docs match code; no unrelated logic/features | All above |

3A/3B/3C, 4A/4B and 5A/5B are **separate authorization boundaries**. Phase 3 is complete only after all its subphases. If another unit proves too large, record a smaller boundary before implementation and finish only that increment.

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
