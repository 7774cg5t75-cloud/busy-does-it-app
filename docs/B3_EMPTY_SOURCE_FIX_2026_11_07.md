# B3 empty-source fix — 7 November 2026

**Implementation and verification complete; hosted fix not installed.** The corrected runtime, separately fused migration, retaining rollback and genuine HTTP regression are delivered. Hosted SQL, native B3 execution and paid AI inference were not performed.

## Continuity and authority

- Starting development commit: `1fa62a2e454793ecac000477fdf453d78c7892ae`.
- Starting tree: `e09fcd041a2f407ae18d650266ffa935847fd07b`.
- Preserved prior functional implementation: `d7fdb898bf302177a81fa27ac6b3f46440f13f7a`, tree `625a330ff609bcf4bcc007e4e59f093766f12e2f`.
- Working branch: `codex/b3-empty-source-fix-20261107`, compatible with the original development branch and draft PR26 dependency chain. No reset, force update or merge is part of this correction.
- Genuine corrected private Master V22.85: SHA-256 `9dc5e697e5a0f5c676db86aedc5aaf1db7be85808fb3320af438ed945d38e22c`. Original ZIP CRC/XML integrity and its complete 3,353 ordered paragraphs/20 tables were verified. Complete master content and extracts remain outside Git.

The earlier unsuccessful B3 runs, unknown-outcome protections, private containment receipts and existing approved source remain preserved. No old execution approval is reused.

## Exact root cause and genuine reproduction

`busy_connected_builder_read_v1` deliberately raised SQLSTATE `40001` when an approved owner had no workspace snapshot. B3 expected one exact HTTP 500 error body to mean empty source. That selected a serialization-failure code for a permanent absence condition. In genuine PostgREST 14.18, the original SQL kept retrying rather than returning the response the synthetic bridge assumed; aborting the client did not end server processing.

[The retained genuine pre-fix receipt](evidence/b3-empty-source-20261107/original-postgrest-reproduction.json) records **2 passed, 0 failed** using PostgreSQL 17.11 and PostgREST 14.18:

1. A locally signed fictional JWT exercised the genuine HTTP role/owner-membership path and returned 200.
2. The original missing-source request was aborted after two seconds. PostgreSQL had recorded 7,103 `40001` errors at client abort and 17,853 after the additional observation interval: **10,750 more errors after client abort**. A matching backend was still active. Profiles/snapshots remained absent and the AI policy remained disabled/zero.

PostgREST binary SHA-256: `e62299f98f67938f754291340b2fc07b69685546e6017b455ef3e776daef45ee`. The original foundation SQL in the reproduction retained SHA-256 `b825989b37e2fef0f874ccdb03405a6650f8dc6ddfe27f94086952cc1cec225d`. Genuine HTTP used AF_UNIX plus a local PostgreSQL socket, with no public listener. Only the reproduction's owned local processes were stopped during cleanup.

This is real database/API evidence with fictional identities and a local JWT authority. It is not a new native Supabase Auth acceptance test, hosted SQL result, Website save or model call. The old `psql` bridge synthesised HTTP 500 from a database exception and therefore could not establish PostgREST retries or disconnect behaviour.

## Correction actually implemented

The runtime now requires the versioned authenticated `busy_connected_builder_source_state_v1` success contract. Only HTTP 200 JSON within 2,048 bytes, exact current actor/business identities, exact fields and consistent boolean snapshot/profile/empty flags can prove absence. Existing snapshots and every profile, including disabled profiles, deny empty-source preparation. All malformed responses, foreign/revoked scope, HTTP/database errors and timeouts fail closed. No HTTP 500 or error-code fallback remains.

The proposed SQL adds that original-authority presence projection, changes the deterministic unavailable-reader branch to non-retrying `P0002`, and changes eight manually raised CAS/history conflicts to `PT409`. Caught serialization/deadlock failures inside the source-state projection become terminal `PT503` errors, never empty success. Exact old/new function bodies and ACLs are pinned; original authentication, membership, RLS, source/CAS semantics, review, Studio readback/history and six-write limits remain.

