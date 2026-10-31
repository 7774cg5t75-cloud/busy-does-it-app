# Historical security audit — Phase Three,31 October2026

Phase Three implements locally tested provider transaction foundations, a bounded correction to an original legacy writer, public redirect/request hardening and targeted workflow protections. The final **453/453 application selection passed on clean, unchanged source**, all25 original Edge entry points genuinely compile, and21 provider/legacy plus31 AI-budget PostgreSQL stages passed. No provider, hosted schema, release or paid operation was activated. The complete historical deep audit remains unfinished.

## Source and private authority

| Checkpoint | Commit | Tree |
| --- | --- | --- |
| Independently rechecked starting GitHub report/head | `6a148f07217ad755742f2908dbd2f75614eb9cbc` | `f3c028d7cdb9326751f98f90d5a732a8d7f85585` |
| Preserved Phase Two functional checkpoint | `4c230a5c4254f3e369cbb87b71b7a37791a30b06` | `a94a50bd0ce9a907828b8c3f4557f7a2b798c411` |
| Published Phase Three implementation | `41bff13da839bb9b8adafeffd416876f308031e1` | `61580d39f129a02ab79b8c3256bd205960c12efe` |
| Equivalent frozen local test checkpoint | `0ff0d44c938e3f41429b0b132d9c2f7df595e46f` | `61580d39f129a02ab79b8c3256bd205960c12efe` |

The clean recovered local starting checkpoint was `8fc96efa…`, with the exact starting GitHub tree. The implementation commit directly parents the actual remote report. Expected-head, non-forced ref updates preserve additive history. The enclosing report commit identifies the final delivery tree; report/coverage/architecture evidence is added separately after the source freeze, without self-referential commit hashes.

Genuine private Master **V22.66** was reopened/checksum verified: `11f7b3069894b40d4467d90ba6883eeb3e3584057ace5b37c511187c883a483a`,2,684 paragraphs/19 tables. The original remains outside Git. Root AGENTS, architecture/workflow policy, existing threat model and actual Phase One/Two reports, coverage and checks were consulted. The repository inventory was not repeated. Supabase security/grant documentation and managed-environment guidance were consulted; a missing optional skill reference was not treated as authority. Draft PR26 remains against Mission14, with its inherited dependency chain independently rechecked and unchanged.

## Significant implementation and findings

| Area | Finding/need | Implemented correction | Evidence level |
| --- | --- | --- | --- |
| OAuth/provider foundation | Historical state/account/refresh/revocation paths lacked accepted transactional authority | Extend the original social connection/state tables with finite, service-only scoped transactions and an offline-only coordinator; keep original denial fences | Real local PostgreSQL and inert adapters; not deployed |
| Legacy Mini App writer | The original service-only entry RPC accepted independent business/app IDs without verifying their pairing | Reviewed replacement locks exact app/business; refuses conflicting historical scope; closes direct table and column write grants | Actual original SQL comparison plus corrected PostgreSQL denial/success/rollback |
| Public Mini App link | A stored HTTPS string alone was accepted as a redirect destination | Require the original project/bucket/business/app/live-version destination; preserve safe handoff fallback | Actual original handler with inert store; no external navigation |
| Internal resource safety | Four internal worker bodies and calendar metadata used whole-body parsing | Original incremental reader now enforces16KiB on four workers and8KiB on calendar status, before privileged work | Actual handlers/stream boundary regressions and genuine Deno |
| Workflow source/publication | Legacy externally influenced events could reach privileged/external jobs; mutable action references and automatic rebases complicated recovery | Four targeted workflow files hardened with immutable actions, explicit manual gates, narrower permissions, safe failure and deterministic read-only installation | Parsed YAML/shell and source regressions; no workflow dispatch |

The counter issue is an internal trusted-service data-integrity/tenant-attribution defect, not demonstrated anonymous RPC access. Its privileged caller boundary already existed; the missing exact record association was corrected without creating another counter store. Public reports omit sensitive operational reproductions. Historical migrations remain intact; review-only SQL is separate and fused.

