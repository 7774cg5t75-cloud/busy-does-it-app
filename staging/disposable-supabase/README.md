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

## Startup refusal investigation and bounded diagnostics

Rehearsal #8 at be82df34baf6c08397c8d96f98e7a75c642e58f2 failed at isolated-stack-start in supabase-local-start with exit 1 and connection-refused. This does not identify a service or prove that network isolation caused it. Raw output was intentionally not published and was removed during cleanup. No database migration result is established.

Reviewed upstream CLI 2.54.11 sources:
- https://github.com/supabase/cli/blob/v2.54.11/internal/db/start/start.go — Postgres publishes configured host port 54322 to container 5432; native pg_isready probes container loopback with a 120-second readiness budget. SetupLocalDatabase then opens a runner-side Postgres connection before applying service schema initialisation.
- https://github.com/supabase/cli/blob/v2.54.11/internal/utils/connect.go — ConnectLocalPostgres uses the configured hostname and published database port.
- https://github.com/supabase/cli/blob/v2.54.11/internal/status/status.go — PostgREST readiness is checked through the API gateway at /rest-admin/v1/ready, not with a native container health check.
- https://github.com/supabase/cli/blob/v2.54.11/internal/start/start.go — start removes project containers when startup fails. Sampling only after CLI exit can miss the failing service.
- https://docs.docker.com/reference/cli/docker/network/create/#network-internal-mode---internal — internal networks allow same-network communication and host-to-container-IP access while blocking other networks. This does not establish that published-loopback forwarding works in this particular runner/Docker configuration.

A bounded observer now runs only during the already approved start command. It inspects six fixed project container names and the internal-network flag, samples only the fixed runner loopback ports and verified project-internal container addresses for Postgres/API gateway, and records allowlisted status/health/port-binding booleans and TCP categories. It does not fetch raw service logs, print Docker environments, change networking, create containers, issue SQL, or call external hosts. All subprocess and TCP probes have short timeouts; the observer stops before migrations proceed.

The failure report includes latest observations plus lastObserved per service, because CLI cleanup may already have removed it. Sample numbers identify observation order; lastObserved entries can be from different times, and brief services may be missed. Native health status and TCP results are observations, not a causal verdict. No result means unobserved, not healthy.

Interpretation for a separately approved future run:
- Runner published Postgres refused, direct internal Postgres open, native DB healthy: evidence of a published-port/host-path discrepancy; investigate Docker forwarding/bindings without granting container egress.
- Native DB unhealthy or both paths refused: investigate local Postgres readiness/listening/startup first; this alone does not prove a firewall fault.
- Published API gateway refused with /rest-admin/v1/ready evidence: investigate Kong publication/readiness before attributing failure to PostgREST.
- Service healthy but container-to-Postgres refusal category: inspect same-network membership and service startup ordering.
- No classified endpoint: retain uncertainty. CLI phase markers and service observations narrow the next investigation without disclosing raw output.

Refused endpoint categories are extracted only from lines containing connection refused and recognised local endpoint literals. Unknown targets become a fixed unclassified category; no addresses, credentials, row data or arbitrary error text are republished. A marker may be incidental/transient and does not prove it caused the final exit.

No startup workaround, ignored health check, CLI upgrade, external network attachment or increased retry budget is introduced. The workflow and all manual/source/environment approvals remain unchanged. This commit needs renewed exact-SHA source approval before any separately authorised execution. No run is performed by preparation or offline validation.

## PostgreSQL-only connectivity control (prepared, not executed)

Select mode=postgres-control on this workflow at codex/disposable-supabase-review only after separate execution approval. This is a separate job with the original public-repository, manual-event, approval-phrase, input-SHA and repository-variable gates, the same busy-disposable-db-review protected environment, pinned checkout of github.sha and persist-credentials=false. Default mode remains diagnose; neither diagnose nor rehearse runs when postgres-control is selected. No default-branch registration change is needed.

The owner must separately approve the new exact commit, verify the existing environment reviewers/branch restrictions and standard public ubuntu-24.04 £0 eligibility, then use approved_sha=<new full SHA>, approval=APPROVE_DISPOSABLE_TEST_ONLY and mode=postgres-control. BUSY_DB_REHEARSAL_APPROVED_SHA must match that new SHA and BUSY_DB_REHEARSAL_ENABLED must remain approved. Preparation does not alter those variables or dispatch anything.

The reviewed CLI v2.54.11 image source is https://github.com/supabase/cli/blob/v2.54.11/pkg/config/templates/Dockerfile: supabase/postgres:17.6.1.029. The control uses its ghcr.io registry location, records the pulled image ID and available registry digest, then creates the container by immutable local image ID. The version tag has the same upstream mutability limitation as the existing CLI setup; recorded digests support later reproducibility. It does not pull an unreviewed generic PostgreSQL version or upgrade the CLI.

