# Busy Does It — V3.179 Operational Intelligence & Real-World Readiness

Development branch: `v3.179` from `v3.178`. No production writes, staging SQL deployments, payments, real customer submissions or external provider calls were authorised or made in this sweep.

## Actual staging facts (observed read-only 12 October 2026)

- Supabase project **Busy Does It Staging**, ref `pnjdlogwegnqbsfpcofw`, is `ACTIVE_HEALTHY`.
- `public.busy_staging_rls_canary` exists with RLS enabled, with two existing fictional rows; this is **not** the application database.
- No Business App tables or deployed Edge Functions have been installed in isolated staging.
- The new `scripts/prepare-staging-install-v3179.mjs` analysed **59** repository SQL migrations, finding **one external baseline table name**, `public.busy_businesses`, required before later SQL. It found no out-of-order table references within the analysed migration set. Multiple migrations reference this missing table.
- The analyser reads local SQL files and prints a dependency report: it does **not** connect to a project, apply migrations, create accounts, evaluate RLS grants, or run Edge functions.
- Treat its pattern-based results as an installation inventory, **not** an executable or complete SQL assurance proof. The canonical base-business schema, membership/auth functions, extensions, foreign keys and security policy must be reviewed independently before an authorised isolated-staging installation.

## 1 — Staging installation preparation

`src/core/stagingMigrationPlan.mjs` enumerates ordered migrations, catches names reused or incorrect, identifies creation and referenced tables, and surfaces missing external prerequisites and order anomalies. It always returns a **no-automatic-apply** verdict; `scripts/prepare-staging-install-v3179.mjs` rejects all flags, including --apply. The existing staging project was left untouched.

## 2 — Booking and enquiry integrity

`supabase/functions/busy-mini-apps/requestBridgePreflight.mjs` is called by the existing owner-authenticated `markRequestLinked` action *before* DB writes. It checks request type, state, current business-scoped customer/action link, disallows silent relinking or downgrades, requires owner approval and a valid date/time for a booking confirmation, and avoids duplicate upserts and status notifications on an exact replay.

**Important unfinished limitation:** the existing service still performs link, event and request-status writes separately. An interrupted write or concurrency race can leave inconsistent rows. This is **not** a transaction, an independent diary record, verified message delivery, or an RLS test. Before going live, move the multi-row handoff into a database transaction/RPC with business-scoped row locking and connect booking confirmation to an authoritative, independently queried diary entry. Never represent owner-entered action IDs or date strings as independently verified appointments.

## 3 — Business Brain with bounded owner and outcome evidence

The existing `businessBrainWorkQueue.mjs` now returns counts of current-revision **approved / rejected / postponed** owner choices separately from customer results. An approval remains permission to prepare a change, not evidence that it ran or worked. The authenticated private App Studio continues to use the owner decisions already retrieved for the current app.

`src/core/storedCustomerJourneys.mjs` and `src/domain/miniApps.js` calculate counts from the authenticated owner's request/link snapshot: booking requests, enquiries, pending and unlinked requests, accepted enquiry states, owner-marked booking confirmations, and inconsistencies. These aggregates are shown in optional App Studio journey review. No private customer details are echoed, and counters are not labelled as independently verified delivery or conversion.

## 4 — More accurate coordination between Website and App Builders

`src/core/businessInfoClarity.mjs` now privately compares normalized **owner-authored service names and business names** for already-scoped website and app drafts. It reports only mismatched counts and generic warnings, never raw names/service descriptions. A matching count of services no longer hides completely different service selections. `src/core/ownerImprovementPlan.mjs` turns the warnings into owner-controlled manual review actions. It never silently synchronises design, text, products or pricing between surfaces.

## 5 — Founder operations

`src/core/founderReadinessTriage.mjs` provides bounded staging review priorities for database, Edge, tenant access, bookings, enquiries, websites and standalone builds. Missing observations stay **unverified**, not healthy. The Founder Operations screen explains that the earlier RLS canary does not verify the application backend. No automatic repair, production change or customer alert is permitted.

## Checks, limits and next authorisation

- `scripts/check-operational-readiness-v3179.mjs` exercises migration inspection, owner handoff guards, row-based journey metrics, cross-business scope, cross-builder mismatches and founder failure prioritisation. Existing regression scripts still run in `.github/workflows/operational-readiness-v3179.yml`.
- GitHub workflow includes syntax/import checks plus main-app and standalone iOS/Android Expo exports. Exports are not device screenshots, signed builds or distribution approval.
- No claim of end-to-end success until independently authenticated test accounts submit real staging requests; we observe owner inbox, customer reply visibility, controlled owner diary confirmation, and cross-business denial **on the installed staging backend**.
- Release gates from V3.178 remain blocking. In particular: real RLS tests with independent JWTs, real provider delivery, actual booking/double-booking checks, website hosting, standalone app distribution, billing/privacy/credits, accessibility and the founder's explicit release approval.

**Recommended next step:** locate and review the canonical `busy_businesses` and membership/auth schema; produce a reviewed, reproducible clean-staging installation sequence and rollback plan. Only then request separate permission to install **in the identified isolated staging project**, never production.
