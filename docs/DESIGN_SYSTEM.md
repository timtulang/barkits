# Barkits design system

Barkits is the working brand pending name and trademark clearance. The product should feel like a welcoming Filipino social app. Clucky informed the use of an expressive character, a recognizable silhouette, and restrained moments of delight. Barkits uses original artwork and a distinct visual identity.

## Kits

Kits is an original, waving coral location pin with a cream face, deep-ink outlines, and plum shoes. The source artwork is `assets/kits.png`. Use Kits to welcome people, soften an empty state, celebrate a completed meetup, or introduce a recap. Keep the mascot out of trip comparisons, voting, permission prompts, and confirmations. Place accompanying instructions in live text and treat decorative art as inaccessible to screen readers.

## Tokens

`src/theme.ts` defines the shared palette, semantic colors, type weights, spacing, radii, control dimensions and sheet elevation. The original palette remains available for existing screens; new shared controls use semantic `colors` roles. Update the tokens and artwork together when rebranding.

| Token | Value | Use |
|---|---|---|
| Cream | `#FFF9EF` | Page background |
| Paper | `#FFFDFA` | Header, cards and fields |
| Mango | `#FFDA62` | Welcome artwork and emphasis |
| Coral | `#F78F78` | Brand mark and friendly accents |
| Deep ink | `#291D32` | Headings, text and primary controls |
| Plum | `#4C285C` | Selected controls |
| Muted ink | `#62566C` | Supporting copy |
| Lavender and mint | `#F1E5FA`, `#DDF2E5` | Light background accents |

Nunito uses weights 600, 800 and 900 for body, controls and headings respectively. The core spacing scale is 4, 8, 12, 16, 24 and 36. Cards use a 20-point radius, buttons/fields use 12, hero surfaces use 28, and small choice chips use the pill radius. Shared controls have a 48-point minimum target. Panels use a quiet border; only modal sheets use the shared soft elevation (8-point downward offset, 24-point blur, 0.16 opacity; Android elevation 8).

`src/ui.tsx` is the stable public entrypoint. Implementation is split into `ui-text.tsx`, `ui-actions.tsx`, `ui-field.tsx`, `ui-feedback.tsx`, and `ui-styles.ts`. Choice fields and icon actions remain in `form-controls.tsx`. Product state and ranking logic remain outside this layer. This extends the existing React Native styling architecture without replacing NativeWind configuration.

### Semantic color roles

| Role | Foreground / surface | Purpose |
|---|---|---|
| Canvas / surface / input | `#FFF9EF` / `#FFFDFA` / `#FFFFFF` | Page, grouped task, editable control |
| Text / supporting text | `#291D32` / `#62566C` | Main content and explanations |
| Control outline / divider | `#8D8194` / `#EAE1D7` | Visible control boundaries versus decorative separators |
| Primary | White on `#291D32` | Main action; hover `#3C2B47`, pressed `#4C285C` |
| Selection / information | `#4C285C` on `#F1E5FA` | Selected option or informational feedback |
| Error / danger | `#A12C38` on `#FCECEE` | Validation/failure; danger button reverses to white on red |
| Success | `#245D3D` on `#DDF2E5` | Confirmed successful action |
| Warning | `#745014` on `#FFF0B9` | Missing prerequisite or caution |
| Disabled | `#746A7B` on `#EEE8E1` | Unavailable controls; not opacity on live content |
| Focus | `#4C285C` with cream separation | Web keyboard outline; focused native field border |

Selected states include a check mark; errors include an icon and live text. Status marks retain their named icon and label. Unknown meetup statuses throw rather than silently appearing as planning. Fourteen enabled text/control contrast pairs were checked in Phase 1: text pairs exceed 4.5:1 and control boundaries exceed 3:1. This is token verification, not whole-app accessibility certification.

