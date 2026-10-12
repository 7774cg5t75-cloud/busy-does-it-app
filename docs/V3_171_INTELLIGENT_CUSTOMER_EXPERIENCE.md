# V3.171 — Intelligent Customer Experience 2.0

**Branch:** `v3.171` (from `v3.170`)  
**Scope:** Busy Business App Studio and real request-detail presentation. The changes are intentionally integrated but approval-gated.

## Four connected workstreams

1. **Customer progress messages — used in real request-detail UI.** New `src/core/appRequestCommunication.mjs` derives finite, plain-language status titles, next steps and completion indicators from the existing V3.158 request state machine. Booking request status and linked diary evidence **must both** indicate confirmation before the UI shows "Booking confirmed". A contradictory accepted request/draft diary, or confirmed diary/unaccepted request, is explicitly marked "needs checking". An enquiry marked accepted is *not* presented as evidence a reply was delivered. Declined and closed requests are not silently treated as active. Guest web visitors are warned BUSY chat replies do not reach guest receipts.
2. **Owner-visible consistency safeguards.** In `src/screens/miniApps.js`, request progress, the status footer, completion indicators and the owner's linked booking card use the consistent booking evidence boundary. Unverified booking states no longer display a misleading green "confirmed" status.
3. **Six-goal improvement reviews — in the existing App Builder rather than Home.** New `src/core/appCustomerExperienceReview.mjs` combines task navigation (V3.169) and synthetic request checks (V3.170) with explicit, actionable, *not yet implemented* owner tasks for missing real modules, missing/unclear service details, blank gallery descriptions, booking confirmation, enquiry reply delivery, offer terms and loyalty earning/redemption. Findings are ranked and capped. The same original/proposed owner-approved navigation preview and Undo mechanism is reused. Busy never invents prices, service claims, appointment availability, customer feedback or promotion terms. New `How Busy would improve this` card is inside the optional customer-task view.
4. **Regression, CI and documentation.** New `scripts/check-app-customer-experience-v3171.mjs` tests real-UI source integrations, contradictory statuses, guest requests, customer privacy, all six review goals, incomplete business content, blocked modules, reversible layout, no mutation, and CI wiring. `.github/workflows/app-customer-experience-v3171.yml` calls new + historical regression scripts and requests Busy and independent standalone iOS/Android Expo exports.

## Verified versus not yet verified

**Verified in development tooling:** 229 assertions in the focused V3.171 suite and 562 assertions in inherited V3.168–V3.170 focused suites ran successfully against repository pure modules and UI/workflow source assertions via an in-memory JS harness. These checks are meaningful regression coverage, but they are **not** the complete repository's native/Edge compilation or GitHub Actions run.

**Not confirmed:** Green GitHub Actions on V3.171; successful Expo iOS/Android exports; physical iPhone/tablet interaction, accessibility, screen readers, dark mode, data security under real identities, separate standalone installable QA, guest-web receipt delivery, provider or Edge deployment.

## Required release and staging follow-through

- Execute/verify GitHub CI including old regressions, native syntax and four export jobs.
- In a private stage environment, submit actual test enquiry and booking requests through all supported customer entry routes. Check authentication, tenant isolation, idempotency/rate limiting, status propagation, owner inbox/notifications, correspondence, declined/closed states and separately confirmed linked diary entries. In particular, demonstrate the contradictory diary/request states recover correctly.
- Verify the customer actually sees the correct message on a real device and that guests use the separate browser receipt rather than a fictional chat-delivery channel.
- Verify every real operational workflow on marketplace and independently packaged standalone versions. No application-store approval is implied by an Expo export.
- Retain owner sign-off before publishing, spending, sending external messages or changing live configurations.

No database migration, provider keys, Edge deployment, real diary bookings, customer messages, subscription charges, or public publishing performed in this sweep.

## Next strategic direction

V3.172 could advance *guided improvement preparation* across app and website builders: reusable service clarity review, stronger proof-based QA at real native widths, and end-to-end private staging contracts. Don't treat successful fictional state tests as proof customers have completed the real workflow.
