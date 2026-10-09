# V3.75 — Reality Check Engine (development)

## Goal
Move BUSY DOES IT beyond internal database labels toward genuine external evidence without inventing provider outcomes, probing arbitrary URLs or enabling unauthorised publication.

## Implemented
- **Read-only founder action:** `POST busy-founder-ops { "action":"verify_external" }`. It performs a fresh Supabase Auth lookup and checks the server-controlled founder `app_metadata.busy_platform_role` before running any elevated query. The request accepts *no* business IDs, hostnames, URLs, post IDs, customer data or other parameters. Other users receive founder access denial.
- **Website verification:** fetches at most four recently updated websites with an internal live deployment pointer. Probes **only a database-sourced one-label hostname under `*.busydoesit.co.uk`** by HTTPS HEAD, at a 4-second cap, with redirects disabled. Verifies HTTP 200, HTML content type and `X-BUSY-Website` and `X-BUSY-Deployment` response headers matching the authoritative database pointers. Classifies responding, unreachable, mismatch or unknown. Never sends a cookie/credential, reads the HTML body or performs an arbitrary fetch. The result is *endpoint/deployment-header verification*, **not** visual correctness, site functionality or broad public uptime. Custom domains remain unverified.
- **Social publishing receipt check:** reads at most twelve recent internal Published, Partial failure and Failed records and their existing Facebook, Instagram and Google Business provider-result objects. Requires a provider-style receipt identifier to classify **provider-accepted**; captures no raw provider body, IDs, caption, account info, media, token or other customer content in the returned response. Records failing/missing receipts separately. A receipt is **not** independent verification that a post is publicly visible; this sweep does not query external social feeds.
- **Business App deployment evidence:** reads at most eight apps with live version pointers, compares `current_live_version_id` and `public_web_version_id`, and checks `public_web_status`. Matching published versions are recorded as **deployment recorded**, not independently externally reachable. An App Store install or user-device session is not verified.
- **Founder UI:** a manual **Check external evidence now** button in Founder Operations, aggregate sample counters and explanations. UI discards stale requests after account changes.
- **Safety:** no new recurring external HTTP job, automatic repair, republish, token disclosure, commercial actions or push notifications. The sampling is on-demand to keep cost and founder access bounded.
- **Automated regression coverage:** `scripts/check-platform-autopilot-v375.mjs`, included in `.github/workflows/production-check.yml`, covers hostname validation, redirect refusal, bounded HEAD semantics, matching deployment headers, social acceptance-vs-visibility separation, app version mismatches, strictly founder-gated action and stale UI responses. Needs actual GitHub run confirmation before claiming green CI.
- **Version:** V3.75.0.

## Verified development state
- Backend `busy-founder-ops` deployed with JWT checking enabled (version 9).
- Production database has zero live BUSY-hosted websites and zero live Business Apps currently available for real external checks, so those categories are **not yet live-device/live-domain verified**.
- Three internally published social records have provider-result objects in the database; any claim of public feed visibility requires a separate authenticated provider readback.
- No database migration was necessary and no customer data or content was modified.

## Release gates
- Confirm full GitHub Actions regression suite passed, not merely committed.
- Run real founder account on-demand check and inspect sanitized response and UI.
- Test against at least one real customer-authorised live BUSY website and one deployed Business App, including a mismatched deployment and a healthy route.
- Add authenticated, rate-limited live provider readback for Meta/GBP only after reviewing provider scopes, tokens and publication APIs; do not use a saved publish response as proof of current public visibility.
- Validate regional hosts, Cloudflare custom domains, cache semantics and retry safeguards before enabling any unattended customer-impacting recovery.

## Files
- `supabase/functions/busy-founder-ops/externalReality.mjs`
- `supabase/functions/busy-founder-ops/index.ts`
- `src/app/AppController.js`
- `src/screens/founderOperations.js`
- `scripts/check-platform-autopilot-v375.mjs`
- `.github/workflows/production-check.yml`
