# Busy Does It V3.213 — Shared Request Receipts and Reliable Saved Outcomes

**Base:** V3.212. **Method:** source-only substantial backend and client sweep, no live database changes, no Edge deployment, no signed mobile builds, no customer operations or paid provider calls.

## Purpose

Bring Business App customer enquiry and booking-request infrastructure closer to a single trustworthy service for signed-in customers, public guest mini-app visitors and business owners. This is **not** a public website-builder form release. The hosted website builder still needs a separately reviewed public intake adapter, origin verification, anti-abuse controls, transactional submission and owner approval before becoming operational.

## A common pure saved-request proof contract

V3.213 adds **byte-identical** `requestReceiptProofV3213.mjs` to both existing Edge function bundles:

- `supabase/functions/busy-mini-apps/requestReceiptProofV3213.mjs`
- `supabase/functions/busy-mini-app-guest/requestReceiptProofV3213.mjs`

They share bounded known request kinds and statuses; require an exact UUID request, business and app match; validate the known saved origin; and reject a link from a different request or workspace. Owner updates preserve whether the customer submitted via guest browser or signed-in app.

The response includes only the internal request ID, type, status, evidence stage and conservative booleans. It **does not include any customer payload, email, phone, access token, message text or personal identifiers**. Actual authentication, database scoping and authorization remain the pre-existing Edge handlers' responsibility.

A booking is flagged internally **marked confirmed in Busy** only when a server-read request has status `accepted` and the same business/request's link says `booking_confirmed`. A link state by itself is no longer enough. This checks consistency of internal records but **does not independently verify a diary entry, payment, notification, calendar provider or real customer attendance**. Separate verified ledger/provider proof is still required for those claims.

## Guest public mini-app requests

The existing guest challenge, PoW/honeypot, live version and transactional Postgres RPC are unchanged. After its guest-creation RPC, the function reads the exact request record, verifies the request origin and business/app/request scope and returns a minimal saved-receipt stage; best-effort push cannot turn a committed request into a false failed save.

The **guest status** lookup still requires the same browser's secret guest-access token and hashed row match. It now additionally constrains the booking link read by business and request IDs and evaluates the **actual saved request status AND link** before returning the legacy `bookingConfirmed` flag. External calendar delivery, push delivery and owner read evidence remain explicitly false.

This is a public **Business App guest request**, not a newly implemented transactional website-builder contact page.

## Signed-in app receipts and owner status updates

The signed-in `busy-mini-apps` function now reuses that contract for:
- an idempotent request replay, including unique-constraint race recovery;
- a successful new submitted request, with post-commit proof and conservative delivery flags;
- an independent customer-scoped read-only receipt lookup;
- an owner status update performed against the existing business-scoped, optimistic-concurrency request row.

The existing replay payload/membership rules remain; a different payload must not reuse the old idempotency key. After a successful insert or owner status update, failure to reconstruct auxiliary evidence must not create a false *failed write*: an authenticated readback is required while the owner/customer avoids a new, possibly duplicate action.

Previously a **committed owner status** could be followed by a failed separate event write, unread-count update, push notification or dashboard refresh and appear to fail overall. V3.213 handles those later steps as separate best-effort evidence, returns a saved status with explicit `eventRecorded`, `unreadRecorded`, `notificationAttempted`, `notificationDeliveryVerified:false` and `statusRefreshRequired` indicators, and avoids re-triggering the original action. **The status update and event/notification are not yet one atomic Postgres transaction**; a durable outbox and stronger concurrency model remain future design work.

The owner AppController accepts a verified saved status even if the latest dashboard or conversation readback fails, avoids wiping the inbox from an incomplete status response, and explains that the owner should refresh rather than repeat the status change. It does not infer actual notification delivery.

## Tests, constraints and follow-up

`scripts/check-request-receipts-v3213.mjs` covers both byte-identical Edge contracts, synthetic request status permutations, wrong-tenants/origins/links, ghost confirmations, guest-origin owner updates, no PII leakage, guest/signed-in integration markers, no false post-commit failure and exact client result handling.

The new `.github/workflows/builders-major-v3213.yml` schedules the new suite, all inherited V3.212/V3.211/V3.210 builder regressions, production/security/staging preflight, Edge/native syntax checks and **unsigned** iOS/Android JavaScript exports. Passing focused offline code tests is not proof that full CI, a real staging database, guest PoW, provider push, Work diary writes or signed devices have been exercised.

**Next real implementation targets:** reviewed server-owned website contact/enquiry intake using verified site origin and publication, existing request persistence with idempotency, rate limits, consent, owner inbox and receipt recovery; Postgres transaction/outbox consistency; independently verified Work diary appointment proof; and device-responsive real customer UX. A real migration or deployment should be separately reviewed with the owner and tested in isolated staging before production.

**North star:** You tell Busy what needs doing. Busy does it — then independently verifies the result.
