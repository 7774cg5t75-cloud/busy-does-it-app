# Busy Does It V3.220 — Staging Bootstrap and Connected Customer Journeys

Base: V3.219. Status: GitHub source changes only. No database migration, Edge deployment, customer record, provider notification, signed build, AI credit charge or public website publication.

## Independently observed staging state (14 October 2026)

Read-only checks through the connected Busy Does It Staging Supabase project (pnjdlogwegnqbsfpcofw; eu-west-2) confirmed:
- Public application-related tables: only busy_staging_rls_canary.
- Exactly two recorded staging migrations: 20261010224121 (staging_canary_owner_read_v3130) and 20261010224205 (restrict_staging_rls_event_helper_v3130).
- pgcrypto installed (1.3); pgmq, pg_cron and pg_net available but not installed.
- Existing business membership, Business App, version, request and guest challenge tables and their request RPC are not installed.
- No private customer data, account tokens or secrets were read.

This metadata is time-bound. The file staging/recorded-readonly-observation-v3220.json contains a non-sensitive snapshot, NOT a continuous connection or fresh proof of the database's condition.

## Source migration finding

There are 64 versioned SQL files under supabase/migrations. The migrations refer to public.busy_businesses and public.busy_business_memberships but do not create those baseline tables. An existing file, staging/ISOLATED_ONLY_business_core_v3180.sql, already provides a compatible STAGING-ONLY foundation. It is not a complete production schema export and must not overwrite production.

Existing dependency and risk engines (stagingMigrationPlan.mjs, stagingSqlRiskLedgerV3203.mjs and stagingSchemaGateV3219.mjs) are reused rather than reinvented.

New source-only contract src/core/stagingBootstrapReconcileV3220.mjs groups one staging-only baseline plus all 64 migrations into five separately reviewed phases:

| Phase | Files | Purpose |
| --- | ---: | --- |
| 01 staging business core | 1 | Owner/business/membership baseline |
| 02 platform and website prerequisites | 11 | Existing foundations before marketplace |
| 03 Business Apps and shared requests | 13 | App versions and request tables |
| 04 guest request protections | 3 | Guest challenge, RPC, immediate hardening |
| 05 later platform features | 37 | Further automation, reliability and AI foundations |

These are SOURCE GROUPINGS, not approved scripts or installed database milestones. The 64-source risk analyser identifies privileged code, possible scheduled/background work, extension requirements and HTTP or other external side effects for review. Applying all files blindly is specifically prohibited.

## Reproducible offline manifest

scripts/prepare-staging-bootstrap-v3220.mjs is an offline Node tool that reads the full source worktree and recorded read-only metadata, creates SHA-256 checksums and emits JSON to /tmp/bdi-v3220-staging-bootstrap. It does not copy executable SQL to a deployment directory, connect to Supabase, install extensions, create a database backup, execute SQL or call any providers.

Command for a developer with a real checkout:

    node scripts/prepare-staging-bootstrap-v3220.mjs

Output:
- manifest.json: original paths, hashes, sizes, phases, noted staging gaps and withheld authority.
- safety-review.json: source risk category counts, flagged files, extension gaps and the next manual task.

Source code changes or live staging changes require fresh read-only inspection and a new operator review; the manifest is not authorization.

src/core/stagingPhaseReadinessV3220.mjs lists the requirements for each phase: independently verified staging project, exact source hashes, extension/privilege and side-effect reviews, migration ledger, backup and proven restore, two-tenant Auth/JWT RLS and separate owner approval. Even when a caller reports all checkboxes true, that pure function NEVER allows migration execution, reports an installed schema, or enables a website form.

staging/READ_ONLY_v3220_source_target_comparison.sql is a separate SELECT-only catalog inspection of tables, RLS flags, extensions, selected function signatures and staging migration history. It does not authenticate the project identity or test owner access in a real signed-in session.

## Simpler and safer owner experience

- src/core/connectedJourneyAdviceV3220.mjs joins V3.218's industry-neutral website/app plan to V3.219's strict linked published-version recovery, proposing ONE useful customer action without implying any new website-native form is operational.
- src/screens/websiteAppHandoffReview.js now shows one concise BUSY recommendation by default, with deeper analysis available inside the optional connected-journey review.
- src/core/ownerRequestDeliveryPriorityV3220.mjs distinguishes uncertain submission, saved Business App request, independently seen owner inbox and provider/outbox notification states, without automatic send, duplicate request, calendar confirmation or payment.

These modules cannot independently authenticate their input records; real server readback and tenant checks are still required.

## Testing and verification limits

scripts/check-builders-v3220.mjs was committed to run source checks against the actual 64 SQL files in a real Git checkout, including full dependency/risk inventory, business baseline, phase gates, owner-flow boundaries and request/delivery proof. The configured .github/workflows/builders-major-v3220.yml runs this test before all inherited builders/security suites and unsigned platform exports.

An isolated V8 check verified structural phase composition for all 64 real migration filenames using SYNTHETIC SQL CONTENT (65 files across phases), canary mismatch and fail-closed self-reported approval gates. A separate V8 contract integration test verified current/stale app links, unknown prior writes, wrong tenant refusals, owner inbox recovery and compact Website Builder wiring. Actual full-worktree Node regression, GitHub Actions, PostgreSQL migration/rollback, authenticated RLS, real browser and native device tests have NOT been independently confirmed.

No production data, customer messages, website publication or signed device builds were touched.

## Outstanding activation gate and proposed V3.221

1. Re-read the named isolated staging project and ledger before any operation.
2. Reconcile staging-only business baseline with real production schema expectations, other non-migrated production bridge objects and 64 migration source dependencies.
3. Review all elevated permissions, scheduling/HTTP effects and missing extensions; establish a tested recoverable backup.
4. Obtain separate explicit owner approval for each staging-only install phase and verify database readback after each approved installation.
5. Run real two-tenant Auth/JWT/RLS, existing guest request RPC, idempotency, saved receipt and inbox, provider uncertainty and booking-diary checks.
6. Only then consider adding an actual website-native intake endpoint, following separate security, privacy and owner publication reviews.

V3.221 should prioritise the real first-phase installation preflight, source-versus-staging compatibility, reviewed scheduler/network safeguards, tenant/RLS verification and further cross-builder Business Brain improvements.

North star: Busy does the real job and can independently prove its outcome.
