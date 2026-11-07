# Genuine native screenshots — owner-requested, fictional and free-runner only

This workflow builds the actual Mission15 application for an iOS Simulator. It does not use EAS, an Apple signing account, paid hosted build services, HTML rendering or generated mock-ups. Native execution/results are recorded in the capture report; workflow source alone is not proof of a successful image.

## Current attachment replacement — prepared, not natively executed

The owner requested removal of the HTTP receiver after run9. The current capture path uses **Apple XCTest screenshot attachments and `xcresulttool export attachments`**. There is no HTTP server, polling, proxy workaround or localhost capture transport. Original application/authentication code and the separate inert fictional-backend fixture remain unchanged. All receiver discussion below the historical headings records earlier candidates only.

This replacement has local source/unit/preparation evidence, **not** a successful native capture. Swift/XCTest compilation, actual `.xcresult` export and visual inspection require the next separately approved macOS attempt. No such attempt has been started.

## Ask for a capture

Only after an explicit owner request and approval for that attempt, on the existing Mission15 branch, update only `scripts/native-capture/request.json` with a unique request label and optional exact `source_sha`, then make a normal expected-head commit **without `[skip ci]`**. That explicitly requested file change starts `.github/workflows/native-screenshots.yml`. Only request-file changes match the push trigger; workflow edits and ordinary development sweeps do not. There is no scheduled capture. Keep source-only corrections on `[skip ci]` commits until a capture is separately approved.

The initial push trigger works on this development branch without modifying/merging main. GitHub requires a workflow on the default branch for its manual-dispatch UI; until separately approved integration, the request-file mechanism avoids that dependency. The workflow also includes `workflow_dispatch` for later compatible control-plane use. Do not dispatch an existing EAS or hosted-staging workflow as a shortcut.

Blank source captures the request commit. A comparison SHA must be an ancestor of this Mission15 request and contain the appearance infrastructure. The original source is checked out in a detached disposable runner worktree. No branch is reset, replaced or merged. Root package compatibility is checked by `npm ci`; an incompatible historical revision fails rather than silently substituting another runtime.

## Actual app, safely fictional I/O

The native application retains original AppController, screens, state, authentication UI/guards, appearance storage and navigation. XCTest enters a visibly fictional account through the real sign-in form. The selected test requires the original Home Ask field to exist and be hittable, no application alert, and the real app in the foreground. A fresh isolated simulator retains the original Midnight default. The broader appearance test remains unselected.

Only a disposable build's App.js is prefixed with the versioned screenshot transport. App configuration is wrapped for a separate `com.busydoesit.capture` install identity, no OTA updates or EAS metadata. Original UI/controller files and production repository app/config files are not patched. The manifest records original/instrumented entry hashes, fixture and compiled-test hashes, and both source/harness commits. The disposable test source receives the exact source SHA before compilation; the production app receives no new capture arguments or UI changes.

The injected transport has **no native-fetch forwarding path**. It returns synthetic in-memory account/snapshot responses, recognises only the fixed test business, and denies unrelated hosts/actions. XHR and WebSocket construction are blocked. No hosted Supabase, provider, payment or publishing service is contacted. This fixture is not real JWT/RLS/CAS/provider verification. Its account receipts are simulated test data, not genuine hosted completion evidence.

Fresh simulator + separate app identifier keep device/Keychain data isolated. Public artifacts contain only intended PNGs and a non-secret provenance manifest. No binary, private Word master, logs, configuration, customer export or XCTest result bundle is uploaded.

## Build/capture boundaries

* Standard Intel `macos-15-intel`, exact public repository/branch guard, bounded45-minute job. No larger/custom/self-hosted runner input.
* Official checkout/setup/upload actions pinned to verified commit SHAs; read-only repository token and checkout credential persistence disabled. No secrets referenced.
* Capture-only lock records the existing application's dependencies with official registry URLs and SHA512 integrity. Install uses `npm ci --ignore-scripts`; no lifecycle scripts during package installation. Explicit Expo/CocoaPods/Xcode commands perform the reviewed native build.
* Select the newest installed Xcode with Swift6.2 or newer before CocoaPods/build; record the actual toolchain in the manifest. No toolchain download or privileged system-default change.
* Existing installed simulator runtime only, foreground Simulator and six-minute boot deadline; prefer iPhone14Pro, otherwise record the actual supported iPhone. No claim of a particular model unless the manifest establishes it.
* Inert attachment-validator tests run before compilation, followed by a bounded check of the installed `xcresulttool export attachments --help` options. No network listener or health probe is required.
* Separate `build-for-testing` (24-minute process deadline/25-minute step) and `test-without-building` (4-minute process deadline/5-minute step). Compile before simulator boot. Release embeds JS without a Metro tunnel; only x86_64 is compiled, native optimisations are disabled for capture, signing remains disabled, and native progress/exits remain logged.
* Only `CaptureTests/testMidnightHome()` is selected. After the original launch/sign-in/Home checks, `XCTAttachment(screenshot: app.screenshot())` is named `busy-home-midnight-<source SHA>` and retained with `.keepAlways` in `busy-home.xcresult`.
* Only after successful native test execution, a60-second scoped `xcrun xcresulttool export attachments --path … --output-path … --test-id CaptureTests/testMidnightHome()` runs in a private temporary directory. The export step has a two-minute overall limit. Missing, ambiguous, wrong-source, failure-associated or unsafe-path attachments are rejected; there is no fallback image or retry.
* Publication checks exact source/harness and original-entry identity, unchanged UI/fixture instrumentation, successful build/test receipts, the source-bound attachment name, PNG chunk CRC/decompressed size/portrait dimensions, and the20MiB bound. Only `home-midnight.png` and a sanitised allowlisted provenance manifest enter the artifact folder. Diagnostic attachments, raw export inventory and `.xcresult` are never uploaded.
* Upload is success-only and requires the validation step's `safe=true`. One-day retention, no binary/cache upload. A failed test/export cannot publish a partial or stale screenshot. Actual PNG retrieval/inspection is still necessary before calling it a successful Home capture.

