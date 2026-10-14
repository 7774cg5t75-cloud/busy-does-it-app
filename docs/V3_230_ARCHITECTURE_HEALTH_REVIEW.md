# V3.230 architecture health — evidence and next refactor boundaries

**Review scope:** Current v3.230 GitHub source tree, both masters, builder/guest/owner notification boundaries, SQL migration ledger and V3.230 test evidence. This is a source inspection, NOT a formal production security certification or native device release.

## Grounded repository indicators

GitHub's complete recursive source tree (not truncated) contained **789 files with .js, .mjs, .jsx, .ts, .tsx or .sql suffixes**, including **68 versioned migration SQL files**. Largest source files by actual Git tree blob bytes (rounded):
| Path | Approximate size | Risk / next low-cost action |
| --- | ---: | --- |
| `src/app/AppController.js` | 682 KB | Very high orchestration coupling. Extract one stable business enquiry or notification orchestration seam only after behaviour-contract tests. Do not mass-rewrite. |
| `src/screens/miniApps.js` | 255 KB | Enquiry/App Builder UI density. Consider extracting the owner inbox card into a focused tested component, preserving iOS/Android layout and current route props. |
| `src/screens/work.js` | 183 KB | Work/calendar coupling. Defer until current customer-request path is proved; avoid scope expansion during staging phase. |
| `supabase/functions/busy-mini-apps/index.ts` | 171 KB | Large authenticated route/controller. Keep server membership checks at the boundary and extract *pure*, version-independent evaluators. |
| `src/screens/customers.js` / `src/screens/websiteBuilder.js` | 81 / 80 KB | Moderate UI coupling. Extract after deep visual regression coverage exists. |

## Risks found and what V3.230 actually improved

1. **False outcome language — addressed at bounded receipt boundary.** Existing V3.229 has a legacy `receipt_state` option `provider_delivered` although a gateway/Expo receipt cannot certify phone display. V3.230 intentionally does **not** write or display that label; new `push_service_state` and pure classifier distinguish service acceptance, service error and expiry. **Follow-up:** after real staging proof, design safe compatibility migration/retention for the dormant legacy field.
2. **Concurrent receipt reconciliation — improved but requires real provider tests.** First terminal `push_service_state` wins using original ticket, attempt and slot, preventing duplicate or contradictory updates in disposable PostgreSQL. The receipt checker limits each on-demand run to ten tickets and does not send notifications. **Follow-up:** add bounded operational metrics, provider rate-limit/backoff and monitoring after separate integration approval; never auto-resend accepted/unknown pushes.
3. **Enquiry presentation/navigation divergence — improved in original screen.** Previously the action said “Open latest request”, while the backend correctly prioritises NEW over merely latest. V3.230 changes the existing button to “Open new request” / “Continue request review”. **Follow-up:** native device accessibility and no-duplicate-action visual tests during authorised staging cycle.
4. **Migration/staging drift — maintained strict gates.** New 68th SQL migration requires prior V3.229 table and service-role policy. Historical manifest and phase-one source checks updated to 68; real hosted staging remains canary-only. **Follow-up:** before any installation, independent current project schema/ledger, permissions/extensions/network/cron review, real backup restore and two-persona JWT/RLS tests with explicit owner phase permission.
5. **Test architecture pressure — contained.** V3.230 adds isolated pure classifier/regression and a disposable SQL transaction that starts from the REAL saved guest request/outbox, not a mocked second request database. Older harness/source checks still execute. **Follow-up:** consolidate repeated historical hard-coded SQL counts into one reviewed inventory contract in a future sweep without weakening dependency-drift detection.

## Non-claims and acceptance

No comprehensive dependency graph, line-by-line circular-dependency analysis, measured native rendering performance, real device receipt or production security penetration test was performed. Size is not a quality score. This source audit is one milestone; keep improving maintainability every sweep rather than postponing all simplification.

Before extracting any giant controller, record real before/after call boundaries, preserve owner roles, receipt type semantics, offline and disposable SQL checks, then run iOS+Android *unsigned* exports when appropriately requested. **Do not trigger paid signing builds**.

## Next audit

Recheck after roughly five substantial sweeps (approximately V3.235) or sooner if a major regression or staging schema drift appears. Prioritise extracting the Business App owner inbox card and a small authenticated-request route seam while keeping the underlying shared request database authoritative.
