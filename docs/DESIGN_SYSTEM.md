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

## Forms

Lead with the meetup or person’s name and the place search. Offer raw coordinates, fare limits, trip duration, schedule and notes as optional controls. Preserve their values when a section collapses. Show units in the label, keep examples in placeholders and put validation next to the field where possible. Schedules use a date picker and a time picker labeled for the Philippines. Before a shared trip is saved, say who can see the starting point.

## Asset licensing

Nunito is distributed under the SIL Open Font License 1.1. Feather icons use the MIT license. Kits is original artwork generated for Barkits. Font and icon notices are stored in `assets/licenses/`.
