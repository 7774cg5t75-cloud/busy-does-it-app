# V3.174 — Offline Staging Preflight, Real-Device Evidence Boundaries and Coordinated Improvements

**Development branch:** `v3.174` from `v3.173`. This is a development-only sweep; nothing is automatically deployed, published, billed or sent.

## Workstream A — executable offline request preflight

- `src/core/offlineStagingPreflight.mjs` executes (rather than merely lists) the existing *fixed, fictional* request state-machine fixtures for booking and enquiry in `appCustomerJourneyPractice.mjs`. It reuses `appCustomerTaskDesign.mjs` to ensure the tracked module is actually enabled. Contact-only cannot pass as a tracked Enquiries backend.
- Builds a six-route matrix: booking/enquiry × BUSY marketplace, independent standalone app and guest web.
- Outputs checks run, passed/blocked/failed, and actionable setup blockers while redacting private customer records and credentials. No endpoint is called, no customer is contacted, no booking is created and no charge is made.
- The future **trusted, authenticated and isolated staging runner is not connected**. Neither checking an ownerApproved flag nor assembling a manifest allows a live request. This is not equivalent to network-level tests for auth, RLS, replay, inbox, reply delivery, booking confirmation or web guest receipts.

## Workstream B — owner-review device coverage and existing real local captures

- `src/core/deviceReviewEvidence.mjs` prepares the exact current-revision iPhone, Android phone, tablet, large-text and screen-reader review checklist.
- Accepts bounded, explicit owner-reported observation metadata for the *same authorized business, surface, draft ID and revision*. Wrong business, older version, duplicated slots, raw screenshot URLs and private notes are rejected. All manual observations are clearly **unverified**, even when complete.
- A second adapter, `summarizeLocalAppCapture`, revalidates the app's existing owner-triggered `appVisibleCaptureReceipt` on-device screenshot, including exact app ID/revision, local URI scheme, public-app-only scope, platform and dimensions. It returns safe summary metadata without the screenshot URI or image contents.
- App Preview now shows when an owner actually uses the existing `Capture visible screen (app only)` action and a matching local capture exists. **This development sweep has not taken a physical screenshot**, scanned pixels, executed VoiceOver, or tested Android/iPad. Recording one screenshot does not prove full-screen scrolling or independent attestation; AI upload still requires its existing separate opt-in and allowance gates.
- Website Builder surfaces the owner device checklist scoped to the current draft. It does not pretend the website preview WebView is a separate physical phone.

## Workstream C — coordinated owner approval

- `src/core/ownerImprovementPlan.mjs` uses existing service clarity, customer-journey and reversible navigation-review engines to prepare **at most three** evidence-labelled priorities. Safe content review is preferred over unsupported AI rewrites. Neither Business App nor Website Builder applies these automatically.
- Website and app are never combined without matching same-business scope; the pure helper does not provide authentication.
- Draft revision validation refuses stale website evidence and missing app revisions. Existing App Studio original/proposed review, Undo and private save gates remain unchanged.
- Both builders show these proposals inside existing customer-help screens instead of adding clutter to Home.

## Workstream D — regressions and packaging

- `scripts/check-offline-staging-device-v3174.mjs` covers fictional booking/enquiry transitions, missing actual modules, six-route manifest, no network operations, device observation isolation and metadata privacy, reuse of local App Preview receipts, owner improvement priority caps, version guards and UI/CI source contracts.
- `.github/workflows/offline-staging-and-device-review-v3174.yml` adds new regressions to V3.173 and earlier suites, native/Edge source syntax checks, plus Busy iOS/Android and independently packaged standalone iOS/Android **Expo export attempts**.

## Evidence limitations and release gates

Source files and the workflow are committed. Focused pure-module tests can be run without network. No claim is made that a GitHub Actions run has completed, native code builds on actual devices, real customer requests reach their recipient, app-store packages are signed, physical accessibility is certified or a public app is ready to launch.

Before release:
1. Confirm green Actions and all four Expo exports from a real V3.174 workflow run.
2. Inspect App Preview on real iPhone/iPad and Android after capturing current-version customer-only views. Repeat with medium Display Zoom, large text, screen readers and scrolling.
3. Implement a separately authorised, **staging-only** trusted execution service with tenant isolation, test accounts, allowed endpoints, audited no-production guard, idempotency, side-effect controls and authoritative server receipt validation. Run all six routes against real staging endpoints.
4. Check owner inbox, real reply delivery, browser guest receipt limitations, genuine confirmed BUSY diary bookings and declined/closed/retry edge cases.
5. Retain explicit owner approval for publishing, credits and third-party sign-ups. Do not infer financial gains or conversion improvements from static navigation or local screenshot metadata.

No database migrations, real customer data writes, Edge deployments, DNS changes, app-store submissions, payments or outward notifications are performed by this sweep.

## Suggested V3.175 priorities

Move from local test preparation toward a controlled staging runner once isolated infrastructure and explicit owner approval are available. Expand real viewport evidence and continue improving practical website/app customer journeys, alongside the main Business Brain and Get More Customers roadmap.
