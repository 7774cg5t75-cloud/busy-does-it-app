# Busy Does It — V3.208 Reviewed Follow-Up Send and Post-Save Outcome Verification

**Base:** V3.207, verified successful GitHub Actions. This is a source-level development sweep. No Supabase migration or Edge deployment, staging customer writes, external notification, paid provider call or production changes.

## 1. Last-minute server-side freshness gate for Busy-suggested replies

V3.207 prepared and rechecked an owner-approved reply **before filling the editable draft**, but the customer could send another message before the owner pressed Send.

V3.208 adds a distinct **reviewedFollowupStamp** for Busy-prepared drafts:
- The actual UI only attaches this stamp when the owner chose and rechecked Busy's editable suggestion. Ordinary manually written replies keep the existing owner-controlled flow.
- On Send, the authenticated owner action passes the exact latest approved source stamp, business/request scope and the existing encrypted, idempotent message key.
- The Edge service validates owner/admin role for stamped follow-ups, re-reads the **one exact current request** and **two newest saved conversation messages**, and rejects the suggestion if it is no longer appropriate, if the conversation changed, if an already-saved business reply means waiting, if the request is terminal or a guest, if the booking needs independent confirmation, or if any source identity or safety flags disagree.
- Only after the guard passes does the existing transactional message write execute.
- The owner still manually presses Send and can edit the draft. A rejected stamped send requires a fresh conversation review, not an automatic replacement or send.

**Important limitation:** The fresh read and atomic message write are distinct database operations. A customer could submit a message **between the pre-send check and the transaction**. This is substantially safer but is **not** atomic compare-and-send. That stronger guarantee requires a separately reviewed database change and cross-writer concurrency tests against isolated staging. Do not describe this as eliminating every race.

The existing SecureStore idempotency key and authenticated message-receipt recovery continue protecting an ambiguous HTTP result. If a stamped retry is rejected because a response was previously saved, recovery checks the original signed-in message before reporting success. There is never an automatic retry send.

## 2. What happened after the reply?

After a successful saved owner reply, the server attempts a new, read-only authenticated `owner_followup_check` of the same request. `reviewedOwnerSendV3208.mjs` compares the saved message ID, business/app/request scope, and fresh last-message categorisation.

The bounded result can establish:
- The owner reply was **saved** in BUSY;
- A new current readback was available, and the latest saved in-app message belonged to the business, so **don't recommend another chase right now**;
- Alternatively, the saved reply is confirmed but message order is changed/unknown, so **review the conversation**.

`reviewedReplyProofV3208.mjs` limits customer-facing and Business Brain summaries to those proven stages. It explicitly refuses to claim email/push delivery, customer reading, an independent diary booking, job completion, payment or conversion.

A post-save readback failure never converts a successful database commit into an apparent failed send. The owner sees the saved receipt while the conversation result remains unknown. The previous V3.205 owner-inbox and exact reply receipts are retained.

## 3. Simple owner experience

An owner still sees the normal **Check latest conversation → Use as editable draft → Send message** pattern:
- Only genuinely reviewed Busy suggestions attach an invisible verification stamp.
- The screen explains that Busy will recheck the current saved conversation when sending and may require another review if it changed.
- The draft and stamp clear after a verified save or navigation to a different conversation.
- The owner follow-up review is invalidated on a verified send so a stale suggestion is not presented as current.
- No new settings, complicated navigation or automatic outbound messages.

## 4. Regression and outstanding live evidence

`scripts/check-reviewed-owner-send-v3208.mjs` tests current vs stale stamps, new customer messages, already-replied and terminal requests, guest and accepted-booking safety, cross-tenant and incorrect app/request scope, role/approval flags, honest post-send unknown evidence, false provider delivery flags, integration wiring and explicit no-automatic-send assurances.

The V3.208 GitHub Actions workflow runs that suite along with V3.207–V3.190 builder regression and staging safeguards, parses native and Edge source, and exports unsigned iOS/Android JavaScript for Busy and standalone prototypes.

**No real end-to-end testing has yet taken place against the unfinished isolated Supabase staging Business App database.** Live Auth, concurrent request/message races, push/email provider receipts, real device delivery and customer-confirmed outcomes remain release gates needing a reviewed staging installation and explicit owner approval.

**North star:** Busy notices potential unfinished work, verifies the latest relevant customer evidence, helps the owner take one sensible action, then distinguishes genuinely saved progress from delivery or job completion.
