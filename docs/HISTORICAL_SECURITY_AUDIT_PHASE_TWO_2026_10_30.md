# Historical security audit — Phase Two,30 October2026

All25 original Edge entry points now pass the actual Deno compiler against the existing pinned official SDK and frozen lockfile. Confirmed legacy provider and request-resource weaknesses have source-level mitigations, with original/current inert reproductions retained privately. This completes the requested entry-point type/dependency selection and extends the historical security review. It does **not** complete a line-by-line review of every helper, prove hosted permissions, or establish provider/native/release readiness.

## Provenance and preserved authority

| Checkpoint | Commit | Tree |
| --- | --- | --- |
| Independently rechecked starting GitHub head | `900ecb68a8983f1d6ffb9da5f4fabee7939a132e` | `c050d9533f7446335f26edf2383a0b12a4d745d5` |
| Preserved Phase One functional checkpoint | `31ea363fb0373b663225871ba51630b2571c525f` | `d5ba81f16c79d25f5a54a9b1017371586a32dfa1` |
| Phase Two implementation | `4c230a5c4254f3e369cbb87b71b7a37791a30b06` | `a94a50bd0ce9a907828b8c3f4557f7a2b798c411` |
| Equivalent clean local final test checkpoint | `61151ab51fe41cc5c788cf1a5d0c19f03216631d` | `a94a50bd0ce9a907828b8c3f4557f7a2b798c411` |

Local recovery lineage began at `0002b0ed0412e963384e88224d15091e0fb1230d`, with the exact starting GitHub tree. Recoverable additive local checkpoints are `070257e6bdcb45cd39ae935817a1129ce8469461` (runtime/security fixes), `df7e2f8ea201eac18c5216f08f1b8401133c6178` (reusable Deno verification), and `61151ab…` (coverage update). The equivalent published implementation directly parents the actual starting remote report. Publication uses expected-head non-forced Git ref updates; no reset/rebase/dependency-branch edit or merge.

The genuine complete V22.66 original was reopened and checksum verified as `11f7b3069894b40d4467d90ba6883eeb3e3584057ace5b37c511187c883a483a`;2,684 paragraphs/19 tables. Original/extraction remain private. Root AGENTS, architecture, workflow policy and all four Phase One delivery artifacts were consulted. The existing coverage matrix was extended, not replaced; the original full inventory was not repeated. Relevant current Supabase Auth/header documentation was retrieved through its documentation tool. Deno2.5.6 command help was consulted after an unsupported proposed CLI flag failed; no compatibility result was fabricated.

The open draft PR list was independently rechecked, including26→Mission14,25→13,24→12,23→disposable review and its inherited chain. Documentation dependency PRs were observed too. No dependency relationship was changed. Owner Preview29, Home/orbs, appearance, original client navigation and account records remain unchanged.

## Corrections actually implemented

| Finding | Severity and scope | Implemented correction | Evidence and limitation |
| --- | --- | --- | --- |
| Historical OAuth connection authority/replay and account-change gaps | High when provider operations are activated | Source-deny legacy calendar mutations/sync and all social provider actions/callback styles until canonical current actor/member/connection/state authority exists. No environment/client switch opens this new fence. Preserve safe private social draft actions and read-only calendar status | Original calendar callback executed twice with inert stale-authority state; current handler denies before network. Full transaction repair is **not** claimed; detailed sequences are private |
| Public/privileged readers relied on declared length or read entire body before checking | Medium, resource-exhaustion exposure | Shared incremental byte/deadline reader for guest32KiB, website form8KiB, founder2KiB and original media12.8MB. Stops oversize streams, rejects malformed UTF8/JSON, cancels/cleans up and returns truthful error status | Actual original guest handler safety assertion exits1; corrected handler and stream/incorrect-header/UTF8/deadline fixtures pass. No load attack generated |
| Health probing followed redirects and buffered before slicing | Medium, internal probe prerequisites | Reject redirects; cap streamed upstream data at500,000 bytes; preserve request timeout and cleanup | Actual original/current helper comparison with inert oversized response fails original safety assertion and passes corrected helper. Custom-domain DNS/rebinding/egress remains unresolved, not claimed SSRF-proof |
| Empty internal service-key comparison lacked explicit fail-closed precondition | Low, defence in depth | Require nonempty service key before direct service-bearer success in four website worker/provider endpoints | Source regression protects guard; normal SDK startup may already deny absent configuration, so no hosted exploit is claimed |
| Missing deployment imports and incorrect inferred helper contracts | Reliability/type correctness | Repair Website form→original lead helper and worker→original form policy imports; narrow guarded receipt unions; declare real helper object/array/callback inputs; stabilise validated request data across closure; check unknown token/catch shapes; copy typed-array digest input | Genuine Deno43-diagnostic intermediate reduced to2 then1 then0. No `any`, ts-ignore, nocheck or weakened compiler configuration added |