Finite first-failure code/status diagnostics exclude response bodies, exception causes/getters and credentials. Client deadlines and non-replay remain, but no universal claim is made about transaction-commit or infrastructure failures outside the reviewed handlers.

Runtime, manifest, approval and marker protocols are v2. Packet preparation now requires a fresh verified `databaseContract`: the fix's native receipt version/name, execution digest, source-state fingerprint, revised-function fingerprint and independent private verification digest. B2 identity evidence alone is refused. Changed code/import hashes, old v1 packets or consumed approvals cannot authorise another run.

The [reviewed 58-file import inventory](evidence/b3-empty-source-20261107/reviewed-code-hashes.json) has canonical digest `12725d5e09117b7c450ab0757fb229caae8b8b71f095e8fc2a05fe7495ab12b9`. This public code inventory grants no execution authority and contains no native owner/business identifiers. An execution-ready v2 packet for the actual Lab has not been created; it requires the installed-fix receipt.

The fictional three-page source and plan digest remain unchanged: `0d8ef3e45ec96a9d608571dc1118c5095daa80f37a019a0813ccc1a614c97ddb`. Any future separately approved B3 execution remains bounded to one sign-in and six original source writes, zero retries/provider calls/spending/publication. No credential re-entry is indicated by this defect.

## Final verification on one frozen functional source

Functional commit `9cdb7d3bdf167b32f1af1c261d11b3e8dabf30d4`, tree `9cea4908e3c83e095f31fa2d35d34174901d2d92`. The complete CI result confirms identical starting/final commit and tree, a stable source and a clean worktree. Counts are overlapping selections, not a sum of unique assertions. [The independent CI summary](evidence/b3-empty-source-20261107/ci-summary.json) was checked against the downloaded artifact and all receipt counts.

| Check | Passed | Failed | Evidence scope |
| --- | ---: | ---: | --- |
| Genuine pre-fix PostgreSQL/PostgREST reproduction | 2 | 0 | Real local SQL, signed fictional JWT and HTTP |
| Runtime boundary | 40 | 0 | Synthetic native/API transport; strict empty-state, failures, timeouts and non-replay |
| V2 package/approval boundary | 20 | 0 | Local preparation/import/approval validation; no credentials or dispatch |
| Original source orchestration | 18 | 0 | 535 assertions; original handlers, protected facts and six-write/readback behaviour |
| Production foundation assertions | 105 | 0 | Fresh original assertions at the frozen source |
| Pure SQL artifact checks | 9 | 0 | Fuses, hashes, finite replacement set and rollback contract |
| New disposable PostgreSQL contract suite | 17 | 0 | Actual migration/history/role/ACL/source/conflict/failure checks |
| Original PostgreSQL source bridge after adaptation | 10 | 0 | Actual SQL/orchestration; HTTP/native transport remains simulated |
| Genuine corrected PostgREST HTTP suite | 20 | 0 | PostgreSQL 17.11/PostgREST 14.18, real JWT/SQL/HTTP, actual engine conflicts, six writes, Studio Undo/Redo and lost acknowledgements |
| Complete application selection | 528 | 0 | Also zero blocked and zero unexecuted; stable/clean exact source |
| All current disposable PostgreSQL suites | 332 | 0 | 13 commands, 14 independent receipt summaries; HTTP 20 counted separately |
| Genuine Deno/Edge targets | 36 | 0 | 27 original entrypoints and 9 proposal modules; Deno 2.5.6 |
| Restored Growth/Voice/Founder/Platform workflows | 6 | 0 | Current PR test-merge tree independently equals the functional tree |

