# Busy Does It V3.235 — Five-Sweep Code-Health & Reliability Audit

**Scope:** GitHub branch V3.234 → V3.235, actual recursive source-tree blob sizes, owner request/reply logic, inherited automatic quality contracts and staging release gates. This is **not** a full architecture security penetration test, signed-device QA, performance profile or release approval.

## Verified physical source indicators

The GitHub recursive tree returned **no truncation**; V3.235 contains **814 JS/JSX/MJS/TS/TSX/SQL files** (including **69 versioned migrations**). Byte sizes, not lines of code, are shown below:

| Source | V3.234 | V3.235 | Assessment |
| --- | ---: | ---: | --- |
| `src/app/AppController.js` | 702,235 B | 702,235 B | Major cross-feature orchestration hotspot; high regression cost for a broad rewrite |
| `src/screens/miniApps.js` | 261,701 B | 261,939 B | Dense owner/customer UI; one small, source-verified explanation added this sweep |
| `src/screens/work.js` | 187,573 B | 187,573 B | Large Work/calendar module; preserve V3.180/181/232 transactional guarantees |
| `supabase/functions/busy-mini-apps/index.ts` | 179,617 B | 178,647 B | Auth and route controller; reduced by 970 B through conservative extraction |
| `ownerFollowupReadbackV3235.mjs` | absent | 2,367 B | New bounded exact-tenant, two-message, read-only database service |
| `ownerOutcomeEvidenceV3235.mjs` | absent | 3,120 B | Pure reusable conservative evidence classifier |

Sizes indicate review priority, not code quality by themselves. Extracting 970 B is an intentionally small safe step, not a claim that the giant controller is now well factored.

## Architecture correctness and risks

1. **Existing authenticated boundary preserved.** The V3.235 helper is called only from the original `owner_followup_check` Edge action after verified membership and explicit owner/admin role check. Dependencies are injected for strict offline tests but NOT exposed as a separate unauthenticated HTTP route. Both original request and the latest two message reads retain exact `business_id`, `mini_app_id` and request ID filters and fail closed on errors/foreign rows.
2. **Consistency of two read queries:** Source-only reads of a request and the two newest messages are not a SERIALIZABLE cross-table snapshot. A customer could write between reads. This was already a bounded risk in V3.207, and remains mitigated—not eliminated—by the existing server-side `guardReviewedOwnerSend` which requires a fresh same-request source stamp at the actual reviewed send. Do not promise fully atomic owner-facing suggestions until real concurrent-session staging tests and stronger snapshot mechanics justify them.
3. **Source of truth:** Original request status and messages are observations, NOT successful customer outcomes. New outcome classifier and client gate require exact tenant IDs and shared message/request source stamp; do not fabricate delivered pushes, confirmed Work bookings, payments, customer satisfaction, training updates or follow-up conversions.
4. **Feedback and learning:** The Business Brain is better at describing evidence, but **no real owner feedback capture, measured conversion loop or cross-business learning/training was implemented** by this sweep. Plan genuine per-business consented structured outcome events, deduplicated receipts and safe measured comparisons in later separately reviewed source changes; protect tenant data.
5. **Client UI:** A single small plain-English paragraph reuses the existing follow-up card; customer still approves all replies. Large native component needs gradual extraction after iPhone/iPad/Android visual regression evidence, not mass refactoring.
6. **Database and live readiness:** No V3.235 schema or hosted Supabase changes. All **69** source migrations remain outstanding for real Business App staging installation. Backup + genuine disposable restore, live Auth/JWT tenant A/B/revoked-member tests, browser submission→owner inbox→approved reply and Work booking remain independent release gates. Source passes cannot waive them.
7. **Cost and safety:** No cron, pushes, external provider invoices, app store signing builds or production changes. Keep future tests in disposable PostgreSQL and simulated provider contracts until approved.

## V3.236–V3.240 engineering sequence

- **First:** Extract ONE more bounded owner request or screen component behind source, accessible UX and original Work/calendar regressions. Avoid moving global auth or unreviewed state.
- **Second:** Prepare owner-reviewed feedback events tied to exact original requests, with actor/tenant consent, evidence type and idempotency. Validate semantics before any new tables.
- **Third:** Improve real staging phase-one acceptance evidence and specific owner approval path: fresh catalog/ledger, backup+restore, genuine JWT RLS and end-to-end customer experience. Do not automatically schedule notifications.
- **Fourth:** When staging is authorised and installed, run real same-business and cross-business UI scenarios before claiming a customer-facing release feature complete.
- **Fifth:** Repeat a measured code-health audit at the next 5–10 sweep milestone, considering build duration, test brittleness, dependency/permission drift, native performance and actual source module sizes.

**Rule:** Build fast, build properly, reuse intelligently, improve continuously. Biggest real-world correctness gap remains hosted end-to-end verification, not missing synthetic test counts.
