# Busy Does It V3.212 — Shared Customer Request Intelligence

**Base:** V3.211. **Scope:** connected website/app request design, an evidence-limited shared lifecycle contract, owner-approved private contact-button improvement, test coverage and architectural documentation.

**No production/staging migration, external provider deployment, paid signed iOS build, real customer data write, payment, outbound message, or website/app publication.**

## What this sweep adds

### 1. One request model for two different builder surfaces

A new pure module, src/core/sharedRequestJourneyV3212.mjs, reviews **enquiries** and **booking requests** across a current same-tenant website and Business App.

It explicitly distinguishes:
- A website with recorded public contact details and a hero anchor, versus a website with a **verified transactional enquiry/booking submission endpoint**. These are NOT the same thing.
- A Business App that has a known, enabled, business-scoped request module with valid current navigation, versus a published customer request proven to be saved in a database.
- A booking **request** versus independently confirmed availability and a confirmed diary appointment, receipt or delivered notification.
- The status rules already implemented in appRequestLifecycle.mjs versus a real server-authenticated request record.

The request review uses the existing validPrivateBuilderPair and appRuntimeScreenSchema/approved business-scoped module catalogue. Booking module provider metadata must preserve business confirmation; the enquiry module must advertise a customer action. A missing contact route, empty services, invalid navigation, unavailable module, wrong tenant or stale private revision produces explicit release gaps. Neither raw customer records nor owner business copy are returned in the small evidence report.

### 2. Evidence states are not interchangeable

The new requestTransitionEvidence adapter uses the existing appRequestJourney and decideAppRequestTransition finite state rules, but deliberately **demotes every synthetic state to unverified** for any caller. Even when an example includes accepted + booking_confirmed, only hypotheticalRuleWouldConfirm may be true; the returned journey never asserts actual confirmation, customer receipt, message delivery or owner response.

This prepares a reusable validation and status-explanation contract for future real website enquiry intake and booking workflow adapters. It is not itself a public API endpoint, authenticated receipt query, webhook, database table, mail sender or appointment transaction.

The V3.210 universal capability catalogue and planner now carry matching metadata for customer request type, authoritative stored-receipt requirement, and (for bookings) independent diary confirmation, so **both builders consistently disclose the same limits**.

### 3. Coordinated customer journey UX without more settings

The existing Business Brand DNA panel in **both website and app builders** now has an optional "Check enquiry and booking journeys" review under its existing website/app continuity check. It explains actual website contact status, app runtime readiness, specific missing tests, and static narrow-phone/phone/tablet app navigation risk.

The mobile and tablet results are rule-based projections from the existing shared app responsive engine; **no real screenshot, physical device test or measured desktop website comparison was performed by this sweep**.

### 4. One owner-approved private website design improvement

When the same-business private review confirms the website has recorded public contact details AND its existing hero button already points to the Contact section, the owner can choose "Make my existing contact button easier to spot". This reuses the existing website private appearance editor and undo stack; it changes the existing safe CTA emphasis token, not URLs, content, payments or request forms.

The owner approval also rechecks the current website ID, generation and authenticated business workspace in AppController before accepting the edit. The published website is never changed automatically. Any stale workspace/version or missing contact route fails safely.

### 5. Automated checks

New scripts/check-builders-v3212.mjs covers both request kinds, wrong-tenant and stale drafts, real server catalogue requirements, public website contact versus a real request, booking confirmation integrity, untrusted synthetic state demotion, status transitions, owner facts, static app layouts at 320/390/820 logical points, private safe-CTA actions, and actual UI/controller wiring.

The branch workflow .github/workflows/builders-major-v3212.yml inherits V3.211/V3.210 and other existing checks, static security/staging preflights, syntax parsing and unsigned iOS/Android JavaScript export for Busy and the standalone prototype. **Passing focused checks is not proof that full CI succeeded or that real customer journeys work.**

## Outstanding milestones and next integration priority

1. Design and implement the real reusable server-owned public website enquiry intake only after reviewing provider capabilities, abuse controls, tenant/site origin routing, CSRF, consent/privacy, idempotency, rate limiting, and a transactional request+receipt write path.
2. Bring website booking requests through the SAME state-transition and diary confirmation safeguards as supported Business App flows; use shared authenticated request IDs and owner inbox/replies rather than making parallel provider records.
3. Re-evaluate and validate the exact saved website/app revisions when the owner approves any future public functionality or cross-surface data transfer, not only at the presentation layer.
4. Advance measured mobile/tablet/desktop screenshot-based design quality, compatible section/CTA improvements and Business Brain learning from verified outcomes. Static rules are a starting point, not independent outcome proof.
5. Continue the agreed substantial multi-feature **build-first** development cadence, cheap automated tests every sweep, deeper periodic architecture audits, and an explicit transition to expensive manual/staging testing only when meaningful theoretical improvements diminish.

**North star: You tell Busy what needs doing. Busy does it — and verifies the result.**
