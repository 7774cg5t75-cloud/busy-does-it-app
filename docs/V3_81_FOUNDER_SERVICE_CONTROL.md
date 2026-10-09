# BUSY DOES IT V3.81 — Founder Service Control and Safe Website Staging

**Development branch:** `v3.81` from `v3.80`.
**Status:** Development features complete. Provider account-billing APIs and a genuine hosted demo site are NOT yet connected or verified.

## Purpose
Give the solo founder a private operational inventory of essential services and their costs, renewals, usage limits and risks. Distinguish provider measurements from staff-entered observations, avoid surprise charges and keep customer accounts out of the platform-wide view.

## Built and deployed
1. Added the private `busy_founder_service_snapshots` table. Row-level security is enabled, with all direct `anon` and `authenticated` rights revoked. A protected Supabase service role reads/adds records only after the existing `busy-founder-ops` Edge Function freshly validates `auth.users.app_metadata.busy_platform_role='founder'` against Auth. Ordinary BUSY customers have no access to the new data.
2. Included ten tracked dependencies: **Supabase, Cloudflare, GitHub, Expo, Apple Developer, Meta, Google, AI provider, email delivery, and payment processor**. Each has a purpose, an explicit unit, a status, a source of evidence and cautions on unconnected accounts.
3. Record the **plan name, Free/Trial/Paid/Unknown status, monthly/annual/usage-based cadence, allowance, observed count, unit, cost in GBP, renewal date and founder note**. Server validates a fixed schema; foreign/malicious keys and amounts are refused. Provider/key uniqueness prevents duplicate saves on retries. Saved rows are append-only historical snapshots, not unapproved contract or billing changes.
4. Seeded a **one-time historical snapshot for Supabase** from 9 October 2026, 09:20 UTC: 14,493 non-OPTIONS function requests observed from 1–9 October across the BUSY and Slow Roast projects, compared with the Free organization's 500,000 monthly included allowance. This is a log-derived **2.9% observation**, not today's remaining invoice quota or a periodically refreshed billing counter. It may omit API calls outside available log coverage. All other providers are explicitly marked "Not measured" pending verified data.
5. Added `service_catalog` and `record_service` actions to `busy-founder-ops`, behind the pre-existing fresh founder-auth check. The backend does not expose secrets or read customer-personal content. Service role credentials remain private.
6. Added a **Founder Service Control** section inside the existing Founder Operations dashboard. It lists plans, latest usage, allowance percentages, observation date, recorded cost, renewal and provenance; founder may select a service and save a new labelled observation. No auto-charge, renewal, provider signup or hidden integration happens.
7. Added `demo_launch_status`: a **fixed-host**, read-only inspection of `demo.busydoesit.co.uk`. It reports the existence of a real website record, a private hosted preview ID or a publication record. It does not let the user choose another business's hostname or publish any files. The UI unambiguously states external HTTPS was **not verified** and the exact preview still requires owner Go Live approval.
8. Performance protection: the app uses stable loader refs to avoid accidental repeated fetches on re-render, rejects stale account responses, and safeguards against out-of-order staging requests.

## Verified
- Supabase migration `v381_founder_service_snapshots` applied successfully.
- `busy-founder-ops` **ACTIVE version 13**, JWT verification **on**, with the extra `serviceRegister.mjs` helper.
- Database permissions checked: anonymous and authenticated clients **cannot select or insert** in the register; the protected backend service role can insert.
- A transactional SQL fixture verified duplicate-keys reject second inserts, owner-entered records require `recorded_by`, and direct client privileges remain closed. Test fixture was **rolled back**.
- Exactly one historical Supabase snapshot is retained; the SQL fixture left no new vendor records.
- One user with verified founder-role app metadata exists, but no actual signed-in iPhone acceptance has been tested.
- New `scripts/check-founder-operations-v381.mjs` passed **86 focused checks**, and is included in `.github/workflows/production-check.yml`.
- Staging check confirmed **zero** records for `demo.busydoesit.co.uk`. No hosted demo preview or real live website has been created; no DNS or domain settings were modified.
- Full GitHub CI, on-device acceptance and interactive end-to-end founder account verification remain pending.

## Future integrations (NOT implemented in V3.81)
- Exact Supabase billing-cycle current usage should come from an authenticated official organisation usage/billing API. Log samples are historical. The 500,000 allowance is **organization-shared** across both projects.
- Cloudflare Workers/requests, invoice, renewal and SSL/provider health; GitHub Actions billing; EAS build credits; Apple developer renewal; Meta/Google API quotas; AI credit/tokens/billing; transactional email delivery; and payment processor subscriptions/refunds each need proper provider permissioned integration.
- Alerts for approaching limits, unusual spikes or renewal dates may be built once reliable source data and founder-selected thresholds exist. **There are no automated external payment renewals, subscription purchases or account modifications.**
- The `BUSY DOES IT` public website and demo staging host still require the approved authentic website/account workflow, private immutable hosted preview, exact owner approval, DNS/SSL/Cloudflare verification, actual public HTTPS response and health proof, without confusing code-generated HTML with a public site.
- A later security/privacy check should establish retention and deletion processes for founder-entered vendor notes and confirm which service contracts need an owner review.

## Files
- `supabase/migrations/20261009111000_v381_founder_service_snapshots.sql`
- `supabase/functions/busy-founder-ops/serviceRegister.mjs`
- `supabase/functions/busy-founder-ops/index.ts`
- `src/app/AppController.js`
- `src/screens/founderServiceCosts.js`
- `src/screens/founderOperations.js`
- `scripts/check-founder-operations-v381.mjs`
- `.github/workflows/production-check.yml`

**North star:** Give the founder useful oversight of all operating services without fabricated live billing, while continuing to make BUSY a valuable low-touch, sustainable subscription platform.
