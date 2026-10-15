# PR #10 independent follow-up review and development

Preflight: supplied Product Master V22.18 (latest available, previously fully read; sections 26, 40, 43–47 and 50–53 rechecked), current architecture and development policy. Latest numbered branch remains v3.240. PR #10 is draft, open and mergeable at remote bfd9e1228cf7cf11222b2522f17e8e78edfc7384. Follow-up local branch preserves the original tested history. No merge, publication, paid provider, deployment, live database or production action is authorised or performed.

## Review sweep: reproduced defects and fixes

The original 91-script baseline reproduced 82 passes and nine existing child-process EPERM blocks. The actual PR patch and local code were inspected, including controller transport, Studio UI, copied Edge policies, standalone handoff and Website Preview measurements.

Seven previously missed cases were reproduced as assertion failures before fixing them: (1) full navigation permutation shifts a locked module; (2) moving an unlocked neighbour shifts a locked module; (3) moving another module first shifts a locked module; (4) a header alias fails to protect header style; (5) undo inserts presentation where it was absent; (6) undo inserts explicit defaults into an empty presentation; (7) candidate approval ignores a changed signed-in owner within the same business.

Lock checks now examine every displaced module and related appearance groups, including direct moves; the direct-move path now forwards direction into that check. Client and Edge use identical policy. A bounded `restore_appearance` operation restores the exact validated pre-edit appearance shape, including absence, while rejecting changed lock metadata, unsupported fields and changes affecting locked elements. It is an extension of the original owner-approved private CAS editor, not a new mutation endpoint. Source deployment must keep the client and Edge editor versions compatible; no deployment was performed here.

Website candidates also carry the signed-in owner into immediate render/apply gating, rather than relying only on a later effect clearing state. The owner is not exported in WebView metric keys.

Ten targeted review assertions now pass, including additional attempts to remove locks or smuggle unsupported properties via restore. The historical Studio test now asserts exact full original configuration restoration rather than requiring insertion of a default imageScale; this strengthens the undo contract. Inherited Studio, V3.239 website, V3.240 intelligence, new save/session, standalone parity and native/Edge parser checks pass.

## Functional sweep: one Studio lifecycle and selective approval

`appStudioSession.mjs` owns the ephemeral original Studio proposal/approval/undo lifecycle; `usePrivateAppStudio` is its small React adapter. It reuses the original planner, source binding and save service. The oversized builder no longer has separate, inconsistent approval and undo response handlers. Duplicate approval/undo/discard while pending is rejected synchronously; uncertain undo is disabled; old-owner responses and unmounted callbacks are ignored. Exact returned revision/configuration/inverse evidence is checked before enabling undo.

Owners can leave out a single proposed change and immediately see the remaining batch recomputed through the same planner. Removing all changes disables approval. Original/proposed comparison stays the original shared renderer. No persistent second record store, new backend or automatic save was added; session continuity across app restart remains out of scope.

New tests cover successful approve/undo with updated props, duplicate actions, edits while saving, lost approval and undo confirmations, malformed receipts, owner changes, unmount and removal of individual changes. Native/Edge parse, inherited Studio, exact-undo design and Snack dependency closure checks pass. Two historical tests now demand exact original sparse configuration instead of added default fields.

## Functional sweep: owner-grounded goal intelligence

The existing goal-aware design review consumes the existing bounded owner design-pattern engine. An explicit owner action loads saved choices through the existing read-only design-history endpoint. Rejected options and liked currently active settings can suppress generic responsive suggestions; only original supported rule choices enter the goal proposal, not synthesized alternatives. The output contains counts and policy evidence, not private history text or promises of visual improvement.

History is bound to business, signed-in owner, app and current draft revision. Wrong scope, future revisions, malformed or oversized records are ignored. The existing controller history reader now checks live refs before the request and after its response; its previous closure comparisons could not detect an owner/workspace change during the await. The React adapter cancels old-scope results and deduplicates repeated same-scope loads. No model call, table, cross-business learning or automatic edit is added.

Tests exercise actual current-vs-rejected goal recommendations, preferred current choices, foreign/stale/future snapshots and the real extracted controller function with delayed simulated responses. Existing V3.166 feedback, goal-editing, V3.240 intelligence and native syntax tests pass. Hosted access and actual owner feedback remain unverified.

## Functional sweep: interrupted website checks and consistent appearance locks

Website Preview measurement attempts now have a bounded lifetime and exact source/width/variant/token identity. A visible stop action, twelve-second timeout, incomplete-result handling and WebView load/process error handling let owners recover without saving. Cancelled, expired and old-workspace results cannot enter the width portfolio. Pending measurements block candidate approval even when an earlier portfolio was safe. Scope and viewport changes cancel the active attempt. Browser process events and device timing remain unverified here.

The existing layout operation engine now exports one appearance-lock guard, consumed by both actual operations and measured design recommendations. Locked hero styles are neither proposed nor applied; global theme styles conservatively require every affected section to be unlocked. Malformed lock metadata fails closed. This covers `style`, `section-style` and `reset-section-style`, not a claim that every historical content operation now has section-lock enforcement.

New checks exercise expiry boundaries, changed owner/source/width/variant/token, actual extracted cancellation code, website JSX, unchanged drafts and coach/application lock agreement. A final lifecycle review also added an explicit same-app receipt check to the Studio adapter; the underlying save service already enforced it, and an extra malformed-receipt assertion now protects both layers.

## Architecture and outcome review

Four connected follow-up sweeps retain the existing planner, CAS service, feedback endpoint, pattern engine, renderer and website layout engine. Lifecycle extraction removes duplicated Studio response handling from the large screen; hooks remain thin. Client and Edge planner/policy copies are byte-identical under the existing parity checks. No dependency, package download, second persistence system, migration or provider call was introduced. The builders remain large; further extraction should follow actual lifecycle boundaries rather than cosmetic file splitting.

Full offline verification: **95 scripts, 86 passed, nine blocked by inherited child-process EPERM restrictions, zero assertion failures**. Exact outcomes are recorded in `BUILDER_PR10_FOLLOWUP_CHECKS_2026_10_15.json`. The native/Edge parse and 319-module dependency graph pass; no preview was published. Live RLS/hosted CAS concurrency, real-device interruption, WebView timeout/error callbacks, accessibility and visual quality remain unverified. No production, deployment, paid build, database execution or additional spending occurred.

Product outcomes: private App Builder now has selective review, unified approval/undo recovery and scoped preference-aware recommendations; Website Builder has recoverable measured checks and consistent appearance locks. Remaining high-value priorities are safe persisted Studio continuity after restart using existing recovery systems, measured owner outcome feedback after real approval, broader lock policy review for historical website content controls, and permitted staging/device validation of marketplace/standalone parity. Client/Edge compatibility must be checked before any separately approved deployment.