Provider closure is an intentional, evidenced security change. Supplying keys, a configured prototype owner, old OAuth state, a model proposal, or an owner-consent Boolean cannot make those closed operations safe. The old implementation is retained for reviewed migration compatibility, not described as working hosted integration. Private draft editing is not publication or permission to reuse arbitrary media.

The new `legacyProviderAdmission.mjs` and `boundedRequest.ts` extract small reusable security responsibilities. The existing official SDK adapter is reused across the remaining entries; redundant legacy JSR runtime shims are removed where Deno already supplies its own types. No new CRM, controller, persistence/billing system, generic writer or generated-code executor was introduced. Oversized AppController/Mini App responsibilities were mapped; broad refactoring was deliberately avoided while fixing entry boundaries.

## All25 endpoints and coverage honesty

[Updated original coverage matrix](HISTORICAL_SECURITY_AUDIT_2026_10_30_COVERAGE.json), `phaseTwo.endpoints`, contains one record for **every original entry**: access, trusted identity/current membership, privileged/provenance authority, input/resource controls, rate/abuse, external requests/SSRF, revisions/retries/unknown outcomes, SQL/effective permissions, error/privacy scope, depth and remaining gate. The preceding Phase One matrix remains intact as historical evidence.

| Group | Endpoints | Evidence |
| --- | --- | --- |
| Closed legacy model entries | ai-intake, social-content, command, conversation-extract | Original10-call census/denial regression preserved; no live provider |
| New bounded model proposal | builder-proposals | Selected gateway/accounting boundaries source-reviewed and locally exercised; offline/default disabled |
| Legacy provider integrations | calendar-oauth, calendar-sync, social-publish | State/token/owner/callback source review; actual handlers denied with inert transport; canonical provider authority unresolved |
| Public/customer Mini Apps | mini-app-guest, mini-app-link, mini-apps | Entry routes, selected public/owner/customer identities and original readback contracts reviewed; guest byte guard executed; large historical gateway helpers not all deeply reviewed |
| Push/receipts/monitoring | mini-app-guest-alert-dispatch, mini-app-guest-alert-receipts, push-dispatch, production-watch, founder-ops | Identity/worker secret, lease/receipt, batching/provenance and selected reporting boundaries inspected; genuine provider delivery remains unverified |
| Website public/private/infrastructure | website-form, website-origin, website-health, website-original-media, website-provider, website-signals, website-worker, website-publish, website-design-review | Original route authority/source selection, finite operations and selected resource/render boundaries reviewed; all compile; hosted grants/storage/DNS/provider acceptance outstanding |

Every entry is genuinely type-checked; **type-checking is not an authorisation test**. Existing historical any/unchecked JavaScript remains technical debt; this is not proof that every runtime value has a sound static type. Entry routing and selected high-risk boundaries are source-reviewed for every endpoint; not every helper in the4,531-line Mini App gateway,1,560-line Website gateway, worker/provider implementations or inherited SQL has received independent deep execution review. The matrix explicitly identifies sampling and unexecuted paths.

## OAuth, provider permissions and credentials

Calendar and social flows have fixed callback destinations and existing unpredictable state, but unpredictability alone does not establish an atomic current actor/business/connection claim. Historical state read/delete and multi-request connection updates are not accepted as revocation-safe. Retaining a refresh token across an unverified provider account change is not approved. Current source closure prevents these operations; it is not a replacement canonical OAuth design.

