# Busy Does It V3.218 — Request Transaction Safety, Recovery and Universal Business Intelligence

**Base:** V3.217. **Status:** source implementation plus isolated dry-run contract tests. **No** new live website form, Edge route, database migration, production write, provider notification, paid AI call, signed build, deployed staging website or actual customer transaction.

## Why this version matters

A website enquiry must never cause duplicate customer work because a browser timed out, a booking request must never be called a confirmed diary appointment, and an AI suggestion must not masquerade as an available published feature. The V3.217 platform already has source plans and a real existing Business App guest request path; the website-native part is still unimplemented.

V3.218 advances five related areas while preserving the universal, any-industry website/app architecture and retaining the existing Business App request table and owner inbox as the intended authoritative system.

## 1. Proposed Postgres and RPC integration, not deployed

Files:
- supabase/functions/busy-website-request-intake/schemaReviewV3218.mjs
- docs/sql-proposals/V3_218_WEBSITE_INTAKE_DRAFT_NOT_DEPLOYABLE.sql

The pure schema reviewer describes proposed records for **owner consent approvals**, **single-use visitor challenges**, a **source-/approval-bound idempotency ledger** and a **durable notification outbox**. No visitor names, email addresses, messages or raw idempotency keys belong in the deduplication ledger. The durable customer record should be created in the **existing** busy_mini_app_requests table and surfaced in the existing owner Business App inbox.

Proposed uniqueness is business + website + immutable deployment + exact owner-approval revision + request type + hashed key, with the approval bound to one exact app and live version. A replay using the same key but different content must be rejected. A caller-reported success is not proof of an authoritative database write.

The SQL is a **review-only design document OUTSIDE supabase/migrations**, with an intentional Postgres RAISE EXCEPTION before the first DDL statement. It cannot deploy a new endpoint or activate a form. Its table names, foreign keys, request_origin constraint, tenant permission boundaries and compatibility with existing staging databases **must be reconciled from the real schema before anybody removes that guard or writes an actual migration**. Draft DENY-BY-DEFAULT RLS/privilege clauses are not by themselves a complete authenticated owner policy.

The pure reviewer can be provided source facts and will report missing schema/permission/notification prerequisites; even if all are caller-marked true, it **always** reports deployReady=false, migrationExecuted=false, and publicEndpointEnabled=false.

## 2. Fail-closed replay and interrupted-request recovery

Files:
- supabase/functions/busy-website-request-intake/idempotencyRehearsalV3218.mjs
- src/core/requestRecoveryStateV3218.mjs

The first function models the decision to make **before** any future atomic Postgres request creation. It validates an opaque digest, business, site, deployment, app, immutable version, approval ID, supported request type, and scope-bound challenge. A new key can only produce the disposition requires_atomic_rpc. It **never** returns permission to insert from JavaScript.

If a matching committed ledger exists, the result is lookup_existing_receipt (without exposing that request ID to a public caller). If a claim is pending/uncertain, the result is reconcile_before_retry. If a key is reused with a changed payload, or another business/site/version/approval, it refuses to proceed. The unique database constraint and a single atomic challenge-consumption + request-insert RPC remain essential; a JavaScript check cannot prevent a concurrent race.

The recovery reviewer accepts only the existing Business App signed-in and guest_web origins when an independently authorised server readback is supplied. It differentiates commit_uncertain, stored request, owner inbox confirmation and provider outbox state. Even an outbox marked delivered **does not by itself provide independent external delivery proof**, and a booking request does not become a confirmed appointment.

**Provenance limitation:** these are pure functions. A caller passing readbackAuthorized=true or a supposed server ledger does not authenticate those inputs; future handlers must supply facts from authorised server reads and never expose these functions directly as client-controlled proof.

## 3. Business Brain can reason from outcomes without inventing results

File: src/core/businessOutcomeIntelligenceV3218.mjs