GitHub documents standard hosted runners as free for public repositories; larger runners are chargeable. Public-only guard and fixed standard label must remain. No billing settings are changed. Future agents should recheck applicable GitHub policy before changing runner/storage scope.

## Retrieve and compare in ChatGPT

Inspect the actual run/jobs, download its screenshot artifact using the GitHub connector, extract only the allowlisted PNG/manifest files and verify PNG hashes. Show the genuine pictures with platform, simulator model/runtime, source commit and fictional-fixture label. Do not describe a source check, planned capture, failed job or simulator image of a crash/dialog as a completed Home screenshot.

Before/after can use retained downloaded artifacts or a new request for the earlier exact Mission15 SHA with the same versioned fixture. Retention is deliberately short: download useful captures promptly. Never replace missing screenshots with conceptual/static HTML.

Original VM limits, source regressions, database abort fuses, disabled hosted rollout switches and all approvals remain unchanged. Dedicated screenshot execution is the owner's explicit exception to the prior no-workflow-run restriction; it does not authorise EAS, staging, deployment, communication, payments or provider actions.

Official references:

* https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job
* https://docs.github.com/en/billing/concepts/product-billing/github-actions
* https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow
* https://docs.expo.dev/guides/local-app-development/
* https://developer.apple.com/documentation/xctest/adding-attachments-to-tests-activities-and-issues
* https://developer.apple.com/documentation/xctest/xctattachment/init(screenshot:)
* https://developer.apple.com/documentation/xcode-release-notes/xcode-16_3-release-notes (modern export commands; installed help is checked before build)

An actual iOS Metro/Hermes export runs before native generation, so bundling failures stop before the expensive Xcode stage. This compiler check is not screenshot evidence.

## Native compatibility found during the first execution

The original pinned view-shot4.0.3 fails against ReactNative0.86.3 because its iOS implementation names removed RCTScrollView types. The SHA512-verified official Expo57.0.23 `bundledNativeModules.json` specifies view-shot5.1.0; the existing dependency and capture lock are updated to that version. Its `captureRef` API is retained. No UI/controller patch or replacement screenshot renderer is used. Earlier source revisions with incompatible dependency declarations fail `npm ci` instead of receiving a silent dependency override.

Expo Audio declares an unconstrained expo-asset peer. npm had hoisted SDK58 expo-asset into the SDK57 build, which Metro could not resolve against Expo57. The app now explicitly requests SDK57 expo-asset, matching Expo’s own dependency. Official registry integrity is locked; no runtime module is stubbed out to obtain a build.

The ARM attempt at05a9799 never received a runner: GitHub reported macOS arm64 capacity constraints and cancelled the unassigned job after15minutes. The request uses the standard free Intel macOS pool instead; this is an infrastructure failure, not an application or XCTest failure.

## Historical run7 forensic correction (23 October2026)

Run39967258319 at459c2ccd2ced5c7f45ac7fbd14965316346a0296 was cancelled. Full decoded job log:3,096 lines/296,643 characters. Combined native stage14:19:59–15:00:08UTC (40m9s). Fresh react-native-svg compiler warnings persisted through15:00:01; cancellation cleanup terminated four clang processes. There are no XCTest suite/test-start or app-launch events. This establishes compilation had not completed; it does not establish a launch or XCTest defect. The nested ExpoModulesJSI xcframework build reports260seconds and multiple platform slices; repeated native source warnings also show costly compilation. The original Release command did not constrain architecture or optimisation and hid normal progress with-quiet.

Correction: keep embedded-JS Release runtime behaviour but disable native C/Swift optimisation, compile only the Intel simulator architecture, build before simulator boot, separate build/test commands and bound both processes. Do not call this speed improvement proven until actual runner execution. The sole authorised retry targets Midnight Home. No repeated automatic attempts, build caches, extra packages, paid runners or hosted services are introduced. Run7 remains cancelled, artifact validation exited1, upload skipped and no PNG exists.

