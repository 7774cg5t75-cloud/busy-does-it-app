# Targeted dependency security remediation — 31 October 2026

Starting GitHub commit: `9a90f90d2d310a3fc336d4f5b7501611a42ceee7`; tree `25ffabf8f0dfca7e29bd8e6bd331f776472a9adc`.

Verified implementation commit: `3195bfc9d347be56b91b7e3124226f9c79e9ecf0`; tree `5b8e464609f170136a39f14cfd81f5b2afbb311b`. Equivalent frozen local commit: `96670d2630e9a4042d449472ff3ab8beb3f6cec7`. Changes were published additively through expected-head checks. Draft PR26 still targets Mission14; its dependency was not changed.

## Implemented remediation

| Family | Final locked versions | Result |
| --- | --- | --- |
| Zod | 4.6.6 | Registry advisory removed; actual original Expo schemas exercised |
| glob | 14.0.2 | Registry advisory removed; actual config/native discovery callers exercised |
| minimatch | 11.0.1 and 11.0.3 | Registry advisory removed; original fingerprint/ignore caller exercised |
| deepmerge | 4.3.1 | Locally backported and regression-protected; upstream advisory remains |

Overrides are qualified by the exact reviewed Expo introducer versions: CLI57.0.32, config57.0.10, config-plugins57.0.11, fingerprint0.20.14 and Metro config57.0.13. These scoped major library changes were accepted only after real caller and unsigned export tests on Node22.13.0 and24.19.0. Expo57.0.31, React Native0.86.3 and application dependency declarations remain unchanged. There was no forced audit fix, Expo downgrade or global replacement.

Deepmerge's actual loaded CJS entry and both other shipped JavaScript artifacts receive a small reviewed key-filter backport. Exact original/patched hashes, version, topology, main entry and symlink restrictions fail closed. Tests retain the original failing counterexample, exercise CJS/UMD, safe merge/array/Symbol semantics, reinstall handling and unknown-byte refusal. The raw source entry is byte-verified, not falsely claimed to execute independently of its build dependency. Registry metadata is unchanged, so the advisory remains visible. Latest published deepmerge was4.3.1. Maintained deepmerge-ts8.0.2 was investigated; its exports/customisation differ, so no unvalidated alias was introduced.

Installation now explicitly uses `npm ci --ignore-scripts`, the reviewed patcher and security verification. The guarded local Expo launcher verifies locked/installed fixed versions and patches before configuration loads; development is localhost-only. There is no automatic network postinstall hook. The dormant native-capture lock now matches the reviewed root graph and preserves the existing node-forge fix; capture preparation verifies dependency declarations and records instrumentation/toolchain hashes. No capture request, simulator workflow, signing or distribution was executed.

## Fresh registry and reachability evidence

Final workflow: [41189752362](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41189752362), on the implementation commit above. Earlier successful compatibility experiments:41178340484 and41187303823. Jobs use read-only permissions, immutable actions, no secrets, bounded standard public runners and ignore-script installs.

Fresh root, omit-dev and mirrored capture audits each exit1 with seven low affected nodes, all propagated from one underlying deepmerge advisory, GHSA-gcqx-w48m-w2h4. There are zero critical/high/moderate findings in these final audits. Offline verification-tools and browser-tools audits exit0 with zero findings. This is not a clean overall audit. npm's suggested Expo51 downgrade was rejected as incompatible.

The original baseline registry audit recorded14 nodes:2 high,10 moderate,2 low. Historical reports had different snapshots; they are not relabelled as current counts. Registry requests independently confirmed the published target versions and package integrities.

npm calls the affected tools production-transitive because Expo declares them. Original Owner Preview and isolated-staging iOS source maps exclude all four affected libraries. Examined Zod uses are CLI DevTools/MCP schemas, without the advisory's constrained-collection maximum; this does not certify arbitrary external plugins. Glob/minimatch process build/config/native paths and ignore patterns; untrusted project trees and patterns remain inappropriate. Deepmerge handles config/plugin options, and the library-level poisoning counterexample was reproduced. Arbitrary project configuration/plugins remain executable code and are not made safe by this patch.

## Verification and failures

Final comprehensive CI result: **457/457 passed, zero failed/blocked/unexecuted, process exit0**, on the exact implementation commit/tree with `workingTreeChanged:false`. The full CI step also passed105 foundation checks, both security checks and final clean-tree assertions. Detailed evidence is recorded in the accompanying checks JSON. Both Node versions exercise genuine Expo APIs and unsigned Owner Preview/isolated-staging Hermes exports, with source-map assertions. These are compilation and dependency-reachability results, not native-device visual acceptance.

Two clean local offline installations succeeded (independent disposable directory and working checkout), using the npm-generated candidate lock and seven exact registry tarballs. SHA512 registry integrity and SHA256 transfer checks were verified before cache import. Local dependency tests, compatibility probes, six JavaScript syntax checks, diff whitespace,105 foundation checks and both security checks exit0.

Preserved unsuccessful evidence: sandbox registry/child-process EPERM; interrupted permission-bound registry attempts; artifact-host403; an initial missing Expo fixture resolution; refused wrong entry/layout hashes; raw-source missing build-only dependency; and a log-transfer missing chunk caught by integrity checks before use. Fixtures/resolution were corrected against real installed packages, supported entry points were tested, and the complete registry transfer reverified. No failed connection was treated as a clean audit; no assertion was weakened. Actions provided the explicitly authorised registry fallback.

No SQL, Edge or business-domain implementation changed, so historical PostgreSQL/Deno acceptance was not rerun or presented as fresh. Private MasterV22.66 authority and PhaseFive restrictions were preserved; its complete private original was not reopened in this continuation, and public provenance is not substituted for it.

## Remaining gates and next work

Three advisory families are fixed in the reviewed graph. Deepmerge is mitigated in the supported installation/launch path, not upstream-resolved; unguarded tooling/reinstallation must not bypass the protocol. Future Expo/tool versions and eventual upstream replacement require renewed compatibility review. Independent assurance of this backport and actual native/hosted acceptance remain release work.

Source-level feature development can resume under the permanent security checks. Next priority: the already approved bespoke App Builder private configuration/preview and governed goal-to-outcome integration, using existing authorities and disabled provider boundaries. Do not prolong the historical audit merely to obtain a zero audit count.

Hosted Auth/RLS/storage/provider acceptance, physical-device testing and public release remain separate gates. No hosted mutations, provider activation, external AI calls, customer actions, paid builds, EAS, signing, OTA, publication, production changes or external spending occurred. Owner Preview build29, accepted visuals/orbs and six-area navigation were not changed.