## Provider replacement: what actually works locally

`docs/sql-proposals/provider-security/` and `supabase/functions/_shared/offlineProviderConnections.mjs` reuse **the two original social tables**, canonical businesses/current memberships and original token fields. No parallel provider database, customer identity or general persistence writer was added. Calendar provisioning authority remains missing; calendar is deliberately not mapped onto an invented schema.

Five finite service operations implement:

1. Begin a reviewed connection intent, storing only a hash of a cryptographically random state and one exact staging callback. Source revision, current owner and original connection ownership are bound. Starts are limited to10 per owner/business/hour, serialised for that pair; this is not a universal network-wide business rate limiter.
2. Atomically claim one unexpired state against the exact current connection revision and a server nonce. A member-row lock serialises revocation and a business-row lock serialises absent-row creation/competing callbacks. Claim acknowledgement loss is not permission to exchange again.
3. Complete a claimed result only under current owner authority and original connection CAS. New credentials never inherit an earlier refresh token. Old assets/scopes/destinations are cleared rather than silently applied to another provider account. A repeated completion must match its recorded result digest/subject.
4. Independently inspect scoped, secret-free metadata/receipts. A lost completion acknowledgement can be reopened in a fresh offline session without another exchange. A committed historical receipt does not prove the connection is still current.
5. Disconnect the exact current connection revision/subject, clear local credentials and invalidate pending claims while retaining state tombstones and completed receipts. A repeat can confirm that same local disconnection; it cannot disconnect a later replacement. Local disconnect explicitly does **not** claim remote provider revocation.

The real local tests exercise successful transitions, foreign/revoked owners, wrong redirects, expired/replayed state, concurrent claims, competing token replacements, revocation lock ordering, claim/completion acknowledgement loss, fresh-session inspection, disconnect races, scoped attempt limits and retaining lockdown.

### Permission and confidentiality boundary

The proposal revokes direct table **and column** access from ordinary client/service roles, enables RLS and grants only five finite service RPCs. Internal functions/schema are not directly granted. Fixed protected search paths and fully qualified records avoid untrusted lookup authority. A table-owner-plus-finite-operation trigger denies legacy direct service modifications to business-bound rows, even when a caller forges the transaction GUC; the GUC alone is not authority. Original unbound prototype records are retained, never assigned to a business by email inference.

Only a trusted server adapter may supply the actor after authenticating. The provided coordinator requires an explicitly offline simulation and contains no live network provider adapter. Model content cannot select RPC names, grant ownership, replace a connection or access tokens. No existing Edge route imports/enables the new coordinator. Original calendar/social denial fences and all10 legacy direct-model denials remain intact.

### What is still blocked

This is **not a working live OAuth integration**. Genuine callback transport/session identity, provider-specific PKCE/nonce/code/userinfo verification, account approval/replacement, remote revocation and provider billing/privacy acceptance remain absent. Tokens use the original server-private fields; they are **not application-encrypted**. Encryption/rotation, erasure, original Auth-user foreign-key/deletion compatibility and retention need a reviewed policy/implementation. There is no automatic deletion or retry of unknown exchanges.

Original social status readers still assume raw service table access. They must be migrated to finite metadata reads before any hosted install; otherwise the new least-privilege closure intentionally denies them. Original current hosted DDL, table ownership, triggers/policies/default privileges and operational records have not been inspected here. The original social prerequisite tables must exist; installation refuses missing contracts. These are precise activation blockers, not an unconditional deployment recommendation.

## Legacy writer and public API scope

The existing coverage matrix is extended with Phase Three, preserving earlier evidence. The original Mini App daily counter table/function is exercised, rather than replaced. Its reviewed function keeps the original public signature and service-only caller, locks the exact app/business pairing and rejects mismatched historical counter attribution. Both table-level and pre-existing column-level direct writes are revoked. Retaining rollback closes the writer without restoring the unsafe body or deleting counters.

