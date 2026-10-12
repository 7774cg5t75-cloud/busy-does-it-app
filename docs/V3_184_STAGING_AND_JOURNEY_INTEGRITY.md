# Busy Does It — V3.184 Staging Safety & Real Customer Journey Integrity

Development branch: \`v3.184\` based on last fully verified \`v3.183\`. No production or hosted-staging changes were authorised by this development sweep.

## What changed

### 1. The actual request conversation becomes atomic

\`supabase/migrations/20261012200000_v3_184_atomic_customer_conversation.sql\` adds a privileged but server-only \`busy_send_mini_app_message_v3184\` PostgreSQL RPC. It locks a business-scoped request, independently verifies business owner/admin membership or original signed-in customer identity, refuses guest-web in-app messaging and closed requests, requires a bounded idempotency key, and stores the message, any status/received→reviewing history event, and unread counter in **one database transaction**. Replaying exactly the same key+text creates no additional message or unread, and using an existing key with changed text fails rather than silently overwriting.

The two Edge paths \`send_request_message\` and \`reply_request_message\` now share \`supabase/functions/busy-mini-apps/atomicConversationService.mjs\`. All customer/business push notifications are attempted **after** the database commit and cannot be represented as independently delivered. A post-commit owner-status read failure returns the committed receipt and \`statusRefreshRequired\`, not an error inviting an unsafe resend. The native UI says **saved in BUSY**, not falsely “delivered”.

**Still outstanding:** client-generated request keys should be persisted across an app restart or ambiguous transport failure to make manual post-timeout retries reliably idempotent. The existing client constructs a fresh request key for new send attempts; the server deduplicates **retries with the same key**, not all repeated messages with similar words. Background provider delivery receipts, outbox retry/recovery, and external notifications remain unverified. No customer or provider messages were sent during this code sweep.

### 2. Business Brain checks actual stored conversation/customer journey milestones

\`src/core/storedJourneyCheckpointsV3184.mjs\` compares a **bounded, authenticated business-scoped snapshot** of stored requests, owner/customer conversation-message metadata, request links and confirmed/cancelled BUSY Work records. It reports counts of requests awaiting an owner reply, saved business/customer replies, guest requests requiring external contact, owner-confirmed Work bookings and contradictions requiring review. It produces bounded private summaries and never exposes message contents, customer names, phone numbers, addresses or revenue.

\`ownerStatus\` retrieves only business-scoped message IDs, request IDs and sender role for this purpose, capped to recent 150 rows. The private Business App review displays these metrics with explicit **truncation warnings**. They are stored database facts, not email/push delivery, completed jobs, generated sales or measured AI accuracy. There is no automatic customer follow-up or cross-business learning.

### 3. Staging migration package safety audit

\`src/core/stagingMigrationRiskV3184.mjs\` performs a read-only, deterministic **pattern-based triage** of the committed SQL sequence: extensions, cron/schedulers, network calls, secrets/keys, privileged SQL routines, grants/RLS and destructive SQL. It is **not** a complete SQL parser or proof of security. It identifies which files require a human to inspect their side effects.

\`scripts/prepare-staging-install-v3180.mjs\` still only produces ordered numbered SQL files and SHA-256 checksums. It now also writes \`review-signals.json\`, includes category totals in \`manifest.json\`, and explicitly marks unreviewed risks. It does not create extensions, connect to Supabase, execute SQL or deploy Edge Functions.

As of the last read-only Supabase check, the target **Busy Does It Staging** project \`pnjdlogwegnqbsfpcofw\` was ACTIVE_HEALTHY, contained its original two-row RLS canary, two historical canary migrations, and no application Edge Functions. \`pgcrypto\` was installed; \`pgmq\`, \`pg_cron\` and \`pg_net\` still need independent enabled-state review before any installation. **No staging installation or cleanup has been performed.** The original canary remains untouched.

Before moving to hosted staging, obtain separate express permission to install, independently verify the target project ref and role, review the migration effects and required extensions, take/test a backup/recovery route, inspect all RLS and service-role grants, and use fictional two-business accounts with proper Auth JWTs. An offline positive result is not a substitute.

### 4. Repeatable engineering and intelligence tracking

\`scripts/track-intelligence-v3183.mjs\` has been extended to track **eleven representative capabilities**: original eight owner/website/app/Work modules plus transactional conversations, stored journey checkpoints and safe staging migration review. Every capability is measured as source present, integrated into an owner or server path, and covered by a corresponding test file.

Counts are physical code lines in the defined extensions, including comments and blank lines; they are **not** an IQ score, automatic model retraining, provider availability or proof a business achieved its goal. Use the same script across versions for comparisons.

## Verification boundary

\`.github/workflows/staging-customer-journeys-v3184.yml\` runs a disposable PostgreSQL 17 job via \`staging/ci-atomic-conversations-v3184.sql\`. It first replays the prior booking/Work rollback fixtures, then exercises the real new SQL with owner/customer scope denial, unread/event updates, idempotent replays, conflicting payload rejection and deliberately failing an event insert to verify atomic rollback. It also runs focused JavaScript checks, previous regressions and Busy/standalone iOS/Android Expo exports.

The actual CI result and SHA should be checked from GitHub Actions after the final commit. Export success is not a signed installed binary or physical-device proof; the disposable PostgreSQL database is not the real staging database.

**Next priority:** after separately approved isolated-staging installation, verify actual complete owner/customer request → saved message → confirmed Work booking → cancellation and recovery, including two-account tenant denial and provider delivery receipts. Continue measuring Busy's success at completing requested customer outcomes rather than adding speculative features.
