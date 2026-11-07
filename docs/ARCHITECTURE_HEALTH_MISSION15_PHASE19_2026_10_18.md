# Phase 19 focused architecture health

Read-only offline census: 1,158 source files, 149,364 physical lines, 2,345 static relative edges, zero detected static relative-import cycles. Dynamic/aliased resolution and runtime behaviour are outside this graph. Shared appearance policy parity assertion passed; clause-splitting copies remain in parity.

- AppController: 17,850 lines / 703,942 bytes / 83 static outbound edges, unchanged.
- miniApps: 5,331 lines / 283,629 bytes / 89 outbound edges. Only related-service callback wiring in this phase; no new controller responsibility.
- Main mini-app Edge entry: 4,606 lines / 183,564 bytes / 38 outbound edges, unchanged.
- Customer rendering and category navigation reuse standalone components. No duplicate request/editor/Brain engine or new dependency.
- Catalogue detail/review/source state is accumulating in BusinessContentView. Risk: stale option/context logic becomes harder to audit. Next useful bounded refactor: extract a pure source-bound selection/revision transition helper, preserve the original component and request adapter, and test business/kind/revision changes and repeated navigation. Do not undertake a general screen rewrite.
- Appearance controls still use the original finite operations; presets merge only scoped properties. Cancellation now blocks callbacks immediately. The explicit keep-colours allowlist fails closed for unsupported/colour-affecting operations; future tokens must be reviewed before joining it.
- Existing approved media uses URI approval metadata rather than the required stable service/asset relation. Prior proposal remains pending; no fabricated association or schema change.

Source census is maintainability evidence, not a production or security certification. Browser/native/hosted acceptance and deployment remain separate. Rollout must include current shared bundles and regenerated standalone exports. No workflow, deployment, hosted access or external spending.
