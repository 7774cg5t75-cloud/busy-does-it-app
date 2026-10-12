# V3.170 — Intelligent Customer Journey Testing 1.0

**Branch:** `v3.170`, based on `v3.169`  
**Scope:** Private Business App Studio; *offline synthetic state-machine scenarios, not live end-to-end tests*.

## What changed

1. Added `src/core/appCustomerJourneyPractice.mjs`: nine fixed fictional journeys exercising the existing `decideAppRequestTransition` and `appRequestJourney` implementations instead of inventing a second rules engine.
   - Booking request stays unconfirmed when received or reviewing.
   - A draft booking does not authorise marking a request accepted.
   - A separately supplied `booking_confirmed` bridge signal permits acceptance in the **fictional** fixture; **no real diary confirmation is performed**.
   - A declined booking request cannot silently reopen.
   - An accepted booking record with an unconfirmed bridge must never display a confirmed appointment.
   - An enquiry can move to reviewing/accepted without pretending a reply was sent.
   - Closed and declined enquiries cannot silently reopen or accept.
2. Checks whether the necessary booking or enquiry module is enabled before running any fixture. A `contact`-only fallback is explicitly **not** the tracked enquiry workflow; any unavailable feature is labelled *needs feature setup* rather than a passing test.
3. Added an optional collapsed **Check sample booking & enquiry journeys** section in the existing App Builder customer-task area. The simple interface shows how many fictional scenarios ran, passed, or were blocked, and a clearly unverified six-part real-release checklist.
4. Added `scripts/check-app-customer-journeys-v3170.mjs`: scenario behaviour, false-booking prevention, terminal states, genuine separate booking-state requirement, missing-module handling, customer-data exclusion and UI/workflow integration.
5. Added `.github/workflows/app-customer-journeys-v3170.yml`, incorporating all historical app-design regressions, native/Edge source parse checks and four iOS/Android Busy/standalone Expo export attempts.

## Safety and evidence integrity

- **No real requests** are created or sent. No customer records, payments, services, apps or live websites are modified.
- All scenario input states are fixed, fabricated strings; neither the owner nor the model can turn this simulation into a live booking confirmation or external message.
- No AI calls, provider charges, permanent training, automatic publishing or tenant-crossing learning are performed.
- Synthetic passes mean only that the state-machine rules behaved as expected for these fixtures. They do not establish routing, delivery, customer identity, privacy compliance, message delivery, availability, successful bookings, real screen behaviour, standalone packaging or revenue.
- The owner still controls all live operations and approvals; there is no background automation attached to this checker.

## Acceptance remaining

- Obtain green **V3.170 GitHub Actions CI**, including the native parse/export jobs and all prior regression scripts. A committed workflow does not establish that it has run.
- Verify private App Builder UI on iPhone/iPad with modules present and absent; check that no disabled service is represented as usable.
- In **isolated staging**, submit fictional-but-real network booking/enquiry requests and verify authentication, RLS, rate limits, idempotency, receipts, owner notification, replies, accepted state, separate confirmed diary booking, refusal and closed/declined edge cases. Confirm actual user-facing status only once the backend evidence matches.
- Independently inspect marketplace and standalone installable apps on both supported platforms; Expo exports alone are not signed installables or app-store approvals.
- Conduct manual accessibility, screen sizes/zoom, responsive performance, privacy and publication approvals before release.

**Build-first status:** code, regression suite and workflow committed; no real staging requests, Edge deployments, API keys, app signing or customer notifications performed in this sweep.