postgres_control.py overrides the image entrypoint and runs initdb plus postgres as the postgres user. It deliberately skips Supabase entrypoint/bootstrap scripts, services, application migrations and fixtures. A random local-only password enables SCRAM host authentication; only the local Unix socket uses trust. Shared preload libraries are disabled and cron execution is off. Container root is read-only with all capabilities dropped and no-new-privileges; cluster data and password staging live in bounded temporary memory. No customer data or hosted credentials are used.

The control owns one labelled container and one separate internal bridge network. It requests only 127.0.0.1:54322 -> container 5432, first checks the host port is free, verifies Internal=true and sole-network membership, and probes no external destination. It samples for at most 60 seconds (plus a bounded in-flight sample), preserving the first readiness success, every observed state transition, exit/OOM state, native health, configured/effective binding count and expected-port/loopback booleans. The three controls are in-container pg_isready, runner -> verified private container IP:5432 and runner -> 127.0.0.1:54322. Addresses, passwords, raw stdout/stderr, health-check logs and Docker environment values are not published.

Evidence is saved before this control removes anything. It has no Supabase automatic cleanup race. Cleanup removes only resources bearing this exact SHA/run/attempt ownership label, including anonymous volumes; an always-run fallback repeats that ownership check. The private password file is removed. Failed cleanup fails the control. Reports use existing JSON/job-summary output without cache or artifact uploads.

Expected conclusions:
- all-paths-open: the minimal cluster and both host paths work here; investigate Supabase-specific bootstrap/configuration next, rather than attributing #9 to isolation.
- published-path-failed: pg_isready succeeds and direct container access works, while loopback fails; inspect configured/effective bindings and Docker forwarding. Keep the internal network.
- direct-path-failed: pg_isready succeeds but direct access fails; investigate the verified internal host/container path.
- postgres-not-ready: readiness never succeeded or the final sample lost readiness; use firstReady, transitions and exit/OOM state to distinguish never ready from ready-then-exited. No PostgreSQL log/root-cause claim is inferred.

A successful control is not evidence that application migrations, Supabase Auth/PostgREST, RLS or rollback passed. A failed control does not authorise an isolation bypass. Continue unrelated Website Builder and App Builder work with existing lightweight offline checks; reserve this gate for the database acceptance boundary.

Offline validation (all Docker, sockets and waits are mocked):
    python3 scripts/disposable-supabase/check-postgres-control.py
    python3 scripts/disposable-supabase/check-draft.py
    actionlint .github/workflows/disposable-supabase-review.yml

## Internal-only Docker published-port correction

PostgreSQL-only control #10 at 8e12b8a5ff72645dfb2f3255dcc67309119ad6b8 confirmed healthy PostgreSQL, pg_isready success and direct runner access while Docker retained one requested localhost binding but created zero effective bindings. Published localhost access was refused; the container remained healthy without OOM and cleanup succeeded. This verifies a publication-path failure, not a PostgreSQL startup failure.

The symptom matches https://github.com/moby/moby/discussions/53256, reported on different Docker/OS versions. This is corroborating evidence, not a claim that every Docker version behaves identically. The discussion's second, noninternal-network workaround is deliberately not used.

The approved rehearsal now creates only two host-side forwards, before Supabase CLI startup:
- 127.0.0.1:54322 -> verified supabase_db_busy-disposable-review internal address:5432.
- 127.0.0.1:54321 -> verified supabase_kong_busy-disposable-review internal address:8000.

Before each upstream connection, local_proxy.py verifies the original network ID, Internal=true, the fixed project/container name and project label, running state, sole-network membership and matching NetworkID, and a private IPv4 address within that network's IPAM subnet. Each service container ID is pinned after first use; replacement is rejected. Destinations and ports are fixed in reviewed source, not chosen by clients, payloads or workflow inputs.

Listeners accept loopback clients only. The implementation is a bounded TCP byte forwarder, not a generic HTTP CONNECT/SOCKS proxy. No container network, external route, firewall setting or permission is changed. Docker inspection is read-only. At most 16 concurrent sessions share the two listeners, with bounded buffers, partial-write handling and TCP half-close support. Payloads, credentials and arbitrary errors are never logged; the existing public report adds fixed policy labels and connection counters only.

Both listeners and active sessions are closed in the rehearsal finally block, on success or failure, before the existing Docker cleanup step. They live inside the rehearsal process, so terminating that process leaves no separate proxy process running. Port conflicts fail startup without stealing a port or changing network policy. If a future Docker version creates native bindings again, they may conflict with the reserved proxy ports; that requires a separately reviewed compatibility change.

All workflow gates, exact-SHA checks, protected environment, pinned CLI/actions, real database tests, historical migrations and isolation/health assertions remain unchanged. The PostgreSQL-only control remains an unproxied baseline. Observer runnerLoopback=open now indicates a listening proxy, not upstream readiness: CLI schema initialisation, API readiness and real Auth/PostgREST tests still establish actual service readiness.

