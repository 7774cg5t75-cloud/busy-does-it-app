# Busy Does It — V3.180 Staging installation and atomic customer handoffs

Development branch: \`v3.180\`, based on \`v3.179\`.

## What V3.180 actually changed

### 1. Missing business-core baseline — **isolated staging only**

The 59 historical SQL migrations depended on \`public.busy_businesses\` before it was ever defined in tracked migrations. Backend Auth also depends on \`busy_business_memberships\`. The **staging-only** file \`staging/ISOLATED_ONLY_business_core_v3180.sql\` now supplies the minimal compatible business and owner/staff membership tables, with indexes, FK to Supabase Auth, row-level security enabled and forced, and no anonymous/authenticated direct privileges.

**This does NOT claim to reproduce the original live Busy Does It production schema.** Do not overwrite/alter production to match these tables. Before installing in staging, review all column assumptions, migrations, extension privileges, JWT/Edge behaviour and exact owner/admin role rules. Membership removal is the revocation mechanism for the new baseline.

Current isolated project observed previously: **Busy Does It Staging** (project ref \`pnjdlogwegnqbsfpcofw\`). It already contains the two-owner RLS canary but **not** the Busy application backend. The staging-only canary is not evidence of app tenant isolation.

### 2. Repeatable, checksummed installation preparation

Run locally or in GitHub CI without credentials:

\`\`\`bash
node scripts/prepare-staging-install-v3180.mjs
\`\`\`

The generator creates \`/tmp/bdi-isolated-staging-v3180/manifest.json\`, README and numbered SQL files. Files are in deterministic order: the isolated-staging business-core baseline first, then the complete committed migration sequence, including the new atomic handoff migration. Manifest stores original path, bytes, order and SHA-256 checksum for each SQL file, and pins the **one** intended staging project ref.

No server, API, SQL connection or provider deployment is attempted. The package is a reviewed-installation input, not a one-click production migration. If even one file changes, its digest changes; regenerate and review rather than silently reusing an old plan.

**Manual installation gates — separate explicit permission required:**

1. Verify the project is *exactly* \`pnjdlogwegnqbsfpcofw\` using the independent connected Supabase project identity; confirm this is NOT either existing production project. Confirm billing and backups. No default authorisation to apply.
2. Reconcile the staging migration ledger, existing two-owner canary and any pre-existing objects. Capture a database schema/roles snapshot. Do not reset or drop the canary.
3. Review baseline core-business and membership permissions against the real Auth identities. Review every migration for extension availability (including pgmq, pg_cron, pg_net), cron configuration, storage buckets, secrets, external URLs and any destructive SQL. **Do not run a blind concatenated SQL bundle**.
4. After authorised isolated staging installation, deploy compatible Edge Functions to *staging only*, with distinct staging-only keys and server-owned project guards. No automatic provider action or real customer messaging.
5. Perform real signed Auth/JWT tests with two fictional owners, staff/revoked/wrong-business users and anonymous callers. Test ownership via PostgREST as well as Edge service_role; a service-role query is NOT a real RLS test.
6. Run the booking/enquiry request, reply, accepted/cancelled, concurrent-requests and actual saved Work diary scenarios. Independently inspect durable receipts, status, user-visible entries and rollback after injected failures. Confirm push/provider delivery separately.
7. Record evidence in the release checklist before authorising any public or production deployment.

Rollback: until installing, there is nothing to roll back. For a test-only staging installation, take a database snapshot/backup and record exact migration versions; use a separately reviewed rollback or reset of **isolated staging only**. Never run destructive drop/reset commands against production or the already-working canary by default.

### 3. Transactional booking and enquiry handoff

\`supabase/migrations/20261012183000_v3_180_atomic_business_app_handoff.sql\` adds \`busy_mark_mini_app_request_link_v3180\`:

- Callable directly only by \`service_role\`, and checks the \`owner/admin\` membership for the business even after Edge authentication. No direct \`anon\`/\`authenticated\` execute grants.
- Locks the exact request row with \`FOR UPDATE\` so competing app handoffs for the same request serialize.
- Checks the request type, tenant identity, linked customer/action IDs, permitted state transitions, owner consent, real date/time and non-conflicting replays.
- Inserts/updates the request link, audited event, request status and unread count in **one database transaction**. A failing event insert rolls the earlier link write back; an exact repeat creates no extra event or unread.
- The Edge \`mark_request_linked\` route **requires** this RPC and refuses fallback to the former series of independent writes. Customer push is best-effort **after** commit, never described as independently delivered.
- The native booking status flow now waits for successful server handoff before changing local displayed status. A failed RPC leaves the local status untouched; both confirmation and cancellation follow the same transition boundary.

**Remaining cross-system limitation:** Local Busy Work/customer snapshots and any external calendar provider cannot be included in the same Postgres transaction. A successful handoff followed by a failed local/cloud snapshot still requires a later read/reconciliation. The SQL does not independently verify Google/Apple calendar delivery or a separately durable external diary event. Do not market this as fully verified end-to-end booking or as no possible conflicts anywhere.

### 4. Business Brain real stored-state evidence

\`src/core/businessBrainMeasuredOutcomes.mjs\` aggregates business-scoped stored request and link rows, plus time age when reliable timestamps exist. It distinguishes pending, over-48-hour waiting, owner-marked booking confirmations, accepted enquiries, unmatched links and inconsistent booking statuses. It never includes customer names/messages in its output, calls other businesses or treats saved states as revenue, customer conversion or email/push delivery.

The optional App Studio review gives owners a practical next step (correct inconsistent bookings first, then follow up on overdue requests), without sending messages or modifying customer records automatically.

### 5. Website/App coordination without matching designs

\`src/core/coordinatedBuilderReviewV3180.mjs\` compares the current private website and app revision of the same workspace against owner-authored business name/service facts and returns only bounded review tasks. It deliberately retains different layout/design identities and never copies or saves content automatically. The optional App Studio review surfaces the mismatch counts and the owner's next review action.

## Evidence from development CI

\`.github/workflows/transactional-staging-v3180.yml\` adds an actual disposable PostgreSQL 17 job, importing the staging baseline and relevant app migrations. Its SQL harness tests role grants, cross-tenant refusal, invalid dates, duplicate/replay protection and rollback after a deliberate failure injecting an event-insert exception.

A separate job runs source/behaviour checks, inherits regressions and exports Busy and independent standalone prototypes for iOS/Android. Passing these is **not** an installed Supabase staging backend, certified Auth JWT boundary, signed mobile binary, physical-device accessibility test or verified provider/customer delivery.

**No staging SQL, Edge Function deployment, production change, customer outreach, publishing or paid provider usage was performed in V3.180.**

## Next controlled milestone

After independent approval, install the reviewed staging baseline/migrations and staging Edge Functions. Then verify genuine owner/consumer flows and reconcile the app request status against persisted Work diary, customer conversation delivery and signed standalone apps. V3.178's release gates remain blocked until authenticated external evidence is collected.
