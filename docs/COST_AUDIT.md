# Cost audit

The Phase 1 prototype expects ₱0 in software and service charges using an existing development machine and network. It does not provision hosting or attach a billing account.

| Technology | Purpose | Free conditions | Usage limits | Risks |
|---|---|---|---|---|
| Expo, React Native, Expo Router, React Native Web, NativeWind and TypeScript | Local app development, build and types | Open-source packages installed from npm; no EAS service | Local compute and disk | Track lockfile, licenses and dependency advisories |
| AsyncStorage | Device-local sessions | MIT library, no backend | Available device/browser storage | Single device, no account sync |
| Nunito and Feather | Display type and icons | OFL 1.1 and MIT respectively | Bundled locally; retain notices | Font files add to bundle size |
| Local fixtures and Node test runner | Ranking, testing and demo data | Run on existing hardware | Four origins by three venues in the demo; 6–24 local combinations for 2–8 friends | Demonstration coverage only |
| Leaflet and OpenStreetMap | Interactive pin selection and group map | Leaflet BSD-2-Clause. Standard OSM tiles allow policy-compliant interactive viewing with visible attribution and normal HTTP caching | Only load a map when opened. No prefetch or bulk downloads. No published numeric quota or SLA | Community tile service can restrict access. Review usage before scaling. [Tile policy](https://operations.osmfoundation.org/policies/tiles/) |
| HOT Philippine OpenStreetMap POI export | Offline discovery of named meeting venues and bus-terminal proximity | ODbL 1.0 derivative, attribution and downloadable source data included | Zero lookup requests. Coverage reflects the source snapshot. | Openings, closures and travel access need confirmation. [HOT dataset](https://data.humdata.org/dataset/hotosm_phl_points_of_interest) |
| GeoNames | Offline Philippine locality search | CC BY 4.0 dataset with attribution and bundled license | Bundled subset; zero runtime requests | Locality centers are approximate. Arbitrary names and coordinates are accepted worldwide. [Data source](https://www.geonames.org/export/) |
| Expo Location and React Native WebView | Foreground device location and native map display | MIT software, browser geolocation on web, no paid APIs or account | Location requested on user action; browser requires HTTPS or localhost | Permission, device accuracy and network availability vary |
| PostgreSQL / Supabase schema | Future persistence and member access | SQL can run on existing local infrastructure; app has no hosted dependency | No hosted quota assumed | Confirm hosting terms and quotas before adoption |
| Playwright Core, Chromium and PGlite | Local verification | Open-source local tooling, no cloud test service | Local compute only | Local verification does not certify hosted Supabase or native device behavior |

Distribution fees and store enrollment are outside development scope. No store membership, paid enrollment, billing, or release submission was initiated.