Offline validation:
    python3 scripts/disposable-supabase/check-local-proxy.py
    python3 scripts/disposable-supabase/check-draft.py
    python3 scripts/disposable-supabase/check-postgres-control.py

The new proxy tests mock Docker/listeners and use a deterministic binary-stream model for partial writes, bounded buffering and half-close. They need no external downloads or network access. Security cases cover unrelated projects, extra/replaced networks, invalid/out-of-subnet addresses, replaced containers, nonloopback clients, occupied ports, concurrency limits and cleanup. Existing startup-failure tests verify proxy start/stop and sanitised reporting integration.

After separate owner approval of the new exact SHA, the minimum next test is one manual mode=rehearse dispatch at codex/disposable-supabase-review with the input SHA and BUSY_DB_REHEARSAL_APPROVED_SHA both matching that commit, BUSY_DB_REHEARSAL_ENABLED=approved, the existing approval phrase and protected-environment approval. It should show forwarding for both services and CLI startup/schema/API readiness passing while containers remain solely on the internal network. Later migration/fixture failures must be assessed separately; this correction does not claim those tests already pass.

No workflow run, hosted Supabase access, setting change, merge, deployment or additional external spending is performed by preparation. Unrelated Website Builder and App Builder work remains unblocked.

## Scheduler-containment privilege correction after rehearsal #11

Run #11 at b455037e8ef6381767af53582cc873312fb5bedf passed Supabase startup and reached scheduler-containment, then psql exited 3 under ON_ERROR_STOP=1. The old report did not distinguish the four SQL calls, and cleanup deleted private stderr. Therefore the first failing historical statement/SQLSTATE cannot be recovered from the retained report.

A privilege defect is independently verified in the pinned image:
- https://github.com/supabase/postgres/blob/17.6.1.029/migrations/db/migrations/10000000000000_demote-postgres.sql explicitly demotes postgres to NOSUPERUSER.
- https://github.com/supabase/postgres/blob/17.6.1.029/ansible/files/postgresql_config/supautils.conf.j2 delegates extension management to postgres but does not allow cron.launch_active_jobs in its privileged-role configuration list.
- https://www.postgresql.org/docs/17/sql-altersystem.html requires superuser or parameter-specific ALTER SYSTEM privilege. The existing helper used -U postgres even for this administrative operation.
- The image's initial schema declares supabase_admin a superuser. https://github.com/citusdata/pg_cron/blob/v1.6.2/src/pg_cron.c defines cron.launch_active_jobs as a SIGHUP-reloadable, superuser-only setting.

The fixed containment path uses the EXISTING supabase_admin role through docker exec in the verified disposable DB container, confined to a fixed reviewed map: verify current administrator is superuser; create pg_cron if absent; set cron.launch_active_jobs=off using ALTER SYSTEM; signal pg_reload_conf; verify the flag via a fresh session. No role grants, privilege promotion, arbitrary administrative SQL or remote connection input is added. Ordinary schema, integration, permission and RLS SQL retains the original postgres role.

Every administrative psql call keeps -X and ON_ERROR_STOP=1 and adds VERBOSITY=sqlstate. Reports publish only fixed operation labels and an exact five-character SQLSTATE parsed from a SQLSTATE-only ERROR/FATAL/PANIC line. SQL text, arbitrary error messages, DETAIL/HINT/CONTEXT, credentials and row data stay out of the public report. schedulerContainment records the current operation and successfully completed SQL calls; completed verification calls are not themselves proof of containment until the final off check succeeds.

pg_reload_conf() signals asynchronous reload. Its result must be true; verification accepts only off, retries only an on observation for a bounded ten fresh-session checks, and fails on any SQL error, unexpected value or continued on. Fixtures and historical replay remain after the containment barrier. No scheduler check is bypassed or treated as optional.

Offline validation includes:
    python3 scripts/disposable-supabase/check-scheduler-containment.py

The tests inject failures into each administrative SQL operation and verify exact labels, SQLSTATE-only reporting, fail-fast ordering, private-log permissions, sensitive-value exclusion and proxy cleanup. They also exercise failed administrator/reload checks, bounded propagation of on -> off and permanent-on rejection. All Docker/SQL operations are mocked. No live SQL was executed during preparation.

The next separately authorised rehearsal must use the new exact SHA in both approval gates and the existing protected-environment approval. It must show scheduler-containment passing before any historical SQL; if another issue appears, the fixed operation/SQLSTATE now identifies it. Localhost proxy, internal Docker isolation, cleanup, workflow triggers, SHA/environment gates, £0 additional-spending policy and PR dependencies remain unchanged. Website Builder and App Builder work unrelated to database acceptance remains unblocked.
