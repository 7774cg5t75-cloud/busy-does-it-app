# Busy Does It V3.219 — Verified Staging Gap, Version Recovery and Provider Evidence

**Based on:** v3.218. **Scope:** read-only real staging metadata check plus safe source-only integration, tests and architecture. **No** application migrations, Edge deployments, customer requests, public website edits, paid AI calls, provider notifications, signed builds, database writes or use of production credentials.

## 1. Newly VERIFIED staging finding — 14 October 2026

Read-only introspection was performed through the user's connected Supabase account for the separately named **Busy Does It Staging** project, status ACTIVE_HEALTHY, UK region. No customer records, secrets, passwords or tokens were read. Inspected information_schema, pg_catalog.pg_tables, function counts and policy counts.

Observed:
- Public schema has **one table**, named busy_staging_rls_canary.
- There are **zero** publicly defined application functions whose name starts busy_.
- The essential existing application tables are **not installed in the public staging schema**: busy_business_memberships, busy_mini_apps, busy_mini_app_versions, busy_mini_app_requests, busy_mini_app_guest_challenges.
- Therefore the staging database cannot currently validate the existing Business App guest RPC, owner inbox, or new native website intake transaction. It would be incorrect to treat a schema design, source-only guard or a passed unit check as a working staged customer request.

These are time-stamped observations, not a live continuously updated state. The repo may contain migration source files not yet applied to staging. The next planned work is to inventory exact base migrations and remote migration history in a controlled staging bootstrap, not to deploy a partial new website form first.

The repeatable queries are in docs/staging/V3_219_READ_ONLY_SCHEMA_INSPECTION.sql. They use SELECT only and show metadata rather than customer information.

## 2. New fail-closed schema and rollback readiness modules

Paths:
- src/core/stagingSchemaGateV3219.mjs
- src/core/stagingRollbackPlanV3219.mjs

The schema gate accepts only a bounded, marked read-only staging catalogue snapshot. It checks required base tables, core request and version columns, the existing mini-app guest RPC, RLS enabled flags and migration-history review. The actual observed staging fixture fails the essential table/RPC checks. Even when given a theoretically complete snapshot, **deploy readiness is always false** until separate owner approvals, live RLS isolation testing, schema reconciliation, restore tests and actual migrations are independently verified. A pure function cannot attest the authenticity of caller-supplied catalogue data.

The bootstrap planner prioritises:
1. Align versioned source migration history with the actual isolated staging database.
2. Establish existing base business/membership/app/version/request tables and dependencies in correct order.
3. Verify cross-tenant owner RLS and existing guest challenge + transactional RPC.
4. Test restore/rollback under staging isolation.
5. Test concurrent idempotent retries and real HTTPS/mobile customer journeys.
6. Require explicit owner review and publication decisions.

No new migration, rollback operation or database write was executed.

## 3. Published app version changes cannot silently break website owners

Path: src/core/publishedVersionRecoveryV3219.mjs

The existing owner-approved handoff is bound to a canonical, trusted HTTPS Supabase link, the source slug, exact Business App ID and immutable published version. Changed live version, disabled module, stale link, altered URL, different tenant, or old owner-approved version results in read-only owner-reapproval and separate website-republication guidance. No redirect, blind automatic reconnection or forced republish.

A prior request with an unknown/committed outcome always goes to server readback recovery **before** the customer is encouraged to create another request. This is recommendation logic only; no actual request status was fetched or updated.

## 4. Honest owner notification and outbox reconciliation

Path: src/core/outboxReconciliationV3219.mjs

Supports plans for pending/claimed/attempted/provider-accepted/failed/dead-letter/supposed-delivered notification states with exact business, request and event scope. No notification is resent or delivered by this function.

**Important:** Even a caller-provided provider-signed delivery assertion is NOT cryptographically verified by a pure function. This module *always* reports independent delivery verification false; a future authenticated adapter must check actual signed provider/webhook evidence, dedupe under worker locks, and keep contact/reply delivery and diary/booking proof separate.

## 5. More useful Business Brain action and simple website UX

Paths:
- src/core/customerJourneyActionV3219.mjs
- src/screens/websiteAppHandoffReview.js

BUSY's existing website/app handoff review now includes a short evidence-limited next recommendation. A pending/unknown customer request takes priority for existing-receipt verification. Stale app versions require owner reapproval and website republish. Otherwise existing owner-intent-first recommendations remain. Cross-business website/app inputs fail closed.

The interface stays optional, and a suggested action never means a real customer request, completed booking, published website or delivered notification.

## 6. Testing and code health

scripts/check-builders-v3219.mjs adds **102 focused assertions**, exercised in an isolated V8 compatibility harness with a URL shim. They cover real observed staging-absence fixture, full hypothetical source inventory that still cannot enable deployment, RLS and guest RPC gaps, migration rollback readiness, canonical link tampering and drift, unknown commit recovery, notification provenance and cross-tenant checks.

.github/workflows/builders-major-v3219.yml runs these before inherited V3.218/V3.217/V3.216 and other existing regressions, security/staging preflight, source checks and **unsigned** mobile/platform exports. **Full Node/Expo GitHub Actions success is not independently verified**; no paid signed builds were triggered. V8 checks cannot replace real remote staging, security proofs or end-user device testing.

## 7. Next priority — proposed V3.220

The blocking task is **establishing the existing Business App baseline on separate staging**, not an additional unverified website form layer. Begin with an exact source migration dependency audit and a safe owner-reviewed apply/rollback plan using the known staging project. Once the base schema is present, independently verify real business memberships, request RPC permissions, RLS isolation, duplicate submissions, saved receipt and owner inbox before any website-native request write path.

In parallel continue universal website/app composer quality, deterministic Business Brain advice and simple visible owner guidance. Keep public native website forms disabled until real protected end-to-end evidence exists.

**North star:** customers should be able to ask Busy to do something and have reliable, independently verifiable evidence that Busy completed it.
