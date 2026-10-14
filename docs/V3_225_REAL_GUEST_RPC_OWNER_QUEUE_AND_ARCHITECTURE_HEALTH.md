# Busy Does It V3.225 — Real Guest RPC Rehearsal, Owner Inbox Action and Architecture Health

**Base:** v3.224. **Preflight completed before creating the branch:** latest saved Word master **Busy_Does_It_Master_V22_5_Dual_Master_Quality_First_Sweeps(2).docx** (sections 33, 52–53), GitHub ARCHITECTURE.md, DEVELOPMENT_SWEEP_AND_ARCHITECTURE_POLICY.md and V3.224 source/test results. Existing one-runtime Business App, shared tenant-scoped requests, user-owned approvals, privacy, brand consistency and quality-first reuse remain unchanged. This is technical implementation work, NOT a new commercial/product commitment requiring a new Word-master version.

## 1. Real Postgres 16 rehearsal of the ALREADY-BUILT guest request RPC

**Source:** scripts/prepare-disposable-guest-rpc-v3225.mjs and staging/CI_ONLY_v3225_assert_guest_rpc.sql.

Rather than create a second request engine, the V3.225 GitHub workflow assembles **ten original versioned SQL migration bodies** (V3.39 app/versions/idempotency, V3.40 shared request event/links, V3.41 conversations, V3.42 unread tracking and V3.45 guest challenge RPC) together with the existing V3.180 STAGING-ONLY business/member baseline. It executes the actual historical guest-request database function under disposable PostgreSQL 16. The test transaction contains only synthetic users/businesses/apps/contacts.

The migration wrapper deliberately removes exactly the old V3.45 **cron registration/unschedule block** while preserving the complete guest request SQL/RPC and prune function. That choice is pinned and fails closed if the migration's expected structure changes. No schedulers, providers, HTTP, production credentials or hosted staging databases are contacted by this CI job. The generated SQL is written under /tmp, not to supabase/migrations, and is explicitly NOT deployable.

**Actual PostgreSQL assertions:** 
- Server-only function EXECUTE privileges, revoked anonymous/signed-in direct access and same-business records.
- Real guest enquiry creation atomically inserts one request + one event, consumes one challenge and persists guest assurance/origin.
- Replaying the same consumed challenge returns the exact original request ID **without duplicating requests or events**.
- The historical RPC also returns the original ID for a consumed challenge even with changed payload. That is why the deployed-source V3.224 Edge handler's independent stored-payload comparison is essential before confirming saved *submitted* data.
- A second synthetic business gets its own separate booking request, not another business’s request. That booking request is **not** a diary confirmation.
- Expired challenges cannot create requests.
- The fixture ends with a real ROLLBACK and verifies that its created request/challenge/business/auth tables are absent.

The disposable CI job reported **V3.225_EPHEMERAL_GUEST_RPC_ROLLBACK_PASS**, and the inherited V3.224 foundation rollback also passed in the same ephemeral Docker Postgres service.

**Limits:** no real hosted staging installation; no Supabase-generated JWT/real Auth two-tenant test; no live Edge deployment or browser transaction; no real provider/notification receipt; no database backup restore; no signed mobile build. The test is a deliberately dependency-focused selection of historical migrations, **not** a proof that all 64 apply cleanly together or that cron is safe.

## 2. Genuine owner-facing request overview on the existing Business App endpoint

**Source:** supabase/functions/busy-mini-apps/ownerRequestQueueV3225.mjs and the existing busy-mini-apps/index.ts Edge handler.

Added a read-only **owner_queue_summary** action, behind the existing signed-in owner/admin membership gate. It reuses the same business's main Business App and the same existing busy_mini_app_requests table. No parallel CRM, inbox or customer table.

The handler uses actual exact-count server queries separately scoped to business ID + app ID for requests marked **received** and **reviewing**, and fetches only the latest scoped request's ID, kind/status and timestamp. The pure classifier verifies UUID scopes, bounded counts and source-row matching, and returns one plain-language recommendation. No contact name, message body, email, phone or arbitrary caller-supplied totals are returned.

**Source:** src/app/AppController.js and src/screens/miniApps.js.

