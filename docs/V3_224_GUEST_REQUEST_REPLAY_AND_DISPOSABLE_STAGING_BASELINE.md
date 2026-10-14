# Busy Does It V3.224 — Guest Request Replay Integrity & Real Disposable PostgreSQL Recovery

**Base:** V3.223. **Product master reviewed before work:** latest saved `Busy_Does_It_Master_V22_5_Dual_Master_Quality_First_Sweeps(2).docx`, sections 33 (one shared Business App platform), 52 (functional customer journeys & safe reuse), and 53 (dual-master quality-first sweeps). **Technical master reviewed before work:** GitHub `ARCHITECTURE.md`, the major-sweep engineering policy and V3.223 checkpoint. This sweep changed implementation and tests, **not the product vision or pricing**, so the versioned Word product master is intentionally unchanged.

## Actual customer-facing code improvements

The existing public Business App guest-request Edge handler already creates an anti-abuse challenge, sanitizes contact/request payloads, calls the pre-existing transactional `busy_mini_app_create_guest_request` RPC, and independently reads the saved row. The SQL RPC returns an existing request ID on a consumed challenge. Previously, an overlapping or repeated browser submission could be returned as a successful receipt **without checking that the stored payload was the same as the newly submitted data**.

- Added `supabase/functions/busy-mini-app-guest/guestStoredPayloadV3224.mjs`: a strict, privacy-minimal readback checker. The saved record must match **the exact request ID, business, app, guest challenge, kind, origin, assurance, optional idempotency key, sanitized payload fields and contact columns**. Extra/changed/invalid fields fail closed.
- Wired the actual `supabase/functions/busy-mini-app-guest/index.ts` Edge handler to fetch those scoped fields and reject mismatches *before* reporting a saved receipt or calling notification logic. Errors never expose saved personal data.
- A sequential replay with an already consumed challenge suppresses another owner-notification attempt. **Concurrent in-flight requests and exactly-once provider sends are NOT fully guaranteed**: an atomic notification outbox keyed by the original request would still be required. No new outbox, customer request database or duplicate provider stack was introduced.
- A successful internal readback is proof of **a saved Business App request only**, not a confirmed booking, delivered notification, externally synchronized diary event, or active website-native form.

All changed server code is **committed only**. The public guest endpoint was NOT deployed; real staging Business App tables/RPC remain uninstalled.

## Real SQL test without affecting Supabase

Introduced `staging/CI_ONLY_v3224_prepare.sql` and `staging/CI_ONLY_v3224_assert_rollback.sql`, executed by `.github/workflows/builders-major-v3224.yml` against a disposable **PostgreSQL 16 Docker service** on GitHub Actions.

The CI SQL fixture creates **fictional** `auth.users` and service/anon/authenticated roles inside a transaction, applies the pre-existing `staging/ISOLATED_ONLY_business_core_v3180.sql`, and checks real PostgreSQL objects: `busy_businesses`, `busy_business_memberships`, enabled and FORCEd RLS, withheld direct anon/authenticated permissions and the intended service-role grants. It inserts two synthetic business/membership pairs, then **ROLLBACKs the entire transaction** and checks that temporary tables, `auth.users` and the fixture roles are absent afterward.

**Independently observed CI success:** the disposable PostgreSQL job emitted `V3.224_EPHEMERAL_BASELINE_ROLLBACK_PASS` and concluded success; this is actual Postgres transaction/DDL rollback evidence, not merely static SQL matching.

**Boundaries:** synthetic roles do not perform real Supabase authentication, two-business JWT checks, real Edge RPC execution, browser verification, provider delivery or real staging backup/restore. The CI test creates no external Supabase project or customer data and is not owner authorization for schema installation. Actual phase-one approval, staging migrations, genuine JWT/RLS and real multi-tenant customer requests remain blocked.

## Testing

- `scripts/check-guest-readback-v3224.mjs` runs **177 focused assertions**, including mismatched payload, owner identity, request kind, challenge, token-independent idempotency and cross-business scope, immutable source fields, no duplicate-request authorization and edge-handler wiring.
- V3.224 builder workflow executed these tests and all inherited source and security checks, including 64 existing SQL migration scans and the 298-module Snack dependency graph.
- A separate **Production Foundation** workflow also ran successfully on the V3.224 development branch; no signed iOS/Android build was initiated.
- The first disposable PostgreSQL run failed only on a final, constant-folded `1/0` test assertion *after* the SQL rollback. We corrected the test expression and the following real PostgreSQL run passed. No business-schema change was required.

## Financial/owner controls

No staging or production schema was changed, no real business/customer request was created, no notifications sent, no public websites published, no paid AI or signed build credits spent. GitHub Actions used normal short-lived CI minutes for a disposable PostgreSQL service and source tests.

## Follow-on priorities: V3.225

Before activating the already-built guest request backend, obtain independent approval for installing the exact isolated staging schema, review the real production schema without copying customer data, test genuine authenticated multi-tenant access and transactional request/RPC/idempotency/notification-outbox behaviour, verify reversible backup/restore, then deploy and observe a safe owner-approved test request. Continue evolving Business Brain on **authenticated real outcomes** and keep the owner UX one-action simple.

**North star:** Build proper customer functionality with reliable, independently verifiable results; never confuse code completion with a working public service.
