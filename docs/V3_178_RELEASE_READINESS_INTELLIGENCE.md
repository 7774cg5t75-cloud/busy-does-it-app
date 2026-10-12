# Busy Does It — V3.178 Release Readiness Intelligence

Development branch: `v3.178`, created from `v3.177`. **No live project deployment, schema application, customer submission, publishing or spending was undertaken in this sweep.**

## Verified staging observation from connected Supabase

Read-only inspection of connected project **Busy Does It Staging** (`pnjdlogwegnqbsfpcofw`, EU West London) confirmed `ACTIVE_HEALTHY` but returned **no matching application tables** among `busy_mini_apps`, `busy_website_deployments`, `busy_brain_owner_decisions`, `busy_website_brain_decisions`, or `busy_staging_qa_runs`. The Edge Function list was empty. This is a major staging-readiness blocker. The query was non-mutating. Security advisors reported no existing lint findings, which does NOT certify security or RLS for tables that do not exist.

**Do not mistake an empty staging instance for installed, security-verified or fully functioning backend services.**

## Workstream A — staging installation audit

`supabase/functions/busy-mini-apps/stagingInstallAudit.mjs` defines an authenticated, owner/admin-only, **read-only**, allowlisted audit for the five above tables.

- The existing Edge Function `busy-mini-apps/index.ts` exposes `staging_install_audit` behind membership-based owner/admin write permission and the server-owned `isolatedStagingGuard` from V3.176.
- The audit rechecks the currently authenticated business's actual Business App ID and draft revision, returning only a five-element list of availability statuses. Each query selects `id` with a limit of one; **no data values, customer content, tokens or row counts are returned**.
- A reachable table only proves the privileged Edge backend can query it. It does **NOT** prove RLS prevents a different authenticated tenant accessing data; `service_role` may bypass RLS. RLS must be tested independently using distinct test JWTs.
- The route is disabled by default on production: `BUSY_STAGING_MODE=isolated` and `BUSY_STAGING_PROJECT_REF` must match the actual Supabase project identity on the server. Client-supplied staging claims are ignored.

## Workstream B — ten mandatory launch gates

`src/core/releaseReadinessIntelligence.mjs` exposes a bounded, fail-closed readiness report for the exact business/app/revision:

1. Installed isolated staging backend
2. Owner's authenticated staging access
3. Cross-tenant RLS/authorisation proof
4. Real booking request and separately confirmed diary
5. Real enquiry and customer reply delivery
6. Website hosting/version rollback
7. Downloadable standalone distribution
8. Physical devices, screen sizes and accessibility
9. Billing, usage credits, privacy and consent
10. Explicit owner final release approval

A validated *staging-only schema audit* may mark backend installation **reported by the server**, but **all ten mandatory release gates stay unresolved** until independently audited evidence exists. A synthetic database round-trip from V3.177 is recorded only as a limited synthetic test. Locally supplied `verified:true` or other forged completion flags are ignored. The evaluator **never authorises publishing, payment, customer contact or release**.

## Workstream C — integration into existing private App Studio

- `src/app/AppController.js` adds `checkIsolatedAppInstallAudit`, verifying current business, app ID and revision on request and response, plus fixed server-origin report schema and allowed statuses.
- `src/screens/miniApps.js` adds a small **V3.178 • Launch-readiness checks** panel within the existing optional owner review. A button **Check staging installation (read only)** initiates the authenticated audit on demand; there is no automatic polling or data mutation.
- The panel reports the number of schema targets reachable, but explicitly warns that availability does not verify RLS, bookings, messages, app signing or physical-device quality.
- App Studio's existing privacy-safe owner preferences, staged synthetic read-back and separate publish/approval controls remain unchanged.

## Workstream D — regression and packaging

- `scripts/check-release-readiness-v3178.mjs`: 123 focused assertions passed using the real pure repo modules, in-memory mock Supabase responses, server-owned staging guard, and static integration checks. Covered stale revisions, wrong business, allowlisted schema-only access, no source row leaks, partial installs, duplicate/fake proof packages, missing tenant tests, and mandatory blockers.
- `.github/workflows/release-readiness-v3178.yml` runs the new tests and all inherited regression scripts from V3.177 downward, native/Edge syntax, Busy iOS/Android Expo exports and standalone iOS/Android exports.

The **123 assertions are focused, simulated development checks**, not proof that the full GitHub workflow, native builds, staging deployment, signed standalone apps, or real customers work. No actual full workflow success has been confirmed.

## Safe next steps before any release

1. Inventory staging versus production migration ordering and dependencies; check migration versions and required extensions. Do not automatically copy production customer data into staging.
2. With explicit separate owner authorisation for staging deployment, install the required migrations and authenticated Edge Functions in the existing **staging project only**. Avoid spending or project-creation actions without consent.
3. Run the new **staging installation audit**, inspect server logs and actual tables, then use two separate test business identities to verify real RLS/Edge authorisation and owner/admin versus read-only member roles.
4. Execute the existing V3.177 synthetic DB read-back only after the isolated environment is verified. Treat it only as staging database evidence.
5. Build separately authorised **real test customer** booking/enquiry/guest/standalone pathways; verify actual owner inbox, delivery, replies, cancellation, and genuine diary confirmation from authoritative server records.
6. Inspect actual GitHub Actions successes, four native Expo exports and physical iPhone/iPad/Android captures including Medium Display Zoom and accessibility.
7. Before release, audit GDPR/consent, clear ownership, billing/credits, App Store and Google Play distribution, rollback, monitoring and explicit owner approval.

## Proposed V3.179

Move from audit code to safely **verifiable staging backend readiness**, prioritising installation dependencies, real signed-in staging access and independent tenant denial checks. Coordinate website and app customer journeys with measured outcomes, keeping the front end simple and all owner-facing changes approval-gated.
