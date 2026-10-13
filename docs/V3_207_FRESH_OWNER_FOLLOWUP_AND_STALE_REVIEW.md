# Busy Does It — V3.207 Verified Customer Follow-Up Intelligence 2.0

**Base:** verified V3.206. **Scope:** source-only, owner-approved follow-up intelligence and offline integration tests. This does **not** install staging schema, publish Edge Functions, send messages, start background monitoring or claim any live customer reached a finished outcome.

## A. One exact authenticated request, no misleading sample shortcuts

The existing V3.206 dashboard uses up to 30 recent requests and 150 messages. It is useful for identifying potential work but cannot prove the most recent message for a particular request if the snapshot is truncated or other customers' records displaced messages.

The V3.207 `owner_followup_check` action is an **owner/admin-only** authenticated Edge read. It scopes the business and the current Business App ID, fetches the **one exact request**, and reads **the two newest messages** for that request by timestamp and ID. It leaves unread state unchanged and never contacts notification providers. Message bodies and customer contact/identity fields are not returned to the device.

`freshOwnerFollowupV3207.mjs` applies independent fail-closed tests:
- Only supported enquiry and booking-request types, states and matching business/app IDs;
- Declined/closed requests do not silently reopen;
- Guest-web requests cannot receive authenticated BUSY chat and therefore require a separate owner contact review;
- Accepted booking requests require a separately verified diary link, not a presumptive confirmation;
- Latest business message means **wait**, not chase, and not proof the customer received it;
- Latest customer message (or no message) allows Busy to propose a conservative, owner-editable reply;
- Missing, invalid, future or tied latest timestamps suppress draft suggestions rather than guessing chronological order.

This is real server source wiring, but the test results are source/fixture verification, not live production behaviour.

## B. Recheck before using a draft — stale recommendations cannot silently act

`src/core/followupProofV3207.mjs` checks the Edge receipt against the current tenant, app, request and a compact source stamp (request status/updated date and latest message identifiers/timestamps). The UI no longer copies a V3.206 dashboard draft directly.

In the request conversation:
1. **Check latest conversation** calls the owner's authenticated, read-only endpoint.
2. Busy explains why it does or doesn't recommend replying and only shows an editable draft for a verified response-needing request.
3. **Use as an editable draft** calls the same read-only endpoint **again** and rejects any changed request/message stamp. If existing unsent text is present, the owner must explicitly approve replacing it.
4. This changes only an unsent local text field. Sending remains a **different explicit owner action**, using the existing authenticated, idempotent and recovery-capable message flow.

The App Controller invalidates its review when a new conversation is opened, on account/business changes or on an incompatible response after a navigation change. Failures retain the owner's own text and show an instruction to review the conversation. Nothing is automatically sent, scheduled or published.

**Limit:** A customer could send another message after the last check and before the owner manually sends a reply; eliminating that race entirely would require a dedicated server-side compare-and-send transaction. This sweep does not claim such atomicity or a provider delivery receipt.

## C. Better accountable Business Brain

V3.206's broad owner dashboard continues to show potential follow-ups, but a reviewed owner action is now grounded in a **fresh exact-request readback**, with a transparent reason and explicit evidence boundaries. This builds on Business Brain's learning architecture without moving private cross-business data, claiming AI model retraining, or fabricating conversions.

`scripts/check-fresh-followups-v3207.mjs` exercises mismatched tenants, app IDs and requests, stale source stamps, new customer messages, already-saved owner replies, equal-timestamp ambiguity, terminal requests, guest requests, booking acceptance, future/invalid timestamps, side-effect flags and real owner UI/controller/Edge source wiring.

V3.207's dedicated GitHub Actions workflow also retains V3.206–V3.190 regressions, offline staging safety/package checks, native syntax parsing and all four unsigned iOS/Android exports. It is still **not** end-to-end live staging verification: the separate staging project requires a separately authorised installation, real signed-in test accounts, Edge deployment and synthetic customer traffic.

**North star:** Busy brings the owner to the right unfinished customer task, verifies the latest facts, offers an appropriate draft and leaves the final decision and send entirely with the business.
