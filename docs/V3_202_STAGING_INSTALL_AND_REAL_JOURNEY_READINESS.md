# Busy Does It V3.202 — substantial staging installation, tenant/Auth verification and customer-journey readiness

**Base:** V3.201. **This sweep is source changes and a live read-only inventory only.** It has NOT installed a database migration, deployed an Edge Function, signed an app or submitted a real customer request.

## 1. Live staging state — independently observed on 13 October 2026

Read-only inspection of **Busy Does It Staging**, project ref `pnjdlogwegnqbsfpcofw`, recorded at **2026-10-13 07:53 UTC**, confirmed:

- Public tables: **one**, `busy_staging_rls_canary`.
- Canary: **two fictional rows**, RLS enabled **and forced**, **one policy**.
- Auth identities: **two existing users** in `auth.users` (aggregate count only; individual sign-ins were not performed in this sweep).
- Table grants: anonymous cannot SELECT the canary; `authenticated` has SELECT, subject to RLS.
- Relevant extensions: **pgcrypto only**; `pgmq`, `pg_cron` and `pg_net` are absent.
- Migrations ledger: `20261010224121 staging_canary_owner_read_v3130` and `20261010224205 restrict_staging_rls_event_helper_v3130`.
- Missing: business core, public business profiles, all Business App/request/Work tables, the V3.199 first-app RPC and its unique main-app index/constraint.
- No production credentials, customer rows or identifying Auth records were retrieved.

This is a dated, read-only database inspection. It does **not** prove genuine JWT owner-to-owner isolation or successful customer delivery. The captured non-sensitive facts are in `staging/recorded-readonly-observation-v3202.json`; they must be refreshed before any installation.

## 2. Dependency-ordered installation sequence — 65 source SQL files

`src/core/stagingInstallSequenceV3202.mjs` and `scripts/audit-staging-install-v3202.mjs` validate the complete, unchanged offline staging package, examine all **64 chronological repository migrations**, and prepare four operator-review phases:

1. Staging-only `busy_businesses`/membership compatibility baseline.
2. Website and preceding platform dependencies.
3. Business Apps, customer requests and related platform changes.
4. Later atomic Work, conversation, delivery and first-app creation changes, including V3.199.

The planner checks for unexplained pre-existing tables or migration ledger entries and fails closed. Each phase includes a list of flagged migrations and categories such as SQL privilege changes, privileged routines, cron schedules, network calls, extensions, secret references and destructive patterns.

The generator writes an offline operator manifest under `/tmp/bdi-isolated-staging-v3180/v3202-operator-sequence.json` in CI. **Risk detection is not a full SQL audit.** A passed manifest never grants permission to apply migrations.

Required human gates: migration-by-migration security review, staging-only outbound/cron side-effect isolation, permission review for `pgmq`/`pg_cron`/`pg_net`, reliable backup/restore test, canary preservation, prior ledger reconciliation, separate user approval, then isolated phase-by-phase deployment and verified RLS/JWT/transaction checks.

## 3. Stronger authenticated tenant isolation checks

`scripts/run-staging-auth-evidence-v3202.mjs` provides a **no-op by default**, manually gated `--verify-read-only` mode. It reuses the existing independent two-owner staging Auth/PostgREST probe (`scripts/lib/stagingSupabaseAuthV3128.mjs`) and hard-codes the actual staging host and separate protected project refs.

It requires owner A/B JWTs, distinct UUIDs, a separate rejected session, a staging publishable key, immutable fictitious canary IDs, source SHA and explicit manual approval through transient environment variables. **Never commit or paste JWTs into a chat.** The runner only performs GET reads against Auth and the canary. It proves that both signed-in test users can identify themselves and see only their own canary records, while the other owner's row and unauthenticated access are denied. It reports only redacted pass/fail observations and HTTP statuses.

In this development sweep no such JWT-enabled live probe was run: existing user *counts* are not equivalent to authenticated identities.

## 4. Better private Business App staging safety

`src/core/stagingActionGateV3202.mjs` and `src/screens/miniApps.js` now **disable the staging synthetic write button** until BOTH:

- A current, independently authorised staging connection probe passes for the exact business ID, private app ID and draft revision.
- The read-only isolated staging installation audit reaches its complete set of five expected tables for the **same** app revision.

A changed app revision resets connection, installation and synthetic-write status. The UI rechecks eligibility before asking for an owner confirmation. The trusted Edge endpoint retains its own required staging environment, membership and revision checks — the client safety gate never replaces server authorisation.

`src/app/AppController.js` now preserves the already-validated business ID, app ID and draft revision when returning connection evidence. The gate does **not** send a customer request, message, diary booking or paid provider call.

## 5. Exact plan for real task verification — NEXT isolated test milestone

After installation and separate explicit owner authorisation:

- Verify actual owner A / owner B JWT identities and both-way denial on the canary, followed by tenant-scoped app tables and denied write attempts using separate accounts.
- Create a strictly fictional business/workspace and independently scoped customer account(s), with real email/push channels disabled by default.
- Run the V3.201 manual first-app race once and directly verify its unique private DB row and version. It creates a synthetic private draft only.
- Test a **separately approved staging-only preview/live app endpoint** for `enquiry` and `booking_request` through all supported entry routes; don't silently point customers at production.
- Record original request persistence, exact idempotency replay, owner inbox, customer readback and reply path, with signed receipts and complete tenant-scoped data. Distinguish a saved reply from delivered customer notification.
- Verify Work booking transitions and independently confirmed diary booking without pretending a request is automatically accepted.
- Validate phone/tablet/accessibility and provider receipt delivery separately. Nothing automatically publishes, bills or sends messages.

V3.201's `stagingRequestReadbacksV3201.mjs` is ready to classify those **future** authenticated request receipts. No result from a fictional fixture is presented as independent live evidence.

## Verification

The dedicated V3.202 workflow runs the new regression suite, V3.201 and previous builder regressions, an offline 65-file source-integrity and operator plan, source parsing and **four unsigned JS exports** for Busy and the standalone app prototype.

**North star:** Busy doesn't merely display “done”; Busy knows which real action was completed, what the backend saved, what remains unverified and what still needs the owner's decision.
