# Historical security and architecture audit — 30 October2026

This is the first retrospective audit phase: a whole-development-branch inventory and automated baseline, deeper review of selected high-risk trust boundaries, and verified corrective source changes. It is **not a completed line-by-line security review**, penetration test, certification, or declaration of release readiness. Important inherited routes remain unreviewed at depth. Exploit details, inert reproductions and detailed triage locations remain private outside Git; this report is deliberately redacted.

## Source and product authority

| Checkpoint | Commit | Tree |
| --- | --- | --- |
| Independently observed starting GitHub report/head | `304a01fc421673a97323544fd60fdc26ffa896ef` | `0e943f6f8926a2457ac2906d1e953917c49c4f15` |
| Prior functional checkpoint preserved | `02fed7fa0fb22106e89dc9f2c452ae1e9e8699e7` | Preserved through the starting report ancestry |
| Published audited implementation | `31ea363fb0373b663225871ba51630b2571c525f` | `d5ba81f16c79d25f5a54a9b1017371586a32dfa1` |
| Equivalent local tested implementation | `001d5f7b4a0bacfcd34bcca13c49449e747d124d` | `d5ba81f16c79d25f5a54a9b1017371586a32dfa1` |

The recovered local lineage began at `bbf353cfbcfaa44d4c37c617064fdb7b4a22a9d9`, with the exact starting remote tree. The published implementation has the actual remote report as its parent. Publication used additive tree/commit creation and an expected-head, non-forced ref update. No reset, rebase, dependency-branch update or PR merge occurred. This report and its three JSON companions are a separate additive documentation checkpoint; its enclosing Git commit identifies the final delivery tree without a self-referential hash.

The genuine complete private **V22.66** original was reopened and checksum verified: SHA256 `11f7b3069894b40d4467d90ba6883eeb3e3584057ace5b37c511187c883a483a`,2,684 paragraphs/19 tables. The private original and complete extraction remain outside Git. Existing Sections70 and72–76, root AGENTS, architecture, standing workflow, security threat model and preceding AI gateway/budget evidence were consulted. No provider/deployment authority is inferred from the master.

Draft chain verified: PR26 Mission15→Mission14;25→13;24→12;23→disposable-Supabase-review;21→11;20→10;19→9;18→8;17→7;15→6;14→permanent instructions. Existing relationships remain unchanged.

## Whole-repository baseline and coverage

The accompanying [inventory](HISTORICAL_SECURITY_AUDIT_2026_10_30_INVENTORY.json) records **every one of2,574 starting tracked files**, paths, hashes, sizes, categories and physical line counts. Immutable starting Git blobs were independently compared with the original inventory hashes. There are1,792 source files and176,190 physical source lines, including tests/SQL/scripts, plus379 configuration files. Physical lines count newline-terminated lines plus a final unterminated nonempty line; preliminary split-based counts were corrected. This number is not production application size: application modules account for86,333 physical lines.

| Starting subsystem | Files | Source files | Physical source lines |
| --- | ---: | ---: | ---: |
| Root |60|37|1,745|
| CI |176|0|0|
| Cloudflare |3|2|195|
| Documentation/proposals |618|58|7,302|
| Verification/tooling |872|861|46,541|
| Other application |56|56|27,807|
| Components |69|69|3,355|
| Core |335|335|22,976|
| Screens |91|91|31,491|
| Connected staging application |13|13|704|
| Staging tools/contracts |44|37|2,305|
| Edge |168|164|26,106|
| Historical migrations |69|69|5,663|

The implementation checkpoint has2,581 tracked files,1,799 source files and176,320 physical source lines. Four delivery documents are additional. All tracked text was examined using finite redacted secret detectors; source/configuration additionally received static trust-boundary signals. Signals such as SECURITY DEFINER, dynamic SQL, fetch and permissive-looking policy syntax are triage inputs, **not confirmed vulnerabilities**. There were33 exact duplicate source groups, largely deliberate Edge/app deployment mirrors; none was deleted merely for duplication.

