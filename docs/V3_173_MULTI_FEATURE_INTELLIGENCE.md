# Busy Does It — V3.173 Multi-Feature Intelligence

Development branch: `v3.173` from `v3.172`. No public deployment is performed.

## Delivered in this sweep

### 1) Cross-builder business and services quality
- `src/core/businessInfoClarity.mjs` assesses the existing owner-authored website brief and Business App service list. It identifies missing names and descriptions, duplicate service names, and differing counts across website and app. Differences are warnings, not automatic copying: a smaller website service list may be intentional.
- Outputs are bounded findings with service positions and finite pre-written owner actions, **not raw service names, descriptions, private contacts, prices, credentials or new business claims**.
- Disabled app Services modules are not evaluated as active. A website/app joint comparison requires explicit matching authenticated business scope; the pure function does not authenticate it.
- Website Builder and App Studio show the relevant findings within existing optional customer-help sections. Owners edit business facts using existing private editors.

### 2) Safe preparation for future isolated end-to-end testing
- `src/core/stagingJourneyPreparation.mjs` compiles a deterministic six-route test matrix (booking/enquiry × BUSY marketplace, standalone, guest web) and fixed positive/negative cases: cross-tenant denial, unauthenticated requests, idempotency, inbox/status consistency, actual reply delivery, booking draft versus confirmed diary, browser receipt limitations, standalone identity and real-device accessibility.
- The preparation explicitly rejects production, unsupported channels, unknown business IDs and invalid revisions.
- A separate owner opt-in for isolated staging *still* does not permit these pure functions to send a request. No trusted staging runner is connected or executed, so `canExecuteLive=false`, there are no customers, no messages, no bookings and no verified delivery. The UI shows the number of prepared practice cases, **not a passing network test**.
- The V3.172 authoritative staging proof contract remains a prerequisite: a metadata-shaped receipt does not independently prove server authentication.

### 3) Stronger before/after evaluation
- `src/core/designEvidencePriorities.mjs` ranks measured website DOM findings separately from predicted app layout changes. Website reports must refer to the same private draft ID, generation, page and width. Stale, duplicate, incomplete or inconsistent measurements are rejected.
- It reports introduced layout warnings and missing screen widths without claiming customer behaviour, sales lift or visual attractiveness. It never applies a new design.
- Website Preview now identifies the current one-width versus multi-width limitation for a proposed visual improvement. App Studio explains its 3-width design prediction as a hypothesis, with original-versus-proposed owner comparison unchanged.

### 4) Regression and export workflow
- `scripts/check-multi-feature-intelligence-v3173.mjs` covers privacy, cross-tenant fail-closed rules, owner-approved service facts, disabled services, production refusal, six-channel matrix, safe dry-run boundaries, missing/stale visual evidence, width regressions, Undo and actual builder integration.
- `.github/workflows/multi-feature-intelligence-v3173.yml` adds the new checks to V3.172 and all earlier app-design regressions, then attempts native-source parsing and four Expo exports (Busy iOS/Android and independent standalone iOS/Android).

## Evidence and limitations

The focused suite can be executed using pure project modules, and GitHub contains the test and CI workflow. That does **not** confirm GitHub Actions completed, that Expo exports succeeded, that real devices passed, or that live enquiries and bookings work end to end. No Edge functions, provider credentials, Supabase migrations, DNS, production data, app-store submission or real customer messaging were changed.

## Release gates, still required

1. Inspect a successful GitHub Actions run, native parse stage and all four Expo exports.
2. Test optional Website Builder and App Studio panels on real devices including medium Zoom, large text, dark UI and assistive technology.
3. Connect an authenticated, intentionally isolated staging transport only after owner authorisation. Execute test identities against genuine request endpoints; inspect backend receipts, idempotency, RLS, inbox, notification and customer-visible status.
4. Separately verify guest receipt limits and signed-in chat delivery; never equate a conversation state change with a delivered customer reply.
5. Verify booking requests only become accepted after genuine BUSY diary confirmation. Test declined, closed, duplicated and cross-tenant requests.
6. Confirm both marketplace and independently built standalone apps work before suggesting production readiness. Record actual before/after measurements, not just hypothetical layout rules.
7. Preserve owner approval for all public changes, publishing, spending and third-party sign-ups.

## Proposed V3.174

Advance **trusted staging execution preparation**, real device evidence capture and owner-controlled improvements in both builders. Prioritise core end-to-end behaviour over extra decorative UI or new unverified feature claims.