Security-by-design, baseline, guarded installation/dependency, syntax/architecture and both unsigned Owner Preview/isolated-staging iOS exports passed at the frozen source. The baseline checked 1,037 source files and 557 locked packages. This is not a clean-registry-audit claim; the reviewed local dependency backport and documented advisory limitations remain. Builds are not device, signing, deployment or release acceptance.

Unsuccessful and cancelled evidence is retained. The first new PostgreSQL candidate had 9 passes/1 failure because its anonymous-claim fixture generated invalid `SET ... = NULL` syntax; the corrected fixture passed 17/0 without relaxing SQL authority. Earlier pure-artifact candidates finished 1 pass/1 failure and 6 passes/1 failure at the derivative expectation and comment-sensitive diagnostic assertion; their receipts remain alongside the final 9/0 result. Two corrected-path HTTP diagnostic runs each stopped at 4 passes/1 failure because the legacy non-retry error was initially expected as HTTP 404, then 400. Genuine wire evidence established HTTP 500/P0002 in 4 ms; only that expectation and the simulated bridge were corrected. The new typed 200 absence response already passed. Their receipts are retained. Initial minimal listener binding hit `EPERM`, an `OUT`-name collision was corrected, and initial HTTP 503 readiness responses were retained; readiness is now required before owner requests. Prior network-permission grant attempts lasting approximately 1,609, 1,141 and 639 seconds were cancelled and retained, not described as successful installation or test execution.

The new source-state RPC returned HTTP 200 in 4 ms in CI; legacy missing-source `P0002` returned fatal HTTP 500 in 3 ms. A real lock timeout returned 55P03 after 2,004 ms. Actual PostgreSQL deadlock 40P01 and serialization 40001 each occurred once and returned 503/PT503 in 114 ms and 51 ms, respectively. The reviewed function body, configuration and ACL were independently checked; the temporary local serialization-fixture setting was restored. [The separate frozen local HTTP proof](evidence/b3-empty-source-20261107/frozen-local-postgrest.json) also passed 20/0 on the identical implementation.

The API-key/gateway and native Auth facades remain disclosed synthetic fixtures. JWT verification, role switching, original SQL/RLS/CAS/history and PostgREST responses were genuine. No local result is presented as hosted native Auth/B3 acceptance.

[Superseded local attempt summaries and receipt hashes](evidence/b3-empty-source-20261107/superseded-local-attempts.json) retain the failed test expectations and environment-blocked/cancelled evidence; no failed CI run is relabelled green.

## Exact SQL proposal and hosted stop

[The reviewed proposal manifest](sql-proposals/ai-lab-b3-empty-source/manifest.json) is the authority for the complete artifact inventory:

| Artifact | SHA-256 |
| --- | --- |
| Fused installation | `37992a8a4600709affec86a2168460ca847a54120d4309a008b853e0f04050f4` |
| Outer-fuse-only execution derivative | `564a516eca321797e191c54efcfb1fd0efeed5e98740f83757c4a4364778bda5` |
| Fused retaining rollback | `e17b2406fe209729deaa94ef9f3ea74c37aa2f7cc19b94728aca05f03a79ca25` |
| Retaining-rollback execution derivative | `324203c52d5883c5f2fe91ba2007bc690cc89c7cadd29a3ade17b254bfb1ec66` |

The original installed foundation's reviewed bytes are unchanged. The new correction is **not installed**. The review fuse, five-second lock timeout, 120-second statement timeout and runner-owned atomic transaction/native-history requirements remain. Retaining rollback needs separate approval; it retains the non-retrying safety corrections, records, receipts and liabilities instead of restoring the known retry defect.

## Independently observed hosted baseline

[The sanitised Lab read-only preflight](evidence/b3-empty-source-20261107/lab-read-only-preflight.json), observed at **10:40:27 UTC**, confirms the correct healthy Free Irish Lab running PostgreSQL 17.11, 28 canonical public tables and six private AI tables. There is one fictional native user, one business and one membership, with zero profiles and snapshots. AI policy remains disabled/zero; all five ledger tables are empty. Both original native migration receipts and exact execution hashes remain unchanged. All five original function fingerprints and expected ACLs match, the new source-state function is absent, and no Edge Functions are deployed.

