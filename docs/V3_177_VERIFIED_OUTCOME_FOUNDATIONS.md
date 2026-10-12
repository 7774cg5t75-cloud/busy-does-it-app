# Busy Does It — V3.177: Verified Outcome Foundations

Development branch `v3.177` from `v3.176`. All changes remain in GitHub source control, NOT deployed.

## 1. Website Builder owner-decision persistence

- `busy_website_brain_decisions` migration is RLS-enabled with **no anon/authenticated grants**; only the service-role Edge backend can select, insert and delete after checking the signed-in owner's/admin's membership.
- New `websiteBrainChoicesService.mjs` uses the existing `busy-website-publish` authentication and resolves `business_id` from membership, not caller data. It re-fetches the site's **latest server-prepared deployment**, validates exact deployment ID, source-draft ID and source generation, and rejects stale or local-only website drafts. The service supports 80 bounded owner-specific records per deployment, idempotent writes and explicit erase, without changing the public website.
- Native AppController methods and optional Website Builder controls allow **Not useful — remember this**, read saved owner choices and **Clear saved website decisions** with explicit confirmation. When the website draft has not yet been prepared to a current hosted preview, decisions remain local suggestions and the controls fail closed.
- This does not train the underlying AI model or permit cross-tenant preference sharing. Historical choices tied to older revisions are not automatically replayed across new drafts.

## 2. Real, isolated *synthetic* staging DB round trip

- The new `busy_staging_qa_runs` test table is service-role-only, RLS-enabled, and **intended for an isolated staging database ONLY**.
- The existing owner-authenticated `busy-mini-apps` Edge endpoint now supports `staging_synthetic_round_trip`. It calls the V3.176 **server-owned staging allowlist** before ANY DB write. The route requires an explicit owner tap/confirmation, validates the current app and draft revision, route (booking/enquiry × marketplace/standalone/guest-web) and idempotency key, and writes/reads the *test-only table* under the current owner/business scope.
- Reused request keys are accepted only with the same app, route, kind and revision. The backend returns a bounded success receipt after successful read-back.
- The actual request, diary, inbox, notifications, customer records, marketing provider and payment tables are untouched. This is not proof of a customer booking, message delivery, real guest receipt or standalone client journey. Even testing a specific route label does not execute that platform's actual customer client.
- The App Builder now offers **Run isolated synthetic database check** only behind an Alert confirmation. Production servers remain denied by default. Without applied staging schema, deployed Edge code and configured staging allowlist, the button cannot succeed.

## 3. Business Brain evidence discipline

- `businessBrainOutcomeEvidence.mjs` accepts only correctly scoped synthetic staging evidence for the current app, revision, goal/route. It refuses to translate DB connectivity into booking success, enquiries received, delivered messages, conversion rate or commercial lift.
- App Studio explicitly displays the limited proof and the remaining need for independently authorised real customer-journey testing.

## 4. Security and regression checks

- `scripts/check-verified-outcomes-v3177.mjs` executes actual new pure service/helpers with an in-memory simulated Supabase database, including latest deployment checks, cross-tenant/owner isolation, event chronology, request-key idempotency, stale draft denial, owner erase boundaries, staging ownership/current app, duplicate retry, route contamination and the evidence ceiling. It also verifies SQL security statements, authenticated Edge integration, controller/UI controls and workflow wiring.
- `.github/workflows/verified-outcomes-v3177.yml` schedules the new tests and prior inherited regressions, native/Edge syntax checks and Expo exports for Busy iOS/Android and standalone iOS/Android.

**Observed focused development result:** 87 assertions passed in the isolated JavaScript harness. This **does not** certify PostgreSQL schema validity, a live Supabase RLS test, the Edge runtime, native compilation, successful GitHub Actions, physical device performance or any customer workflow.

## Required isolated staging verification BEFORE production changes

1. Create/use an explicitly authorised isolated Supabase project. Confirm cost, ownership and environment identity. Do not create or configure a paid project or change production without the owner's approval.
2. Apply the V3.176 owner-decision migration and the V3.177 website/staging migration **to staging first**. Review RLS, public grants, indexes, request replay and migration order with security/database advisers.
3. Deploy BOTH authenticated Edge services **to staging only**, and set the V3.176 `BUSY_STAGING_MODE=isolated` and `BUSY_STAGING_PROJECT_REF` values on staging only. Production should retain no staging allowlist.
4. Exercise owner A/owner B/admin/read-only member, revoked JWT and anon boundaries using real sign-ins against a disposable test business. Re-test cross-tenant data denial, stale deployment rejection, latest prepared website revision, idempotency and deletion privacy.
5. Run the new synthetic test with an isolated owner-approved test app across all six labeled combinations, and inspect the **test-only** rows and receipts. No real customer requests should be generated.
6. Separately build approved real test-customer end-to-end routes and inspect actual request persistence, owner notifications, reply delivery, guest receipts, diary confirmation, cancellation and app-store standalone behaviour. The synthetic test alone explicitly does not meet this requirement.
7. Confirm actual V3.177 GitHub Actions workflow results and all four Expo exports. Test app/website controls on real iPhone, iPad and Android, including dark UI, medium Display Zoom, large text and screen readers.
8. Require explicit owner approval for any production deployment, publishing, subscriptions, usage credits, third-party signups or actual customer communication.

## Next sweep idea — V3.178

Prioritise **reliable release-readiness evidence**: safe staging provisioning and deployment verification if authorised, audit of security/permissions with actual test identities, customer-journey instrumentation in isolated staging and coordinated before/after quality scoring that only credits observable outcomes. Avoid building more planning-only layers until genuine end-to-end evidence is available.

**No live database migration, Edge deployment, test submission, public website publishing, app-store activity or spending occurred in V3.177.**