A new bounded, tenant-scoped business rollup interpreter identifies a practical next review task when source-labelled, same-business counts show waiting enquiries, zero accepted enquiries, unconfirmed booking requests or visits without enquiries. No raw customer identity is required. It validates count ranges and conflicts, refuses another business's rollup, and labels conclusions as **hypotheses** rather than causal evidence.

It deliberately does **not** query metrics, execute suggestions, send replies, publish content, spend money, retrain an AI model, or aggregate across businesses. Owner cross-business data-sharing consent is recorded as a supplied state but does not activate any sharing. The underlying app must later supply independently verified, same-period server rollups before these recommendations are treated as grounded operational intelligence.

## 4. Industry-neutral shared website and Business App composition

Files:
- src/core/universalCustomerJourneyV3218.mjs
- src/screens/websiteAppHandoffReview.js

BUSY can prepare one explainable customer-action plan using the existing V3.216 owner-goal-first advice, current published Business App modules, owner-approved website handoff, and the still inactive website-native intake roadmap. All legitimate/novel business types retain an unblocked fallback. The composer requires one business across website and app, rejects mismatched tenants and never treats an unsupported module as working.

An optional **“How would BUSY connect my website and app?”** control now appears in the existing handoff review. This is advice, not an extra large onboarding screen, a site edit, a new module, a public website request form or an outbound action.

## 5. Testing, code health and deployment gates

scripts/check-builders-v3218.mjs adds **179 source-level assertions**, run in an isolated V8 compatibility harness. Coverage includes:
- conflicting/missing real-schema prerequisites; no ability to enable the website endpoint from an evidence flag;
- fresh/double/stale/replayed idempotency keys, mismatched payload hash, tenant, website, app version, approval and expired/consumed challenges;
- unknown write outcomes, verified Business App readback, scoped owner inbox and outbox evidence, failure to independently verify actual notification;
- missing/wrong-business/contradictory rollup evidence, no cross-tenant learning or provider actions;
- known and unusual industries, current published app modules vs private draft, public website native form remaining disabled;
- read-only SQL proposal having an intentional RAISE EXCEPTION, never placed in the live migration directory.

.github/workflows/builders-major-v3218.yml places this new test before V3.217, V3.216 and inherited request, architecture, security and staging checks. The workflow also includes **unsigned** Expo iOS/Android and standalone JavaScript exports, not paid signed device builds. This committed workflow is not proof that GitHub Actions CI, Postgres or real HTTP staging tests succeeded. No CI status success was independently confirmed while preparing this report.

## Activation gate — still mandatory

1. Examine the real isolated Supabase staging schema, current deployed request tables, owner memberships, published website identities, permissions/RLS, request_origin enum/check, challenge implementation and notification delivery infrastructure.
2. Design and review a concrete migration/rollback consistent with that schema; never run the draft SQL proposal. Include versioned notice approvals and explicit owner enablement, retention and deletion policies.
3. Create a server-owned challenge issuer with anti-abuse limits (Origin never authenticates the visitor). Implement atomic one-time proof consumption + uniquely scoped idempotent INSERT into the existing request table.
4. Extend the server receipt and owner inbox readback to the **new** website_native origin only with independent authorization; keep notification and independent diary/calendar proof separate.
5. Verify concurrent duplicates, stale app/website revisions, revoked notices, changed payloads, network timeouts, token replay, malicious origins, mixed-tenant attempts and retries in real HTTPS staging browsers and on mobile.
6. Require owner-approved publication after legal/privacy, accessibility, provider, cost and recovery checks. Unverified source-only parts must remain disabled.

## V3.219 recommendation

Implement the next substantial shared-database integration **against a verified staging schema**, including a migration-and-rollback readiness auditor, site-to-app version conflict recovery and provider outbox delivery reconciliation. Continue evidence-based Business Brain improvements and universal builder usability while maintaining the build-first, no-spurious-credits policy.

**North star:** You tell Busy what needs doing. Busy does it — properly, safely and with verifiable outcomes.
