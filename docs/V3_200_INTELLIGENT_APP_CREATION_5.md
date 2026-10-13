# Busy Does It — V3.200 Intelligent Business App Creation 5.0

**Base:** V3.199, verified workflow and latest Snack-preview head. This is a development-only sweep, not a live staging release or app-store submission.

## 1. Give each business app an actionable, verified customer-first design

`src/core/industryFirstExperienceV3200.mjs` composes the existing shared app-runtime schema, industry-priority engine, owner-approved services/offers and fictional request lifecycle checks into **one** conservative plan. Examples:

- **Hairdresser or salon:** promote actual supported booking **requests**, without calling them confirmed appointments.
- **Tradesperson:** prioritise the real Enquiries module instead of pretending the app generates an instant quote.
- **Food/event business:** prioritise usable owner-approved service/product information; offers do not bypass approved-terms checks.
- **Other businesses:** prioritise a usable service/enquiry/contact route, not an invented feature.

If a module isn't in the *authenticated owner-status catalogue*, lacks required backend capabilities, isn't enabled or has no essential approved content, Busy cannot suggest it as functioning. A runtime schema failure stops changes altogether.

The planner deliberately distinguishes:
- static supported runtime screens,
- approved public service data,
- synthetic, offline request-state transitions (when relevant),
- **unverified** live submission, notification/reply and real-device accessibility.

A passed fictional request transition is never reported as a real booking or end-to-end delivery.

## 2. Actually save a reviewed improvement to a private app

The new `IndustryFirstExperienceReview` component sits in the Business App Builder. It begins collapsed to keep the front end simple. Customers see a short, plain-English justification, any setup warnings, and the status of the checks.

When an action is genuinely available but buried, Busy prepares the exact enabled-module navigation order, preserving the business identity as the first section. The owner sees before/after and can cancel or approve. Approval **recomputes the proposal** from the current business, app ID, revision and catalogue, rejecting tampering and outdated suggestions, then uses the existing authenticated `saveCoordinatedAppChanges` controller and server's optimistic revision check.

The response must confirm the revision increment, same app ID, private-only status, no charges and no publishing. This is a **real** private app configuration edit — not a decorative recommendation.

## 3. More consistent Business Brand DNA

`src/core/brandCampaignReviewV3200.mjs` prepares three actual private text drafts — social, poster and advert — from the exact same current, tenant-scoped website/app Brand DNA. It refuses mismatched brand identity or conflicting approved website/app facts, and checks brand name, colour, tone availability, media rights and owner publication consent.

The Brand DNA UI now offers an optional one-tap review of all three copy drafts and their unresolved approval items. This is text preparation, not a real generated poster image, paid advertising campaign or video.

## 4. Regression and release limits

`scripts/check-major-builders-v3200.mjs` tests appointment/trades/food journeys, actual supported backend capabilities, absent public services, invalid offers, stale business/revision approval, never-automatically-publishing safeguards and cross-channel brand consistency. The dedicated V3.200 workflow also runs the older builder and core foundation regressions, parses native/Edge code and exports unsigned Busy and standalone prototype JS for iOS/Android.

**This is not a claim that the entire app works end to end in production.** The SQL migration introduced in V3.199 is still not deployed by this sweep. Genuine authenticated staging, simulated racing first creates in the database, owner/customer request delivery, real devices, accessibility, media rights and standalone distribution require separate evidence and owner approval.

**North star:** Busy prepares the useful next result, uses true business facts and supported functionality, explains what she chose and why, then verifies what actually happened.
