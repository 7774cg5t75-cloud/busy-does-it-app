# Busy Does It — V3.178 Release Readiness Intelligence

**Development branch:** `v3.178`, based on `v3.177`.

## What was actually delivered

### 1. Owner-authenticated isolated-staging installation audit

- `supabase/functions/busy-mini-apps/stagingInstallAudit.mjs` checks a FIXED allowlist of required staging backend tables using bounded, read-only service-side selects. It returns only identifiers and `reachable`/`unavailable` outcomes, never customer data or row counts.
- `busy-mini-apps/index.ts` exposes `staging_install_audit` only through the existing authenticated membership boundary and write-action owner/admin check, and ONLY after `isolatedStagingGuard` checks server-owned staging mode, project ref and URL. Caller-provided flags cannot enable production.
- The helper also requires the exact current private Business App ID and revision. If the app table isn't yet installed, the endpoint fails closed: initial installation must be reviewed administratively, not bootstrapped by an unauthorised client.
- This schema reachability check runs under service-role and is **not a real RLS tenant isolation test**. It does not examine table contents, grant permissions or live customer delivery.
- New AppController method `checkIsolatedAppInstallAudit` and an optional owner-facing **Check staging installation (read only)** control in App Studio allow safe later inspection once the staging backend is deployed.

### 2. Ten explicit pre-release blockers

- `src/core/releaseReadinessIntelligence.mjs` introduces a ten-gate review spanning staging install, owner access, cross-business privacy, actual booking/diary, enquiry/reply delivery, website hosting/rollback, independent standalone distribution, physical devices and assistive technology, consent/billing/privacy, and final owner approval.
- The review reports what an authenticated staging server *says* about installed schema separately from what has independently been proven. A synthetic database write/read cannot become a real customer booking or conversion result.
- A caller-provided or forged set of `verified:true` evidence entries is ignored. **No combination of self-attested metadata ever permits release**: unresolved gates remain blocking until independent authenticated evidence systems exist and the owner explicitly authorises a release.
- App Studio shows a concise `NOT READY` summary and next priority inside its existing optional customer-journey review, not on the Home screen. No save/publish/charge capabilities are added.

### 3. Regression and build-export preparation

- `scripts/check-release-readiness-v3178.mjs` checks current app scope, bad/stale IDs, allowlisted schema queries, five-table outages, zero customer-row leakage, production staging denial, partial/full reports, cross-business misattribution, forged client evidence, full ten-gate refusal to publish, and actual Edge/native/UI/workflow source wiring.
- `.github/workflows/release-readiness-v3178.yml` invokes this new test then V3.177 through earlier suites, native-source parsing, Busy iOS/Android Expo exports and independent standalone iOS/Android exports.
- Focused assertions executed in the JavaScript harness, using actual source modules and a synthetic PostgREST client, **not** a real Edge/React Native compilation or a live staging SQL test.

## Actual connected staging discovery — read-only observation

**Observed on 12 October 2026:** Supabase has an active healthy project named **Busy Does It Staging**, ref `pnjdlogwegnqbsfpcofw`, in `eu-west-2`.

Read-only direct inspection using the connected Supabase project tools found:
- **Zero out of five required V3.178 application tables** (`busy_mini_apps`, `busy_website_deployments`, `busy_brain_owner_decisions`, `busy_website_brain_decisions`, `busy_staging_qa_runs`) in public.
- **Zero deployed Edge Functions** in that staging project.
- One `public` base table in total (not one of those five); do not incorrectly call the project an entirely empty database.
- Staging security advisor returned no notices, but that **does not mean there are no security risks**: there is no deployed application/RLS tenancy configuration to audit yet.

This confirms infrastructure exists but the Busy application backend is **not yet installed**. The newly added owner-authenticated staging endpoint therefore cannot execute there today. No DDL, Edge deployment, provider secrets, customer data or project settings were changed by this read-only investigation.

## Outstanding release gates

1. Review base app/database dependencies and migration ordering. Create the staging application schema in an authorised isolated project before applying the V3.176 and V3.177 private-history/test-only schema. Stage the corresponding Edge functions. Check all permissions against live Postgres and real JWT identities.
2. Verify owner/admin, staff, revoked, anonymous, wrong-business and cross-tenant access using real independent test accounts. Service-role table reads alone do not prove RLS.
3. Execute the V3.177 synthetic staging DB round-trip across six labelled routes. A successful result proves test-only DB write/read, not that native apps/guest web delivered a customer request.
4. Execute actual test-only booking/enquiry journeys through marketplace, guest browser and standalone clients with backend evidence of persistence, status, reply delivery, owner inbox and *separately confirmed* diary bookings.
5. Verify website publish/rollback on staging hosts, signed standalone package distribution, physical iPhone/Android/tablet and accessibility; do not equate static layout simulations with real captures.
6. Audit billing credits, consent/privacy, data isolation, providers and safety before owner-approved distribution.
7. Confirm a **real successful GitHub Actions run**, four Expo exports and native/device smoke testing; the workflow's existence is not proof of success.

## Proposed next work

**V3.179:** Prioritise a safe *staging bootstrap sequence and installation validation* (including migration dependencies and security reviews) so the separate staging project can genuinely run Busy. Only after that connect isolated customer-journey verification. Preserve the user's preference to build in substantial multi-area sweeps, keep front-end simple, and require separate approvals for production changes, spending, messages and publishing.

**No production changes or paid services were initiated in V3.178.**
