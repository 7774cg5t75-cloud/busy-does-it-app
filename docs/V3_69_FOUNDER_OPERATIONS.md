# V3.69 — Founder Operations Security Foundation

**Status:** Development branch `v3.69`. Dedicated `busy-founder-ops` Edge Function deployed with JWT verification enabled. **Founder role provisioning is intentionally NOT performed.** No paying subscriptions, platform-wide alerts, or public release are enabled.

## Objective

BUSY DOES IT aims to justify a **£50/month** future subscription while steadily reducing the founder's workload. Build platform-wide reliability and cost visibility without allowing one customer's normal account to read any other customer's information.

## Implemented

1. **Server-side founder role enforcement:** `supabase/functions/busy-founder-ops/index.ts` only allows POST with `{"action":"summary"}`. It obtains the user freshly from Supabase Auth on EVERY request, and requires the server-controlled `app_metadata.busy_platform_role === "founder"` on a verified authenticated user. User-editable `user_metadata`, account email, a self-claimed role, business ownership, and UI flags NEVER grant platform privileges.
2. **Fail-closed backend:** A new, distinct Edge Function with `verify_jwt=true` checks the role *before* any privileged database operation. No service-role or secret key appears in mobile UI, environment variables sent to Expo, client requests or JSON results. Unsupported requests are denied.
3. **Aggregate-only telemetry:** The function reads exact PostgREST counts for business workspaces, memberships, recently updated business snapshots, queued/failed website jobs, failed social posts, and failed Business Apps. It retrieves bounded 30-day AI request counter and website request volumes, returning **unknown** on unavailable or incomplete sources rather than fabricated zero.
4. **Founder-only in-app view:** `src/screens/founderOperations.js` shows an on-demand platform overview, grouped issue totals and available usage. If the server denies the signed-in account, it renders only a restricted-access explanation. Accounts/businesses changing mid-request invalidate responses. Access entry is under Production Bridge, not as a default customer Home feature.
5. **Transparent money metrics:** £50/month remains a commercial quality target. The system does **not** yet know paying subscribers, MRR, AI invoices, hosting bills or profit. Business workspace count is **not** subscriber count.
6. **No external changes:** No new signup, email service, payment provider, secret-provisioning step, schema migration or cross-tenant data table is required for the **deployed read-only foundation**.

## One-time founder activation gate

Current database inspection on 8 Oct 2026 found **zero founder accounts granted** `busy_platform_role=founder`. This is intentional to prevent accidental elevation. Do not grant founder status merely because an email matches a marketing/support address or because someone owns a BUSY business.

To activate the private view later, an authorised operator must verify the exact authenticated founder **Supabase Auth user ID** and update *only that user's server-controlled* `app_metadata.busy_platform_role` using an admin-protected Auth operation. Then sign in again to refresh credentials. Do **not** add the role in `user_metadata`, the client app, or business membership records. Inspect/verify access from the actual founder iPhone account before using the report. No founder role was granted in this sweep.

## Security and operational limits

- All cross-business queries run **after** fresh server Auth check, via a private server environment key. Reports contain numbers only, no emails, customer records, business names or row identifiers.
- The handler is read-only and cannot create, delete, publish or retry work. Existing per-business Operations & Reliability screens retain their own scopes.
- The report is **on-demand**, not a continuously running platform-wide monitor. Next version could add server-only scheduled watchers, deduplicated incident tickets, alerts to founder after severity/quiet-hours thresholds, delivery logs, and drill-down with privacy controls.
- Subscription payments and provider invoice aggregation still need safe Stripe/App Store/AI/cloud integration and reconciled ledgers. The £50 subscription is not active.
- Fixed 1,001-row caps on usage queries avoid unbounded scans; if the source exceeds 1,000 rows, the corresponding metric is marked unknown until proper paginated or materialised aggregates are built.
- JWT verification is enforced in the Supabase configuration and in the deployed Edge Function. All normal users are denied, including a single-business owner.
- Testing: `node scripts/check-founder-operations.mjs` plus V3.64–V3.68 regressions and the production-foundation check. Security tests exercise forged client metadata, unauthenticated users, strict role, scope and non-leakage, null vs zero, and lack of write operations.

## Remaining acceptance before release

- [ ] Provision and validate one verified founder Auth user; no guessed user IDs, emails or grants.
- [ ] Test successful authenticated founder request and 401/403 refusals from a nonfounder account on a signed native iPhone build.
- [ ] Confirm the production Supabase REST exact counts and bounded 30-day request metrics through the founder endpoint.
- [ ] Test token expiry, account switch mid-refresh, offline status and revocation of the founder Auth role.
- [ ] Add a secure server-side audit trail of founder reads and role changes before handling more sensitive actions.
- [ ] Design privileged platform-wide uptime watcher and alerts with idempotency, quiet-hours rules and cost budgets.
- [ ] Integrate billing and provider invoice data before claiming active subscribers, £50 charges, revenue or margin.
- [ ] Native App Store acceptance still requires Apple Developer account verification.

**Value principle:** Each sweep should make BUSY more useful to paying customers **and** reduce the founder's daily operating workload. Any future autonomous action must be safer than manual repetition, not merely automatic.
