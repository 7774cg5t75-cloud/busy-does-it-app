# Busy Does It — V3.201: Real Staging Prerequisites & Customer-Journey Evidence

**Base:** V3.200. **Scope:** read-only inspection of the real isolated staging project, safe code and a manually gated synthetic fixture runner. No migration deployed, no customer accounts contacted, no test app created, no Edge Function deployed.

## Independently observed staging state (13 October 2026)

The linked Supabase project list identifies **Busy Does It Staging**, project ref `pnjdlogwegnqbsfpcofw`, London region (`eu-west-2`), reported active/healthy.

A direct read-only SQL inventory using `staging/READ_ONLY_v3201_schema_inventory.sql` returned:

- Public tables: **only** `busy_staging_rls_canary`.
- Installed relevant extensions: **only** `pgcrypto`. Missing `pgmq`, `pg_cron`, `pg_net` for the broader package.
- Present app functions: **none**; in particular `busy_create_first_mini_app_draft_v3199` is absent.
- First-app uniqueness constraint: **absent** because `busy_mini_apps` itself does not exist.
- Project migration ledger lists only `staging_canary_owner_read_v3130` and `restrict_staging_rls_event_helper_v3130`.
- No authenticating staging Business App owner or test app was available to run a customer-request journey.

**Result:** V3.199's transactional migration cannot responsibly be applied on its own, and neither the first-app race nor an actual customer request is presently testable on that project. These findings are schema-reachability and migration observations, not proof of tenant JWT isolation or a production release.

## What V3.201 adds

### 1. Fail-closed staging dependency gate

`src/core/stagingSchemaReadinessV3201.mjs` requires an exact staging project identity, fresh directly observed inventory, business core, public business profile, app tables and journey tables, the recorded schema migrations, the atomic first-app RPC, the existing unique main-app constraint, relevant extensions, backup review, owner sign-off, isolated Edge setup and a verified synthetic test fixture. Missing or unconfirmed evidence produces specific blockers. Nothing auto-installs and a green offline gate does not independently authorise a write.

`staging/READ_ONLY_v3201_schema_inventory.sql` is a bounded, read-only `pg_catalog` query. It deliberately never selects business/customer rows or changes DDL. Migration names must be collected separately using the staging project's migration ledger.

### 2. Manual, synthetic first-app collision exercise

`scripts/run-isolated-first-app-race-v3201.mjs` is a **no-network no-op by default**. A future, separately approved `--run-against-staging` call requires:
- the exact synthetic business UUID, existing only on the known staging project;
- a short-lived **staging owner JWT** and the staging publishable key, injected via temporary environment variables (never committed);
- an exact explicit approval phrase;
- a **signed-in owner-status response** confirming the correct business, owner role, precise synthetic profile name `BDI STAGING TEST - V3201`, and that **no app exists yet**.

Only after passing these checks does the runner send two simultaneous `build_draft` requests with `expectedNoExistingApp:true`. It then reads the owner status again and accepts only exactly one verified private first-create success, one refused second attempt and an unchanged saved private draft revision. The endpoint is **hard-coded to staging HTTPS**, redirects are prohibited, automatic retries are prohibited, and results deliberately omit credentials or private data.

**Important:** Even a passing first-app API race is not independent database row-count proof. Inspect the uniquely keyed test business app and SQL constraint in the isolated staging database before signing off; a simulated JavaScript race alone cannot prove production concurrency safety. This exercise makes one synthetic app draft and intentionally leaves evidence in staging for independent audit; it does not publish.

### 3. Exact-scope customer request receipts

`src/core/stagingRequestReadbacksV3201.mjs` validates consistent IDs, app scope, request type and the saved request across the first response, idempotent retry, authenticated owner inbox and customer readback.

This prepares a narrow, honest definition of **persisted and visible**. It does **not** claim that the customer was notified, a reply was actually delivered, the owner's calendar confirmed a booking or a job was completed. A later isolated runner, using fabricated customer accounts and separate signed JWTs, must supply the real independently checked readbacks. A caller-created object or passing offline fixture does not count as external evidence.

### 4. Safe installation dependency sequence (later separate approval)

1. Independently verify the staging ref, recovery/backup plan, existing RLS canary integrity and privilege/extension baseline.
2. Review `staging/ISOLATED_ONLY_business_core_v3180.sql` plus the complete chronological set of `supabase/migrations/` files and `scripts/prepare-staging-install-v3180.mjs`'s digest package. **Do not blindly apply old migrations**: some contain schedulers, network calls or privileges, and the staging project already contains canary migrations.
3. Decide precisely which extension roles and external schedulers should remain disabled in staging; review impacts and migration conflicts before any DDL.
4. After **separate owner approval**, apply the reviewed staging schema in dependency order, preserving the canary, and independently verify `busy_mini_apps` unique constraint and V3.199 RPC security/permissions.
5. Deploy isolated staging Edge Functions with staging-only secrets and outbound provider notifications disabled; verify actual owner and synthetic customer JWT claims and tenant boundaries.
6. Create two synthetic owner clients for a single dummy business, use the manual first-app runner once, confirm unique private app state, then test requests on separately approved preview/published **staging-only** app endpoints.
7. Verify original submission, exact idempotent replay, correct business inbox and customer readback; separately verify replies, push/email receipts and genuine Work confirmations before claiming end-to-end completion.
8. Keep manual controls for app publishing, paid providers, outbound messages and App Store actions. Real iPhone/tablet checks and accessibility follow.

## Verification

`scripts/check-staging-verification-v3201.mjs` exercises missing-schema observations, fresh/target identity checks, explicit install approvals, non-production URL restrictions, no-network default, fake authenticated first-app collision readbacks, replay scope, cross-tenant refusals and non-overstated request delivery proof.

The V3.201 GitHub Actions workflow runs this suite, carries forward the V3.200–V3.190 builder checks and existing foundation checks, verifies the staging install package offline, then runs all four unsigned mobile JavaScript exports. **Green CI means code and mocks pass, not that missing staging infrastructure has been installed.**

**North star:** A Busy customer can ask for a real outcome, and Busy can safely demonstrate the actual server records and customer-visible result—not merely an attractive screen or optimistic completion message.
