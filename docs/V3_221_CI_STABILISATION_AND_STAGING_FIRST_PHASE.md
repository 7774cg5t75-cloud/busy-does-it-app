# Busy Does It V3.221 — CI Stabilisation, First-Phase Staging Safety and Business Brain

**Base:** v3.220. **Change scope:** source-code fixes, read-only baseline/migration assessments, evidence-graded Business Brain guidance, offline tests and CI workflow improvements. **No Supabase schema changes, Edge function deployment, public website form activation, customer messages, payment, provider calls, paid native build or automatic publication.**

## 1. Staging foundation: first phase remains approval-gated

The separate Busy Does It Staging database was read-only audited in V3.219/V3.220. At that observation it had only the canary and two canary migration-history entries, NOT the existing Business App request backend. V3.221 **did not install the baseline**.

The repository already contains the staged-only compatible core-business source at staging/ISOLATED_ONLY_business_core_v3180.sql. V3.221's src/core/stagingFirstPhaseSafetyV3221.mjs evaluates this exact file for owner/business schema, membership foreign keys, role allowlist, enabled and FORCEd RLS and withheld public/anon/authenticated direct privileges. It detects network/cron/secret/destructive SQL and client-grant signals. This is a strict **static pattern check**, not a full SQL parser, proof of authentication, transactional correctness or permission to install.

src/core/stagingSqlSideEffectGateV3221.mjs wraps the existing V3.203 line-numbered source-risk scanner across all **64 actual versioned migrations**. It flags scheduled jobs, network/HTTP, extension setup, elevated functions, grants, destructive operations and secrets for manual human review. Never auto-remove unsafe SQL and assume it is safe. The only approved path is independent isolated staging review, tested backup/restore, owner-scoped phase approval and two-tenant Auth/JWT/RLS validation **before** executing any SQL. Pure gate execution flags ALWAYS remain false.

The V3.220 five-phase migration source order remains unchanged. V3.221 did not duplicate or replace the staging-only business baseline or introduce a new database schema.

## 2. Business Brain: one evidence-limited owner next step

src/core/businessJourneyDecisionV3221.mjs builds upon the existing V3.220 cross-builder advice. When a previous request is uncertain, verification takes precedence over creating another. A stale published app version triggers owner review and website republish guidance. A live module can be recommended only as an owner review, not an autonomous action or proof of an actual enquiry.

The Website Builder now shows one compact recommended action with an evidence-specific reason and keeps additional technical explanations in the optional expanded section. Unknown industry types still receive a safe plan. This helper does not perform cross-business learning, send customer messages, publish content or verify external bookings.

## 3. Actual CI health and Snack graph

V3.220 had a longstanding class of legacy test harness failures: test scripts using Function() to evaluate src/domain/websiteBuilder.js omitted its newer canonicalWebsiteHandoffUrl import. V3.221 repairs these tests to **inject the actual production helper**, rather than removing the runtime security validation. Source-level legacy fixture updates cover V3.191, V3.100-V3.102, V3.133-V3.142 and other builders/website test suites. These are CI compatibility changes, not runtime deactivation.

scripts/snack-source.mjs now includes the pure Business App request receipt proof module (V3.213) so the generated Snack JS module graph is complete. scripts/check-snack-graph-v3221.mjs performs an **offline** virtual dependency graph check, without publishing Snack or using API credentials.

New scripts/check-builders-v3221.mjs parses the existing staging-only first-phase SQL plus **all 64 versioned SQL migration files**, tests side-effect denial, incorrect project and direct grants, uncertain request and stale-link handling, and owner UI wiring. The V3.221 GitHub workflow has reported **71 source-level assertions passing**, as well as **292 Snack modules with zero unresolved relative imports**, and the inherited V3.220 source suite passing **135 tests**. That workflow has reached a green success on V3.221 during this sweep. Separate Snack publishing has also been reported successful on a V3.221 commit; actual live device test is a different requirement.

.github/workflows/builders-major-v3221.yml runs the source/security and inherited regressions on push, cancels superseded branch runs and reserves heavier unsigned platform export steps for explicit workflow_dispatch. This reduces redundant work but does not reduce security assertions. Note: unsigned exports are NOT signed native builds. .github/workflows/production-check.yml now also cancels superseded branch runs; publish-snack.yml already had this protection.

Four historical workflow files had YAML errors: unquoted scalar values containing a colon. These were repaired to avoid spurious invalid-workflow failures, retaining their historical branch triggers. No branch histories were rewritten.

### Remaining CI status

The independent *Production foundation check* workflow has continued to expose older test-harness imports, one after another. Several were fixed, including V3.191, V3.100, V3.101, V3.102, V3.133-V3.142. Full production-foundation success on the latest commit has **not** yet been independently verified. Source CI success must not be represented as full mobile build or actual staging success.

## 4. Next stage / V3.222 proposal

- Finish consolidating old websiteBuilder Function() test harnesses into a single reusable safe adapter, then independently verify the production-foundation suite on one stable commit.
- Review production bridge schema assumptions against staging-only V3.180 baseline, including exact business role permissions, without accessing or copying any private production data.
- Build a disposable restore/rollback rehearsal, subject to separate explicit owner approval before real staging changes. Audit scheduling/HTTP/extension side effects before any attempt to apply.
- Extend the Business Brain from recommended next steps toward actual independently verified outcomes, preserving owner approval, privacy, tenant isolation, and any-industry website/app support.

**North star:** You tell Busy what needs doing. Busy does it — with evidence the result actually happened.
