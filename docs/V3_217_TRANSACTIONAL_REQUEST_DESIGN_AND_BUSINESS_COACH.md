# Busy Does It V3.217 — Transactional Customer Journey Design and Intelligent Owner Guidance

**Base:** v3.216. **Implementation:** private owner-reviewed website form specification, dry-run server transaction contract, existing Business App receipt reconciliation, deterministic Business Brain prioritisation, static responsive checks, source-only regression suite. **No live public website-native form, database migration, Edge endpoint, paid AI call, notification, signed device build, or published website update.**

## 1. One real request infrastructure — not another customer database

V3.217's future website-native workflow is deliberately designed to use the **existing Business App request and owner inbox**. The canonical in-code guest path currently calls busy_mini_app_create_guest_request using an existing mini-app guest challenge, then server-reads busy_mini_app_requests and evaluates the shared V3.213 receipt proof. It reports saved state and notification state separately.

**Do not call that guest RPC from a website-native submission**: the current RPC expects a mini-app guest challenge, and the existing saved-receipt proof recognises only the signed-in and guest_web origin channels. A real website-native path requires a reviewed, distinct website origin/challenge contract, source-bound idempotency uniqueness and a new atomic server-owned adapter; this should still write into the existing shared requests/inbox rather than creating an independent website customer database.

### New dry-run server adapter

Path: supabase/functions/busy-website-request-intake/requestTransactionDesignV3217.mjs

- Reuses V3.216's bounded visitor preflight only after a future server independently resolves the exact published website, deployment, approved form configuration and one-time challenge. The preflight is not itself authentication and cannot attest database provenance.
- Additionally requires an exact same-business published Business App and immutable live version, enabled request module and currently supported service. The owner-approved future form binding must reference the **same exact app and published version**.
- Plans the six separate stages: resolve facts, verify challenge/limits, atomically claim challenge and source-bound idempotency + save, independently re-read, surface in owner inbox, reconcile notification/outbox. Every stage remains **implemented:false** and execution authority is always false.
- Explicitly disallows creating native website requests using the unchanged mini-app guest RPC. No payload, contact details, payment data or visitor token is included in the returned transaction design.

### No live activation

There is **no** supabase/functions/busy-website-request-intake/index.ts. No new database table, public API handler, credentials, RPC, migration or live customer request was added. A positive design response is NOT a committed request or an approved publication. It merely means provided in-memory examples satisfy a constrained contract. Live database provenance, atomicity and retry safety are still unverified.

## 2. Owner reviewed private website form

Paths: src/core/websiteFormApprovalV3217.mjs and src/screens/websiteFormSpecReviewV3217.js

- A draft specification is pinned to the signed-in business, private website ID and generation and an exact current deployment candidate when one is known. The form never inherits public authority from a private draft.
- Supports two explicit request kinds: enquiry and booking request. Requires name, either email or phone, and the relevant message or service; rejects unexpected fields and duplicates. For booking requests, proposed services must be owner-authored and bounded.
- The owner can *locally* draft processing purpose, privacy notice and retention days. Missing information fails readiness. A second comparison refuses an unchanged-review claim after any business, generation, deployment, fields, purpose, notice or retention change.
- **This does not approve or store a privacy notice, process customer consent, certify GDPR compliance, persist any record or activate forms.** Real owner/legal approval, a server-owned immutable notice revision and a final publish confirmation are later steps.
- A small opt-in panel sits inside the existing Website Builder handoff review. The interim owner-approved Business App link remains available.

## 3. Honest request outcomes and retry recovery

Path: src/core/customerJourneyEvidenceV3217.mjs

- Reuses the V3.213 saved-request validator solely for the existing **Business App guest_web** records when a future authorised caller supplies an independently read-back record with exact business, app and request IDs. A public website click is NOT a website-native submission.
- Rejects native-website origin claims, wrong tenant/app, absent readback or signed-in origin mislabelled as guest. An uncertain write suggests **checking the existing receipt**, not creating a duplicate. A positive Business App readback never proves independent calendar confirmation, a delivered owner notification or a customer reply.
- **Provenance warning:** this is a pure validator. A caller setting readbackTrusted=true does NOT authenticate or fetch the record. It must only be invoked with rows independently queried inside an authorised server path. It is not connected to a public route or currently shown as a real customer outcome in the app.

## 4. Better advice with explicit proof levels

Path: src/core/businessJourneyCoachV3217.mjs

- Prioritises a genuine same-business/same-app verified guest request for owner review; otherwise accurate contact information, then an owner-reviewed handoff to an existing published module, or help configuring an app module.
- Combines the current business brief and V3.216 owner-intent-first industry-neutral advice. It refuses to treat an app draft, unknown business type, screen mock or client-supplied receipt claim as a completed customer journey.
- Advisory only: no autonomous send, no new publishing authority, no cross-business learning, no expensive AI calls.

## 5. Responsive, readable forms

Path: src/core/customerFormResponsiveV3217.mjs

- Provides a low-cost estimated phone/tablet/desktop form layout contract, visible labels, 48px targets, keyboard access, full-width long fields and an explicit booking-is-only-a-request statement. Keeps customer consent unchecked.
- Output identifies screenshots, screen reader coverage, actual browser tests and colour contrast measurements as **not performed**. The owner-facing form preview displays this distinction rather than claiming a visual audit.

## 6. Regression scope and result

scripts/check-builders-v3217.mjs adds **169 focused source-level assertions**, run independently in an isolated V8 harness using a minimal URL shim. They cover private ownership and generation changes, consent/retention, illegal fields, exact site/app/version matches, cross-tenant submission denial, stale module and service, replay/consent failures, app-only saved receipt readback, uncertain writes, booking-vs-calendar distinction, business recommendations, and estimated responsive layouts.

.github/workflows/builders-major-v3217.yml includes this script BEFORE the V3.216 suite and all inherited architecture, security, request receipts, staging checks and unsigned iOS/Android JavaScript export tasks. **The V8 checks are not a replacement for real Node/Expo CI; full CI and staging have not been independently confirmed.** No paid native build was requested.

## 7. Staging activation checklist (still mandatory)

1. Verify exact deployment provenance, owner permission and current published app/module in isolated staging with real accounts, including tenant isolation and rollback.
2. Design and review a versioned server-only approval/consent schema, approved notice revisions, retention rules, safe form field allowlist and explicit owner enablement. Draft notices are not legal approval.
3. Implement an actual challenge issuance, browser controls and abuse limits suitable for published HTTPS websites. Origin alone never grants auth.
4. Implement a **new atomic website origin RPC** that conditionally claims its one-time challenge and unique business/site/deployment/source/idempotency key, writes one request in existing storage and returns one ID with durable retry semantics.
5. Extend the existing server receipt proof for the new origin only after the transaction and owner inbox linkage exist. Separate save status from owner notification/outbox and actual booking diary confirmation.
6. Test both successful and interrupted requests in real browser and device environments, including keyboard, screen-reader, accessibility, privacy and rate-limit failures. Test rotated app versions and revoked owner consent.
7. Only with explicit owner review and deployment gates may the customer-facing form become active.

## Proposed V3.218 focus

Implement a **versioned, source-only migration/RPC design** with idempotency and approval lifecycle invariants plus prepared isolated staging integration tests, while continuing shared business capabilities, visible Business Brain reasoning and the universal builder. Never deploy a new endpoint or claim successful public enquiries until real staging proves the complete transaction.

**North star:** You tell Busy what needs doing. Busy does it — and verifies the actual result.