All1,596 current JavaScript/TypeScript-family files were parsed, and418 JSON/TOML/YAML/Python files received parser checks. Static graph analysis found zero distinct cycles in its supported relative-import graph; dynamic/aliased/runtime relationships are outside that result. The25 Edge entry points were inventoried, nine were genuinely Deno checked, and the remaining16 have only syntax/static/sampled coverage. All69 historical migrations were inventoried; only selected original installation/contracts were executed, not an indiscriminate historical migration replay.

The [coverage and paid-path matrix](HISTORICAL_SECURITY_AUDIT_2026_10_30_COVERAGE.json) states completed and unproven scope for every major business subsystem. AppController, the91 screens and most historical route bodies have **not** received independent line-by-line deep review. Deleted Git history, organisation IAM, real hosting ACLs, actual backup restoration and native OS behaviour remain outside acceptance.

## Trust boundaries and threat model

Review priorities were informed by relevant OWASP ASVS/MASVS/LLM, NIST SSDF and UK NCSC secure-development control themes: independently verified identity, least privilege, tenant isolation, safe inputs/rendering, controlled AI tools/costs, supply-chain integrity and recovery. This is a practical control mapping, not a formal assessment against every versioned requirement.

The intended flow is: untrusted owner/customer/imported text → bounded interpretation/proposal → independently selected authorised current context → owner review → finite original writer → exact revision/receipt/readback. A model, prototype publishable key, owner-consent Boolean, email or client-supplied business UUID is never a server permission. External provider credentials remain server-side. Private preparation remains distinct from publication, sending, booking, acceptance and payment.

Highest-priority reviewed boundaries were the new proposal gateway and ledger, legacy model HTTP paths, prototype provider-owner actions and callbacks, private renderer navigation, and selected SQL permission/rollback contracts. Tests execute actual original components/handlers/SQL with inert external adapters or real local PostgreSQL; none attacks a hosted service.

## Confirmed findings and corrections

Severity is contextual to reachability and deployment prerequisites. No confirmed critical finding is claimed. High findings gate activation/release of the affected feature; source blocking is mitigation, not completion of the missing integration.

| ID | Severity | Redacted finding | Correction and evidence | Remaining gate |
| --- | --- | --- | --- | --- |
| H01 | High, activation-dependent | Historical model routes could use credentials/counters without central monetary admission | All10 known direct model HTTP call sites are source-blocked through shared denial; AI-only entries refuse before body parsing; original deterministic App planning remains available. AST census and boundary regression pass | Authenticated, transactionally admitted adapters must replace each fence individually; never add a global legacy enable switch |
| H02 | High, prototype-dependent | A historical provider batch action omitted the owner gate; prototype ownership relied on email | Every owner POST now obtains fresh server Auth identity and matches an independently configured exact Auth UUID; missing configuration fails closed. Old/current actual handler comparison and retained foreign-ID fixture pass | Global single-workspace prototype is not a multi-tenant integration; canonical business/provider mapping required |
| H03 | High, provider-prerequisite-dependent | Destructive provider callbacks lacked sufficient current connection subject/revision scope | Verified signed payload must bind a configured subject and current authoritative connection subject/time/revision; exact conditional deletion and old-state-only cleanup. Missing mapping fails closed | Original table lacks the required provider-subject field. Callback is deliberately unavailable for unmapped rows, not newly operational; reviewed canonical migration/retention/provider acceptance required |
| M01 | Medium | Provider diagnostic HTML did not encode dynamic content | Shared bounded escaped passive response, no-store/referrer/content protections and restrictive CSP; actual old/current renderer comparison | No hosted/browser exploit or provider acceptance claimed |
| M02 | Medium, internal-renderer-dependent | Private screenshot navigation permitted a broader document destination than selected | Exact origin/selected-document binding, port rejection, limited data resources and final-URL check; actual original worker counterexample failed before fix and passed after fix with inert browser | Hosted redirect/storage IAM/browser metering still require acceptance |
| L01 | Low, service-only evidence integrity | Non-settlement budget acknowledgements accepted contradictory usage fields in some replay paths | SQL rejects usage/receipt evidence for unknown/released outcomes before idempotent replay. Original SQL counterexample failed, corrected real PostgreSQL stage passed | No monetary balance theft/corruption demonstrated; ledger still disabled |
| L02 | Low, reliability | A legacy Website voice header parser matched a literal escape instead of ordinary Bearer whitespace | Corrected parser, preserved original route and authority tests | Remote inference itself remains source-blocked pending secure admission |
| I01 | Informational/correctness | Five genuine Website visual-review union-shape compiler errors | Safe property narrowing and existing pinned official SDK for touched consumers; selected genuine Deno check exits0 | Remaining16 entry points not type-accepted |

