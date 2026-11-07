# Mission15 — trusted integrity and private finite forms, 1 November2026

## Source and authority

Repository `7774cg5t75-cloud/busy-does-it-app`, branch `codex/builder-mission15-design-advancement`; PR26 remains draft against Mission14. Existing dependency PRs remain open/unmerged and were not modified. Starting GitHub HEAD `115c101fe47ce238667fd85030fb292e51b7bea7`, tree `b5fefb012724803de005b3cf078a49428658aaf9`. Clean local recovery HEAD `8ca70047158fbc6b0f168da997d7ed88458f12fd` had the identical tree. Previous functional `67f1199df6001c207f7cce55f5a84f50b8f6b8ed`/tree `5eac387bdb0f4628bd5f723bc2a54e0177043cbd` remains in additive remote ancestry.

Initial implementation remote `e3c56c6f67c385886622ccc4f35d60c430be4fbb`, tree `fc23280347fdc3312edbc1206362e41b6c92a560`; final corrected functional remote **`bebe9117e31642bbaa478712d80926387c73bd24`**, tree **`6ed2e2033f790488e1e3597ce3ce65ccf26d14d7`**. Local equivalents `fe7a47f68d6816ffcab0e6d47106c58289d1e045` and `13933af49634d1949e59faf9288b7910bc69fa25` have respectively identical trees. Remote commits were created against the actual GitHub parent and published with expected-head checks, without force/reset/rebase/merge. Report-only delivery follows the verified functional source.

The genuine private V22.73 original was accessible and its bytes reverified: SHA256 `23793f82b471328bdd216897c212999a430652e19228fcb221a8ee16a7ddc272`,2,904 paragraphs/19tables. Previously reviewed relevant builder, security, continuity, cost and simplicity requirements are retained. Private Word bytes and complete extraction remain outside Git. This is source development, not approval for hosting, distribution or customer execution.

## Native integrity implementation

`artifactIntegrity.mjs` provides a narrow interface for UUID and exact-string SHA-256. `privateArtifactCrypto.js` selects Web Crypto on web and optional `ExpoCrypto` on native. The ORIGINAL private library passes this platform adapter into the original account verification/save/read/preview flow; no global polyfill changes the rest of the application.

Native uses only raw `randomUUID` and `digestStringAsync('SHA-256',canonicalText,{encoding:'hex'})`. It avoids the JS convenience library's development/random-byte fallback paths and requires both trusted methods. Missing modules/methods, invalid UUIDs, non-hex/wrong digests, excessive text or malformed Unicode fail closed. Canonical text is not normalised or reserialised for hashing. Native encoding is the SDK module's explicit UTF-8 operation; web uses its real TextEncoder/Web Crypto path. The native path works in fixture tests with both global Web Crypto and TextEncoder removed.

Expo Crypto **57.0.4** matches the installed Expo57 bundled-native recommendation `~57.0.4`. It is an exact-pinned direct dependency, with no added runtime dependencies, MIT licence, matching lock SRI and independently checked downloaded archive bytes. Root/capture locks remain mirrored. Native/package source fingerprints and reviewed methods are in `security/native-artifact-crypto.json`. iOS source uses Foundation UUID and CommonCrypto with `str.data(using:.utf8)`; Android package/module metadata and implementation are present. Only hashing/UUID methods are exposed by the adapter; no encryption keys, credentials or signing authority are introduced. Primary documentation: [Expo Crypto](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/); exact compatibility authority is the installed SDK metadata and integrity-verified57.0.4 package, not the moving latest documentation.

Autolinking resolution identifies ExpoCrypto57.0.4, its podspec, Swift module and CryptoModule class. This is linkage metadata, not an executed iOS binary or proof of actual module invocation. Optional lookup means an existing build with no ExpoCrypto module can still boot; only the affected private feature denies operation. The actual installed build29 module inventory was not inspected, replaced or distributed. A native binary may need a separately authorised rebuild if the capability is absent.

Source-supported paths: iOS/native adapter and separate web adapter, with SDK Android support available in package metadata. Actual observed execution is Node Web Crypto, native-bridge fixtures exercising the original adapter/component code, real local PostgreSQL and unsigned iOS/Hermes compilation. Physical iOS/Android and real-browser runtime acceptance remain unverified.

