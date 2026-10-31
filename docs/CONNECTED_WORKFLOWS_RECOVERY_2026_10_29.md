# Connected Business Workflows — recovery and verification

29 October 2026. Repository `7774cg5t75-cloud/busy-does-it-app`, branch `codex/builder-mission15-design-advancement`.

## Recovered and published

The implementation is now on the active GitHub branch. The first additive recovery commit is **`3f35496f0ccf6c973355a75f73f57663d65c2848`**, directly descended from the independently rechecked report commit `8c59258abf401dd9bd5911bbc8cc9a2feb354436`.

Its tree is `f2a11b931f316adeb1618c5a0ec7162d0909757c`. Removing only the separately published report reproduces the exact original tested tree **`3c5db0d80e06082533b18c330dc89321abbe3f0b`**. The original local checkpoint `a1a6ce2925c5511a815ca4ce4b42fff7d8f19a54` was available, clean and preserved. Recovery required exactly seven modified files and eight new files. No unrelated files were replaced.

The published report remains byte-identical: blob `b29a929b879f2861a2181ee9ad9afe14689047c7`. About/build identification, build-29 preparation and all legitimate preceding commits remain in history.

A separate, verified native-identifier correction follows at **`805c120ba8a1557a830b8cbf474c694326e80069`**. Its functional tree is **`7562130016499487990b0cbb258f99d2ac33b01e`**, identical to the freshly tested local checkpoint `9ae5d798b1dcef2a3872e01ca3c4e6cbbb0ab59d`. Different local/API commit metadata is not presented as identical commit identity; exact tree equality is verified.

Publication used an expected-head check against `8c59258a…`, with force disabled. Independent GitHub reads confirmed the final functional commit, tree, two-commit parent chain and nineteen changed paths: the fifteen recovered paths plus four native-identifier correction paths. PRs #21 → #23 → #24 → #25 → #26 remain open, draft and unmerged with their original dependencies.

This report and its checks JSON are evidence-only additions after that tested functional source. They do not alter application, SQL, dependency or build configuration.

## Authority and preservation

The genuine private V22.53 Word original was reopened and verified against SHA-256 `fa9456077fd843f1f04ea450d9e2ec425077695b6b106b91bf7cee150b727f62`. Its complete original and extracts remain outside Git. Repository instructions, architecture, build/test policies and prior evidence were reviewed.

No redesign or feature expansion occurred. The accepted four-edge floating placement, gesture/intent persistence, living main orb, Home composition, six destinations, voice routes and appearance modes were preserved. The original AppController was not enlarged. Owner Preview build number 29, bundle identity, signing configuration and disabled OTA policy were not changed. Source verification does not mean this implementation is installed on the iPhone.

## One genuine defect corrected

The preceding About/native-capture checkpoint passed `accessibilityIdentifier` to React Native Pressable/View. The installed React Native source exposes `testID` and maps that prop to the native iOS accessibility identifier; it does not expose the former prop as the React Native bridge.

A focused counterexample first failed on the original About toggle. The correction changes only those identifier props in BusyOrb, About and original navigation, and adds deterministic component assertions. The main/floating/dock identifiers remain distinct, and their original actions remain unchanged. No floating geometry, drag, animation or safety logic was changed.

The exact recovered tree remains available in its separate parent commit. The corrected child is the verified final functional source. Native source/attachment checks pass, but no XCTest capture, simulator build or real-device screenshot was executed. The native workflow's actual execution remains unverified; no source/unit test is claimed as capture acceptance.

## Connected implementation confirmed

The restored staging entry retains the original authentication/security inspector. After verified fictional-account login it can open a bounded connected-builder workbench. Current server identity and owner membership, scope epochs, source revisions, foreground revalidation and obsolete-callback guards are retained. A canary row is not business membership. Tokens remain ephemeral in the original inspector.

Website generation and supported wording edits reuse the original generator, shared HTML renderer, WebsiteContentEditor and website gateway. The finite proposed write targets only the existing snapshot's `websiteDraft`, locks current membership and exact revision/target, preserves unrelated data and requires independent readback. Lost acknowledgement remains uncertain and is not blindly replayed. This is not complete persisted coverage of every website design control, an immutable website history, or an exact operation-receipt ledger.

App workbench wiring reuses the original goal planner/executor, explicit service selection, capability catalogue, MiniAppSurface, enquiry editor, coordinated Studio save and eligible Undo. The local database test exercises the original first-app routine and the actual original Studio function body with real PostgreSQL CAS. This does not establish that the whole App endpoint is provisioned or that hosted membership/revocation races are accepted.

Both builders reuse a finite saved public business-profile projection with owner review. Existing drafts are not silently refreshed from historical or newer source facts. No new CRM, asset registry, booking ledger, generic snapshot writer or memory database was introduced.

