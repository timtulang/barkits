# Barkits product and integration notes

## Phase 1 workflow

Start with four example participants from Caloocan, Quezon City, Makati and Pasig. Create additional meetups and add friends with a starting city, transportation mode, optional fare limit and optional maximum trip duration. Pick a ranking, inspect each person's mocked trip, vote, and explicitly choose a venue. Complete the meetup to save an optional recap and individual ratings. Archived meetups retain their recap and rating summary.

The Expo prototype uses device storage, with simulated participant identities. Invitations, group synchronization, location permissions, exact origin search, map pins, media and live provider data require later work. Keep personal addresses out of the prototype.

## How ranking works

Exclude any candidate exceeding a participant's time or budget. A missing fare cannot satisfy a budget cap. Fastest minimizes total minutes. Fairest minimizes the longest-to-shortest trip gap. Cheapest minimizes combined fare among candidates with complete fares. Balanced weights average time at 50%, time disparity at 30%, and average fare at 20%. Time uses a 60-minute reference and fare uses ₱100 with a normalized ceiling of 1. Balanced uses a conservative penalty for missing fares. Venue IDs break ties deterministically. Fixture trips do not include traffic, verified transit schedules, transfers or official provider quotes.

## Mapping and routing

The prototype makes zero automated map or routing requests. It includes a user-initiated handoff to the OpenStreetMap venue map. OpenStreetMap data under ODbL can support a future maintained venue catalog. A deployment must comply with attribution and the chosen tile provider's usage policy. OSRM or Valhalla deployment still needs compute, storage and current data. Public demo servers are unsuitable for a production dependency. No validated Metro Manila journey planner or GTFS source is wired. Grab, Angkas, JoyRide and Move It pricing stays unavailable until authorized, zero-cost access is verified. Participants can enter a known motorcycle-taxi fare per venue. Barkits labels these values as user-entered and includes them in budget checks.

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