The digest is **integrity, not a digital signature**. Authentication, current server membership, App ownership, immutable approval metadata and CAS are independent controls. A matching client hash never authorises a business action.

## Finite private-form contract

`private-form` v1 is separate from `private-calculation` v1. It permits at most eight fields, eight fixed options per choice and four reviewed examples, within the original bounded data envelope. Supported fields are numeric, bounded plain text, fixed choice and boolean. Numeric fields retain original finite six-decimal/magnitude bounds; text length is capped240 UTF-16 code units. Labels, defaults, options, types, mandatory keys and unknown fields are checked independently.

Relevance is one typed equality against an earlier **unconditional** boolean/choice. Unknown references, self/cyclic references, chained conditional parents, malformed expressions and unreviewed options are rejected. No arbitrary regular expressions, JavaScript, code imports, dependency selection, tools, networking or mutable business operations exist in this language.

A form may embed the original, separately validated finite calculation contract. Its scope must match the form and every referenced input must match a required, unconditional numeric/boolean field, including units and ranges. The original calculation examples and whole-form acceptance examples are validated before acceptance. The whole immutable form artifact approves those exact questions, choices, calculation rules and examples. This is not a loose reference to a mutable function name, nor a new generated-code engine.

Evaluation reports field-specific missing/type/range/length/option errors, active fields and optional read-only outputs. Invalid values do not become successful results. Inactive values stay in local state but do not influence relevance or calculation; unknown/executable fields fail validation. Reset is deliberate. Private input values are evaluated locally after exact artifact readback; they are not sent to the artifact reader or filed as customer records. `submitted:false` remains explicit.

## Original owner and preview experience

The original goal editor now hosts the private form pilot alongside the existing calculation experiment and saved-function library. The owner describes a supported goal, reviews questions/options/limits/conditions/rules/examples, tests values, changes question or option wording, reviews changed bytes and deliberately accepts for private saving. Changing wording invalidates the prior review; acceptance fails until a fresh exact review. An accepted original artifact cannot be edited in place.

The existing library saves, independently reopens, selects and privately previews the form beside the original App surface. Its fields/validation/read-only results use original Card/Field/Button/Details styling. The library chooses the appropriate original calculation or form editor when revising; it does not pass form data into the calculation-only editor. Shared re-opening checks reject foreign/future source scope before deliberately preparing a new current-source draft. Unsaved App configuration/business information is not overwritten.

Every private evaluation reopens an eligible exact artifact/version/hash/head/App revision. Readback was tightened to verify the **requested function ID and version**, preventing a differently versioned response from being accepted as exact readback. Foreign identity, current revocation, changed App context, modified bytes/hash, disabled/superseded/locked records and stale references refuse execution. Original uncertain-save/disable fences, no blind replay, receipts and independent readback remain; reviewed successor versions supersede old versions while retaining immutable history.

Preview placement and input values remain session-only. Artifacts are durable in the proposed and locally rehearsed private authority; none is hosted yet. No private form, reference or rule graph enters public `draft_config`, descriptive project notes, customer records or public projections.

The proposer is a finite recogniser with three supported example families. The renderer/evaluator/storage are generic within the strict form language, not per-industry handlers. Owners can refine current question/choice wording; unrestricted prose-to-new-fields/workflow generation and an arbitrary full form designer are not claimed. A staff-assignment/notification/inventory request is explicitly refused as unbuilt functionality.

## Three independently scoped examples

| Private experience | Distinct reviewed structure | Independently checked result |
|---|---|---|
| Catering | Guests, servings and split; fixed service options; mixed-service requirements appear conditionally |100 guests ×1 serving,60% rolls → total100, rolls60, bowls40; missing guests/service/conditional requirements fail |
| Gardening/trades | Dimensions, coverage, allowance; fixed material options; conditional access information |7.5m ×3.2m =24m²;2.5m²/unit +10% allowance →11 indicative units; invalid material/range fails |
| Design/project brief | Project option, bounded description, existing-site yes/no and conditional existing-site information; no calculator |Complete new-site brief passes local checks; missing required brief or existing-site information fails; no submission or business action |