## Fresh verification

All final application checks ran on local `9ae5d798…`, tree `75621300…`, with clean start/end worktrees and unchanged commit identity. The remote functional tree is identical.

| Check | Observed result |
| --- | --- |
| Complete application selection | **435 passed**, zero failed/blocked/unexecuted; all child exits 0; **outer exit 0** |
| Foundation/security selection | **105 passed**, exit 0 |
| Targeted actual PostgreSQL17 integration | **21 stages passed**, zero failed; outer exit 0; 17 successful RPC calls |
| Concurrent website CAS | Two real competing writes: one committed, one rejected as a conflict; outer exit 0 |
| Syntax | 16 source files passed; exit 0; separate CommonJS syntax check exit 0 |
| Architecture | 1,670 source files; 3,469 static relative edges; **zero detected static cycles**; exit 0 |
| Native attachment validator | **24 tests passed**, exit 0; synthetic PNG fixtures, not screenshots |
| Native pipeline source checks | Passed in full selection and focused invocation; no workflow triggered |
| Expo dependency check | Exit 0; offline validation limitation retained |
| Owner Preview iOS/Hermes export | Exit 0; 1,470 modules; approximately 7.8 MB |
| Isolated staging iOS/Hermes export | Exit 0; 1,529 modules; approximately 8 MB |

PostgreSQL ran on the existing dedicated private Unix socket with TCP disabled. The tests use synthetic `auth.uid()` claims and inert external transport. Their tenant, anonymous, revoked-membership, privileged-write, stale-revision, save/readback, fresh-client reopen, uncertain outcome and original Studio Undo assertions remain intact. These are local database tests, not hosted Auth/JWT/PostgREST, deployed Edge or physical-device acceptance. Historical broad PostgreSQL totals are not fresh credit.

### Retained unsuccessful and interrupted candidates

- Fresh worktree health initially exited 2 twice because the original ignored pinned-tool resolution symlink had not been recreated. The existing `scripts/node_modules → offline-tools/node_modules` arrangement was restored; no source, assertion, package pin or VM limit was weakened.
- Before the native-identifier correction, a deliberately interrupted regression recorded 132 passed, zero failed and 303 unexecuted; outer exit 2. It is not counted as a full pass.
- The new identifier counterexample exited 1 against the old prop and passes after correction.
- Two concurrency tool calls were interrupted without an observed process exit. A subsequent command exited 2 because the interrupted call had not created its script. The script was then created, and the real concurrent test passed with exit 0.
- The separate legacy Snack graph check still exits 1. This invocation produced **27 unresolved-import diagnostics**. The historical **81-diagnostic** result remains historical evidence from its earlier invocation; it is not relabelled as passing or used as the current count. Snack infrastructure was neither repaired nor restarted. Native Hermes exports pass independently.

Full child identities/exits, source provenance, PostgreSQL stage results, concurrent results and raw artifact hashes are in `CONNECTED_WORKFLOWS_RECOVERY_2026_10_29_CHECKS.json`. Raw logs remain under the recovery worktree's ignored `.test-artifacts/recovery` directory. Prior mission failures and original counterexamples remain preserved in the original workspace/source.

## Remaining staging activation gates

This recovery did not make hosted calls to application data or change the staging schema. The preceding read-only observation—healthy staging project `pnjdlogwegnqbsfpcofw` with only its two-row RLS canary—is historical for this recovery and must be rechecked before activation. Production remains separate.

The SQL proposal still aborts. `BUSY_CONNECTED_BUILDERS_ENABLED` remains unset/false. No migration installation, hosted Auth-user creation, gateway deployment, provider activation or rollout occurred.

Next work should:

1. Complete the original App endpoint dependency closure. In particular, `owner_status` needs its original request/link, guest, Work booking and message/outbox evidence contracts, beyond the first-app foundation.
2. Complete the genuine signed-in six-area staging application adapter, preserving the diagnostic inspector and finite original authorities. The current workbench is not that complete application.
3. Rehearse the selected original schema, effective grants, membership/revocation races, retaining rollback and source/version conflicts locally. Do not apply all historical production migrations blindly or copy live data.
4. Obtain explicit approval for exact SQL/deployment operations on the designated staging project, then run real two-tenant Auth/JWT/PostgREST and builder persistence acceptance before enabling the server switch.
5. Connect the first bounded original enquiry-to-Inbox/Customer/Work journey, then assess readiness for productive owner end-to-end testing.

No EAS build, OTA update, signing change, distribution, publication, customer communication, booking, payment or additional spending occurred. No new screenshots or physical-device acceptance are claimed. The completed recovery is source-level progress; the connected application is not yet ready for full owner end-to-end acceptance.
