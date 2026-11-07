# Mission 15 Phase 9 — reproducible verification and continued app development

Same branch `codex/builder-mission15-design-advancement`, draft PR #26, dependent on #25 and its unchanged earlier chain. Starting remote head verified as `0bde348b02e6ba99bb54ae1477cba905675b7888`. Latest fully regression-tested functional source: `93320d6c530b341dc5b631f9569144792575334a`, tree `17743ea4c9e27d03c8705d2e94d17c8dc91c20e0`. Closeout adds records, a separately tested no-selection runner guard and stronger selected-render/Undo assertions; no product change after that full run.

AGENTS, architecture/development policies, testing workflows and Phase 8 evidence reviewed. The prior complete private V22.32 review remains current: supplied original DOCX reverified at SHA-256 `217b20a109368c92817e936d5a82845003d41e6b8ff92f1f79a07098d1cacb07`. No master content is committed.

## What was missing / what now works

Phase 8's root `node_modules` link targeted `/tmp/mission13-tools/node_modules`, which no longer existed. The offline npm cache lacked packages including yallist. An integrity-pinned Babel lock already existed, but no durable repository setup/health command restored it. Runtime Expo packages and Playwright SDK/browser installation were also absent; Chromium binary presence did not prove sandbox compatibility.

Node 24.19.0, npm 11.9.0 and Python 3.12.14 were available. Registry access was allowed by the managed network policy, but the command sandbox separately returned connect EPERM. One scoped network permission allowed the existing locked Babel install to complete (51 packages, lifecycle scripts/audit/fund disabled). No app dependency upgrade, credential/configuration change or paid service was used. Node synchronous subprocess calls separately returned EPERM; Python subprocess orchestration works without relaxing security.

The repository now supplies:

- Exact test-runtime pins and the existing complete Babel integrity lock, isolated from runtime dependencies.
- Offline-by-default, idempotent `python3 scripts/testing/bootstrap.py`; `--allow-network` is for an approved setup phase. Complete installed-version checks and a scoped scripts-only resolution link replace reliance on the temporary installation. Existing unrelated directories are not removed.
- `node scripts/testing/health.mjs`: checks pinned runtime/npm, complete package versions/resolution and actual JSX/CommonJS/TS transforms; reports missing optional runtime packages honestly.
- `python3 scripts/testing/regressions.py`: reviewed explicit selection, no shell/network installation, atomic evidence, timeouts and passed/failed/blocked/unexecuted outcomes. Missing application source/assertions fail; environment/tool absence blocks. Filters and fail-fast retain unexecuted checks. An empty selection exits 2, not green.
- `node scripts/testing/syntax.mjs <files>`: pinned Babel syntax checking without root runtime installation. No Deno/Expo semantic acceptance claim.

All five pinned Babel packages serve the restored selection: core 7.29.7, parser 7.29.9, CommonJS transform 7.29.7, React JSX transform 7.29.7, TS transform 7.29.9. Their transitive tree is fixed by the existing lock. Some tests also use locked core transitives such as traverse. No React/Expo install is necessary for their documented inert component boundaries.

Fresh-environment and owner configuration instructions: [DEVELOPMENT_TEST_ENVIRONMENT.md](DEVELOPMENT_TEST_ENVIRONMENT.md). A repository cannot publish a Codex environment, select its runtime image, grant technical permissions or preserve a deleted temporary cache. The owner must save/select a reusable environment using the approved branch, exact runtimes and setup command, with registry access during setup. No production/provider secrets are required. Setup health must pass before calling an image ready.

## Real builder functionality delivered

App Studio's original visual-selection panel now selects service presentation and gallery presentation, preparing existing service cards/rows/spotlight, gallery grid/stack, finite image size/corners proposals. It retains real content, navigation and customer actions; collection-wide scope is explained. Controls wrap on narrow native layouts. No per-card CSS or native dragging is implied.

Header selection exposes contextual owner-written tagline editing; the business-description action edits the supported original field. These prepare the original coordinated Studio comparison, normal approval/CAS and Undo. They do not write directly or implement arbitrary web contenteditable. Existing locks disable unsupported changes. Changed-source wording is retained but cannot be submitted until the owner explicitly reselects current source; stale callbacks cannot revive earlier copy. Cancel only discards this unsaved selection.

One shared `ServiceDetails` component serves marketplace and standalone exports. Customers can expand long owner-authored descriptions, read current informational category/price/duration labels and return to the same summary without losing category/search navigation. Refreshed records collapse stale details; old callbacks cannot alter the replacement record. Original enquiry/booking-request actions stay outside the informational component and retain existing published-version, exact-review and receipt contracts. No confirmed appointment, availability, stock, order/payment, private portal or delivery is invented.

## Browser preparation, accurately bounded

