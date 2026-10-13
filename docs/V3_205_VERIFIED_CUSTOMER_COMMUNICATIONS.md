# Busy Does It V3.205 — Verified Customer Communications and Task Completion 1.0

**Base:** verified V3.204. **Scope:** source code and offline tests. No database migration, Edge Function deployment, provider send, actual customer notification, staging data insertion, or production write in this sweep.

## 1. Verify the request reached the correct business — beyond a recent list

New `ownerInboxReceiptV3205.mjs` and the Edge `owner_inbox_receipt` action check **one exact** request ID under the authenticated owner/admin's real business membership and current Business App ID. Unlike the owner overview's last 30 requests, this indexed one-record lookup works for older saved requests.

The owner opens the existing conversation and taps **Verify this request in my inbox**. The result is a read-only, privacy-minimal receipt: same business, app, request type and saved state. It does NOT claim the business owner saw a push notification, replied, confirmed a diary booking or completed the service. It neither changes unread counts nor sends messages.

Other businesses, missing memberships, general members, mismatched apps and invalid request IDs fail closed.

## 2. Independently recover an interrupted owner/customer reply

New `messageReceiptV3205.mjs` adds a strict, *read-only* `owner_message_receipt` and `customer_message_receipt` check. Both begin with the authenticated user, then enforce owner/admin membership or the stored request's original signed-in customer ID. The message is selected by **business, request, actor, role and original idempotency key**, then compared against the exact original trimmed text. No other user's message, a different body, an unknown key or a mismatched outbox can qualify.

The readback returns **only** the saved message ID, request ID, outbox state and limited proof flags; not the stored message, name, email, phone number, push token, message body or retry key.

`recoverSavedReplyV3205.mjs` integrates with the existing SecureStore-backed V3.185 idempotency key. After an ambiguous HTTP failure:
- Busy first checks the saved original reply rather than automatically posting again.
- If the authenticated exact-match receipt is verified, Busy safely clears the old secure retry reference and shows **reply saved — notification unverified**.
- If the lookup fails, message was not found or it conflicts, Busy keeps the original key, blocks automatic resends, and explains that the original conversation should be checked before trying again.
- The same mechanism covers both business-owner and signed-in-customer replies.
- No private message text is stored in the new evidence model or disclosed in the UI.

The existing atomic SQL transaction remains the only way to create replies and their durable delivery intent. This new read path does not create messages, alter unread counters or mark the customer's booking confirmed.

## 3. Honest notification evidence and clearer UI

`requestCommunicationOutcomeV3205.mjs` distinguishes:
1. Customer request **stored in the correct business inbox**;
2. Exact owner/customer **reply saved**;
3. A notification **outbox intent recorded**;
4. Provider **submission attempted but not independently delivered**;
5. **No confirmed delivery/reading/appointment** without independently verified receipt and diary evidence.

The existing request conversation now includes a quiet **What Busy verified** section only for the matching request ID. Business owners can check their actual inbox without going into technical SQL screens.

Importantly: `submitted_unverified` does **not** mean a push was delivered; `no_submission_evidence` is not permission to resend. No new automatic notification retry worker, provider sending, marketing campaign or paid operation was added.

## 4. Tests and release limits

`scripts/check-communications-v3205.mjs` exercises:
- valid owner and customer reply readbacks and empty readbacks;
- wrong actor, business, request, customer, key, role, message body and app;
- outbox mismatches and fraudulent delivery flags;
- owner/admin-scoped inbox confirmation independent of 30-item pagination;
- encrypted retry key reuse, storage cleanup on verified readback and preservation on uncertainty;
- original customer/business controller routing, UI and privacy contract.

The dedicated GitHub Actions V3.205 workflow also runs the V3.204–V3.200 regressions, offline staging package and risk checks, existing message integrity checks and four unsigned JavaScript exports for iOS/Android Busy and the standalone prototype.

**These are code/mocked contract tests, not proof that an actual customer device received a message.** The separate Supabase staging project still lacks the full Business App schema, so isolated JWT-based end-to-end testing remains outstanding. No migration or Edge Function should be deployed without separately approved staging schema, reviewed cron/network side effects, live JWT/tenant proof and safe test identities.

**North star:** Busy verifies saved work and tells customers what remains. “Reply saved” is useful and true; “message delivered” or “booking done” must not be claimed without further evidence.