`global.css` mirrors the theme's focus, canvas, ink, muted and mango colors for browser focus, selection, caret and scrollbars. Keep these five variables synchronized with `theme.ts`; this is the existing web CSS boundary, not a second theme.

### Shared component contracts

- `Button`: existing `secondary`/`quiet` props remain supported. New `variant` selects primary, secondary, quiet or danger and takes precedence over those legacy flags. `busy` disables interaction and exposes busy state; optional `busyLabel` supplies action-specific progress text. Keep async guards in the calling workflow. Labels wrap beside icons.
- `Chip`: selected controls show a check mark, native selection state and web `aria-pressed`; disabled controls cannot activate. Omitting `onPress` creates a static badge rather than an interactive control.
- `Field`: `error` renders red text/icon, a web invalid state and an associated description; native exposes the error as an accessibility hint. Optional `hint` appears when there is no error. `disabled` makes the input noneditable and exposes its state. Inputs preserve their values on validation failure.
- `ChoiceField`: web uses the native select; native uses the existing expandable labeled choice list. Both support disabled state. `IconAction` has a 48-point target, accessible label and web title, focus, hover and pressed feedback.
- `Feedback`: info/success/warning/error tone, optional title and action; use actionable error copy. `LoadingState` requires a descriptive label. `EmptyState` requires a title and explanatory content, with an optional next action. Adopt these in each later screen phase rather than rewriting all screens during Phase 1.
- `Panel` stays a simple task surface. `EditorDialog` retains keyboard avoidance, safe-area padding, compact/wide layouts and busy dismissal guards; it now uses shared surface/elevation and section typography.
- `MeetupListItem` gives local and shared plans the same summary hierarchy: named status with icon, meetup name, date, available context and an opening arrow. Show the demo label and chosen venue when supplied. Use a paper surface, quiet border, card radius and shared hover/pressed colors; let names wrap. Keep the accessible opening label and summary hint.

Example for later screen adoption:

```tsx
<Button busy={saving} busyLabel="Saving trip…" onPress={saveTrip}>Save trip</Button>
<Feedback tone="error" action={<Button secondary onPress={retry}>Try again</Button>}>
  Couldn’t load this meetup. Check your connection and try again.
</Feedback>
```

Use explicit ARIA state props where needed on web: the installed React Native Web version does not translate all `accessibilityState` entries. Keep native state props too. Keyboard focus uses a three-pixel outline with light separation so it remains visible on dark surfaces.

## Text hierarchy

Use the role scale in `src/theme.ts` with the shared Label. Page titles are 36 points, major sections 28 and venue or item titles 22. Body and numeric values are 16. Field labels and supporting details are 14; captions are 13. Line height is 1.2 for title weight and 1.45 for other text, rounded up. Native font scaling remains enabled. Nunito’s heaviest weight leads the page, bold identifies a name or value, and muted ink carries location, provenance and context. Keep a venue name close to its location. Align people and distance values across a row and state a shared approximation once. Travel rankings group total minutes, time gap and cost under their own labels. Allow long names to wrap and let figures reflow before they collide.

## Voice and access

- Write short English labels for actions and navigation. Use natural Filipino-English in welcome copy, empty states, and recap prompts. “Kita-kits, barkada!” works as a greeting. “Finalize location” names the action clearly.
- Use sentence case and show minutes and Philippine pesos beside their values. Use “Fare unavailable” when a fare is missing. Keep demo labels visible near route data.
- Keep interactive targets at least 44 points high, show selection through text or shape as well as color, and preserve visible keyboard focus.
- Keep essential information in text. Use brief, optional motion in celebratory moments and respect reduced motion. Kits makes one brief hop upon meetup completion when reduced motion is off. Controls respond immediately.

## Responsive application layout

Barkits uses a paper header with the coral brand mark, a home action and account access. The shell is centered at a maximum width of 1112 px with 16-point horizontal padding. A compact, full-width mango welcome panel with Kits and Plan a meetup sits above the plans at every width. At 860 px and above, On this device and With friends use equal columns when shared access is available; below that they stack. Keep their storage-scope explanations visible. The header hides its tagline and shortens New meetup to New on compact screens while retaining the full accessible action name.

