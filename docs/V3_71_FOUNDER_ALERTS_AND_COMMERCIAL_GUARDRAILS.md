# V3.71 — Founder Alert Inbox and Commercial Guardrails

## Product objective
Continue toward a BUSY DOES IT service worth a future **£50/month** with less founder intervention. Avoid shipping speculative billing claims, uncontrolled automated fixes, or an unfair website cancellation experience.

## Delivered
- Built `public.busy_platform_alert_inbox`, a **private four-signal aggregate alert inbox** synchronised on every existing 15-minute database incident scan. RLS is enabled; direct normal-customer access is revoked.
- New alert rows record incident key, priority, transition generation, affected count, timestamps and acknowledgement time. No customer names, customer identifiers, post text, device IDs or message contents are stored in the inbox.
- **Acknowledge** only marks the current alert generation as seen; it does **not** resolve the underlying incident, retry publication, make a customer change or claim successful notification delivery.
- Same-generation scans preserve acknowledgement. Incident closure follows the established two-clean-scan rule. A reopened incident resets acknowledgement so the founder can review the new occurrence.
- Extended the server-authorised `busy-founder-ops` Edge Function to return an allowlisted, bounded alert inbox and accept only a single, allowlisted `acknowledge` action with a transition-number optimistic lock. Every request requires a **fresh authenticated founder app_metadata check** before reading or updating records. JWT verification stays enabled.
- Added founder dashboard alert counts, status, acknowledgement buttons and class-specific **safe review guidance**. No automated publishing, customer data mutation, payment charging or live content recovery was added.
- Added pure `subscriptionGuardrails.mjs` decision helpers with new regression test cases for future verified paid-through periods, seven-day grace, post-grace review and metered usage soft/hard thresholds. All unverified data returns **unverified**; **no automatic suspension or hard stop is enabled**. This is groundwork, not a billing integration.
- Updated the development branch version to **3.71.0**.

## Commercial service-policy proposal (not yet active)
- £50/month is the **target**, not currently a charged subscription.
- Website creation is a service bundled with continued BUSY hosting, maintenance, updates and operating tools; customers continue to use those services while subscribed.
- On cancellation, paid services remain active until the end of the **already paid period**. A proposed 7-day service grace period follows; changes after this require a verified payment provider, customer notification and clear terms.
- At the end of any fully disclosed service period, managed hosting and BUSY-powered services may eventually pause in line with accepted terms, but **domain ownership remains with the customer** and they should be able to export their content and data without being held hostage.
- Retain customer export paths and an appropriate retrieval window; **no automatic data deletion** or involuntary domain transfers based on this helper.
- AI/media limits should be stated up front, based on verified usage and real provider costs. Metering failures must be marked unknown, not zero; do not impose surprise charges.

## Verification performed
- Deployed the V3.71 database migration and `busy-founder-ops` Edge Function.
- SQL transaction-only QA covered alert creation, repeated-scan acknowledgement preservation, two-clean-scan resolution and acknowledgement reset on recurrence. The transaction was rolled back: it left no simulated customer incident.
- Confirmed `authenticated` role has neither SELECT nor UPDATE privilege on the alert inbox.
- Source-level regression checks are in `scripts/check-platform-autopilot-v371.mjs`. A signed-in founder iPhone acceptance pass and all repository Node regression checks remain to be completed.

## Production acceptance / still not active
- [ ] Open a **new V3.71 development build or preview** (the V3.70 Snack link does not magically update), sign in to the server-authorised founder account, and verify Founder Operations displays the alert inbox.
- [ ] Test a real alert acknowledgement using a supervised isolated QA fixture; check optimistic-lock denial for an older transition, and ordinary-user 403.
- [ ] Register and verify a founder push destination or an authenticated email address, add strict class-based cooldowns and delivery receipts, test quiet hours and opt-out. **External alerts are NOT enabled.**
- [ ] Design provider-specific **read-only** diagnostic probes and safe idempotent recovery for certain job types; retries/publishing must not duplicate customer actions.
- [ ] Connect verified subscription payments, invoices, cancellations, billing webhooks, dispute handling, entitlements and provider-reported AI/cloud costs before enforcing subscription or usage decisions.
- [ ] Confirm export, hosting, grace-period language and applicable consumer/business cancellation terms before public signup. Nothing in this sweep changes a customer's hosting.
- [ ] Rerun the full GitHub/Node regression suite and native-device release acceptance. Apple Developer and separate release gates still apply.

## Files
- SQL: `supabase/migrations/20261009013000_v3_71_founder_alert_inbox.sql`
- API: `supabase/functions/busy-founder-ops/index.ts`, `report.mjs`, `alertInbox.mjs`
- UI and app: `src/screens/founderOperations.js`, `src/app/AppController.js`
- Commercial readiness: `src/domain/subscriptionGuardrails.mjs`
- Checks: `scripts/check-platform-autopilot-v371.mjs`