On the existing Business App screen, owners can press **Check customer requests**. This is deliberately on-demand: no background polling, no AI/API call, and no automatic customer reply. The controller verifies the exact returned business/app ID and server-origin/owner-check flags and clears stale evidence if verification fails. The screen displays new/reviewing counts and offers **Open latest request** via the existing request/conversation path. It repeats that a booking request is not a confirmed appointment. Only private owner UI has this feature.

The endpoint and UI are **committed source, not deployed**; no claim is made that the separate staging workspace can yet execute the action.

## 3. Automated evidence

- scripts/check-owner-request-queue-v3225.mjs: checks exact tenant/app scope, malformed counts, bounded private fields, wrong latest-request origin, truthful owner-next-action labels, Edge route permission and direct DB query guards, and real UI/controller wiring.
- .github/workflows/builders-major-v3225.yml: runs new source tests before inherited V3.224–V3.180 regression/security checks; executes both real disposable PostgreSQL tests in **one existing Postgres service container**, avoiding redundant provisioning and signing costs; normal pushes do not perform unsigned native exports, which remain manual.
- Successful V3.225 workflow execution included the disposable Postgres guest RPC rollback marker and all inherited source regressions. Production Foundation is a separate workflow and must be checked on the final commit.
- The public guest-post RPC implementation remains protected by V3.224's post-commit stored-payload proof. Concurrency and exactly-once initial owner notification are still **not guaranteed** without a server-owned durable outbox.

## 4. Five-sweep architecture-health review (V3.220–V3.225)

Concrete maintenance risks identified from source inspected during this sweep:

1. **supabase/functions/busy-mini-apps/index.ts:** one large multipurpose Edge handler with many owner/customer/marketplace routes. Risk: permission checks drift and unverified methods leak data. V3.225's owner queue business policy and private fields are isolated in a pure module, while the route retains existing owner/admin membership validation. Next: split a small group of high-risk handler routes into shared service modules with deterministic membership proof.
2. **src/app/AppController.js:** very large owner React controller orchestrating connected builders, requests and notifications. Risk: subtle stale business/app state and expensive repeated calls. V3.225 adds only an on-demand queue action with exact business/app scope checks and no hidden polling. Next: gradually extract Business App server action adapter, preserving actual state shape and UI.
3. **src/screens/miniApps.js:** about 5,200 lines in the inspected source. Risk: owners face a sprawling business app builder despite the simplicity goal. V3.225 adds one small optional practical inbox action to the existing page, with no new maze or separate screen. Next: selectively consolidate view subsections around the current task-first owner journey after actual staging verification.
4. **Historical V3.45 guest SQL:** the cron schedule/unschedule is a side effect and depends on pg_cron, while the guest RPC is a separate transaction. Test runners must not blindly execute scheduled provider work. V3.225 explicitly gates/omits cron in the **disposable** test fixture, without altering authoritative production migration source. Before hosted staging install, review extension setup and background effects individually.
5. **Original guest notification path:** previous V3.224 sequential replay safeguards cannot guarantee exactly-once sends under concurrent challenges or lost provider responses. Next release-critical architectural fix is one durable, server-committed notification outbox integrated into the *same* existing request engine, with independent provider acknowledgement, retry locks and owner inbox readback.

No mass rewrite of large files was attempted. No custom external/open-source package was added. The highest leverage remains a real staging schema installation **only with separate approval**, then authenticated end-to-end checks.

## 5. Fresh isolated staging observation

Read-only inspection of the separately named **Busy Does It Staging** project on 14 October 2026 still found only public busy_staging_rls_canary (RLS enabled) and exactly two original canary migration versions (20261010224121, 20261010224205). No request backend, mini-app schema, or guest RPC is installed there at that time. No customer/secret records or provider data were inspected. No hosted staging or production writes, Edge deployment, public website changes or paid native builds were initiated.

## 6. Next V3.226

Following the dual-master vision, prioritise closing the last genuinely blocking pieces: exact phase-scoped owner-approved staging install with independently reviewed business schema, migrations, security-definer/grant surfaces, pg_cron/provider isolation, backup and restore; real two-tenant Auth/JWT/RLS plus guest request to owner inbox proof; a durable, request-scoped notification outbox; and a simple first customer-facing functional rehearsal. Extend the existing Business Brain using verified outcomes, not invented activity counters. Keep individual designer and app sections reusable and preserve brand identity.

**North star:** Customers can tell Busy what needs doing, Busy does it properly, and the owner can verify the actual saved result.
