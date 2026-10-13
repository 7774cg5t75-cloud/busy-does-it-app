# V3.210 — Universal Builder Intelligence 1.0

**Base:** v3.209. **Target:** v3.210. **Development policy:** substantial build-first sweep, inexpensive offline checks. No live migrations, Edge deployments, external AI usage, signed device builds, real customer traffic, purchases or site/app publication.

## Permanent product ambition

Any legitimate business should be able to describe a website or app it wants without selecting a predetermined industry. Busy should build from reusable business capabilities, discover missing dependencies, and tell the owner honestly when a function needs implementation, an external service or real verification. The permanent policy lives in the repository's root ARCHITECTURE.md.

## 1. Shared capability inventory

The new source module src/core/universalCapabilityCatalogV3210.mjs declares **27 versioned feature contracts**. They cover existing website draft sections and controlled Business App modules plus requested future capabilities such as availability, bookings, payments, deposits, accounts, commerce, subscriptions, memberships, uploads, competitions, event tickets and custom functionality.

A website SECTION is a supported draft-rendering element, never proof of a real transactional service. An app MODULE is a known controlled runtime component and still requires business-scoped catalogue confirmation. Other features are explicitly GUARDED or PLANNED and must never be presented as working.

Each contract includes dependencies, website/app mappings, owner-approval requirements and relevant provider/financial risk flags. It can be expanded without imposing industry whitelists.

## 2. Industry-neutral natural-language requirement planning

The new pure module src/core/universalBuilderPlanV3210.mjs interprets bounded ordinary-language customer goals with no external AI provider call. It is deliberately deterministic, transparent and not a general model-based builder yet.

For example, a caravan park asking for available pitches, booking requests, deposits and confirmation emails receives a plan distinguishing supported app booking-request components from unimplemented availability, payments and provider-confirmed delivery. A photography contest asking for accounts, uploads and voting surfaces the unimplemented access and abuse protections. Unknown requests are marked for bespoke design, never refused because the industry is unfamiliar.

Plans include a safe, dependency-aware sequence, website/app status for each capability, specific missing-development features, current private source draft IDs/revisions and explicit all-live-outcomes-unverified flags. The planner fails closed when draft context lacks a business workspace or conflicts with another business. It does not create executable source, customer requests, payment attempts or public deployments.

Controlled app modules must appear in the current business-scoped available catalogue, preserve booking confirmation and enquiry action contracts, and satisfy valid private-draft navigation. An offers module does not count as configured without approved owner terms. Status does not imply tested provider delivery.

## 3. Website composition and owner control

The planner can prepare an alternative section priority order using ONLY existing, enabled website sections and the owner's current requirements. It respects owner-authored section-order preferences; it never creates missing pages/features, reorders or publishes the original, or claims improved usability without a real visual comparison.

The existing private website layout editor and undo/approval route remain the only way to apply changes.

## 4. Shared owner-facing UI

New src/screens/universalBuilderPlanReview.js is imported into both src/screens/websiteBuilder.js and src/screens/miniApps.js. The UI remains collapsed until requested, then allows a typed requirement and returns honest per-surface support levels, underlying dependencies and optional private section-order suggestions.

No customer message, booking or payment is sent. Nothing is automatically enabled or published. No provider or paid AI credit is consumed. The report invalidates on workspace, business type or private draft revision changes.

## 5. Automated verification

New scripts/check-builders-v3210.mjs covers contract integrity, real app-module mappings, dependency closure, unfamiliar business types, multi-goal examples, section ordering and owner overrides, disabled/unsafe modules, approved offers, wrong-tenant and missing-tenant rejection, and actual two-builder source wiring.

The new .github/workflows/builders-major-v3210.yml includes this script before inherited builder, security, staging preflight and production checks, as well as unsigned JS exports for Busy and the standalone prototype on iOS and Android. No signed device build is requested.

**Limitations:** Pure-code checks are not proof that GitHub Actions passed, that paid integrations work, or that real users can successfully complete every journey. Real availability, customer accounts, payments, e-commerce, complex membership systems and arbitrary custom applications remain future engineering work, not functionality released by this sweep.

## 6. Next foundation steps

Continue building reusable server-owned workflows with tenant and transaction safety, capability-driven website/app composition, controlled owner-approved private edits, before/after real screenshot quality comparisons and Business Brain evaluation loops. Keep meaningful work underway before transitioning into full hands-on paid testing, consistent with the permanent architecture policy.

**North star: You tell Busy what needs doing. Busy does it.**
