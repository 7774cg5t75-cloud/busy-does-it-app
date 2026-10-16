# Disposable Supabase rehearsal — draft for owner review

Status: implemented test preparation, **not executed or approved for use**. No database, workflow run, environment protection, repository variable or billing setting has been changed by this preparation.

This is a reusable development gate, not a release pipeline. It preserves the application source and existing dependent PRs. It must not become a prerequisite for every small builder change: reuse successful evidence for unchanged schema/contracts, run lightweight offline checks continuously, and repeat this deeper rehearsal at meaningful schema/auth/integration boundaries.

## Review and approval before any first run

1. Review this dependent change against PR #20, including the workflow, Python orchestration, JavaScript integration tests, fixture prerequisites and destructive disposable-only rollback. No existing migration or application module is modified.
2. Confirm GitHub Actions eligibility and billing: public repository, **standard** GitHub-hosted `ubuntu-24.04`, no larger runner, no hosted Supabase project, no external provider or artifact upload. Standard public-repository runners are ordinarily free; the owner must verify the current account/policy and applicable log/storage limits before authorising execution. A workflow timeout limits execution time; it is not a financial spending cap.
3. Configure the GitHub environment `busy-disposable-db-review` with required owner-designated reviewers, no administrator bypass where supported, and a branch restriction matching only the reviewed branch. Confirm those protections actually exist: naming an environment in YAML does not create reviewer protection. Consider prevent-self-review if another authorised reviewer is available. **This task does not create or change those settings.**
4. Set repository variables `BUSY_DB_REHEARSAL_ENABLED=approved` and `BUSY_DB_REHEARSAL_APPROVED_SHA=<full reviewed GitHub commit SHA>`. Missing or mismatched variables skip the job. Do not set production credentials or project references. Remove/rotate the approved SHA after the approved run; future revisions require renewed source approval.
5. GitHub requires a `workflow_dispatch` workflow to be registered on the default branch before it can be dispatched. A new file only on a dependent draft branch may therefore be unavailable in the Actions UI/API. Registration requires **separate owner approval** for a minimal reviewed workflow change; do not merge the application PR chain to accomplish it. After authorised registration, dispatch the workflow at the exact reviewed development ref, with `approved_sha` matching that ref's full SHA and `approval=APPROVE_DISPOSABLE_TEST_ONLY`. This preparation neither registers nor dispatches it.
6. Approve the protected environment only after checking source and expected cost. No automatic trigger, workflow-run chaining, remote project credential, self-hosted runner or deploy step is provided.

The repository variable is an additional explicit source-approval gate; it does not replace correctly configured environment protection. A repository administrator can edit source/settings, so code review and repository access controls remain part of the trust boundary.

## What the approved rehearsal will do

- Start the pinned Supabase CLI's local stack on a standard disposable Linux runner, with real Supabase Postgres 17, Auth and PostgREST. No cloud account login/link is used.
- Create an **internal Docker network before startup**; verify attached containers have no additional network. Images are downloaded by the runner/daemon, but application containers have no external egress. Disable cron execution before applying any historical SQL. Older migrations contain worker URLs; never replay them with unrestricted egress.
- Start with an empty temporary migration directory. Bootstrap the existing isolated business-core fixture, an explicit missing internal-config compatibility fixture, and the existing bridge reference. These are **not authoritative production schema captures**. No production dump is fetched.
- Replay **every existing migration unchanged, in timestamp order** using `migration up --local`; compare the resulting migration versions and original file hashes. Missing dependencies or incompatible historical SQL fail the stage. Never skip a failing migration or weaken security to make the chain green.
- Call `supabase migration new shared_business_content_records` in the temporary workspace. Verify the CLI-generated version is unique and later than the existing history, then copy the exact prepared schema bytes into it. Record candidate filename and SHA-256. No guessed timestamp filename, repository write or automatic production migration is created.
- Test DDL within a rolled-back transaction and compare the previous public schema fingerprint. Then apply the candidate through the local migration runner.
- Create fictional Auth accounts at `example.invalid`, perform real local password sign-in, reject missing/malformed/tampered tokens, and execute the **existing source** `requireUser` and `membership` function bodies against local Auth/PostgREST. User-editable metadata is not ownership evidence.
- Execute the actual shared record store against real local PostgREST: create/approve/edit/Undo, same-ID tenant separation, exact revision races, generated-column constraints, event cancellation, membership-role revocation, and two concurrent creates at the 200-record cap.
- Verify direct anonymous/authenticated CRUD is denied. Separately exercise real Postgres RLS under transaction-only SELECT grants, then roll them back. This proves RLS independently of ACL denial; it does not change deployed privileges.
- Run focused existing contract regressions and client/Edge/export helper parity checks.
- Back up only fictional content rows locally, run a guarded **disposable-only** down script, compare the pre-candidate schema, reapply exact candidate SQL and restore/compare all content rows. This rehearses a data-preserving recovery strategy; it is not permission to drop a live catalogue. Production rollback should normally disable the new feature/retain data and use an approved forward repair. Database backups and independent staging rehearsal are still release requirements.
- Destroy local containers/data even when a stage fails. No cache or artifact storage is configured.

## Evidence and reproducibility

The workflow emits an allowlisted JSON report and GitHub job summary with source SHA, complete historical migration hashes, CLI version, actual image IDs/digests, candidate hash, individual stage results and integration check results. The runner's private temporary directory also contains the candidate SQL and diagnostics. Local credentials, user sessions, row dumps and raw CLI status are never uploaded or included in the public report.

A passed report means the **local Supabase-compatible** checks actually ran. It does not establish hosted Supabase project settings, API key rotation, production RLS, Edge gateway/runtime behaviour, external delivery, browser/device behaviour or release readiness. Current auth guards run as their exact stripped source bodies in Node; the whole Deno Edge HTTP function is **not** served by this harness. A failed setup/history stage leaves later checks unverified, never passed.

Local preparation checks (no Docker, CLI or network execution):

```sh
python3 scripts/disposable-supabase/check-draft.py
node --check scripts/disposable-supabase/integration.mjs
```

The runtime orchestrator deliberately refuses ordinary local invocation and arbitrary database URLs. It requires the reviewed GitHub-hosted runner context and exact commit. Do not remove those controls to run it locally. A separately reviewed local runner mode could be added later if necessary.

After a successful approved rehearsal, review the generated migration artifact and commit a correctly generated migration as a **separate** reviewed change. This workflow never pushes changes or adopts a CI fixture as a production baseline. Existing hosted schema provenance remains an explicit integration dependency.