Original pilot/library/form-view component bodies execute in three separately scoped fictional contexts using the actual adapter boundary. Changed question wording requires fresh review and a new saved version. Calculation outputs are compared to independently specified values, not advertised as live provider outcomes.

Real PostgreSQL tests also use three distinct businesses/owners. The third owner/business, approved profile and first private App are prepared through the original business/profile/first-App authorities in disposable data only. Form saving/readback does not modify original App config or descriptive specs. Unicode examples and a new immutable version compare exact PostgreSQL UTF-8 canonical hashes with the adapter path; supplementary characters obey the same UTF-16 text-length limits in JS and SQL.

## Private persistence and rollback

The separately fused `forms.sql` extends the existing private artifact authority without new tables, a generic writer or a duplicate project database. It retains the exact original calculation validator body under a private helper and replaces the original validator **without changing its identity/callers** with explicit finite-kind dispatch. This preserves old calculation behaviour and immutable rows. New helpers are private/invoker functions with no anon/authenticated/service direct execute; the original scoped service-only RPC, protected search path, RLS and locks remain authoritative.

`BUSY_PRIVATE_FORMS_ENABLED` is an additional absent-by-default server gate alongside existing private-function/builder gates. It denies form writes/read-through execution even if existing calculation support is enabled. It was never activated. No stored artifact grants public execution authority.

Installation and retaining rollback remain separately reviewable/fused, hash-listed and local-only. Failed installation is deliberately injected and verified to leave the original validator intact. Form rollback conservatively closes **all** private function/form eligibility and head writes while retaining immutable rows and scoped service readback. Broader base-package rollback can additionally revoke that RPC reader. No deletion, erasure policy or automatic reactivation is introduced.

## Verification and preserved failures

Final [CI run41305068359](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41305068359), job124843685023: **success**.

| Verification | Actual result | Exit |
|---|---|---|
| Frozen full application selection |468 passed,0 failed,0 blocked,0 unexecuted |0 |
| Foundation |105 assertions |0 |
| Genuine disposable PostgreSQL |82 stages,0 failures; also reproduced on fresh local PG17 |0 |
| Genuine original Edge checks |All25 entry points |0 |
| Unsigned Owner Preview iOS/Hermes export |1,518 modules; actual `.hbc`8.3MB |0 |
| Unsigned isolated-staging iOS/Hermes export |1,577 modules; actual `.hbc`8.4MB |0 |
| Original component/goal/project/screen, security, syntax, architecture, dependency guard and compatibility checks |Passed; selected regressions also execute in full suite |0 each |
| Fresh raw registry audit |0 critical/high/moderate;7 low affected nodes, one deepmerge family retained/guarded |1, expected unresolved finding |

Downloaded artifact13083675145 independently matches GitHub SHA256 `9288ec7a91ae85f6dbf76dc634d446fae7b79d1dd13f849510879d2b5f184d99`. Its application JSON verifies start/end commit `bebe9117e31642bbaa478712d80926387c73bd24`, start/end tree `6ed2e2033f790488e1e3597ce3ce65ccf26d14d7`, `sourceStable:true`, initially clean and final entries empty. All468 child exits0 and all82 PostgreSQL stage exits0 were independently checked. Actual CI autolinking JSON identifies ExpoCrypto57.0.4. See accompanying CHECKS JSON for per-check results, SQL/package provenance, artifact digests and failure history.

Architecture evidence: 1,805 source files,171,397 physical lines,4,015 static relative edges,0 detected static cycles; limited static graph evidence, not a new historical audit or security certification.


The first primary CI run [41304269612](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41304269612), source `e3c56c6f67c385886622ccc4f35d60c430be4fbb`, failed PostgreSQL with76 stages passed/1 failed, process exit1. Native/original-component checks and all25 Deno checks had passed, but exports/full selection were not claimed. The save remained uncertain and never reported false success. Failed artifact13083245502 digest `1b016da8f58557e1936cee8a7b787d525ef2799b3db47063823521b612a303ae` was downloaded and its original failing stage preserved.