Website enqueue/read/archive/retry, Mini App unread and guest-request/message authorities received selected source/grant/search-path review. Their existing service boundaries do not prove all legacy actor/approval/revocation paths safe. Full historical publication/message writer closure remains incomplete; no generic writer, new booking ledger or automatic publication was introduced.

The public redirect helper accepts only the current original project's public Mini App storage live alias, with exact business/app identity and matching live version. Credentials, alternate hosts/ports, query/hash additions and foreign/stale destinations are rejected; the original safe BUSY handoff remains. This does not independently verify hosted object availability or infrastructure DNS.

The shared byte/deadline reader is reused for four internal workers and calendar metadata. New16KiB/8KiB limits are for their small control payloads; larger existing builder/media payloads were not arbitrarily truncated. Actual authenticated oversized-handler tests assert413 before privileged lookup. Existing guest32KiB, form8KiB, founder2KiB and original-media12.8MB controls remain.

Still open: atomic guest challenge quotas/trusted proxy evidence, custom-host DNS rebinding/egress, remaining builder/private-media ingress bounds, upload revocation races, push-send idempotency and comprehensive log/error minimisation. A local body guard is not proof of hosted perimeter rate limiting, SSRF immunity or provider acceptance.

## Workflow and supply-chain hardening

Four source files changed: `apply-v13.yml`, `eas-link.yml`, `publish-snack.yml`, `real-staging-auth-v3128.yml`.

* The three privileged legacy jobs now require manual dispatch and an exact approval phrase. EAS/Snack additionally require a separately configured `BUSY_LEGACY_TOOLCHAIN_REVIEWED` variable. This mission did not set that variable or assert its current remote value.
* Workflow-level default contents permission is read; write permission is explicit only on jobs that legitimately push metadata/source. Those writer jobs retain credentials needed for their authorised push; the read-only staging checkout does not persist credentials.
* Expo credentials move from whole-job exposure to the EAS operation step. No credential value was read, rotated or copied.
* Automatic rebase/retry around external publication is removed. A moved branch fails instead of rewriting history/replaying an external action. Snack metadata artifacts are retained even if the metadata push fails.
* The read-only staging job uses `npm ci --ignore-scripts` against its lock. Unreviewed legacy `@latest` EAS/Snack tooling is not presented as fixed; its separate toolchain-review gate remains a prerequisite.

Pinned official v4 action commits are checkout `11d5960a326750d5838078e36cf38b85af677262`, setup-node `49933ea5288caeca8642d1e84afbd3f7d6820020` and upload-artifact `ea165f8d65b6e75b540449e92b4886f43607fa02`. Read-only upstream tag/commit metadata, verified signatures and action definitions/runtime were inspected. This is identity/runtime/provenance vetting, **not** an independent audit of every bundled/transitive action line. No workflow, signing, EAS build, OTA or distribution was invoked. Old versions of these files on other refs and repository Environment enforcement are not retroactively secured by this branch change.

### Dependency risk remains open

Fresh registry audit returns exit1: **2 high,10 moderate,2 low affected nodes**,14 total, zero critical. Four advisory families are currently reported: Zod `GHSA-mrhx-c7xc-m3w5`, deepmerge `GHSA-gcqx-w48m-w2h4`, glob `GHSA-3g3m-2fjr-6pw4`, minimatch `GHSA-g3hv-75wg-m249`. This is not14 independent vulnerabilities. Propagation/severity changed from the prior snapshot despite an unchanged package lock; do not mistake that for remediation.

Affected paths were traced through Expo CLI/config/fingerprint/Metro tooling. Installed/latest-required-major metadata remains deepmerge4.3.1, Zod3.25.76, glob13.0.6 and minimatch10.2.6. Recognised advisory fixes lie outside the permitted major lines or are not available there. The audit's suggested Expo downgrade is not a validated compatible correction. No forced override, downgrade, dependency churn or advisory suppression was applied. Tooling reachability is not proof of non-exploitability of all builds/dev servers/native paths. No vulnerable dependency was added to the governed Edge proposal path.

## Fresh verification, failures and evidence levels

