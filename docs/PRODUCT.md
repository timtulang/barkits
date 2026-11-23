# Barkits product and integration notes

## Phase 1 workflow

Start with four example participants from Caloocan, Quezon City, Makati and Pasig. Create a meetup with a name and optional activity, description, and target date and time. Save it as a draft to revisit on this device, or start planning immediately. Drafts can hold participant starting points and budgets. Starting planning opens comparisons and voting. Add friends with any starting place, transportation mode, optional fare limit and optional maximum trip duration. Pick a ranking, inspect each person's mocked trip, vote, and explicitly choose a venue. Complete the meetup to save an optional recap and individual ratings. Archived meetups retain their recap and rating summary.

The Expo prototype supports guest planning and optional verified email accounts. On-device meetups support a manually entered roster. Signed-in organizers can also create a shared meetup. Single-use codes enroll real accounts, each with its own starting point and travel preferences. Shared membership and origins reload when the group opens, returns to the foreground, or a member selects Refresh group. Members shortlist venues and cast one changeable vote each. The organizer confirms the destination. Shared completion and recaps, street address geocoding, media and live routing require later work. Keep personal addresses out of the prototype.

## Automatic place discovery

Planning opens on Nearby places. Barkits searches a bundled Philippine venue catalog for places within 50 km straight-line distance of every participant. Pins take priority. Unambiguous locality names resolve to labeled approximate city centers. Unique mapped venue names also resolve offline. Starting-place and destination forms search a shared offline Philippine directory. Queries can combine name, locality, category, street and barangay in any order. Rows include available address details and selecting a result sets its pin. Search also includes campuses, hospitals and bus and ferry terminals as manually selectable places. Ambiguous or unknown input prompts for a pin. The activity selects the initial category, which the group can change.

The score in kilometers is 60% longest individual distance plus 40% mean distance. Venues within 800 m of a mapped bus terminal receive a 0.5 km preference scaled by the share of public transport riders. Terminal proximity describes the destination area only. The group sees up to three named places with individual distances. Price, traffic, journey time, connectivity and opening hours require separate evidence. Groups with travel limits can add a place to travel comparisons to check those limits before finalizing it.

## How travel ranking works

Exclude any candidate exceeding a participant's time or budget. A missing fare cannot satisfy a budget cap. Fastest minimizes total minutes. Fairest minimizes the longest-to-shortest trip gap. Cheapest minimizes combined fare among candidates with complete fares. Balanced weights average time at 50%, time disparity at 30%, and average fare at 20%. Time uses a 60-minute reference and fare uses ₱100 with a normalized ceiling of 1. Balanced uses a conservative penalty for missing fares. Venue IDs break ties deterministically. Fixture trips do not include traffic, verified transit schedules, transfers or official provider quotes.

## Mapping and routing

Participants can type a label anywhere, enter coordinates, select a Philippine locality center from a bundled GeoNames index, use foreground device location, or drop a map pin. Opening a map requests tiles from OpenStreetMap or, on a web preview configured with a Google browser key, the Google Map Tiles API. Google supplies its roadmap and viewport credits. Search and ranking continue to use the bundled catalog. Selecting Open in Google Maps sends the venue coordinates to Google. On-device meetups keep pin coordinates and names in device storage. In a shared meetup, saving a starting point sends it to the group’s database. Opening a map sends the viewed area to the tile provider. The group map distinguishes origins and meeting places. Custom venue suggestions support voting and finalization. Enter trip minutes and optional fares per participant and venue for reproducible rankings outside demo coverage. Straight-line distance is calculated locally when both pins exist. A changed origin, pin, or mode clears that participant’s previously entered trip figures. OSRM or Valhalla deployment still needs compute, storage and current data. Public demo servers are unsuitable for a production dependency. No validated Metro Manila journey planner or GTFS source is wired. Grab, Angkas, JoyRide and Move It pricing stays unavailable until authorized, zero-cost access is verified. Participants can enter a known motorcycle-taxi fare per venue. Barkits labels these values as user-entered and includes them in budget checks.

## Data and permissions

Account sign-in uses Supabase email codes for both registration and returning participants. Supabase stores the auth session in browser storage on web. Native builds use Expo SecureStore. Signing out ends the session on this device. Guest meetups keep their original storage key, so existing drafts reappear when a participant returns to guest planning. Shared meetups are available to the same signed-in account across devices. Local drafts stay on their original device.

The initial Supabase migration separates meetups, membership, invites, private origins, destination candidates, journey provenance, votes, recaps and ratings. Origins are available to members only. Recap records carry no origin fields, and group publication requires an explicit timestamp and a completed meetup. Ratings allow one optional 1–5 entry per participant. Only the author can write their own recap or rating. Database functions create the shared meetup and organizer membership atomically, issue an organizer-only code, and enroll the redeeming account. The database stores only a digest of the code. It expires after 24 hours. Redemption locks the invitation and a retry by the same account returns its meetup.

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
| Meetup lifecycle | Create and edit a local draft, start planning, decide, complete and archive. | Shared planning and organizer-confirmed decisions are persisted. Shared completion and archiving remain. |
| Invitations and membership | Verified email sign-in, organizer ownership, expiring invitation codes, cross-device rosters, personal trip inputs and shared venue suggestions. Members can shortlist and vote, and organizers can finalize. | Shared completion and group recaps. |
| Origins and destinations | Device location, manual input, offline locality search, map pins, custom venues and a group map. | Street-level geocoding and broader venue and transport coverage. |
| Travel and ranking | Four ranking modes, per-person limits, fixture trips, user-entered times and fares, and group voting. | Supported real routes and mode coverage, accessibility and transfer details, walking legs, arrival times, traffic availability and routing cache. |
| Completion and memories | Local completion, editable recap caption and optional ratings with a count and average. SQL policies have been exercised locally. | Authenticated group publication, consent controls and optional media storage. |
| Verification and release | Browser scenarios, local schema checks, zero-cost audit, and platform exports. | Multi-device acceptance tests, native-device verification and release preflight. |


## Shared venue decisions

Each group stores its own shortlist. Changing a category or starting point can change the suggestions while preserving nominations and votes. Votes never select a winner automatically. Members can move or withdraw their vote while planning is open. Trip estimates belong to the member who entered them. A missing fare cannot satisfy a fare limit, and changing the trip origin or mode clears the member’s previous estimates. The database checks current membership, ownership, planning status and travel limits at confirmation. A decided meetup displays its final venue on every member’s device when refreshed or reopened.
