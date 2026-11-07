# Mission 15 Phase 23 — partial continuation: original native extraction and verified defect fixes

Started from verified GitHub `38f833657b9462bfe9d05ddf9455db1c95fd80da` / draft PR #26 on the existing branch. The dependency chain #25 → #24 → #23 → #21 was rechecked open, draft and unmerged at its previous heads. No new branch or PR.

## Current product-master access gate

The owner-approved version remains V22.35, with prior provenance recorded in Phase 22. Its original attachment and extracted text are no longer present in this execution environment. A filename scan of the available workspace Word documents found only V22.18. That older document was not substituted. The initial access assumption was corrected immediately. This phase does not claim a fresh full V22.35 review.

AGENTS.md requires: "If the full master is inaccessible, say so. Request the current document before product-scope decisions or major feature sweeps. You may perform independently safe, scope-neutral code review or prepare a plan, but do not invent requirements or silently fall back to an older document." The owner's mission likewise requires obtaining V22.35. Consequently this continuation is limited to the expressly requested behaviour-preserving extraction, testing reliability and a verified existing presentation-contract defect. New marketplace focus/recovery UI and Website/App/Explore product sweeps remain unfinished pending reattachment. This is a real input gate, not a claim that Mission 15 has finished or execution capacity alone was exhausted.

## Three verified engineering batches

1. `05b8e2b334a860d3ef84123dd7c9ed60c6986c9b` — moved the original RequestScreen function body unchanged into `standalone/template/nativeRequestScreen.js`. A small factory receives the app's existing presentation primitives only. It does not receive alternative transport, persistence or authority. The original screen retains its same imported validator, request transport, local hook state, exact review, duplicate/uncertain guards, customer requirements and receipt logic. The parent still owns its existing bounded private form map, source/version keys, attachment rekeying and navigation. App.js falls from 467 to 315 lines; the extracted module is 160 lines. The existing fictional offline package includes the new module. Existing extracted lifecycle harnesses now read its real new location; actual packaged App/RequestScreen tests remain in place.
2. `dbe8fecba8de7435e12f66acb0e23d179aaf8218` — the regression runner supplies its child checks the pinned isolated-tool NODE_PATH, rather than depending on an earlier shell export. One inherited Babel string-plugin lookup was blocked despite installed verified packages. The original trusted-handler test passes after this runner-only fix. No downloads, app dependency changes, platform configuration or weakened assertions.
3. `27405bcb1fa71020f900c7c406069610fdac2be5` — corrected an existing shared Field defect: marketplace Message/Note already requested multiline inputs, but Field discarded that prop. The optional prop now reaches the actual native TextInput, with a single-line default retained. Existing visible labels also reach accessibilityLabel. A new behavioural check traverses real marketplace BusyAppDetail → original BusinessAppCustomerRequestFields → actual Field/TextInput; it preserves newline wording through original parent state and proves that typing submits nothing. This is not completed invalid-field focus/recovery.

## Integration and evidence boundaries

Original native tests exercise the actual packaged app's configured RequestScreen, as well as original lifecycle callbacks with inert hook/transport boundaries. They retain exact enquiry/booking review, source changes, customer requirements, attachment removal, generated-versus-owner wording, parent key changes, late save/receipt continuity and uncertain/successful duplicate prevention. A supplemental source comparison verified that the extracted function body itself is byte-identical. The evidence is not limited to that comparison.

Actual marketplace import identity and runtime context checks from Phase 21 remain in the reviewed selection. The new marketplace test exercises the actual shared Field renderer, not a substitute form. Original request validation, approval and trusted server submission paths were not modified. No new request engine, customer store, editor or memory layer was added.

The first integrated selection had 125 passed / 0 failed / 1 blocked / 0 unexecuted: an inherited named Babel plugin lookup. It passed in isolation with the corrected runner, then the complete 126-check selection passed. The final selection was expanded for the later multiline defect fix and run again against clean frozen source. Final complete frozen-source selection: **127 passed, 0 failed, 0 blocked, 0 unexecuted** against GitHub `27405bcb1fa71020f900c7c406069610fdac2be5` / local `f11111764fc14cde7fb754b2f3450219897bcb77`, starting from a clean tree. Exact source/tree mapping and individual outcomes are in the checks JSON. Seven changed JS/MJS files parse with pinned Babel; the Python runner compiles. No package installation was needed.

## Architecture and compatibility

Final read-only census: 1,170 source files, 149,644 physical lines, 2,360 static relative edges and zero detected static cycles. This is not a complete dynamic graph or quality score. AppController (17,850 lines), miniApps (5,340) and main mini-app Edge entrypoint (4,606) remain unchanged. The refactor reduces native root complexity without introducing a central replacement controller.

The request screen still combines local lifecycle and presentation inside its bounded extracted component; that may be split further only when a real feature benefits. Some older lifecycle tests still extract original function bodies with inert hooks, while actual component tests cover the real import path. Real standalone packages must include the new module and be regenerated through reviewed compatible exports before a separately approved rollout. No deployment occurred.

No new Website Builder design, Talk & Explore, quality-control policy, service imagery, personal workspace, schema or remote authority capability is claimed. Existing behaviour was regression-tested. No new invalid-field focus action is claimed. Native focus/scroll, keyboard, real screenshots, browser/iPhone/iPad, hosted RLS/provider and signed-build acceptance remain unverified and separately gated.

## Exact next work

Reattach the complete private V22.35 Word master and verify access. Then resume the original Phase 23 queue: marketplace invalid-field recovery using the already shared validator's field identifier and original form source/review identity. The real shared Field currently has no input-ref forwarding; add that through the actual component, preserve disabled invalid-review semantics, and test current-source focus/correction without submitting or clearing customer data. Then continue professional canonical website composition, simpler selected editing and grounded Explore through original candidate/approval/Undo architecture.

Mission 15 and Phase 23 remain open. No merges, force-pushes, deployments, hosted database/schema changes, workflows, publication, customer/provider actions, billing/credential changes, paid builds or additional external spending. £0.