Social owner access still requires fresh server Auth plus an explicitly configured Auth UUID, never email/metadata. Its global prototype workspace remains unsuitable as a tenant model. Earlier subject/time/revision checks and HTML encoding remain intact; the original missing authoritative provider-subject mapping is still a blocker. Both path and query callback styles, destructive callbacks and owner provider actions are closed. No token/schema provisioning was performed. Historical social SQL includes a scheduled batch call; current source denies that legacy execution path. Existing hosted function versions/schedules were not inspected or changed, so these source fixes do not retroactively protect an older deployed endpoint. Deployment/version reconciliation remains a separate controlled prerequisite.

Original social SQL stores tokens server-side with deny policies for ordinary roles; these statements do not establish current effective hosted permissions, at-rest application encryption, provider revocation or legal retention acceptance. Authoritative calendar provisioning DDL is not present in the selected migration set. No token values or real accounts were inspected. Current connection CAS, membership revocation at dispatch, one-time state claim, subject-bound refresh and retained/revoked state recovery must be implemented through original finite authorities before reopening.

## AI and central monetary admission

All10 known direct model/transcription HTTP paths remain source-denied. The new proposal gateway remains exact-staging/offline-only and externally disabled. The pinned Edge dependency lock contains official Supabase components/transport dependencies, not a model-provider SDK. Searches for model SDK construction, completion/generation APIs and additional provider endpoints found no additional indirect live inference integration in the selected source. This finite source/dependency evidence is not whole-program proof or permission for future providers.

Fresh31-stage actual local ledger checks re-exercised conflicting-operation reservation ownership, duplicate/lost acknowledgements, dispatch once, concurrent balances/platform ceiling, stale context, revocation, uncertain liabilities, receipt overrun, kill switch and retaining rollback. No live tariff, subscription entitlement, provider invoice, currency feed or billable request was provisioned. Infrastructure/Browser Rendering, push/social and hosting costs remain outside universal AI-ledger acceptance. **Zero live paid model paths are accepted as centrally protected.**

## Supply chain and release review

The23 workflows referencing secrets and three with write tokens (24 distinct files) received targeted trigger/permission/credential/action/install/release-block review. Legacy preview families trigger only their named historical branches/file paths but also expose manual dispatch; some hold Expo credentials at job scope without an independently verified protected Environment. Three legacy workflows can write repository content. Snack publishing also has historical PR/branch trigger paths. These are relevant dormant/activation and supply-chain risks, not evidence that this mission executed them or that every workflow is exploitable.

Floating action tags, persisted checkout credentials, unpinned `@latest` tooling and `npm install` in privileged jobs remain open. Recommended controlled remediation is reviewed full-SHA action pinning, job-scoped minimal credentials, disabling persisted checkout credentials for non-writers, lock-based installs where compatible, and protected reviewed release environments/explicit approved dispatch. Actual repository/environment enforcement was not inspectable. Per owner restrictions, no signing, provisioning, distribution or paid-build workflow was altered or run. No credentials were read.

Fresh `npm audit --json` exits1 with **three high and28 low affected nodes**,31 total and zero critical. The same two root advisory families remain: Zod/Expo `GHSA-mrhx-c7xc-m3w5` and deepmerge `GHSA-gcqx-w48m-w2h4`. This differs from Phase One's recorded3 high/5 low propagation snapshot despite an unchanged dependency lockfile. Affected nodes are not31 independent vulnerabilities. Known Expo CLI/config/dev tooling paths remain in scope; no compatible fix was validated and no forced upgrade, override or suppression was applied. Tooling reachability does not prove all native/build paths non-exploitable.



Observed upstream v4 tag targets (read-only metadata; not applied or independently audited):

* `actions/checkout@11d5960a326750d5838078e36cf38b85af677262`

* `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020`

* `actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02`

These are review candidates matching the observed tags, not a claim that the referenced action implementations are vulnerability-free. No workflow was modified.

## Actual verification and failures

[Phase Two checks JSON](HISTORICAL_SECURITY_AUDIT_PHASE_TWO_2026_10_30_CHECKS.json) records source, selections, actual process exits and all application result rows without private logs/payloads.