Detailed inert payloads/affected request sequences are held privately, not in public report files. No hosted exploitability, duplicate-email account creation, real provider call or native acceptance is asserted. Source/test fixture changes are reviewable in the implementation commit; the old same-email/different-user cases remain and now require denial.

## AI gateway and central budget controller review

The selected new gateway verifies server identity and current membership, selects finite original context, binds business/project/capability/revisions and independently validates structured output. Model output cannot create writer authority. The new path remains disabled and offline-adapter-only. The screenshot intake prototype is not used as authentication for it. Existing malicious/oversized/forged proposals, stale context and review/save/Undo tests were retained. This is not acceptance of an eventual live provider's streaming, cancellation, retries or billed-usage receipts.

The actual local ledger tests cover missing/stale entitlement and tariff denial; tenant/feature/expensive allowance boundaries; conservative FX accounting; concurrent reservations and a shared platform ceiling; operation/nonce ownership; dispatch once; revocation; stale project revisions; immutable tariff evidence; duplicate receipts; uncertain liabilities; receipt overrun; kill switch; and retaining lockdown. The previously corrected conflicting-operation release bug was independently rerun, together with lost-reservation acknowledgement ownership, duplicate concurrent requests, lost dispatch/settlement acknowledgements and cancellation boundaries. They pass. Unknown possibly dispatched work remains reserved, rather than silently released/retried.

Important limitations remain: entitlement fixtures are synthetic, not real subscription provisioning; tariff/allowance administration requires separately trusted configuration; no real invoice/FX reconciliation or hosted JWT acceptance occurred; unresolved operations require controlled reconciliation, not blind expiry. A service-only receipt is not independently verified external provider billing evidence. The controller does **not** protect every historical billable feature merely because its own SQL passes.

The complete known direct-model census is10 call sites in six entries, all source-blocked/unintegrated. The new gateway is integrated with the ledger only in offline/local execution. **Zero live billable model paths have been accepted as centrally protected.** Browser Rendering, storage/hosting, OAuth/social delivery, optional marketing/media and build/distribution costs require their own reviewed operational authorities. The paid-path matrix identifies those gaps explicitly. No model, transcription or media provider was activated.

## Database installation, ACL/RLS and recovery evidence

Actual selected SQL and effective local roles/functions were exercised in disposable PostgreSQL:31 AI-budget stages,51 whole-app stages and62 connected-builder stages, all exit0. These include original tenant/provenance/revision contracts, installation fuses/order, induced failure rollback, source/version conflicts, revocation/concurrency, exact readback and retaining rollback. Auth shims and fictional fixtures are explicitly local; they are not genuine Supabase JWTs.

The budget manifest was refreshed against the exact corrected source and locally executed installation transformation. Approval fuses remain in repository files; only recorded disposable execution material removes the designated rehearsal line. SQL ownership/search-path/grant protections in selected contracts were inspected and tested; no new broad snapshot writer or generic privileged RPC was introduced. Retaining rollback preserves records and outstanding liabilities while closing new work, retaining only the intended reconciliation authority.