Local correction verification retained one failed candidate: the original source check still looked for CODE_SIGNING_ALLOWED in workflow YAML after that command moved into native_stage.py. It failed with AssertionError/exit1; the assertion now checks the actual command owner, retaining the same signing denial. Executable Python command checks verify build/test separation, exact device/test selection and missing/ambiguous workspace rejection. These are harness tests, not native execution.

## Historical controlled run8 result and receiver follow-up

The single controlled attempt39978147649 at4503218bc16a6c49a41fb24ac65da03ada9281eb completed with failure; **no PNG or artifact exists**. Xcode26.3 actually compiled the application and XCTest bundle (`TEST BUILD SUCCEEDED`, child/stage exit0,978.9seconds; Actions stage16m20s). iPhone14Pro/iOS26.2 boot passed in4m30s. The test **stage** failed after32seconds with `Local Apple screenshot receiver did not start`/exit1. This occurred before invoking xcodebuild test-without-building: XCTest did not run and the app did not launch. Artifact validation exited1; upload was skipped. No second native attempt was started.

The receiver's redirected stderr was not preserved, so the exact macOS startup/health failure cannot be recovered from this run. Do not claim a proven proxy, port, application or XCTest defect. The follow-up source candidate removes that diagnostic gap: owned receiver startup with visible stderr, early preflight before expensive compilation,15-second readiness deadline, no external proxy routing for loopback, and a bounded per-process identity response that rejects another process occupying the port. It is verified locally, **not yet on macOS**. It is committed with `[skip ci]` to respect the one-attempt instruction.

Repeat the explicit local integration check with `python3 scripts/native-capture/check_receiver_local.py` in an environment that permits loopback sockets. It uses no hosted services or Apple commands. Checks include actual startup, invalid proxy configuration, expected occupied-port denial, caller-error propagation/cleanup and fresh startup; command checks cover separate build/test, exact test/device, signing/architecture and malformed workspace denial. An initial socket test in the restricted Codex sandbox exited1 with PermissionError; the same test passed with approved additional network permission. This local restriction does not establish the macOS failure's cause.

On controlled capture source4503218, the full offline selection passed346/failed0/blocked0/unexecuted0, runner0 and every child0. Production foundation105/exit0, Python/Node syntax, YAML parsing and diff checks passed. Later receiver-only changes passed focused harness/security checks and real loopback integration; the entire application selection was not rerun for those CI-only edits. No production application, database proposal, approval or tenant boundary changed. The Phase52 loss counterexample remains byte-identical.

Next requested native capture should first pass the new cheap receiver preflight, then the existing bounded native build, simulator boot and single Home test. Keep capture scope restricted until an actual PNG is downloaded and inspected. No further native run is authorised by this report itself.

## Historical run9 and current replacement verification

Owner-approved run39986598573 atfee4e25c6558985a874818098dcc7ece88ea0ecc stopped at the receiver preflight: `RuntimeError: Apple screenshot receiver not ready within15s: URLError`, exit1. Native compilation, simulator boot and XCTest were skipped; no PNG was produced and there was no retry. The underlying URL error was not recorded. The owner then explicitly requested the native attachment replacement above; the old receiver and local socket-check scripts are removed from the current tree while their commits/evidence remain intact.

Local commands for this replacement:

* `python3 scripts/native-capture/check_attachments.py`:23 passing inert unit/orchestration tests, process exit0. Generated PNGs exist only in temporary unit fixtures; Apple/Git export commands are mocked. These tests are not native screenshot or hosted evidence.
* `node scripts/check-native-screenshot-pipeline.mjs`:source/security/fixture checks, exit0.
* `python3 scripts/testing/regressions.py --filter native-screenshot-pipeline --output .test-artifacts/native-xctest-attachment-focused.json`:1 selected pass,0 failures,0 blocked,345 unselected/unexecuted; actual runner/child exit0. This is not a rerun of the full346 selection.
* `node scripts/check-production.mjs`:105 checks, exit0. Python byte compilation, Node syntax, workflow YAML parsing and diff checks pass. No Swift compiler/XCTest runtime is available locally; native verification is pending explicit approval.
* Actual disposable detached-worktree `prepare.py` execution passed: source placeholder bound exactly once, manifest identifies Home/Midnight, original App.js preserved behind the existing fixture-install prefix, and original src/UI files unchanged. No installation, native build or external service call was performed.

One unsuccessful local candidate attempted to launch the Python validator through Node synchronous child-process pipes and was blocked by `spawnSync python3 EPERM`. The same assertions now run directly with Python and as a separate cheap workflow step, preserving runtime isolation and the existing10-second VM limit. There are no weakened assertions or new dependencies.

Production application/config/dependencies, trusted database proposals, hosted switches and the Phase52 loss counterexample remain unchanged. Additional external spending is£0; no hosted run, deployment or customer/provider action was performed for this replacement. All historical checks remain historical. The next capture requires a separate owner-approved request-file update; never generate screenshots automatically after a sweep.