| Verification | Actual result | Exit |
| --- | --- | ---: |
| Initial all-Edge original dependency check | Legacy JSR manifest unavailable; no type pass claimed |1|
| First real pinned-SDK all-Edge check |43 genuine diagnostics, including two missing local imports |1|
| Subsequent corrective compiler iterations |2 then1 remaining diagnostics |1 each|
| Final all25 genuine Deno checks |Zero diagnostics, real dependencies/frozen lock |0|
| New reusable all-Edge runner |25 entries accepted, Deno2.5.6/TypeScript5.9.2 |0|
| Initial runner invocation |Restricted subprocess EPERM, correctly reported blocked |2|
| Intermediate runner CLI attempt |Unsupported cached-only flag; removed after actual command help |1|
| Original guest-handler safety assertion |Failed as intended against original code |1|
| Actual original/current calendar and health inert comparison |Original safety assertions fail; corrected denials/bounds pass |0 comparator|
| Phase Two security regression and preserved Phase One regression |Passed |0|
| Production foundation |105 checks passed |0|
| Security-by-design/baseline and architecture checks |Passed |0 each|
| Edge JS/TS plus new security regression parsing |170 files passed/0 failed |0|
| Actual local AI-budget PostgreSQL |31/31 stages |0|
| Actual local connected-builder PostgreSQL |62/62 stages |0|
| Complete application candidate selection |452/452 passed; verification tooling/coverage changed during this candidate run |0|
| Final clean-source complete selection |452/452 passed; clean identical source at start and finish |0|
| Fresh dependency audit |3 high/28 low affected nodes remain |1|

A temporary local edit-helper script had a syntax error before touching source and was corrected; it was not accepted as verification. No assertion/security rule was relaxed. Phase One's two450/451 failed processes and repaired fixtures remain historical evidence, not rewritten results. The final clean selection identifies the exact clean local source commit/tree and unchanged source at finish.

No native source, package lock, build identity or visual component changed. Phase One's two unsigned local Hermes exports remain earlier evidence; they were not unnecessarily repeated for an Edge-only patch. No browser/native screenshots were obtained. Inert security handlers and Deno checks are not rendering, hosted Auth or device acceptance.

## Remaining findings and next work

1. **Before any provider activation:** canonical current tenant/provider account/connection mapping, atomic state claim and membership/connection revision protection, safe account-change refresh policy, revocation, token storage/retention and unknown provider outcomes. The new source denial must never become a global enable flag.
2. **Historical privileged writer closure:** per-action review of legacy Website/Mini App/customer/message/publication operations beyond the locally locked staging slice; real current permissions and concurrent revocation. Existing getUser or a single membership read is not an accepted transaction guarantee.
3. **Public abuse/resource boundaries:** complete per-identity/per-project ingress limits and byte/response budgets on remaining entries; atomic guest challenge quota, trustworthy proxy-header evidence, device business scope, push test-send admission/idempotency and monitoring deduplication. Existing counters/CORS/PoW are not universal abuse protection.
4. **Network/storage exposure:** custom-host DNS/rebinding and egress restrictions, original media multi-request membership/rate race, public destination allowlist, error/log minimisation and safe generated HTML/storage/cache acceptance. Redirect/body corrections alone do not close the entire SSRF/upload surface.
5. **Supply chain and CI:** compatible advisory remediation or demonstrated affected-path mitigation, protected release credentials, reviewed action/tool pinning and historical workflow execution fences. Repository administrator/provider changes remain separate approvals.
6. **Hosted staging:** the historical infrastructure router generator still has a production-origin fallback, so its compilation is not staging compatibility acceptance. Infrastructure deployment is outside the selected connected gateway allowlist; require an independently bound isolated target before any future provisioning. Actual target/schema/ACL inspection, authentic compatibility closure, final package/deployment fingerprints, separately approved fictional Auth/provisioning/gateway deployment and real two-owner JWT/PostgREST tests. No unconditional activation readiness is asserted.

The next source mission should implement the original canonical OAuth state/connection transactional contracts and remaining legacy writer/abuse limits with disposable adversarial tests, while provider/staging switches remain disabled. Continue comprehensive owner testing only when the connected application and required hosted security evidence are genuinely ready.

No hosted SQL/Auth/deployment, production/customer data access, provider activation, AI spending, communication, publication, booking/payment, EAS/signing/OTA/distribution or new external spending occurred. Private masters and sensitive reproductions remain outside Git. The complete historical deep audit and independent security/native/release acceptance remain unfinished.
