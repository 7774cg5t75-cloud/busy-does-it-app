# Busy Does It V3.216 — Website Intake Preflight and Connected Business Intelligence

**Base:** v3.215, new branch v3.216. **Status:** source implementation and adversarial offline tests only. No migration, customer request, public endpoint, hosted deployment, owner consent record, paid AI calls, provider notification, signed build or store operation.

## Outcome and intent
Continue the permanent universal business website/app architecture. Reuse existing Business App guest requests, atomic save RPCs, owner inbox and V3.213 receipts; **do not introduce a second website customer database**. V3.216 adds an independently testable pre-commit boundary that a future *native* website form must satisfy before any public write is considered. An owner-approved website→Business App handoff remains the interim supported in-source route from V3.215.

## 1. New future server intake guard (inactive)
Path: supabase/functions/busy-website-request-intake/siteOriginGuardV3216.mjs.

- A public visitor cannot send businessId, websiteId, approval flags, app IDs or deployment authority. Unknown or missing request metadata fails closed. Each future request has exact source-origin, allowed request type, approved consent revision and a bounded idempotency token.
- Only **server-fetched** published website, current live deployment, same-business owner-approved form configuration and single-use verified challenge records can reach the pure preflight. Published deployment and approval IDs must match exactly across rows, and deployment status must be live.
- An HTTPS Origin is parsed and matched exactly against the independently retrieved current deployment, but **Origin alone never authenticates a user**. Actual abuse limits, fingerprint/proof challenge issue/verification, atomic challenge consumption, transaction retry uniqueness and signed server readback must be implemented in the future server route.
- Visitor field names and size limits are bounded. Enquiry needs name, email-or-phone and message. Booking requests need name, email-or-phone and an owner-approved service. Unknown fields, oversize input, unrecognised actions and inconsistent consent are rejected. Preflight deliberately returns **no visitor PII**.
- The guard **always** returns mayCommit: false, mayIssueReceipt: false, publicEndpointActive: false, bookingConfirmed: false, providerDelivered: false, even when its input checks pass. It does not call a database or provider. An ok: true response means **preflight shape validated under assumed server-read provenance**, not that the request was saved or the facts were independently fetched.

**Critical caveat:** No index.ts or deployed busy-website-request-intake endpoint exists. The module must never be treated as an auth service or as independently proving the origin/approval/challenge rows. A future authenticated server handler must load all of them without trusting public input, and an atomically safe database operation must decide whether a request is committed.

## 2. Owner planning and simple UX
- src/core/websiteIntakePlanningV3216.mjs builds an industry-neutral, read-only proposed field list and staged checklist from V3.215 evidence. A delivery proof can mark only the *source-check* for the exact published deployment, never public browser verification or a submitted request.
- src/screens/websiteAppHandoffReview.js, already nested in Website Builder, exposes the plan only on request. No large new setup page. It explains missing safeguards, required notice/consent, full-width controls, visible labels and minimum touch targets; it keeps the existing owner-approved Business App handoff visible.
- The current Contact section does not gain an unverified native form. No live website, app or private draft is mutated by the planning panel.

## 3. Reusable business capability intelligence
- src/core/customerCapabilityAdviceV3216.mjs suggests a practical first customer action for hospitality/appointment businesses, trades, retailers, events and arbitrary/unknown industries, with a safe generic fallback.
- Suggestions are **not** app entitlements or active capabilities. They distinguish a potentially available catalogue module from an actually enabled published module; a separate live version check is still necessary before handoff or publication.
- Existing Brand DNA/website business brief informs the Website Builder guidance without customer data, third-party AI requests or extra provider credits. Future outcome-feedback learning must use verified real receipts and consent, not fabricated success labels.

## 4. Shared customer lifecycle
src/core/sharedRequestJourneyV3212.mjs adds future website requirements to the existing server-owned request contract: exact site-origin server resolution, approved privacy, single-use challenge with transaction-safe consumption, idempotent receipts and independently verified notification state. It **explicitly keeps** websiteIntakeEndpointActive and websiteNativeRequestReceiptVerified false.

Booking request ≠ booked appointment. Inbox saved state ≠ customer or owner notification delivered. The existing app receipt/booking constraints remain authoritative.

## 5. Testing and branch policy
scripts/check-builders-v3216.mjs adds 274 source assertions across wrong tenant, fake browser business identity, recycled/stale deployment, missing approval, origin mismatch, consent version, challenge replay, expiry, abuse-limit denial, bogus service, excessive input, unknown industry, owner guidance, source-only proof distinctions and real/no-live state invariants. These were additionally exercised with a lightweight isolated V8 compatibility harness; **that is not a substitute for running real Node or Expo**.

.github/workflows/builders-major-v3216.yml runs new V3.216 tests before inherited V3.215 and earlier suites, security/staging/architecture checks, and unsigned iOS/Android Expo exports, using GitHub Actions rather than paid signed device builds. GitHub Actions results must be checked; file presence is not evidence CI ran.

## Outstanding activation gate — do not skip
1. Owner-approved site form configuration stored with immutable deployment/version scope, consent wording, retention and data protection review.
2. An actual server route that independently resolves site ownership and active deployment, verifies rate limits/challenge, never uses client-supplied tenant authority, and atomically consumes the proof.
3. Reviewed database changes/RPC that implement unique source-bound idempotency, durable inbox handoff, and server readback of saved receipt and request status.
4. Honest post-commit uncertainty handling with separate outbox/provider notification and real owner inbox, calendar and booking acceptance checks.
5. Isolated staging migration and full public HTTPS browser test (mobile/tablet/desktop, keyboard/screen readers), cross-business isolation, replay, throttle and failure recovery.
6. Owner approval for publication and explicit evidence marking exactly what has been independently verified.

## Next natural sweep
V3.217 can advance the **private approval schema and server-side adapter design**, maintaining the inactive state until migrations and real isolated staging are approved. Continue universal capability composition and measurable visual evaluation in parallel.

**North star:** You tell Busy what needs doing. Busy does it — properly, safely and with evidence that the job was completed.
