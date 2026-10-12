# Busy Does It V3.181 — durable Work bookings and isolated-staging installation readiness

Branch: \`v3.181\`, started from passing \`v3.180\`.

## Changes actually committed

### Transaction-backed Business App → Work calendar

\`supabase/migrations/20261012193000_v3_181_durable_work_booking_ledger.sql\` adds
\`busy_mini_app_work_bookings\` with tenant ownership, one booking per original request, date/time, timezone, stable action/customer reference, confirmed/cancelled state, creator, audit timestamps and server-only access. The new \`busy_mark_mini_app_request_link_v3181\` wrapper invokes V3.180's locked/atomic request-link-event-unread handler, then writes/reviews the durable Work booking **in the same transaction**. A failed ledger write aborts the preceding request changes. Exact repeats reuse one record; a cancellation moves that same record to a durable cancelled state. Conflicting date/action replacement fails rather than silently moving an appointment. Date/time does not imply an independent Google or Apple Calendar receipt.

Once the new wrapper is installed the direct service-role execute permission for \`busy_mark_mini_app_request_link_v3180\` is revoked to prevent bypassing the ledger. An authenticated Edge owner/admin identity and membership must still be validated. SQL does not contact external providers.

The existing Edge \`mark_request_linked\` now requires the new RPC; no non-transactional fallback is permitted. \`update_request_status\` also routes closure of *linked* booking requests through the atomic Work path and blocks new booking acceptance via a status-only update. An owner-status refresh failure **after commit** is handled as a committed write awaiting snapshot refresh, not as permission to repeat a potentially successful booking.

### Work calendar and Work overview

Private authenticated \`owner_status\` now returns a bounded Work ledger snapshot (up to 200 records, with truncation flag). The main app's calendar intelligence and Work overview reconcile the saved ledger against device/customer snapshots. This avoids duplicate saved bookings and hides cancelled server records even if an old local snapshot still says Confirmed. Missing device copies can be shown as server-backed Business App records, and tapping one navigates to the Business App review instead of a nonexistent local customer action. Owners see unmatched/mismatched counts and explicit external-calendar evidence limits.

Ledger records and customer drafts are from the same owner-scoped business. This is not continuous push synchronization, not an authoritative Google/Apple sync, and **not a guarantee that an owner's separate cloud customer snapshot was saved**. Source-list limits and sync lag are flagged for review. External events are not automatically sent or modified.

### Business Brain measured results

\`src/core/durableWorkOutcomeEvidenceV3181.mjs\` compares recently stored owner-scoped Business App request statuses against the new saved Work ledger, surfaces accepted requests missing saved Work records and cancelled requests with active Work entries, and suggests a bounded human review. These are actual stored-row results, not proof that a customer received a message, a job was completed, revenue was earned or an AI model automatically retrained. No cross-tenant learning or automatic owner/customer edits occur.

## Isolated staging — currently NOT installed

Live, **read-only** Supabase inspection of the single intended staging project on 12 October 2026:
- Project **Busy Does It Staging**, ref \`pnjdlogwegnqbsfpcofw\`, PostgreSQL 17, health ACTIVE_HEALTHY.
- Only \`public.busy_staging_rls_canary\` exists under public, with its existing two canary rows and two previously recorded canary migrations.
- Zero deployed Edge Functions.
- Available extension inspection: \`pgcrypto\` installed; \`pgmq\`, \`pg_cron\` and \`pg_net\` available but **not installed** at the time of inspection.
- No application migration was run; no existing canary was changed; production was untouched.

The repository contains an optional **read-only** SQL audit: \`staging/ISOLATED_ONLY_readiness_v3181.sql\`. The existing \`scripts/prepare-staging-install-v3180.mjs\` generates a reproducible, numbered, SHA-256-manifested package containing the missing staging-only business core baseline and all repository SQL migrations, including V3.181. This is a **preparation package**, not a command to blindly apply every file.

Before any staging installation, independently confirm the exact project identity, snapshot/backup the existing staging state, inspect missing extensions, migration prerequisites, grants and all cron/worker/provider configurations, and review the install sequence and recovery plan. **Separate express approval is required** before adding tables/migrations, enabling extensions or deploying Edge Functions to the actual staging project. Never repoint this to production or delete the existing canary by default.

## Verification

\`.github/workflows/durable-work-staging-v3181.yml\` runs a disposable PostgreSQL 17 test that loads V3.180's real baseline/mini-app SQL then V3.181's ledger migration, including role privilege denial, cross-business refusal, confirm/replay, cancel/replay and deliberately failing a ledger insert *after* request/link/event writes. The failure must roll back the complete change.

\`scripts/check-durable-work-v3181.mjs\` covers cross-tenant view rejection, local/server mismatch detection, cancellation, server-only recovered bookings, privacy, source enforcement and staging audit being read-only. Earlier regression suites and main/standalone iOS/Android export checks are run as separate CI steps.

These checks are not live staging Auth/JWT tests, Apple/Google provider receipts, signed installation builds, phone screenshots, actual customer transaction evidence or a public release. They must be completed in the staged end-to-end test phase.

## Priority after this sweep

1. Request explicit approval for **isolated staging only** after a full extension/migration and backup review; install reviewed schema/Edge Functions there, not production.
2. Verify owner and customer sign-ins using independent real test JWTs with two tenant boundaries; run actual booking, cancellation, retries, guest enquiries, customer messages and denial conditions.
3. Persist/reconcile the native Busy Work customer snapshot and external calendar provider receipt using a separately authenticated durable sync/outbox pipeline; never treat external delivery as verified before receipts.
4. Continue making Busy learn from measured outcomes (pending, answered, attended, completed, paid) with consent, truthful attribution and owner-controlled improvements.
