# V3.82 — Founder Financial Autopilot 1.0

**Status:** Code implemented and guarded. Hourly **internal** usage snapshots are scheduled and have already written records. GitHub billing and Cloudflare analytics adapters are implemented but require dedicated read-only provider credentials before collecting real provider reports. **Do not claim automatically connected supplier invoices or a fully live operating-cost dashboard.**

## Scope and safety
- Founder-only as in V3.81: every `busy-founder-ops` request validates Auth `app_metadata.busy_platform_role='founder'` server-side. Secret/service credentials remain in Supabase Edge Functions only.
- No provider subscription creation, provider billing-plan changes, paid purchases, auto-credit top-ups, or website Go Live actions. No customer-specific data is returned.
- Manual founder snapshots, log-count samples, internal scheduled metrics, and optional provider API reports have different source/provenance categories.

## Automatically working now (without new credentials)
- Migration `20261009123000_v382_internal_telemetry.sql`: new private `busy_founder_auto_telemetry` table (RLS, direct anon/auth grants revoked).
- Scheduled **every hour at minute 37 UTC** with `pg_cron`: aggregate BUSY's own AI request records over rolling 30 days, hosted-website request records over 30 days, prepared website versions, website live *records*, workspaces, and internal incident-monitor runs in the past 24 hours.
- Six distinct, timestamped first-party metrics, individually labelled; unknown values are never converted to measured zero. The first backfill has run. Future pg_cron execution is scheduled, not claimed as independently observed until cron logs confirm it.
- Built-in private retention job at 03:47 UTC prunes telemetry older than 90 days.
- **These are not billable Supabase Edge Function invocations or provider AI tokens.** They cannot be compared directly with the 500,000 org-wide Edge Function allowance.
- UI now shows measurements, timestamps/freshness, privacy caveats, provider connection gaps, and clearly labelled historical subscription details.

## Provider-readiness work (requires permission)
- `providerReaders.mjs`: fixed-host read-only adapters (no caller-supplied arbitrary URL or account selection).
- **GitHub:** user-level Actions minutes for the authenticated account's current UTC month, from GitHub billing usage summary; requires a secure `BUSY_GITHUB_BILLING_READ_TOKEN` with account Plan **read** permission plus `BUSY_GITHUB_BILLING_ACCOUNT`. This is an account-scoped usage observation and is NOT a GBP invoice. GitHub source-code repo access does not grant billing API access. GitHub documents: https://docs.github.com/en/rest/billing/usage .
- **Cloudflare:** Workers invocation/traffic observations from one account and a single named Worker during the previous hour, using its Analytics GraphQL API; requires `BUSY_CLOUDFLARE_ANALYTICS_READ_TOKEN`, `BUSY_CLOUDFLARE_ACCOUNT_TAG` and `BUSY_CLOUDFLARE_WORKER_SCRIPT`. Enforces one-account, fewer-than-100-series nontruncated results. These are **sampled operational observations, not billed usage**. Documentation: https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-workers-metrics/ .
- Neither credential is requested from, stored by or displayed in the iOS app. They must be authorised separately through the provider and saved securely in the Supabase server environment. **No credential was created or activated in this sweep.**
- The Founder dashboard has a button to **check configured read-only provider feeds**. This is on-demand rather than scheduled: external provider polling *cannot yet run unattended* until credentials and scheduling permission are in place. It fails closed if not configured.
- Provider responses are saved in the founder-only append-only ledger with source `provider_api_readonly` (not `founder_entered`), no inferred subscription plan, no allowance and no currency conversion. One saved observation per UTC hour per provider; a distinct service-only atomic **30-minute provider refresh cooldown** prevents frequent API requests.
- 50/75/90% usage warnings and 30-day renewal reviews are in-app **historical-review prompts** unless a fresh, matching verified provider allowance/period is available. They are not external push/email alarms.
- Supplier-authoritative balances, payment invoices, valid multi-service GBP totals, actual customers' MRR and actual margins remain unconnected.

## Technical changes
- `supabase/migrations/20261009123000_v382_internal_telemetry.sql`
- `supabase/migrations/20261009124500_v382_provider_readonly_source.sql`
- `supabase/migrations/20261009125500_v382_provider_refresh_limits.sql`
- `supabase/functions/busy-founder-ops/autoTelemetry.mjs`
- `supabase/functions/busy-founder-ops/providerReaders.mjs`
- `supabase/functions/busy-founder-ops/index.ts`
- `supabase/functions/busy-founder-ops/serviceRegister.mjs`
- `src/screens/founderServiceCosts.js`
- `src/app/AppController.js`
- `scripts/check-financial-autopilot-v382.mjs`
- `.github/workflows/production-check.yml`

## Checks performed
- Applied three Supabase migrations successfully; first automatic sample created six metric records.
- Checked scheduler: telemetry hourly, retention daily and provider cooldown pruning daily all active.
- Verified unauthenticated and ordinary authenticated clients cannot read the founder telemetry or provider-refresh slots or invoke either privileged RPC.
- Transactional fixture (rolled back) confirmed first provider refresh claim succeeds, duplicate claim in the same window is refused, valid read-only provider provenance can be stored, and fake creator records are rejected.
- V3.82 regression suite passed **113 focused assertions** (pure logic + mocks for real provider API response shapes + strict security/source checks), and production CI workflow includes it.
- `busy-founder-ops` Edge Function is ACTIVE **v14**, with `verify_jwt=true` and the new helper modules.
- GitHub CI complete run and device acceptance have **not** been confirmed. No real provider API credential or billing result has been verified. No real public demo website exists yet.

## What comes next
1. Connect a restricted GitHub billing read credential and the Cloudflare Analytics read credential through explicit founder setup, then inspect the first actual response and provider rate limits. For other suppliers, add the least-privilege billing read interfaces as they become available.
2. Add a protected scheduler for configured **external** provider feeds (do not schedule external API calls until least-privilege access and a bounded alert/budget strategy are approved).
3. Connect actual Supabase organization billing usage meter, AI tokens/spend, payments, email and EAS build quotas. Per-provider usage periods and allowance reset dates are essential.
4. Only after verified source and cycle alignment, enable trusted 50/75/90% **current** usage alerts and founder-only delivery; no unapproved spending.
5. Continue the private BUSY demo hosted-preview → owner approval → real HTTPS test. Domain `demo.busydoesit.co.uk` has not been published.

**Business objective:** Keep costs legible, avoid surprises and build a self-running sustainable SaaS platform, without misrepresenting what we've connected.
