# Google Cloud setup and troubleshooting

## Status

The Google Maps Platform page has an open reload-loop report. The cause and project settings are unverified. Phase 0 only inspected source and public documentation. Live Google sign-in, Maps and Calendar tests require a configured development project with restricted credentials and suitable test accounts.

## Isolate the reload loop

1. Open the API Library and Google Auth Platform directly with the intended project selected. Compare with the project dashboard to see whether the failure is limited to Maps. Record the time, project, affected URL and any request or tracking ID. [API Library](https://console.cloud.google.com/apis/library), [Google Auth Platform](https://console.cloud.google.com/auth/overview)
2. Try a clean profile in a supported browser with one signed-in Google account and extensions disabled. Check browser cookie restrictions and console site data. If the clean profile works, test settings one at a time. In developer tools, check whether repeated redirects end at sign-in, permissions or billing. Keep cookies, tokens and authorization headers out of diagnostic notes. [Console troubleshooting](https://docs.cloud.google.com/support/docs/troubleshoot-console-page-loading)
3. If the error persists, compare another supported browser or network. Ask the project administrator to check project visibility, Service Usage and API Keys permissions, organization policies and project billing status. Check the incident dashboards against the observed time. [Cloud status](https://status.cloud.google.com/), [Maps status](https://status.cloud.google.com/maps-platform/), [Billing](https://console.cloud.google.com/billing)
4. Use the CLI to isolate project/API access from the browser issue. Escalate a repeatable failure to Google Cloud support with the timestamp, tracking ID and redacted error details. CLI commands still require privileges and applicable billing. [Console troubleshooting](https://docs.cloud.google.com/support/docs/troubleshoot-console-page-loading)

## Configure development first

1. Select or create an approved development project. Use a distinct production project and credentials. Check the Maps billing relationship and free usage exposure before enabling metered APIs. Development and production can share exposure when the billing account aggregates usage. Enable only the APIs needed by the phase being tested. [Project selector](https://console.cloud.google.com/projectselector2/home/dashboard), [Billing](https://console.cloud.google.com/billing), [Maps setup](https://developers.google.com/maps/get-started)
2. In Google Auth Platform, configure Branding, Audience, Data Access and Clients. Set a support contact and the required app, privacy policy and domain details. For an external test project, add named test accounts. Barkits requests `openid` and `profile` for sign-in. Add Calendar scopes for a separate consent flow when Phase 11 reaches live testing. Before production, publish the app and complete domain, branding and scope verification where required. Test Calendar refresh expiry in Testing status. [Auth Platform](https://console.cloud.google.com/auth/overview), [OAuth verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance), [Calendar scopes](https://developers.google.com/workspace/calendar/api/auth)

| Credential | Configuration |
| --- | --- |
| Barkits sign-in OAuth client | Create a Web application client for the server-side flow. Register the exact preview or production callback, such as `https://dev.barkits.example/api/auth/google/callback`. Web and native both use that HTTPS callback. Keep its secret server-side. |
| Calendar authorization OAuth client | Use a Web application client for the backend code exchange. Register the exact backend callback for each environment, for example `https://dev.barkits.example/api/calendar/callback`. Return to the app after backend authorization through an allowlisted link. |
| Web Maps key | Restrict to exact authorized referrers and Maps JavaScript API. Use a separate localhost-restricted key for development if needed. |
| Android Maps key | Restrict to package/signing SHA-1 pairs and Maps SDK for Android. |
| iOS Maps key | Restrict to the bundle ID and Maps SDK for iOS. |
| Server Maps credential | Restrict to allowed Places API (New), Routes API and Geocoding API only if needed. Use separate keys if deployments or restrictions differ. For keys, apply allowed server IPs where possible. If the host has dynamic egress, verify supported service-to-service authorization or approved egress before enabling production traffic. |

Create OAuth clients and keys in the credentials screens. Confirm the app identifiers and the deployed callback URL before adding signed-device test accounts. OAuth client IDs and restricted SDK keys may be client configuration. Backend credentials, session secrets, database passwords, Calendar refresh tokens and encryption keys belong in backend secret storage. [OAuth clients](https://console.cloud.google.com/auth/clients), [API credentials](https://console.cloud.google.com/apis/credentials), [API key restrictions](https://developers.google.com/maps/api-security-best-practices)

## Applicable CLI commands

Use separate CLI configuration or explicit `--project` values. The following placeholders describe commands for a project administrator. Project creation and billing association are separate administrative operations. [CLI setup](https://docs.cloud.google.com/sdk/docs/initializing), [enable services](https://docs.cloud.google.com/sdk/gcloud/reference/services/enable)

```sh
PROJECT_ID=your-barkits-development-project
gcloud projects describe "$PROJECT_ID"
gcloud billing projects describe "$PROJECT_ID"
gcloud services list --enabled --project="$PROJECT_ID"

# enable only the product surfaces currently being tested
gcloud services enable maps-backend.googleapis.com maps-android-backend.googleapis.com \
  maps-ios-backend.googleapis.com places.googleapis.com --project="$PROJECT_ID"
gcloud services enable routes.googleapis.com --project="$PROJECT_ID"
gcloud services enable calendar-json.googleapis.com --project="$PROJECT_ID"

# example web key with an application restriction and an api restriction
gcloud services api-keys create --project="$PROJECT_ID" --display-name=barkits-dev-web \
  --allowed-referrers='https://dev.barkits.example/*' --api-target=service=maps-backend.googleapis.com
```

Enable `geocoding-backend.googleapis.com` only if a proven use case needs it. For other key types, use `--allowed-application` with package and SHA-1, `--allowed-bundle-ids`, or `--allowed-ips` with the appropriate API targets. Use Google Auth Platform for the consumer OAuth clients, branding, test users and publishing. Keep key values out of terminal transcripts and Git. [API key CLI reference](https://docs.cloud.google.com/sdk/gcloud/reference/services/api-keys/create)

## Before enabling live traffic

- Set conservative per-API or per-method quotas where offered. Configure billing alerts and compare usage by API, SKU, key and project. Confirm that shared backend caps and retry accounting enforce the application budget. Keep separate headroom for client map loads and other projects on the billing account. [Quotas](https://console.cloud.google.com/iam-admin/quotas), [Billing budgets](https://console.cloud.google.com/billing/budgets), [Maps usage and cost](https://developers.google.com/maps/billing-and-pricing/manage-costs)
- Verify sign-in with the same test account on web, signed Android and signed iOS. Check audience validation and one Neon user record. Test each map key from its intended client and verify restrictions, attribution, error states and actual SKU reporting. Keep live Routes disabled until the backend passes the finalists-only tests.
- For Calendar, test separate consent, a confirmed meetup with the clients closed, duplicate prevention, rescheduling, cancellation, and revoked access. Test optional free/busy with its separate scope. Verify that scheduled retry works with the actual host and OAuth publishing status. [Calendar authorization](https://developers.google.com/workspace/calendar/api/auth)