A separate optional lock retains existing Playwright 1.58.2 / playwright-core 1.58.2, Apache-2.0 (optional macOS fsevents MIT). No SDK or browser was installed by this phase; only its exact lock was prepared. No Chromium launch occurred.

The prepared runner generates fictional original first-party website HTML and binds evidence to source/revision/HTML hashes. It requests phone/tablet/desktop captures, original tap/movement policy readback, geometry/quality measurements and screenshots. `chromiumSandbox: true` is explicit; startup failure has no unsandboxed fallback. The wrapper removes inherited application/provider credentials and uses a temporary home. Browser requests are aborted; full OS egress denial remains a compatible runner's responsibility.

Fixture preparation and injected launch-policy tests pass. Actual capture, screenshot/geometry results, aesthetic assessment and physical touch/drag acceptance are **unexecuted**. Synthetic pointer cancellation and keyboard controls in the prepared script do not certify physical-device gestures. Existing measured-inspector logic is reused; unknown image/gradient contrast stays unknown.

[BROWSER_ACCEPTANCE_ENVIRONMENT.md](BROWSER_ACCEPTANCE_ENVIRONMENT.md) describes compatible non-root local setup and the remaining boundary. `docs/proposals/mission15-browser.yml.proposed` is a manual-only/read-only proposal deliberately outside `.github/workflows`; it cannot register/run. It requires exact SHA/branch/owner-input review and a compatible verified runner. Its YAML/gates were checked, not actionlint or actual Actions execution. Separate owner review/registration, free-usage checks and run authorization remain necessary. No workflow was activated/dispatched.

## Evidence and recoverability

| GitHub checkpoint | Result |
| --- | --- |
| `73b88cec94b2108a2a0fa24553f10d77063d8421` | Reproducible isolated setup, health and explicit offline runner |
| `72eb55c154ea7fbb72ebfab68030d9030e93dc87` | Contextual Studio appearance/wording and shared customer service details |
| `93320d6c530b341dc5b631f9569144792575334a` | Optional sandboxed browser preparation, inert proposal and persistent syntax checker |

The original **85/85 Phase 8 checks pass**, including **all 27 formerly blocked checks**. Final expanded selection: **88 passed, zero failed/blocked/unexecuted**. The evidence JSON lists every restored check and output. Forty-two changed Phase 8–9 JS/JSX/MJS/TS files parse with pinned Babel; previously blocked component suites now genuinely execute original components against their documented inert boundaries. Four environment-policy unit tests pass, including the actual no-match CLI exit/report; a focused three-check run verifies the final runner guard. Original inverse operations also restore exact source shape; row styling and revised wording render after JSON reload in focused original-component checks. Scoped Babel checks pass with the old root symlink temporarily absent and safely restored, proving independence from that legacy setup. Python modules compile. Bootstrap was exercised from an absent isolated installation using the complete cache, then repeated without installation. Existing standalone prototype preparation includes the new shared component.

Checks execute actual original source/renderers/handlers with inert native/DB/transport boundaries, not hosted/native acceptance. Full-suite local source `f9b0f9160a86de280bea042f813aaa29beac0ff7` and remote `93320d6c530b341dc5b631f9569144792575334a` have identical trees; connector commit metadata differs. Each push compared exact tree hashes and protected the expected branch head. Dependencies #25/#24/#23/#21 remain draft/unmerged at their original heads. No branch rewriting.

## Maintainability / remaining release limits

No parallel editor, request engine, memory store or schema. Original shared planners, lock policy, Studio CAS/Undo, public service projection, exact review, receipts and source/revision recovery remain authoritative. Shared service presentation replaces duplicated marketplace/standalone wording; its export inclusion is tested. One inherited standalone extraction harness now injects the actual extracted component rather than a fake substitute.

AppController remains 703,942 bytes; main mini-app Edge entry remains 183,295. miniApps.js is 281,708 versus 281,151 bytes; focused AppVisualSelection is 5,670 versus 2,736 bytes. Large controllers remain a risk; no speculative rewrite or new giant controller. Tooling responsibilities are separate from runtime.

Root application has no lockfile and runtime Expo/RN packages are not installed. Root `npm ci`, unsigned Expo exports, Deno semantic checks, real browser/native/assistive technology, OS recovery, hosted Auth/RLS/provider integration and release acceptance are not proven. A complete runtime lock/compatible environment is separate from the restored offline selection; no arbitrary Expo upgrade was introduced. No root/standalone runtime dependency, active workflow, SQL migration, production/staging deployment, hosted mutation, real customer/provider action, merge, paid build or external spending change. Budget remains £0.

Mission 15 stays open. Next substantial functional work: coherent finite selected-text/image editing and natural instructions in App Studio, mobile Website Builder toolbar/wording polish through original transactions, and approved browser/device acceptance in a compatible runner. Do not call the platform production-ready or rerun the earlier database rehearsal as proof of these changes.