This is not proof of authentic hosted production DDL equivalence or every historical SECURITY DEFINER/default-privilege policy. No production customer data or hosted metadata/ACL state was queried in this phase. The designated staging project's current schema remains **not freshly inspected** here; the prior two-row canary observation is historical only. Hosted activation is **not authorised and not ready for unconditional recommendation** until exact target identity/current inventory, authentic compatibility gaps and effective privileges are independently resolved.

## Architecture, maintainability and supply chain

AppController remains18,332 physical lines with103 static imports; Mini Apps screen5,424 lines; the current Mini App gateway4,531 lines. These are concrete coupling/review risks, not justification for a wholesale rewrite. The static graph reports1,745 selected source files,169,109 physical lines and3,747 relative edges with zero distinct static cycles; its narrower file selection differs from the complete repository inventory.

This phase extracted one reusable redacted secret detector, one legacy admission denial helper, strict prototype-identity checks and passive provider-page rendering. It removed one provably unreferenced internal email lookup after searching declarations/callers, preserved all public contracts, and reused the existing pinned official SDK in touched routes. Deployment mirrors, historical migrations and compatibility writers were retained. No speculative CRM, memory store, billing system or generic persistence layer was added. No visual redesign was performed.

543 locked dependencies have integrity records; lockfile version3 contains544 entries including root, with one dependency install-hook and no root install lifecycle hooks. Eight relevant local dependency-history commits were inspected; this is not a complete historical supply-chain attestation. Of175 workflows,173 use floating action tags, three request contents-write,23 reference secrets, and none matched pull_request_target in the selected static scan. These are review priorities, not173 confirmed exploits. Pinning requires review of legitimate release/update semantics; nothing was blindly rewritten.

Fresh registry audit returns exit1 with **three high and five low affected dependency nodes**, representing Zod/Expo `GHSA-mrhx-c7xc-m3w5` and deepmerge `GHSA-gcqx-w48m-w2h4` advisory families. Expo CLI/config dependency paths were examined; no safely validated compatible remediation was established. No incompatible major override, advisory suppression or lockfile churn was applied. Selected affected tooling paths are not new Edge validation dependencies; this does not prove all release/native/build paths non-exploitable. A clean vulnerability audit is **not** claimed.

Whole tracked-text secret scanning found zero strong signals; a separate quick secret-shape match was an existing explicit negative-test fixture. No credential values were logged. Finite signatures, current-tree coverage and fake-fixture triage cannot prove the absence of secrets in deleted history, alternate encodings, external configuration or provider consoles.

## Verification ledger and genuine failures

See [machine-readable checks](HISTORICAL_SECURITY_AUDIT_2026_10_30_CHECKS.json). The source checkpoint was frozen before unsigned exports; source/SQL checkpoints have exact tree identity. Some full-suite evidence predates the final small fail-closed entry guards and pure-detector extraction; final targeted/security/syntax/Deno checks cover those changes. No all-suite frozen-source green run is invented.

| Check | Actual result | Process exit |
| --- | --- | ---: |
| First full application selection |450/451; old Creator Auth fixture failed |1|
| Second full application selection |450/451; different old cancellation Auth fixture failed |1|
| Corrected Creator rich-variants direct retest |Passed; foreign same-email Auth ID still present and denied |0|
| Corrected cancellation/revision direct retest |Passed; original CAS/race/expiry assertions retained |0|
| Final historical boundary regression |Passed |0|
| Production foundation |105 checks passed |0|
| Security-by-design |Passed original session/tool denial/injection/render boundaries |0|
| Security baseline |Passed quick source/lock detector |0|
| Architecture audit |Passed; static-relative graph only |0|
| All JS-family syntax |1,596 passed/0 failed |0|
| Configuration/Python syntax |418 passed |0|
| Selected genuine Deno checks |Nine entry points plus one type fixture; frozen real dependencies |0|
| Earlier visual-review Deno check |Five genuine diagnostics, subsequently corrected |1|
| Actual local budget SQL |31/31 stages |0|
| Actual local whole-app SQL |51/51 stages |0|
| Actual local connected-builders SQL |62/62 stages |0|
| Pre-fix worker and SQL counterexamples |Expected safety assertions failed against original implementations |1 each|
| Corrected original/current provider evidence comparison |Passed with inert external adapters |0|
| Fresh dependency audit |3 high/5 low affected nodes remain |1|
| Whole tracked-file inventory/secret scan |Passed; detailed triage private |0|
| Owner Preview unsigned local iOS/Hermes export |Passed |0|
| Isolated-staging unsigned local iOS/Hermes export |Passed |0|

