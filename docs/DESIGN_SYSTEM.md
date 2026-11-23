# Barkits design system

Barkits is the working brand pending name and trademark clearance. The product should feel like a welcoming Filipino social app. Clucky informed the use of an expressive character, a recognizable silhouette, and restrained moments of delight. Barkits uses original artwork and a distinct visual identity.

## Kits

Kits is an original, waving coral location pin with a cream face, deep-ink outlines, and plum shoes. The source artwork is `assets/kits.png`. Use Kits to welcome people, soften an empty state, celebrate a completed meetup, or introduce a recap. Keep the mascot out of trip comparisons, voting, permission prompts, and confirmations. Place accompanying instructions in live text and treat decorative art as inaccessible to screen readers.

## Tokens

`src/theme.ts` defines the shared palette, type weights, spacing, and radii. Update the tokens and artwork together when rebranding.

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

Nunito uses weights 600, 800 and 900 for body, controls and headings respectively. The core spacing scale is 4, 8, 12, 16, 24 and 36. Cards use a 20-point radius, and buttons and fields use 12. `src/ui.tsx` contains the shared labels, buttons, chips, fields, panels, and Feather icon wrapper. Product state and ranking logic live outside that layer.

## Voice and access

- Write short English labels for actions and navigation. Use natural Filipino-English in welcome copy, empty states, and recap prompts. “Kita-kits, barkada!” works as a greeting. “Finalize location” names the action clearly.
- Use sentence case and show minutes and Philippine pesos beside their values. Use “Fare unavailable” when a fare is missing. Keep demo labels visible near route data.
- Keep interactive targets at least 44 points high, show selection through text or shape as well as color, and preserve visible keyboard focus.
- Keep essential information in text. Use brief, optional motion in celebratory moments and respect reduced motion. Kits makes one brief hop upon meetup completion when reduced motion is off. Controls respond immediately.

## Responsive application layout

Barkits uses a deep-ink navigation bar and a mango welcome panel with Kits. The home view places active and past meetups beside the welcome panel on wide web screens and immediately below it on phones. Shared and on-device plans keep their own labels. Status marks combine text, color and an icon. A completed meetup returns through Past meetups.

Planning and memories use a primary work area with a narrower roster, invitations or rating column at 940 px and above. On phones the panels stack. Starting-point entry comes first when needed. Editors use a bottom-aligned sheet on phones and a centered panel on wider screens. Recap publishing and withdrawal name the audience explicitly. Keep private origins off the memories screen.

## Forms

Lead with the meetup or person’s name and the place search. Offer raw coordinates, fare limits, trip duration, schedule and notes as optional controls. Preserve their values when a section collapses. Show units in the label, keep examples in placeholders and put validation next to the field where possible. Schedules use a date picker and a time picker labeled for the Philippines. Before a shared trip is saved, say who can see the starting point.

## Trip comparisons

Keep the route, one-way fare and travel time together. Use the mint panel for a possible train connection. Name the boarding and exit stations, direction, rail-only amount and distance to each station. Put the operator and effective date beside the fare lookup. Use a provider name and save time for a ride price entered by a rider. Keep Kits in the welcome and memory screens so travel decisions have room for names, numbers and controls.

## Asset licensing

Nunito is distributed under the SIL Open Font License 1.1. Feather icons use the MIT license. Kits is original artwork generated for Barkits. Font and icon notices are stored in `assets/licenses/`.
