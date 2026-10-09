# BUSY DOES IT V3.79 — Customer Success Engine 2.0: Secure Lead Capture

**Development branch:** `v3.79` from `v3.78`. No customer website was published. Visitor submissions are **disabled by default** until explicit activation and real end-to-end tests.

## Built

1. **Private and public enquiry origins.** A new migration permits `website_form` alongside `owner_entered` in the existing RLS-protected `busy_website_leads` table. An anonymous form submission has `created_by=null`, cannot claim to be an authenticated owner, must refer to its website, and still requires affirmative permission to reply. Owner-created records still require a real creator ID. The original per-business idempotency key remains unique.
2. **Site-level fail-closed switch.** `busy_websites.public_form_enabled` is a NOT NULL boolean defaulting to **false**. Public intake also requires server-side `BUSY_WEBSITE_FORM_INTAKE_ENABLED=true`, the Turnstile secret configured, and the site to have a valid live deployment and a one-label `*.busydoesit.co.uk` default hostname. The public form renderer additionally needs a configured public Turnstile site key. No feature flag or credential is enabled in this migration.
3. **Public intake Edge Function.** New `busy-website-form`, deployed without JWT requirement because visitors are anonymous, has its OWN application checks before elevated database use: strict HTTPS BUSY-host Origin, exact website UUID and its database-owned hostname, Cloudflare Turnstile Siteverify `success=true`, exact hostname and action `busy_website_enquiry`, strict request size/contact/consent validation, and server-side hourly quota. Without every gate, the POST is rejected. Service-role credentials and Turnstile secret never enter website HTML or API responses. No automatic customer email, SMS or paid AI request occurs.
4. **Atomic 12-per-hour site quota.** Service-role-only SECURITY INVOKER Postgres `busy_claim_website_form_quota(uuid)` uses an atomic conflict update and refuses the thirteenth accepted claim. Private `busy_website_form_quota` table has RLS enabled and grants revoked from public, anon and authenticated. Hourly `pg_cron` deletes quota counters after 48 hours; it never deletes actual customer enquiries.
5. **Hosted preview and website rendering.** `busy-website-worker` has an accessible, opt-in generated contact form for a website's homepage/contact page when BOTH site/platform switches and the public site key are present. Exactly the same form content appears in the prepared hosted preview and the public artifact so the user can review before approving Go Live. The browser form disables submit when opened from a different origin, including the signed private preview. Existing and newly prepared sites remain form-free by default.
6. **Improved customer inbox.** The owner/admin lead list preserves the true provenance of a `website_form` record. Website Management now separately labels challenge-verified website contacts, owner-entered contacts, ordinary analytics events and manually labelled quote/booking stages. Simple **unsent, non-AI reply suggestions** are displayed for human review. No provider message is transmitted and no real customer booking is claimed.
7. **Automated safeguards.** New `scripts/check-customer-success-v379.mjs` joins existing GitHub production regression scripts. It tests disabled-by-default behaviour, strict hostname boundaries, bot proof validation, contact consent and anti-bot honeypot, local form rendering and preview parity, source labels, no message sending and security wiring.
8. **V3.79 version stamp** for Expo configuration, package and runtime.

## What was actually verified
- Applied Supabase migrations `v3_79_public_form_gates` and `v3_79_form_source_creator`.
- Transactional SQL fixture (fully **ROLLED BACK**) verified: form gate default false; anon/authenticated roles have no table or quota RPC privileges; `website_form` accepts null creator only with an actual website; `owner_entered` refuses a null creator; twelve claims pass and the thirteenth is refused. No dummy customer/site remains stored.
- Focused policy, form markup and origin-accuracy tests passed (15 checks). Regression test source parsing and prior backend validations checked. **Full GitHub CI execution is not yet confirmed green.**
- Supabase `busy-website-form` is ACTIVE v2 with `verify_jwt=false` (required for anonymous visitors; safe because application checks deny disabled requests).
- `busy-website-publish` is ACTIVE v20 with JWT verification and owner/admin lead listing.
- `busy-website-worker` is ACTIVE v14 with JWT verification.
- Production database had zero live BUSY-hosted customer sites and zero opted-in public forms at inspection. Therefore there is **no real external visitor submission success to claim**.

## Security/privacy release gates before turning forms on

1. Create an approved BUSY staging website using actual approved hosting, preview, Go Live and public DNS/SSL checks. A real website publishing workflow still needs end-to-end verification.
2. Set up Cloudflare Turnstile site key and secret, confirm allowed domains/action and run both human and bot/expired-token tests.
3. Publish a website privacy notice covering enquiries, use, retention, correction/deletion/export and consumer communication purposes; review UK data protection and spam rules. No automatic marketing opt-in is inferred from consent to respond to an enquiry.
4. Add an owner-authorised, audited self-service activation toggle and safe disable/revoke flow. This release does not include a public activation button, and no website was enabled.
5. Confirm challenge, CORS, quota limits, duplicates, failover, client accessibility and deletion policy with real integration tests. Note that a per-site limit can block legitimate traffic if too low; tune based on evidence with abuse controls.
6. Establish confirmed lead → customer → quote → booking **record associations**, not only manually selected labels. Automatic replies and paid AI remain disabled until reliable permissions, budgets and approvals exist.
7. Run full automated GitHub suite and future native iPhone acceptance before general release.

## Main files
- `supabase/migrations/20261009110000_v3_79_public_form_gates.sql`
- `supabase/migrations/20261009111500_v3_79_form_source_creator.sql`
- `supabase/functions/busy-website-form/index.ts`
- `supabase/functions/busy-website-form/formPolicy.mjs`
- `supabase/functions/busy-website-worker/formHtml.mjs`
- `supabase/functions/busy-website-worker/index.ts`
- `supabase/functions/busy-website-publish/leadWorkflow.mjs`
- `src/screens/websitePublishing.js`
- `scripts/check-customer-success-v379.mjs`
- `.github/workflows/production-check.yml`
