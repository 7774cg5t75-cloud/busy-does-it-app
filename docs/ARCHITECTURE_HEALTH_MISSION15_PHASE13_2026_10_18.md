# Mission 15 Phase 13 — focused architecture health

Functional source `f6cb8ea7d386b2f38eae3800ff0afc17042f48cb`, existing PR #26. This is a focused changed-boundary review, not a whole-product release audit.

## Reuse and improvements

- Shared component-appearance validation remains canonical in src/core with byte-identical copies for original authenticated and guest Edge handlers. FAQ tokens extend the existing operation; no new SQL or editor engine.
- FAQ customer presentation is a small shared marketplace/standalone component rather than duplicate inline UI. Pure token calculations and existing public projections remain authoritative. The original generic Card is untouched.
- Explore explanation is a separate presentation adapter over the existing universal planner/readiness checks. Discussion, scratch ideas and approved editing remain separate; no second AI service or chat store.
- Trusted capability code is a closed read-only foundation, separate from the large Edge entrypoints. No key issuance or provider transport is smuggled into it. A post-await role/source check protects delayed reads. Actual HTTP session integration remains deliberately disabled.
- Website cancellation and reading preparation extend the existing finite instruction/atomic transaction system. No arbitrary HTML/CSS or direct persistence callback is added.

## Measured census

Static audit: 1,131 source files, 148,525 physical lines, zero distinct relative-import cycles. Static cycles do not prove absence of runtime coupling.

| Module | Lines | Bytes | Finding |
| --- | ---: | ---: | --- |
| src/app/AppController.js | 17,850 | 703,942 | Unchanged; large mixed controller remains highest maintenance risk. |
| src/screens/miniApps.js | 5,329 | 282,557 | Two lines larger than Phase 12, shared FAQ presentation extracted; still high fan-out (87 imports). |
| supabase/functions/busy-mini-apps/index.ts | 4,606 | 183,564 | Unchanged this phase; broad handler remains a risk. |

Avoid speculative rewrites. Next useful extraction should follow a real owner/customer capability boundary, retaining exact CAS/tenant/receipt tests.

## Security and release limits

The dormant capability foundation depends on genuine trusted read adapters and a future reviewed transport; it is not an operational distributed read-only session. Never activate remote tools with unrestricted owner credentials. Legacy editor auth is intentionally unchanged. All current Explore UI execution has no provider/mutation handlers. Main risks remain unsupported remote integration, native/device behaviour and coordinated separately approved deployment of changed finite appearance helpers plus shared exports.

If a future rollout is approved, update trusted authenticated/guest validation and helper bundles before clients can save FAQ component tokens; deploy public projections/renderers and regenerate standalone packages with the new helper/component. Older trusted handlers reject unknown FAQ tokens safely; no schema migration is needed. No rollout performed.

Full reviewed offline selection passed 108/108 in one run; focused new boundaries and final source-ID compatibility passed. No browser/device/hosted acceptance or accessibility certification claimed. Keep the source/revision-bound browser instructions for later authorised acceptance. No external spending.
