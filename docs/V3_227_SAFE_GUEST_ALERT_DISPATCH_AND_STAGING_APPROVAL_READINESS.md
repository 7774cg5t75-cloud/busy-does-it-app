# Busy Does It — V3.227 Safe Guest Alert Dispatcher and Staging Approval Readiness

**Base:** V3.226. **Implementation status:** completed GitHub source development, disposable PostgreSQL tests and no-network static/regression checks. Source-only dispatcher is **disabled** and **not deployed**, no hosted schema installation or production mutation has been approved.

## Mandatory dual-master preflight

Before creating branch V3.227 we located and reviewed the **latest saved Word product master V22.8 — Automatic Search Visibility Check**, plus GitHub ARCHITECTURE.md, engineering sweep policy, V3.226 report and exact notification outbox schema. Prior V3.226 referred to V22.6; the newer saved product master now includes V22.7 commerce/verified-customer-success guidance and V22.8 default search-visibility handoff to Get More Customers. No product feature, tier, entitlement or budget decision was changed during V3.227. The Word master is intentionally left unchanged; this technical checkpoint belongs to the GitHub technical master.

Product-master compatibility: reuse one shared customer Business App/request database; prove customer-facing outcomes before promising completion; keep approvals, business ownership, portability and fair credits; let Get More Customers reuse owner-approved website search assessments and Brand DNA, without creating a second marketing engine. The latest SEO/search-visibility addition remains on the roadmap but does not displace this release-critical customer-request work.

## Real functionality added to source

**Versioned SQL migration:** supabase/migrations/20261014170000_v3_227_guest_alert_dispatch_leases.sql extends the existing V3.226 pending notification-intent table; it does not create another request database. It adds:

- An atomic **service_role-only** claim function, one eligible intent per transaction via **FOR UPDATE SKIP LOCKED**, a random lease token, 90-second lease and up to three attempts.
- A lease-token-checked complete/acknowledge function. Valid gateway acceptance requires a bounded SHA-256 receipt digest; a *definitively rejected* provider response can receive a ten-minute bounded retry, while unknown provider results always become **manual_review**.
- A separate service-only expired-claim quarantine function. **Expired claimed work is never automatically reclaimed**, because the provider might have accepted an earlier send before our acknowledgement was lost.
- Security-invoker functions with explicitly schema-qualified table access and restricted EXECUTE grants. No SECURITY DEFINER, public/anonymous/authenticated client access, cron or HTTP provider invocation in the migration.

**Notification sender SOURCE:** supabase/functions/busy-mini-app-guest-alert-dispatch/index.ts plus dispatchReceiptV3227.mjs. A new private POST-only Edge function is disabled unless the explicitly named enable flag is TRUE and a long separately configured shared worker secret is verified. Even then it processes **at most one** database-leased alert per authorised call. It checks original guest request scope and current business owner/admin membership, fetches up to 20 ACTIVE owner-device tokens, and prepares a small, non-customer-PII Expo push; timeout is 12 seconds. Missing/invalid gateway responses become **uncertain**, not blindly resent. Provider ticket “ok” is recorded as **accepted by gateway**, not delivered to an actual device; database completion persists only a hash of tickets, not device tokens/contact data. A failed completion leaves an expired lease for manual review. There is **no scheduled invocation and no deployment/activation**.

The worker requires separate provider account, network, device and security integration testing before activation. Per-owner partial ticket errors and Expo delivery receipts should be upgraded to fully reconciled per-device delivery tracking before claiming reliable notifications across every device. The database gate does not independently verify an external gateway's receipt content; the authorised Edge worker must do that.

**Owner UX:** Existing owner/admin-only `owner_queue_summary` endpoint now counts the four not-yet-accepted guest-alert states: pending, retry_wait, claimed, manual_review. New ownerGuestAlertEvidenceV3227.mjs produces one plain-language action, with distinct warning when manual attention is required. The original mobile Business App inbox now says **“Alerts awaiting provider confirmation”**, rather than incorrectly suggesting a pending counter can prove delivery. No new navigation, custom CRM, background polling or unsolicited customer message.

## Actual automated verification

- **122 focused dispatcher/owner/security assertions** in scripts/check-dispatch-v3227.mjs; **16 focused staging approval/source gate checks**. Inherited V3.226/V3.225/V3.224 suites remain active.
- **Actual disposable PostgreSQL 16 integration run passed:** this assembles the existing V3.225 original guest request RPC and V3.226 atomic intent trigger, adds the *actual* V3.227 migration, then checks two simultaneous worker claims receive different request/tenant/lease IDs; no third claim; wrong lease and malformed receipt cannot confirm; correct gateway-accepted acknowledgement persists an SHA and cannot be repeated; a definite provider rejection causes bounded delayed retry, then a new lease; uncertain outcomes cannot auto-retry; expired claim is quarantined; existing two customer requests remain intact. The run ends with full **ROLLBACK** and emits V3.227_DISPATCH_LEASES_AND_NO_DUPLICATE_SEND_PASS and V3.227_EPHEMERAL_DISPATCH_ROLLBACK_PASS.
- Inherited staging and source audits now explicitly account for **66 versioned SQL migrations plus one separate isolated-only business baseline**, without bypassing security checks. Both V3.227 source CI jobs initially completed successfully after implementation; the final GitHub commit result must be checked separately before making a final claim. No paid signed builds, AI credits or real providers were used.

These tests demonstrate the SQL transaction and state machine, **not real Expo acceptance, device delivery, signing, live tenancy auth/JWT, deployed rollback or real hosted staging requests**.

## Isolated staging state and approval gates

On **14 October 2026**, a fresh read-only connected Supabase query of isolated project pnjdlogwegnqbsfpcofw still returned only **busy_staging_rls_canary** (RLS enabled) and original canary migration history **20261010224121** and **20261010224205**. Not a single Business App request/outbox/dispatcher migration is installed in that hosted project. No customer or token rows were read.

scripts/prepare-staging-gates-v3227.mjs writes a source-checksummed, **non-executable** approval review JSON in `/tmp/bdi-v3227-staging-gates`, with the exact dependency order and separate gates: fresh project identity/schema/ledger check; complete versioned migration and extension/cron/privilege review; actual disposable backup/restore; real signed-in owner A/B and revoked-member JWT tests; original guest request and owner inbox end-to-end proof; source-hash match and **phase-specific explicit owner approval**. It grants no automatic installation permission or rollback SQL. The older historical canary snapshot is treated as stale until a fresh authorised live readback.

**Not performed:** hosted SQL install, Edge deployment, enabling the worker flag, worker-secret provisioning, scheduling, provider calls, customer requests, publishing, public native website forms, real Auth/JWT isolation tests or paid native signing.

## Quality and next highest-value V3.228

Prioritise a reviewed actual **isolated staging-only** business/request backend installation, after explicit owner approval and a valid recovery rehearsal, then real guest browser → same-business owner queue → pending alert → one authenticated dispatcher test with a sandbox/approved provider. Strengthen per-recipient push receipts and unknown-result reconciliation before enabling recurring sends. Continue shared Website Builder + Get More Customers search-visibility handoff and broad reusable Business App capabilities as specified by product master V22.8. No duplicate providers, customer stores or learning engines.

**North star:** Busy reliably completes real work, respects owner permission, and tells the truth about what was saved, submitted, accepted and actually delivered.
