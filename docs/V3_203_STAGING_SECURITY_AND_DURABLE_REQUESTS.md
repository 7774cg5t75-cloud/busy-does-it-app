# V3.203 — Staging Security, SQL Risk Audit & Durable Customer Requests

**Base:** V3.202 verified. **Scope:** source code, source review, offline/mock checks, four unsigned exports. No SQL migration, Edge deployment, customer record creation, real notification, live booking or provider charge.

## 1. SQL safety: review the actual migration statements

The complete 64-migration isolated-staging package is verified against GitHub source and inspected by `stagingSqlRiskLedgerV3203.mjs` and `audit-staging-risks-v3203.mjs`. The generated local operator report lists **migration file + category + exact line numbers**, deliberately omitting SQL snippets containing private data or credentials. Categories include cron scheduling, external HTTP, extensions, security-definer routines, grants, RLS policies, dynamic SQL, destructive statements and secret sources.

This is a *signal detector*, not a full parser or a claim that migrations are safe or ready to execute. In particular, jobs/callbacks and network extensions must be explicitly neutralised through independently reviewed staging-only plans; the tool never automatically rewrites and then runs scripts.

The read-only `staging/READ_ONLY_v3203_post_phase_attestation.sql` prepares independent verification after each future authorised deployment phase. It reports table-level RLS and grants, privileged RPC EXECUTE access for different roles, uniqueness constraint presence, installed extensions and preservation of the two canary rows. **It does not install or repair anything.**

## 2. Real, authenticated two-business access test (prepared, not executed)

`stagingTwoTenantAppProbeV3203.mjs` and `scripts/run-staging-tenant-app-read-v3203.mjs` use a no-op default. Explicit invocation requires two independently authenticated, fictional staging owners and business UUIDs, distinct ephemeral access JWTs, a staging publishable key and explicit approval. It:
- Verifies both JWT identities from the staging-only Supabase Auth endpoint.
- Checks each owner can use **read-only** `owner_status` for their own specifically named synthetic, private business.
- Only after both succeed, tests that each owner is blocked from the **other** workspace.
- Never sends `submit_request`, `build_draft`, `publish`, messages or paid-provider calls, and never outputs JWTs, customer rows or profiles.
- Treats a published/discoverable app or a mismatched business as a failed rehearsal.

Even a successful two-tenant read test would not yet prove request-write isolation or live customer delivery. At present staging still lacks the Business App schema and isolated Edge deployment, so this check is **prepared but not runnable**. Never copy credentials into chat or GitHub.

## 3. Dependable live-path request processing (source improvement)

Review of the existing server-side `submit_request` path revealed a meaningful durability problem: a new request could commit, but a subsequent tracking, event or notification exception could cause a misleading failed response. It now:
- Returns an explicit **saved request** after the database insertion succeeds, keeping event recording, notification attempt and notification delivery as separately honest statuses.
- Avoids triggering a second customer action merely because push/email submission was not independently verified.
- Validates **matching business, signed-in consumer, app, action, and all sanitised request fields** when an idempotency key is replayed, including an insertion race; a different payload using the same key is rejected.
- Checks a genuine existing idempotent replay **before** counting it towards the hourly new-request limit.
- Keeps the same in-memory customer request key across ambiguous network retries, blocks simultaneous duplicate taps, clears that key only after a verified saved response, and describes the result as *saved* rather than *delivered/accepted*.

A failed post-commit event is now surfaced as `eventRecorded:false`; that is a known reconciliation task, **not** proof that the event or notification was completed. The client must show the existing requests screen before retrying an uncertain submission. This is a code path change and needs isolated authenticated staging end-to-end testing before being declared proven with real requests.

## 4. Remaining release gates

- 64 migrations + isolated baseline still need explicit review, backup/restore evidence, scheduling/provider egress safeguards and **separate owner approval** before any install.
- Staging has only the RLS canary today; the V3.199 first-app RPC and main app uniqueness table are not installed.
- Two owner test Auth accounts are present (count verified), but JWT-based tenant app read tests and two-account cross-scope assertions have not run against live staging.
- No actual first-app creation race, customer submission, owner inbox, notification receipt, Work booking confirmation, real-device task or accessible screen test has been independently verified.
- The offline regression includes adversarial mock tenant and idempotency cases; it does not establish cryptographic identity or provider delivery.

**Guiding rule:** When Busy says something is done, distinguish the persisted business outcome, authenticated readback, owner action, provider receipt and customer completion. Never report downstream actions as successful merely because earlier operations saved.
