# Mission 12 focused architecture health — 17 October 2026

Scope: five connected improvement areas in PR #23. Reviewed changed customer-entry/request, original Studio, shared transfers, intent policy and approval/recovery boundaries. This is not a complete repository performance/security certification.

## Corrections and reuse

- Preserved one request system and tenant source. Actual app-detail response now includes its server-resolved business ID; real submit/replay logic is tested offline.
- One universal intent interpretation now serves three existing planning/advice consumers; removed the now-unused duplicate explicit-advice regex metadata.
- Existing Studio edit, approval, lock and inverse contracts serve new FAQ/contact preparation. Shared client/Edge source parity is retained.
- Existing private website commit applies recomputed reviewed information sections; no parallel website writer.
- Separate opt-in protects compatible defaults for additive FAQ transfer.
- Record approval is tied to the exact saved revision and form snapshot. Account-scoped and standalone navigation recovery remain bounded and avoid blind replay.

## Concrete risks and disposition

| Finding | Evidence | Disposition |
| --- | --- | --- |
| Large mixed-purpose controllers | src/app/AppController.js: 699324 → 701068 bytes; src/screens/miniApps.js: 273825 → 276422 bytes; supabase/functions/busy-mini-apps/index.ts: 182449 → 182526 bytes | Existing high maintenance risk. Added only narrow routing/glue; keep extracting coherent responsibilities under functional regressions, not a mass rewrite. Next mission should isolate request-form lifecycle behind the original controller boundary. |
| Several deployable contract copies | Records: five copies; public collections: four; Studio: two; content HTML/native adapters | Parity checked for changed contracts. No competing source of truth introduced. A future build-time copy check/generation consolidation may reduce maintenance, subject to export/Edge packaging tests. |
| Full render/build evidence missing | Babel component suites unavailable; new tests execute real pre-render/handler logic, and complete JSX syntax separately passes | Release gate, not a claim of native/component rendering. Run existing component/build checks in a suitably provisioned environment before release. No paid build authorised. |
| In-memory recovery only | Customer form maps bound to account/app/version/selection, maximum eight entries | Preserves navigation and pending outcome; process-death/reinstall recovery remains unverified. Do not casually persist customer PII to solve it. |
| Public context is not financial/availability authority | Saved service/message includes listing revision and explicit enquiry wording | Keep owner validation and original trusted request flow; no purchase, stock, booking, payment or delivery promises. |
| Language rules are bounded heuristics | Explicit exclusions/conflicts/dependency tests | Owner can correct the brief. No model-training, autonomous execution or universal language accuracy claim. |

## Boundaries preserved

No migration, database permission, approval variable, protected environment, workflow, billing setting, package dependency or production/provider configuration changed. Internal Docker isolation, localhost proxy, exact-SHA gates and cleanup remain inherited from PR #21. No hosted Supabase access. £0 additional external spending.

Before release: compatible authenticated staging, actual JSX/runtime exports, real device/browser/accessibility and interruption tests, and current-version request/inbox/receipt readback. Existing rehearsal proves its exact previous disposable scope only.