Cause: `(f->'when')-ARRAY[...]` needed explicit parentheses; without them PostgreSQL interpreted the expression differently and returned an invalid-JSON error inside the fail-closed validator. The fix preserves the unknown-key guard; it does not accept malformed conditions or remove lifecycle assertions. An explicit exact-SQL validator assertion now precedes the actual save. A temporary private diagnostic copy in disposable PostgreSQL raised rather than swallowed rejection branches; it did not change the reviewed source authority or grant access and was removed when the next fresh test database was recreated.

The first attempt against the old socket failed connection-refused, process exit1. Using the tool's permitted additional network capability, a new owned cluster was created in `/tmp`, bound only to a0700 Unix socket, with TCP disabled and host authentication rejected. The test verifies the exact data directory and empty listen_addresses before recreating its known synthetic database. The original failure reproduced there, then all82 stages passed after the source fix, exit0. Cluster shutdown was confirmed; no hosted schema/data were accessed and no sandbox controls were disabled.

Older component tests initially failed, exit1, because their inert harness did not model the newly imported `expo-modules-core`. The harness now explicitly returns **no optional native module**, not fake working crypto. Original root/component paths and the targeted missing-capability test pass with that failure boundary. Native working-method fixtures are separate and explicitly labelled. One dependency-probe command used a nonexistent filename (exit1); the established actual `dependency-compatibility-probe.mjs` was then run successfully. No assertion was suppressed.

Initial registry attempts were environment-blocked (socket EPERM, then cache-path ENOENT); the supported network permission and writable task cache allowed actual package metadata/tarball retrieval and a fresh audit. No proxy, TLS, dependency or sandbox security rule was weakened. Final raw audit exit1 reflects the remaining upstream deepmerge finding below, not a clean audit.

System Chromium launch with `chromiumSandbox:true` exited1 on sandbox setsockopt EPERM/SIGTRAP. No screenshot, synthetic mockup, native pixels or real rendered acceptance is claimed; the working-component evidence is inert native execution, distinct from pixels. No browser isolation bypass or download/build/distribution was attempted.

## Dependency and acceptance boundaries

A fresh registry audit found **0 critical,0 high,0 moderate,7 low affected nodes in one deepmerge advisory family**, not seven distinct vulnerabilities. New Expo Crypto has no reported advisory in that retrieved snapshot. Zod4.6.6/glob14.0.2/minimatch11.0.1+ remediation, scoped overrides, ignore-script installation and the guarded deepmerge backport are preserved. The raw audit is intentionally not called clean; the actual guarded backport and original Expo callers pass. The separate read-only [dependency/compatibility CI run41304269617](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41304269617) passed all three jobs on the initial implementation source. Its dependency files are unchanged in the final SQL-only correction; it is supplementary evidence, not a substitute for the final functional-source run. Dependency locks changed only for the SDK-matched native package; no forced override, Expo downgrade, model/provider call or subscription change occurred.

Public HTML typed screen-composition parity remains a separate compatibility blocker. This mission does not expose private functions/forms or activate publication to resolve it. The repaired legacy3158 original-component check remains selected and passes. Home, six areas, orbs, voice routes, appearance modes and installed build29 remain unchanged.

Ready for further private finite-function/form source development after final verification. Not hosted verified, physically/native accepted, customer-form ready, public-runtime activated or production/release ready. Remaining gates include exact approved SQL/gateway rollout, genuine hosted JWT/membership/RLS/races, native linked-binary and encoding/UUID tests, retention/erasure decisions, actual owner usability and proportionate independent assurance. A submitted form requires its own original identity/data/action authority, consent, receipts, duplicate prevention and rollback; these private checks create none of that authority.

Next highest-value work: richer owner-driven bounded field/option refinement and deliberate durable private-screen bindings, continuing the original App Builder; then a separately designed first submission handoff through an existing original customer authority, kept default-off until accepted. Native device/simulator execution of this adapter must be demonstrated before claiming native acceptance. Broader generated-code execution still requires a separately reviewed isolated runtime; this finite interpreter does not justify unrestricted code, plugins or tools.

No hosted SQL/Auth provisioning, switch activation, production mutation, provider/AI spending, customer messages, bookings, invoices/payments, publishing, EAS/signing, OTA, distribution or merges occurred. External spending remains£0.