Active plans and Past meetups filter both lists, and the selection remains when returning home from a meetup. Completed and archived plans appear under Past meetups. Use labeled loading states for account, local and shared plans, contextual empty states, and actionable load/save/refresh errors with Try again. A failed shared refresh keeps previously loaded plans visible and identifies them as such.

Planning and memories use a primary work area with a narrower roster, invitations or rating column at 940 px and above. On phones the panels stack. On phones, an empty roster leads to Add friend. Once an on-device plan has participants, venue suggestions come first. Nearby places, Travel rankings and Trip details appear as labeled sections. Use a pencil for editing a named item, a circular arrow for refresh, and an × for closing a sheet. Give each icon-only action a descriptive accessible name, a 44-point target and a hover title on web. Keep decisions, prices and permission requests in words. Editors use a bottom-aligned sheet on phones and a centered panel on wider screens. Recap publishing and withdrawal name the audience explicitly. Keep private origins off the memories screen.

## Forms

Lead with the meetup or person’s name and the place search. Show the optional schedule, notes and travel limits directly in the form. Present raw coordinates as a labeled alternative to place search. Use a labeled selector for a single choice such as transportation mode. Keep the close icon in the sheet header and the main creation or save action in the footer. Show units in the label, keep examples in placeholders and put validation next to the field where possible. Schedules use a date picker and a time picker labeled for the Philippines. Before a shared trip is saved, say who can see the starting point.

## Participant roster and invitations

Use the same “Your barkada” roster for local and shared plans. Put the mapped count immediately below the heading and the available setup action above the list. Count the places the discovery resolver can actually map. A free-text address may need a map pin. A recognized locality counts toward readiness and carries the “Approximate area center” label. A shared member without an origin has a pending starting point. A mapped roster can still have no matching venues.

Lead each row with the person’s name. Place ownership (“You”, “Organizer”) next to the identity, then show the origin, location caveat, transport, and any one-way limits. A zero-peso limit is meaningful. The on-device roster can offer a named edit action per person. Shared plans have one personal starting-point action. Kits appears in the empty roster.

In the participant sheet, show shared visibility before location entry. Leave the optional fare and time fields visible with units; use two columns only when both fit. Keep the save action visible as the sheet scrolls. Explain the loss of entered estimates when a changed origin or mode would invalidate them.

Only organizers see the invitation panel. Explain the one-person, 24-hour and replacement rules before issuing a code. Once issued, give the selectable code and Copy code more prominence than Replace code. Announce the clipboard result and provide a manual copy path when needed. The server determines redemption and expiry; the client stops displaying a code after its local sharing window.

## Suggested place pins

Open ready planning meetups on an edge-to-edge map. Float the meetup name and navigation above it and keep the place list in a collapsible tray below the map attribution. Start with the list closed. Use plum pointers numbered in the same order as the venue list. Keep the number upright, give the pointer a contrasting light edge over map imagery, and provide a 44-point keyboard- and touch-accessible target. Tap a pin or list row to open the venue details in the same sheet. On a decided meetup, show one checked pin and pair the venue name with Get directions in the bottom bar. Keep coral dots for friends’ starting points on the group map.

## Trip comparisons

Keep the route, one-way fare and travel time together. Use the mint panel for a possible train connection. Name the boarding and exit stations, direction, rail-only amount and distance to each station. Put the operator and effective date beside the fare lookup. Use a provider name and save time for a ride price entered by a rider. Keep Kits in the welcome and memory screens so travel decisions have room for names, numbers and controls.

## Asset licensing

Nunito is distributed under the SIL Open Font License 1.1. Feather icons use the MIT license. Kits is original artwork generated for Barkits. Font and icon notices are stored in `assets/licenses/`.
