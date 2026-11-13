# Phase 21 architecture health

Read-only census: 1,165 source files, 149,526 physical lines, 2,357 static relative edges, zero detected cycles. Static graph excludes dynamic/aliased/runtime resolution.

- AppController: 17,850 lines / 703,942 bytes, unchanged. Main mini-app Edge entry: 4,606 lines / 183,564 bytes, unchanged. miniApps: 5,340 lines / 284,807 bytes; growth is nine lines of runtime wiring and guarded replacement, not a new controller.
- Removed the 42-line duplicate marketplace catalogue renderer. Its import now resolves to the actual standalone component; behavioural identity assertion prevents the earlier coverage gap. Historical catalogue parity claims were too broad and are corrected in the delivery record.
- Source-bound public browse caches are separate from the existing private request cache. Runtime-supplied context is never authorisation. Native review restoration rechecks original exact payload/source keys; unknown outcomes retain original retry guards.
- Pure composition facts are shared between candidate preparation and Explore, avoiding a second design planner. Original client and worker gallery branches agree; only the pure worker renderer executes in tests with inert URL resolution.
- Original request-replacement handler rechecks latest draft/account/detail and current approved record. Native denied actions now change no return-origin state. Inherited handler extraction supplies explicit runtime context and tests its denial.
- Remaining risk: giant original controllers and manually extracted test seams need gradual replacement by coherent modules/full original component tests. New return-path tests exercise actual original native component with an export-only fixture seam; no full Metro/device execution. Pending asset and general tenancy contracts remain explicit blockers, not invented capabilities.

Future rollout must coordinate client/catalogue/native and canonical worker bundles plus regenerated standalone exports. No rollout, schema, hosted access or production-readiness claim.
