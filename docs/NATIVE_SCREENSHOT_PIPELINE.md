# Genuine native screenshots — owner-requested, fictional and free-runner only

This workflow builds the actual Mission15 application for an iOS Simulator. It does not use EAS, an Apple signing account, a cloud app build, HTML rendering or generated mock-ups. Native execution/results are recorded in the capture report; workflow source alone is not proof of a successful image.

## Ask for a capture

Ask Codex to capture Busy. On the existing Mission15 branch, update only `scripts/native-capture/request.json` with a unique request label and optional exact `source_sha`, then make a normal expected-head commit **without `[skip ci]`**. That explicitly requested file change starts `.github/workflows/native-screenshots.yml`. Other code changes do not automatically start this workflow.

The initial push trigger works on this development branch without modifying/merging main. GitHub requires a workflow on the default branch for its manual-dispatch UI; until separately approved integration, the request-file mechanism avoids that dependency. The workflow also includes `workflow_dispatch` for later compatible control-plane use. Do not dispatch an existing EAS or hosted-staging workflow as a shortcut.

Blank source captures the request commit. A comparison SHA must be an ancestor of this Mission15 request and contain the appearance infrastructure. The original source is checked out in a detached disposable runner worktree. No branch is reset, replaced or merged. Root package compatibility is checked by `npm ci`; an incompatible historical revision fails rather than silently substituting another runtime.

## Actual app, safely fictional I/O

The native application retains original AppController, screens, state, authentication UI/guards, appearance storage and navigation. XCTest enters a visibly fictional account through the real sign-in form and uses the actual Settings appearance controls.

Only a disposable build's App.js is prefixed with the versioned screenshot transport. App configuration is wrapped for a separate `com.busydoesit.capture` install identity, no OTA updates or EAS metadata. Original UI/controller files and production repository app/config files are not patched. The manifest records original/instrumented entry hashes and both source/harness commits.

The injected transport has **no native-fetch forwarding path**. It returns synthetic in-memory account/snapshot responses, recognises only the fixed test business, and denies unrelated hosts/actions. XHR and WebSocket construction are blocked. No hosted Supabase, provider, payment or publishing service is contacted. This fixture is not real JWT/RLS/CAS/provider verification. Its account receipts are simulated test data, not genuine hosted completion evidence.

Fresh simulator + separate app identifier keep device/Keychain data isolated. Public artifacts contain only intended PNGs and a non-secret provenance manifest. No binary, private Word master, logs, configuration, customer export or XCTest result bundle is uploaded.

## Build/capture boundaries

* Standard Apple Silicon `macos-15`, exact public repository/branch guard, bounded50-minute job. No larger/custom/self-hosted runner input.
* Official checkout/setup/upload actions pinned to verified commit SHAs; read-only repository token and checkout credential persistence disabled. No secrets referenced.
* Capture-only lock records the existing application's dependencies with official registry URLs and SHA512 integrity. Install uses `npm ci --ignore-scripts`; no lifecycle scripts during package installation. Explicit Expo/CocoaPods/Xcode commands perform the reviewed native build.
* Existing installed simulator runtime only, foreground Simulator and six-minute boot deadline; prefer iPhone14Pro, otherwise record the actual supported iPhone. No claim of a particular model unless the manifest establishes it.
* Release simulator build embeds actual JS at the recorded commit, with no Metro tunnel. XCTest drives controls; a localhost-only receiver calls Apple `xcrun simctl io … screenshot`.
* Initial test targets genuine Home in Midnight and Daylight. Broader screen coverage must be added/executed and labelled; do not infer it from workflow design.
* PNG signature and total20MiB cap before upload; uploader runs only after the artifact gate succeeds. One-day retention, no binary/cache upload. No artifact is uploaded when no actual screenshot exists.

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
* https://developer.apple.com/library/archive/documentation/IDEs/Conceptual/iOS_Simulator_Guide/InteractingwiththeiOSSimulator/InteractingwiththeiOSSimulator.html