See the companion [checks JSON](HISTORICAL_SECURITY_AUDIT_PHASE_THREE_2026_10_31_CHECKS.json) for exact command exits, all453 result rows, local transaction stages and source hashes.

| Verification | Actual result | Exit |
| --- | --- | ---: |
| Final complete application selection |453 passed,0 failed/blocked/unexecuted; source clean and identical at start/finish |0|
| All25 original Edge entries |Genuine Deno2.5.6 check, original pinned official SDK/frozen lock |0|
| Edge/new security-test syntax |173 parsed,0 failed |0|
| Targeted Phase Three and preserved Phase One/Two boundaries |Passed original handler and denial tests |0|
| Production foundation |105 passed |0|
| Security-by-design/baseline, architecture, existing staging-Auth regression |Passed |0 each|
| Workflow YAML/shell |Four YAML files and changed shell blocks parsed only |0|
| Provider and original legacy-counter PostgreSQL |21 stages passed, including induced installation rollback, ACL/column grants, concurrency, unknown outcomes and both retaining lockdowns |0|
| Existing actual AI-budget PostgreSQL |31 stages passed, including reservation ownership/unknown liabilities/cost controls |0|
| Initial default-sandbox database attempts |Local socket/Node subprocess EPERM; not accepted as SQL verification |1 each|
| Supported permitted local database rerun |Same hardcoded disposable socket;21/31 stages passed |0 each|
| Fresh dependency audit |Four advisory families remain |1|
| Required-major registry metadata queries |Four read-only queries passed; no install |0 each|
| Changed-source redacted secret detector |21 changed files, no signals |0|

One interrupted initial full-suite request produced no runner/artifact; it was not counted as a test. Recovery confirmed no active process or lost edits before starting the actual clean-source selection. Initial19-stage and subsequent21-stage local rehearsals passed as implementation grew; the final frozen21-stage run is the acceptance evidence. Expected negative SQL operations are asserted within passing stages; no individual unrecorded child exit is invented. The original wrong-scope counter acceptance is a deliberately observed unsafe outcome, not a passing security claim. Assertions were not weakened.

Canonical business/Auth test scaffolding is the existing explicitly reconstructed local fixture; original social/counter CREATE/function statements are reused. This is genuine PostgreSQL execution, **not authentic hosted DDL equivalence, real JWT/OAuth or real provider acceptance**. No customer data is used. No native client, package lock, Home/orb, navigation, appearance, microphone permission, app build number or signing identity changed. No new native rendering or Hermes export was warranted for this backend/workflow-only patch; earlier exports remain earlier evidence, not new acceptance.

## Remaining gates and next priority

1. Integrate finite provider metadata/intent operations into original authenticated source boundaries while keeping live exchange blocked. Establish real callback identity/session/PKCE/subject policy, canonical calendar provisioning authority, credential confidentiality/deletion and account-transfer/revocation semantics.
2. Obtain separately authorised current target schema/grant/deployment metadata before deciding any install is compatible. These fused proposals are not bundled into an automatically approved hosted activation. Original source fixes do not repair an older deployed endpoint retroactively.
3. Continue original legacy publication/message writer review and transactional permission closure, guest challenge quota/proxy trust, push/media resource and egress/reconciliation controls. Preserve original records and lifecycle approvals.
4. Resolve or effectively mitigate dependency paths with a compatible reviewed toolchain/Expo change; finish privileged workflow/source-integrity coverage and verify protected release environments separately.
5. Hosted two-owner Auth/JWT/PostgREST/provider tests, native whole-product acceptance and proportionate independent assurance remain outstanding. The full historical deep review is not complete.

The next safe source mission is the original authenticated provider metadata/callback preparation integration and guest/public quota closure, with further adversarial disposable tests. No comprehensive owner manual testing is requested yet.

No hosted SQL/Auth provisioning, production/customer-data access, provider activation, model spending, customer communication, publication, booking/payment, signed build, EAS/signing/OTA/distribution or external spending was performed. All existing provider/model/staging approval fences remain intact. Security, quality and readiness remain separate from a calendar deadline.
