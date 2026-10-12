# Busy Does It — V3.185 Durable Reply Retries & Notification Intent Evidence

Source branch: \`v3.185\`, branching from \`v3.184\`. Production and hosted staging are unchanged.

## 1. Retry safely when the phone cannot tell whether a message was saved

\`src/core/durableMessageRetryV3185.mjs\` and the main application send handlers now prepare an account-, business-, role- and request-scoped **stable idempotency key** and store it in the device's encrypted Expo SecureStore **before** sending. It contains no customer message body, auth token, email, address or personal contact data. It also stores a bounded noncryptographic checksum as a local same-draft hint — not a security digest. The real Postgres message handler checks **exact text equality** before deciding whether a replay is the same message.

If the network call times out ambiguously, an app relaunch and retry with the *same* reply text reuses the pending key. If the text changes while a prior attempt remains uncertain, Busy prevents creating a second message until the earlier conversation outcome is checked. After a verified server database receipt, it deletes the local pending key. The app also blocks concurrent double taps while the send is in progress and explicitly states that saved messages do not imply the push notification was delivered.

**Limitations:** If encrypted storage cannot be used, a new message is not sent without a durable key. If secure cleanup fails following a successful response, an identical later message may need review before being sent as a *new* message. This is a conservative anti-duplication policy, not a fully featured outbox reconciliation UX. Manual resends with intentionally different text remain owner controlled. SecureStore's account-specific pending key is not a replacement for the server's authenticated identity check.

## 2. Keep a delivery intention in the same transaction as the message

\`supabase/migrations/20261012211000_v3_185_durable_message_delivery_intent.sql\` adds a private, server-owned table \`busy_mini_app_message_delivery_outbox\` with one row per actual message, a scoped recipient role, and a state: \`pending\`, \`submitted_unverified\`, or \`no_submission_evidence\`. A new server-only \`busy_send_mini_app_message_v3185\` wraps the V3.184 locked message/unread/status transaction, then inserts or reuses the matching outbox row **in that same transaction**. Any failure rolls back both the message and its notification intention. The previous direct service-role entry point is revoked.

After commit, the Edge function attempts push dispatch. Its separate \`busy_record_mini_app_push_submission_v3185\` function records a bounded number of submitted tokens and attempt count. The existing Expo push helper returning a positive \`sent\` count means at most **submitted to the provider**, not displayed on a device. The ledger always explicitly returns \`providerDeliveryVerified:false\` and \`customerReceiptVerified:false\`. No automatic resends, remote calendar writes or email/campaign sending have been introduced.

**Important real-world gap:** An Edge crash between committing the message/outbox and attempting the push can leave the outbox \`pending\`. A lost/uncertain provider acknowledgement can similarly leave ambiguous delivery evidence. Pending items are surfaced for owner review; no background retry worker has been enabled. Replaying the identical saved message does not automatically trigger another push because that could duplicate an already delivered notification. A guarded worker with real provider receipts, reconciled delivery-state transitions and a deliberate retry policy remains a future project.

## 3. Show operational evidence without overstating success

\`src/core/messageDeliveryEvidenceV3185.mjs\` uses a bounded, authenticated, business- and app-scoped snapshot of the new outbox. It identifies pending notifications, those pending longer than an hour, those with no submission evidence and those submitted to a provider but not independently confirmed as received. It returns only counts and a recommended next owner review; no text, phone numbers, emails or recipient identifiers.

The private Business App Brain panel displays these counts, explicitly distinguishing **a saved message from successful notification delivery**. Only the last 100 rows are inspected at a time; it marks the result partial when that limit is reached.

## 4. Repeatable intelligence and architecture measurement

The existing source survey \`scripts/track-intelligence-v3183.mjs\` now covers **13** identified code-level capabilities. V3.185 adds secure retry handling and notification-submission evidence to the previously identified Business Brain, design learning, Get Paid, booking, messaging and staging areas. Each survey entry checks code implementation, a route into the actual app/service and existence of a focused test. It still **does not** measure actual model IQ, real customers helped, quality uplift, achieved sales or self-training.

The large AppController remains significant. Instead of rewriting it, this sweep puts the new privacy/retry policy into a pure independently tested core module and expands the server's existing transactional message service. Maintain the principle: stronger foundations alongside tangible functional development.

## 5. Verification

\`staging/ci-message-delivery-outbox-v3185.sql\` runs after earlier PostgreSQL 17 booking and chat rollback tests, then tests the live SQL with:
- Direct authenticated-role permission denial.
- Exactly one outbox entry across repeated message sends.
- Owner/customer recipient-role separation and business scope.
- Submission counts being explicitly unverified delivery.
- Injected outbox failure rolling back message, unread and status.

\`scripts/check-message-integrity-v3185.mjs\` checks the encrypted storage adapter with a simulated app relaunch, repeated send, different text, account/role separation, storage failure, UI/server wiring and private delivery-evidence aggregation. It runs alongside all prior source tests and Expo exports for iOS/Android, including standalone apps.

Passing disposable SQL and source/native exports is **not** proof of a signed mobile installation, live Supabase authentication, a real two-tenant staging test, push-provider final delivery, work completed, or money earned.

## Staging and approval boundary

Read-only Supabase inspection on 12 October 2026: isolated project \`pnjdlogwegnqbsfpcofw\` is ACTIVE_HEALTHY, with the unchanged two-row RLS canary, two recorded canary migrations and **zero** application Edge Functions. The full Busy application schema has not been installed there. The migration package includes every committed SQL migration plus the isolated-staging-only base business schema, SHA256 manifest and migration risk signals. It is **not** a runnable unattended production upgrade or permission to install.

Before installation: independently verify the exact target project, scope, backup/recovery, full ordered migration sequence, extensions and permissions; then obtain **separate express owner approval** for that isolated staging installation. No SQL was applied to the hosted project in V3.185.

## Next substantial sweep — V3.186

Recommend reviewing the actual isolated-staging installation prerequisites and arranging explicit approval before any schema changes. After safe installation, use fictional owners/customers to verify: enquiry, first reply, ambiguous-timeout retry, closed request refusal, notification intent evidence, booking, cancellation, Work persistence and two-tenant isolation. Add provider receipts and guarded reconciliation before claiming actual push delivery.