An initial restricted subprocess attempt reported EPERM and was not accepted as verification. Supported local permissions allowed subsequent inventory/SQL operations; no security control was bypassed. Full-suite failures were not hidden, assertions were not weakened, and no single451/451 exit0 full-run result is claimed. Across the latest full run plus direct repaired-check retests all selected checks have passing evidence, with the chronology/coverage qualifications above.

## Outstanding prioritised work and acceptance gates

1. **High, before affected activation:** replace each legacy model fence with the original authenticated, current-member, bounded reservation/dispatch/receipt adapter. Keep live models disabled until real tariff/entitlement/receipt ownership and failure recovery are accepted. Review provider timeout/streaming/resource limits and all possible SDK/indirect model call paths.
2. **High, before social/provider activation:** replace global prototype ownership with canonical business/provider subject mapping, account/connection revision and review authority. Audit all OAuth callbacks/token storage/redirect validation/webhook replay and rate/resource limits; no mapping workaround based on email.
3. **High, before staging activation:** inspect exact authorised target metadata; resolve compatibility-vs-authentic-DDL uncertainties; review all selected service/default grants and old-client exposure; bind final deployment/rollback fingerprints; then separately authorise narrow hosted provisioning/deployment and two-owner real JWT/PostgREST tests.
4. **Medium/high by affected reachability:** finish all25 Edge entry semantic checks and remaining historical public/authenticated/consumer route privilege review, public request body/upload limits, SSRF/URL/storage policy, Cloudflare metering and generated-HTML/assets. Existing gates do not prove these universally secure.
5. **Dependency/supply-chain:** resolve or demonstrably mitigate affected Zod/Expo/deepmerge paths, pin reviewed workflow actions, review write-token/secrets/release jobs and historical deleted-blob secret coverage. Preserve legitimate PR chain and release restrictions.
6. **Architecture/reliability:** extract small cohesive pure contracts from AppController only behind exact behaviour tests; review swallowed failures, unfinished/unknown operation status, resource bounds and cache/session transitions. Do not remove compatibility data/records as cleanup.
7. **Operational/native assurance:** genuine hosted Auth/RLS/rollback/backups, provider security configuration, actual native token-storage/lifecycle and accessibility, whole-product owner acceptance and appropriate independent assurance remain outstanding. Passing local checks is not hosted, physical or production acceptance.

The smallest next safe source mission is the legacy OAuth/provider + public Edge input/permission closure, including the16 remaining genuine type checks and focused disposable tests, while models and hosted activation remain disabled. Comprehensive owner testing remains deferred; no routine physical testing is requested.

## Deployment, cost and visual status

No hosted SQL, Auth provisioning, Edge deployment, server switch activation, real customer access, external provider/model call, communication, publication, booking, payment, EAS build, signing, OTA or production operation occurred. No external spending was initiated. Owner Preview build29, accepted Home/orb visuals, four-edge saved mini-orb, six destinations and appearance modes are unchanged.

No genuine running-app screenshot/recording or native-device evidence was obtained. The inert browser is a security fixture, not rendering evidence. Hermes exports are compilation evidence only. The app is **source-hardened and locally verified at the stated scope; hosted/native/production acceptance remains unproven**.
