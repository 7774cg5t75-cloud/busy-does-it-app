# V3.226 — Durable Guest Alert Intent, Owner Delivery Truth and Staging Gate

Base: V3.225. Before creating branch, checked both masters: latest Word product master V22.6 (Holo Marketing Intelligence), especially sections 33 (one shared Business App runtime), 42 (evidence-led marketing), 52 (working universal builders) and 53 (quality-first dual-master governance), plus GitHub ARCHITECTURE.md, engineering policy, V3.225 report and code. This is technical implementation, not a new product/pricing/tier decision; the Word master remains V22.6.

## Real customer-request code change

Previously, the guest Edge handler attempted Expo notification sends directly after saving a request. A network timeout could leave actual provider delivery unknown; the old push-delivery dedupe table is not an atomically stored guest-request intent.

New versioned additive migration: supabase/migrations/20261014151000_v3_226_guest_notification_intent.sql.

- Creates one server-owned busy_mini_app_guest_notification_intents record per guest_web insert into the pre-existing busy_mini_app_requests table, by AFTER INSERT trigger. The trigger runs in the original database transaction alongside request and event writes, with unique request ID and exact business/app scope. No duplicate CRM/request engine.
- The record begins in pending state and has explicit, bounded state/attempt/lease metadata for a future independently reviewed dispatcher. V3.226 does NOT execute a dispatcher, contact Expo, send an email, start a scheduled job or make a charge.
- Public/anon/authenticated direct access is revoked; RLS is enabled and FORCEd. Trigger function has empty search_path, tenant-source checks and revoked public/anon/authenticated EXECUTE. Real server-only access remains intentional.
- The actual busy-mini-app-guest/index.ts Edge handler now verifies the exact persisted outbox row after the V3.224 stored-request payload proof, instead of making a synchronous push call. Missing or cross-business outbox evidence fails closed; customer is directed to check the original receipt, not create another request. The response distinguishes notificationIntentSaved from notificationDelivered:false.
- The private owner/admin Business App queue endpoint now independently reads per-business/app pending/retry_wait intent counts. One additional line on the existing customer-request screen reports unsent guest alerts, with owner action to open the existing inbox. No unsolicited polling, auto-reply or extra complicated screen.

## Actual testing and evidence limits

scripts/check-outbox-v3226.mjs exercises 126 synthetic/source assertions about tenant/app/request scope, status truth, RLS, direct-send removal and owner UI. Historical V3.224 guest payload tests still run their 177 checks.

The disposable PostgreSQL 16 CI runner combines the real V3.225 guest RPC fixture, the actual V3.226 migration, and new synthetic same-transaction assertions. It verifies exactly two matching pending outbox records for two distinct tenant requests, no duplicate outbox on consumed-challenge replay, server-only table access, FORCE RLS and trigger function privileges. It then performs a real full ROLLBACK. This SQL is CI-only and excludes the historical V3.45 cron registration; never deploy the assembly itself.

Source CI had two test-only compatibility regressions, fixed without altering production schema: old fixed 64-file migration inventory is now 65 migration files plus one staging-only baseline; JavaScript replacement preserved PostgreSQL dollar-quoted function delimiters using function callbacks. The final complete GitHub CI result must be independently checked before calling this sweep green.

A fresh, SELECT-only observation of Busy Does It Staging on 14 October 2026 found only busy_staging_rls_canary (RLS enabled) and the original two migration-history versions 20261010224121 and 20261010224205. No guest request backend, outbox migration or Edge handler is installed there. No hosted Supabase write, production/customer data read, signed native build, provider notification or publication happened.

CI cannot prove genuine Supabase Auth/JWT tenant isolation, real device delivery, lost provider acknowledgement, worker concurrency, authenticated hosted owner screens or real database backup/restore. A provider accepted notification is not proof a customer device received it, nor that a booking was confirmed.

## Most valuable next dependency: V3.227

After exact isolated-staging project and migration/security/cron/extension review and separately explicit owner approval, install a verified minimal Business App backend in staging. Prove genuine authenticated two-tenant and guest browser request -> owner inbox -> pending notification intent with transaction/replay/error recovery.

Then implement a server-owned dispatcher with atomic lease/claim, rate limits, permission checks, bounded retries, stable idempotency, distinguish provider-accepted from delivered, and safe manual recovery; do not infer delivery from intent creation. Reuse the existing Business Brain and Brand DNA to minimise owner effort and maintain genuine function across website and app journeys.

North star: You tell Busy what needs doing. Busy does it properly, and can prove the outcome.
