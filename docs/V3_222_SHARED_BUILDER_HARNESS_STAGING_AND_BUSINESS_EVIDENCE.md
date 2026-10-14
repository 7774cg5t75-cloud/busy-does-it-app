# Busy Does It V3.222 — Shared Website Test Harness, Staging Evidence and One Useful Next Action

**Base:** V3.221. **Status:** implemented, committed, and focused/inherited GitHub Actions checks verified on a V3.222 commit. **No** staging/production database migration, Edge endpoint deployment, public customer website-native form activation, customer request, provider send, AI credit use, payment, signed device build or customer website publication was initiated.

## 1. CI stabilisation — one real source-checked website builder harness

Previous historical checks used at least 16 independent copies of a Function()-based loader for src/domain/websiteBuilder.js. Those loaders forgot the actual canonicalWebsiteHandoffUrl import introduced in V3.214, causing repeated false CI failures one version at a time. They also increased maintenance burden when imports changed.

**New source:** scripts/lib/website-builder-test-harness-v3222.mjs.

- Loads the actual checked-in websiteManagement.js and websiteBuilder.js, validates all **six exact production source imports** and refuses any unreviewed additional import/export.
- Injects the **real** website request-handoff helper, design engine, layout design planner, reviewer, visual editor and field editing dependencies. No mocked security helpers or untrusted code.
- Only allows a known set of actual website builder test entry points; duplicate/unknown export requests fail closed. The exported rebuildPrivateWebsiteDraft alias remains bound to its original withHtml implementation.
- Evaluates only developer-controlled checked-in source for Node compatibility (React Native's extensionless imports otherwise cannot be resolved by plain Node). This is a test-only mechanism, not a runtime loader, production Node API or customer data evaluator.
- Replaces individual ad hoc loaders across **16 older suites**, retaining their existing substantive assertions and actual source checks. This includes V3.100–102, V3.133–142, V3.147–148 and V3.191–192.
- scripts/check-builder-harness-v3222.mjs verifies these migrated suites remain on the shared harness and tests real draft/render/instruction behavior, unknown exports and preservation of non-publication.

During migration, one overbroad automated refactor would have dropped V3.192 assertions. It was corrected by restoring the original file and replacing **only** its final loader; its real test assertions were preserved. This emphasizes why CI and source review remain mandatory even when reducing duplication.

## 2. Fresh isolated staging observation (read-only)

On **14 October 2026**, a read-only connected Supabase query for the already known **Busy Does It Staging** project (ref pnjdlogwegnqbsfpcofw) confirmed:
- The only busy_* public table in the queried catalog is **busy_staging_rls_canary**; the table has row-level security enabled.
- **busy_mini_app_create_guest_request** is not present.
- Remote staging migration history still lists only **20261010224121** and **20261010224205**, the original canary-related migrations.

This confirms the baseline Business App and customer request tables were still absent **at the time of the query**. No customer rows, secrets, token, payloads or production data were accessed. Source work cannot legitimately claim live staging request transactions or working native website enquiries.

src/core/stagingFirstPhaseEvidenceV3222.mjs provides a pure, bounded first-phase evidence review against the existing staging-only business baseline:
- Checks exact project identity, read-only catalog provenance label and source-required RLS patterns.
- Flags unexpected public application tables, partial business/member baseline installation, missing canary and unrecognised migration history; unexpected state halts the next-phase plan.
- Differentiates an **uninstalled baseline**, **partial/unexpected state** and **an existing baseline requiring independent inspection**.
- Specifies separate requirements for schema/privilege/extension review, side-effect controls, real backup/restore, two-tenant authenticated RLS test and explicit owner approval.
- **Always** denies automatic apply, reports actual staging installation unverified and keeps native website intake off. A labelled/boolean source input cannot prove a real permission or authenticate its own origin.

scripts/check-builders-v3222.mjs covers correct and malicious source snapshots plus wrong projects, replay/receipt priority, mixed-business rollups and unverified metrics without accessing the database.

## 3. Business Brain — concise priorities from scoped evidence

src/core/businessNextActionEvidenceV3222.mjs composes the prior deterministic website/app planner with the V3.218 bounded outcome rollup reviewer:
1. Check a **possibly saved request** before recommending any duplicate submission.
2. Review a stale immutable published app/version link before further website actions.
3. When an explicitly scoped same-business outcome rollup claims waiting enquiries, suggest **owner review** (NOT automatic replies).
4. Otherwise advise review of existing published modules or preparation of a missing capability.

A pure function does **not** fetch/authenticate a real rollup, count actual customers, verify deliveries, issue bookings, send messages, publish pages or train itself. All source claims remain cautiously labelled. Unknown businesses and their owner-stated goals remain supported. The Website Builder's already compact "BUSY recommends" line now uses the V3.222 planner, with richer details still optional.

## 4. CI outcome and cost discipline

New .github/workflows/builders-major-v3222.yml:
- Executes scripts/check-builder-harness-v3222.mjs followed by scripts/check-builders-v3222.mjs and the full inherited V3.221/V3.220 and earlier security, owner-request and builder contracts.
- Preserves branch-specific cancel-in-progress concurrency, avoiding redundant superseded runs.
- Retains unsigned iOS/Android exports **only for explicit workflow_dispatch**, not every rapid code edit. No paid signing or native device distribution was performed.

**Independently confirmed GitHub Actions outcome on commit d9ee0911f770b1feb8872f6c1c076354bc32ca3b:**
- V3.222 shared builder harness: **71 checks passed** across **16 historical suites**.
- V3.222 staging/Business Brain contract: **86 checks passed**.
- V3.221: **71 source checks passed**, all 64 SQL migrations scanned.
- V3.220: **135 checks passed**, full actual SQL worktree source check.
- V3.221 full Snack import checker: **294 bundled modules, no unresolved relative imports**. A Snack preview publication is separate from customer website publication.
- Both the **V3.222 Shared Builder Harness and Staging Safety** workflow and the separate **Production foundation check** workflow concluded **success** for that commit.

These are significant CI improvements, but NOT a signed Expo iOS/Android build, real Postgres migration/rollback, independently performed authenticated two-tenant RLS security test, public website-native form, verified provider delivery or a genuine customer transaction. The owner must explicitly approve any future real staging changes after a fresh state check.

## 5. Recommended V3.223

- Use the green CI baseline to perform a deeper production-bridge vs staging-only SQL compatibility analysis, including exact business/membership fields and function privileges **without exposing or copying production customer data**.
- Prepare disposable *non-production* restore/rehearsal tooling and owner-reviewed, separately approved phase-1 staging installation.
- Continue improving the Business Brain's outcome capture from real authorised server evidence and truthful cross-builder UX.
- Perform unsigned build exports deliberately at a stabilisation milestone; keep all paid signed native builds opt-in.

**North star:** "You tell Busy what needs doing. Busy does it." Verifying what actually happened matters more than making unsupported completion claims.