These are fresh hosted **read-only** observations, not installation or B3 execution. They confirm that the fix is still uninstalled and that older receipt evidence cannot authorise or attest the proposed new contract. The public receipt contains no native owner/business UUIDs, source contents or secret values.

## Next exact decision and remaining limits

The next decision is **separate exact migration-installation approval** for the isolated AI Lab. No older foundation or source-execution approval authorises this migration. Fresh read-only project, receipt, source-empty, function-body, permissions and disabled-budget checks are required immediately before any approved installation, followed by independent post-install/native-history verification. Use the [exact installation approval packet](sql-proposals/ai-lab-b3-empty-source/INSTALLATION_APPROVAL_REQUEST.md), its pinned new preflight/verification queries, and the existing complete catalogue query [read-only-post-install.sql](sql-proposals/ai-lab-foundation/read-only-post-install.sql). Compare the preserved original security catalogue while allowing only the reviewed five body changes and added authenticated function (70 public foundation functions after installation). Confirm no active original source reader before execution. No full original foundation reinstall is proposed.

Only then can the fresh verified SQL contract support a private v2 source packet. Manifest storage, one marker-only protected-job queue and actual-run/actor/commit-bound short-lived execution approval remain deliberate separate steps. The original marker is unchanged by this source mission; no new B3 job, Auth user, website/profile/snapshot write, credential change, Edge deployment, provider activation or publication was performed. Staging, production, Slow Roast and all other projects remain untouched. Errors and unknown acknowledgements never trigger automatic replay, repair, deletion or account reset.

The fix makes the original Website Builder source path safer; it does not establish a newly saved hosted Website, exceptional design quality or AI superiority. No visual renderer/content changes are claimed. Three design-reference candidates and zero approved Gold Standards remain; free/paid design parity and the planned Grow/Pro requirements are unchanged. Real model availability, tariffs, token limits, central reservation/settlement and the first paid request still require their own reviewed evidence and explicit approval. Before that paid pilot, test the existing central budget controller's stale/unknown-outcome behaviour through genuine HTTP as well; its current disposable SQL passes alone do not prove PostgREST transport behaviour. This does not authorise a new spending controller or paid call.

## Exact source and workflow evidence

- Functional commit: `9cdb7d3bdf167b32f1af1c261d11b3e8dabf30d4`.
- Functional tree: `9cea4908e3c83e095f31fa2d35d34174901d2d92`.
- Report-only commit/tree: the commit containing this completed report; its exact identifiers are provided in the delivery message. It changes evidence/documentation only.
- Main CI: run `42365375672`, job `128382212941`, success.
- Full artifact: `13572495629`, ZIP SHA-256 `c36651037cdd3ff08e10c4a977f38a709cbec316a78d1a6babd3a4a0f0e8a7a3`; independently downloaded, CRC/hash/receipts checked. GitHub retention expires 14 November 2026; safe persistent evidence is linked above.
- PR26 remains draft against `codex/builder-mission14-intelligent-followups`. Its six legacy runs use GitHub's synthetic PR merge `002f976256e4bef7598a823175f348048c47f4d6`, independently verified as the identical functional tree. No branch merge occurred.
- Source push left the historical marker byte-identical and queued only the main verification and six legacy workflows. No B3 job was queued.

Main workflow (copyable URL):

```text
https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/42365375672
```

Six restored workflows (all successful; one URL per line):

```text
https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/42365381851
https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/42365381744
https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/42365381787
https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/42365381766
https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/42365381742
https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/42365381776
```

See [the contract and next approval sequence](B3_EMPTY_SOURCE_CONTRACT_AND_NEXT_APPROVAL.md) for field-level validation, rollback and evidence boundaries.
