# Busy Does It — V3.187 Staging Handover & Customer Outcome Proof

Base branch: \`v3.186\`. Development branch: \`v3.187\`. This sweep has **not** deployed SQL, changed hosted staging, used paid providers or touched production.

## Improvements committed

### 1. Business Brain: actual saved evidence instead of “completed task” assumptions

\`src/core/customerOutcomeProofV3187.mjs\` evaluates the same owner-scoped saved requests, replies, request-to-customer links and BUSY Work rows. It differentiates request received, owner response saved, customer response saved, confirmed BUSY Work entry, cancellation and contradictory states. It returns **counts and safe owner review steps, never customer names, message bodies or cross-tenant data**.

A stored owner reply isn't proof the customer received it; a confirmed BUSY Work record isn't proof the customer attended or paid. The evaluator deliberately returns no overall task completion rate or fake revenue. It flags samples capped by recent-row query limits so “zero problems found” does not imply all historical requests succeeded.

The private Business App Brain review now shows these distinctions in simple language alongside the existing prioritised owner recommendations. It does not send messages or automatically modify customers or bookings.

### 2. Website, Business App and Work coordination without forcing one design

\`src/core/connectedCustomerJourneyV3187.mjs\` combines **already-scoped** private website/app draft-review findings with the saved customer proof ladder. It requires current website and app revision values and the same business identity. It prepares a bounded set of tasks to check approved shared facts, accepted bookings missing Work entries, enquiry replies and the full website/app route. It never sends a customer message, moves an appointment, copies descriptions, publishes changes or changes either design automatically.

The Business App editor shows a small “One joined-up customer journey” review for the current revisions.

### 3. Isolated staging — genuine installation-blocker matrix

\`src/core/isolatedStagingRunbookV3187.mjs\` produces a strict, **non-executable** checklist of project identity, SHA-256 installation package, required extensions, SQL side effects, verified backup restoration, membership/Auth/RLS roles, existing migration ledger, staging-only Edge secrets and explicit, separate owner approval. It also defines the true signed-JWT test scenarios required after installation.

\`scripts/plan-isolated-staging-v3187.mjs\` checks the actual repository-generated SQL package and outputs an **offline, dated snapshot**, never claims live access to Supabase, and cannot apply migrations. Do not treat script outputs or an all-green set of user-supplied booleans as genuine independent authority to install.

#### Read-only hosted facts observed 12 October 2026
- Intended project only: **Busy Does It Staging**, \`pnjdlogwegnqbsfpcofw\`, ACTIVE_HEALTHY, London \`eu-west-2\`.
- Under public: original \`busy_staging_rls_canary\` with two fictional records; app tables are **not installed**.
- Exactly two historical canary migrations; no Busy application migrations applied.
- No Edge Functions deployed.
- \`pgcrypto\` installed. \`pgmq\`, \`pg_cron\` and \`pg_net\` available but **not** installed (read-only SQL verified this sweep).

Before installing, independently recheck project identity, review extension safety/roles and every migration's side effects, create and test a staging-only backup/restore, reconcile the existing canary migrations, and review Edge secrets/callback URLs. **Do not blindly execute the package or reset any existing canary.** Installation requires explicit, separate approval and is never authorised by this document.

### 4. Full customer journey exercised in one disposable PostgreSQL database

\`staging/ci-full-customer-journey-v3187.sql\` starts with the V3.185 disposable-PostgreSQL fixtures, then adds a new fictional customer request and exercises:

1. Owner reply → atomic message, review state, unread and durable notification intent.
2. Customer reply → second saved message and owner notification intent.
3. Ambiguous exact-repeat reply → no duplicate message.
4. Owner booking draft → approved confirmation in BUSY Work.
5. Exact booking-confirmation replay → no duplicate Work row.
6. Cross-business owner attempting cancellation → denied.
7. Authorised booking cancellation → both request and Work ledger closed.
8. Attempt to message a closed request → denied.

This is *real SQL transaction testing*, not a hosted Supabase run with real signed JWTs. It doesn't verify a real consumer-device rendering, an external booking provider, push delivery or revenue.

### 5. Architecture and intelligence baseline

The targeted approach continues: isolate new outcome/coordination/staging logic in small independently testable modules rather than growing the large main app controller or launching a high-risk rewrite. The existing \`scripts/audit-architecture-v3183.mjs\` remains in regression coverage.

\`scripts/track-intelligence-v3183.mjs\` now surveys **19 representative capabilities**. The three new ones are owner-scoped customer outcome proof, connected website/app/customer journey advice, and the staging-review gate. Its methodology is unchanged: physical lines of selected code extensions (including blanks/comments), source existence, wiring and test presence. **It is not IQ measurement, model retraining or proof of customer satisfaction.** Rerun for precise latest-commit code-size counts.

## CI / release boundary

\`.github/workflows/outcome-staging-v3187.yml\` exercises the full fictional PostgreSQL 17 journey, focused proof/coordination/staging tests and inherited regressions, syntax/import checks, and the main and standalone iOS/Android Expo exports.

A successful source/export test still does not make BUSY release-ready. Release remains blocked by hosted signed-JWT tenant tests, full staging installation and recovery, real provider receipts, independent Work/cancel reconciliation, app distribution signing, security/privacy/billing gates and explicit founder approval.

## Next controlled milestone

The next highest-leverage step is to obtain separate approval for an **isolated staging-only** installation after reviewing exact migration side effects and backup/rollback. Then use two fictional businesses with independently authenticated owners and customers to verify a real enquiry → reply → booking → Work → cancellation path, including repeated requests and denial boundaries. Do not install onto production or treat the current successful disposable tests as equivalent to hosted end-to-end verification.
