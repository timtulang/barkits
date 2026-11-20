# Barkits product and integration notes

## Phase 1 workflow

Start with four example participants from Caloocan, Quezon City, Makati and Pasig. Create a meetup with a name and optional activity, description, and target date and time. Save it as a draft to revisit on this device, or start planning immediately. Drafts can hold participant starting points and budgets. Starting planning opens comparisons and voting. Add friends with any starting place, transportation mode, optional fare limit and optional maximum trip duration. Pick a ranking, inspect each person's mocked trip, vote, and explicitly choose a venue. Complete the meetup to save an optional recap and individual ratings. Archived meetups retain their recap and rating summary.

The Expo prototype uses device storage, with simulated participant identities. Invitations, group synchronization, street address geocoding, media and live provider data require later work. Keep personal addresses out of the prototype.

## Automatic place discovery

Planning opens on Nearby places. Barkits searches a bundled Philippine venue catalog for places within 50 km straight-line distance of every participant. Pins take priority, and unambiguous locality names resolve to labeled approximate city centers. Ambiguous or unknown input prompts for a pin. The activity selects the initial category, which the group can change.

The score in kilometers is 60% longest individual distance plus 40% mean distance. Venues within 800 m of a mapped bus terminal receive a 0.5 km preference scaled by the share of public transport riders. Terminal proximity describes the destination area only. The group sees up to three named places with individual distances. Price, traffic, journey time, connectivity and opening hours require separate evidence. Groups with travel limits can add a place to travel comparisons to check those limits before finalizing it.

## How travel ranking works

Exclude any candidate exceeding a participant's time or budget. A missing fare cannot satisfy a budget cap. Fastest minimizes total minutes. Fairest minimizes the longest-to-shortest trip gap. Cheapest minimizes combined fare among candidates with complete fares. Balanced weights average time at 50%, time disparity at 30%, and average fare at 20%. Time uses a 60-minute reference and fare uses ₱100 with a normalized ceiling of 1. Balanced uses a conservative penalty for missing fares. Venue IDs break ties deterministically. Fixture trips do not include traffic, verified transit schedules, transfers or official provider quotes.

## Mapping and routing

Participants can type a label anywhere, enter coordinates, select a Philippine locality center from a bundled GeoNames index, use foreground device location, or drop a map pin. Only explicit map actions load OpenStreetMap tiles. Pin coordinates and names stay in device storage; the tile host receives requests for the viewed area. The group map distinguishes origins and meeting places. Custom venue suggestions support voting and finalization. Enter trip minutes and optional fares per participant and venue for reproducible rankings outside demo coverage. Straight-line distance is calculated locally when both pins exist. A changed origin, pin, or mode clears that participant’s previously entered trip figures. OSRM or Valhalla deployment still needs compute, storage and current data. Public demo servers are unsuitable for a production dependency. No validated Metro Manila journey planner or GTFS source is wired. Grab, Angkas, JoyRide and Move It pricing stays unavailable until authorized, zero-cost access is verified. Participants can enter a known motorcycle-taxi fare per venue. Barkits labels these values as user-entered and includes them in budget checks.

## Data and permissions

The initial Supabase migration separates meetups, membership, invites, private origins, destination candidates, journey provenance, votes, recaps and ratings. Origins are available to members only. Recap records carry no origin fields, and group publication requires an explicit timestamp and a completed meetup. Ratings allow one optional 1–5 entry per participant. Only the author can write their own recap or rating. Member enrollment through invitation redemption and server-controlled lifecycle transitions need trusted application operations before hosted use.

## External tools

| Resource | Reviewed decision |
|---|---|
| moizibnyousaf/ai-agent-skills | MIT library supports Codex. Evaluated database design and verification skills. Applied database design to the initial schema. No whole-library install. |
| supabase/mcp | Apache 2.0. Hosted use requires an authorized development project and OAuth. Start project-scoped and read-only with database and docs features. No project is configured here. |
| appeeky/aso-skills | MIT Agent Skills compatible with Codex. Reserve local guidance for store metadata. Hosted capabilities and free plans remain unverified and unused. |
| truongduy2611/app-store-preflight-skills | MIT Agent Skill. Reserve for release privacy, permissions, moderation and metadata review. |
| rorkai/App-Store-Connect-CLI | MIT Go CLI. Reserve for release preparation. App Store Connect operations need applicable credentials, permissions and enrollment. |

All five upstream repositories were reachable over Git and had their documentation and licenses inspected. No hosted services or release accounts were provisioned.

## Original brief coverage

| Workflow | Available in the current branch | Remaining work |
|---|---|---|
| Meetup lifecycle | Create and edit a local draft, start planning, decide, complete and archive. | Persist transitions with authenticated ownership in the shared database. |
| Invitations and membership | One device can simulate multiple participants. A versioned schema defines membership and invitations. | Sign-in, secure invitation creation and redemption, and cross-device synchronization. |
| Origins and destinations | Device location, manual input, offline locality search, map pins, custom venues and a group map. | Street-level geocoding and broader venue and transport coverage. |
| Travel and ranking | Four ranking modes, per-person limits, fixture trips, user-entered times and fares, and group voting. | Supported real routes and mode coverage, accessibility and transfer details, walking legs, arrival times, traffic availability and routing cache. |
| Completion and memories | Local completion, editable recap caption and optional ratings with a count and average. SQL policies have been exercised locally. | Authenticated group publication, consent controls and optional media storage. |
| Verification and release | Browser scenarios, local schema checks, zero-cost audit, and platform exports. | Multi-device acceptance tests, native-device verification and release preflight. |
