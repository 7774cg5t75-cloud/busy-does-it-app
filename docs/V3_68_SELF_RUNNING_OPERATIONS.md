# V3.68 — Self-Running Operations 1.0

**Status:** development branch `v3.68` only; no production release or subscription charges.

## Purpose

BUSY DOES IT aims to justify a future £50/month customer subscription while requiring progressively less day-to-day intervention from the founder. This sweep establishes **per-business** operational triage, safe read-only recovery, and honest usage visibility before adding any global SaaS administration or full autonomous backend recovery.

## Implemented

- `src/domain/selfRunningOperations.mjs` builds a deterministic low-noise exception digest from **existing** operational continuity, core integrity, hosting, Business App, published-channel results and production watcher signals. Deduplicates identical failures and prioritises genuine human-review requirements separately from self-service issues.
- `src/domain/readOnlyStatusRecovery.mjs` safely retries an authenticated status request **once** after a transient 408/502/503/504 or network failure, with a bounded delay. **Only the three enumerated status actions** are allowed. No publish, schedule, delete, app launch or rollback is retried from the operations view. Permanent permission failures never retry.
- `src/domain/verifiedBusinessActivityCloud.mjs` now preserves HTTP status codes on reporting errors, allowing retry policy to distinguish transient vs unauthorised failures.
- `src/screens/selfRunningOperations.js` provides a dedicated owner-only **Operations & Reliability** dashboard, linked from Home and the Verified Business Activity screen, with status availability, human/automatic handling boundaries, actionable exception drill-downs, and usage counters.
- Health check results are scoped to current owner and business. Late async responses cannot update a different account. Two successive failures are escalated from `watch` to `needs inspection`; one uncertain response is **not** treated as a confirmed outage.
- Website **usage counts** (where returned by existing hosting status) are shown separately from spend. AI bills, cost of storage/hosting, per-customer cost, revenue, active subscriptions and profit/margin remain marked **not integrated**, because we have no approved billing/expense ledger providing authoritative monetary numbers.
- `scripts/check-self-running-operations.mjs` and GitHub CI check temporary vs permanent HTTP failures, authenticated scope, maximum retries, record conflicts, source uncertainty, duplicate alerts, real vs invented costs, and safety boundaries. Prior cloud/Operator/verified activity regressions are re-run.

## What is NOT in V3.68

- **Not a SaaS-wide administrator dashboard:** normal customer accounts must NEVER be able to see other companies' activity, subscribers, revenue or owner costs. A founder-only platform administration service with server-side role checks, audit trail, billing aggregation and access controls is a separate milestone.
- **Not fully autonomous service recovery:** re-reading a failed status response is safe; automatic provider reauthentication, restoring backups, database mutations, website rollbacks, or reposting to social media all have separate authorisation, idempotency, provider and rollback requirements.
- **Not continuous server-side monitoring:** the user-triggered/when-open operations dashboard is not a 24/7 cross-tenant uptime monitor. The existing production watcher and backend scheduled services retain their existing functions; this sweep does not create new unattended schedules, trigger external alerts or claim 24/7 operation.
- **Not subscription enforcement or profit analytics:** the £50/month figure is a commercial quality target, not a live subscription or realised revenue, and no money figures should be fabricated from request counts.

## Operational safeguards

- Browser/app only receives already owner-authorised publishing status from existing authenticated Supabase endpoints.
- **No privileged service-role credentials** or new unrestricted platform-wide tables.
- No hidden retries of publication, scheduling, social posts, email, app launch, website rollback, or backup restoration.
- Reporting errors produce `not verified`, not fabricated `healthy` states. Two repeated reporting failures cause an inspection suggestion, not an automatic customer outage alert.
- Publishing statuses remain evidence from each provider's recorded response; no independent public URL reachability checks are implied.
- Source records may contain customer information. The dashboard only shows bounded, generic exception summaries and no cross-business data.

## Next engineering gates

- [ ] Test real iPhone Expo Go development preview and signed-in current business.
- [ ] Verify status reads, single retry, business switching during request, and 401/403 handling on a live Supabase owner account.
- [ ] Confirm existing cloud-conflict recovery has an owner decision and never merges automatically.
- [ ] Review a real failed social channel and confirm existing owner-approved retry-only-failed logic is preserved.
- [ ] Verify usage counters match provider status fields and show unavailable when no backend telemetry exists.
- [ ] Test native iOS development build once Apple Developer enrolment is complete.
- [ ] Design separately authenticated founder **platform-admin** backend using server-held role IDs, per-tenant aggregate metrics and narrowly permissioned live incident alerts.
- [ ] Add measurable AI/provider cost telemetry with explicit privacy and cost/usage budgets, validated against invoices before enforcing any fair-use or subscription limits.
- [ ] Add independently monitored server-side queue recovery and incident escalation with idempotency keys, controlled limits and real receipts.
