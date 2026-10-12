# V3.172 — Shared Customer Journey Intelligence & Evidence

**Branch:** `v3.172`, created from `v3.171`.

## Multiple connected workstreams delivered

### 1. Shared customer-goal review across builders
- `src/core/sharedCustomerExperience.mjs` gives Website Builder and Business App Builder a common six-goal vocabulary: booking, enquiries, services, photos, offers and rewards.
- Website-specific advice reuses real `websiteQualityGuidance` and `websiteJourneyAssurance` instead of copying an app template into a website or inventing conversion evidence.
- App advice reuses V3.171 `reviewCustomerExperience` with its existing owner-controlled navigation preview and missing-module / content setup advice.
- Each UI passes only its own currently selected private draft. **Combining both drafts is refused unless an authenticated caller supplies the same authorized business identity for website and app scope**. Identity from a caller is still not independently authenticated by this pure module; trusted application state must verify it upstream.
- Both UIs keep details optional, behind ordinary owner-facing disclosure. Nothing is published or sent.

### 2. Stronger before/after evidence boundaries
- `src/core/crossBuilderEvidence.mjs` compares original/proposed app configurations across 320, 390 and 820 logical points using *predicted static layout rules*, not actual screenshot inspection.
- Website Preview now displays evidence measured for the **current private draft, generation and page only**, using `websiteViewportEvidence`. Checks on stale generations do not carry over.
- Cross-builder evidence reporting explicitly distinguishes predicted native app layouts from measured preview DOM checks. Neither alone proves customer task success, accessibility or conversion improvements.

### 3. Isolated-staging end-to-end contracts
- `src/core/stagingJourneyContract.mjs` describes explicit authentication, tenant separation, idempotent submission, owner inbox, status, reply-delivery, booking diary, guest receipt, standalone and device evidence for future safe staging execution.
- No network requests are made by this module. A receipt from the wrong tenant, wrong revision, fictional simulation, unknown provenance or unsupported status fails metadata checks. Even nine well-formed evidence records remain **unverified** until an authoritative trusted backend checks their source and actual logs.
- The App Builder now shows how many distinct staging checks are outstanding instead of mislabelling V3.170 fictional scenarios as end-to-end success.

### 4. Regression and packaging
- `scripts/check-shared-customer-journeys-v3172.mjs` covers all six customer goals, separate/combined business scope boundaries, missing capabilities, private draft preservation, reversible app navigation, three-width app rules, website version-specific checks, cross-builder evidence limitations, stale / cross-tenant / fictional staging receipts, no client-side claim of verified delivery, and both UI integrations.
- `.github/workflows/shared-customer-journeys-v3172.yml` runs new and historical JavaScript regressions, native/Edge syntax checks and Busy plus independent standalone iOS/Android Expo exports.

## Privacy, owner control and limitations

This sweep does not make up business copy, reviews, prices, addresses, availability or image descriptions. It does not read real customer submissions, send messages, confirm appointments, charge for AI, deploy Edge Functions, publish websites/apps, or submit app-store builds. Website and app draft information remain separate unless an upstream authenticated same-business scope is supplied. Owners approve all public changes.

**Not yet verified:** Complete GitHub Actions / exports, physical iPhone/iPad and Android testing, accessibility, real delivery of booking/enquiry messages, actual confirmed diary linkage, genuine customer task completion and commercial outcomes. These require independent verification.

## Next release gates

1. Confirm the V3.172 workflow genuinely completes, including all prior regressions and four Expo exports.
2. Test each new optional owner view and original/alternative app comparison on real phone and tablet.
3. In a dedicated isolated staging business, run authenticated submissions across marketplace, standalone and guest-web entry. Verify server tenancy, replay/idempotency, inbox/notification, reply delivery, guest limitations, diary confirmation and consistent request statuses.
4. Collect independent page-width DOM reports for the exact draft revision; rerun after approved modifications.
5. Verify no live public changes occur without explicit owner approval. App store signing and submission remain separate.

## Development note

This is a coordinated improvement to the intelligence and review foundation, not a declaration that booking/enquiry delivery, standalone stores, external hosts or sales analytics are fully automated.
