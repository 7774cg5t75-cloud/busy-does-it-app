# Busy Does It V3.204 — Authenticated Customer Request Recovery & Outcome Evidence 2.0

**Base:** verified V3.203. Source-only sweep; **no staging migrations deployed, Edge Functions published, test customers contacted, external provider sends or production writes**.

## 1. Interrupted request recovery that checks what is saved

New `customerRequestReceiptV3204.mjs` is a minimal, fail-closed, customer-scoped receipt contract. The Edge `request_receipt` action uses the exact original idempotency key, app slug and request kind and filters the saved database row by the **authenticated customer user ID and specific app ID**. It returns only an ID, kind, state and narrowly defined proof flags — no customer message, phone number, contact details, app metadata, business name or source request payload.

The operation is **read only**, never resends a request or notification, never updates unread counts, and remains available to an owner of an existing saved request even if the app has stopped accepting new submissions.

In the real Business App customer screen, a failed/ambiguous `submit_request` now asks the server to look up the original request before suggesting a retry. If the authenticated receipt matches the exact current app, kind and customer, Busy can report the original saved request. If the lookup is missing, unavailable or stale, Busy does NOT say the request was lost; she preserves the same in-memory request key and asks the customer to check My BUSY Apps before trying unchanged details again. The V3.203 server's matching-payload idempotency guard prevents the same key being repurposed.

The client also blocks simultaneous taps, clears the pending request upon verified save, resets identity-scoped pending state at sign-in change and avoids accepting a response after the selected app/account has changed. This is a best-effort **in-memory** recovery path: it does not guarantee survival of app termination/device replacement without a separately designed secure persistent queue.

## 2. Business Brain learns from *bounded actual outcome evidence*

`customerJourneyOutcomeV3204.mjs` translates a verified server submission response or exact authenticated customer receipt into a small, privacy-limited proof: which app and request stage was seen, and whether the evidence came from an original submission or an independent readback.

The existing Business App customer screen shows an optional **What Busy has verified** card only if the proof belongs to the current app. No private customer payload is added to this evidence. It never claims a delivered push/email, customer reply, conversion, invoice payment or independent calendar confirmation merely because a request was saved or moved to `accepted`.

The proof is held only as local session UI state; it does NOT automatically retrain the underlying AI, aggregate behaviour across businesses, persist private customer notes, schedule outreach or send marketing messages. It is the first building block for an accountable future learning loop — not proof that outcome-based learning is deployed end-to-end.

## 3. Real signed-in staging receipt check — prepared, not run

`scripts/run-staging-customer-receipt-v3204.mjs` is a **no-network default**. `--verify-read-only` requires independently created synthetic staging request, two actual test Auth users, short-lived JWTs, a hard-coded allowlisted staging project, synthetic app slug and exactly matching idempotency key. After verifying both Auth identities, it checks customer A can read their originally saved synthetic request, while customer B cannot.

It never submits a request or message, changes the database or publishes an app; it only looks up already-saved proof. It outputs no sensitive contact fields, IDs, access tokens or keys. Real authenticated execution remains blocked until the V3.202 staging schema, V3.199 RPC and isolated Edge deployments are separately reviewed, approved and installed.

## 4. Verification and limits

`scripts/check-customer-journey-v3204.mjs` tests:
- no customer contact fields or original keys returned in read-only receipts;
- ID, app, signed-in user, request kind, state and request-key matching;
- valid saved submission vs invalid response and unsigned/unverified receipt;
- no overclaiming notifications, replies, diary bookings or conversion;
- wrong-account and wrong-app readback rejection;
- no-network default / explicit staging approval and real-Auth mocks;
- source wiring to the authenticated Edge and actual App Controller / customer UI.

Dedicated `builders-major-v3204.yml` also runs V3.203/V3.202/V3.201 and older builder regression suites, offline verified staging package checks, native source syntax verification, and four unsigned iOS/Android exports.

**Important:** Passing a JavaScript/HTTP mock does not establish independent live JWT signature verification, successful notifications or actual end-to-end customer task completion. Those must be demonstrated against the isolated and authenticated staging environment **after separate owner-approved installation**.

**North star:** Busy should be able to say, “I checked the exact customer request. It was saved,” rather than guessing from an interrupted connection or pretending the business finished a booking.
