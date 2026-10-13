# Busy Does It V3.209 — adaptive builders and consistent customer journeys

**Base:** V3.208. **Scope:** source code, private draft guidance, offline regression tests and unsigned JavaScript exports. No migration, Edge deployment, customer traffic, website/app publishing, paid provider call, signed binary or app-store submission.

## 1. Website designer: distinct, grounded compositions

The shared native and hosted website design planner now recognises creative, retail, learning and events as distinct business sectors, alongside existing nature, hospitality, wellness, professional and trades. It selects from already supported visual families, with deterministic within-sector variation of palette, hero, cards, ornaments and typography instead of forcing unrelated firms through generic layouts.

- Portfolio/photo-first sections depend on the rendered site's actual real-photo evidence, not invented stock assets.
- Gallery-heavy creatives, product-led shops, real FAQ-heavy instructors and event businesses can put their genuinely present material earlier.
- Sparse drafts keep focused architecture; meaningful multi-page structures still require recorded content.
- Previously owner-selected themes, section order and draft-only edits retain their existing approval and version checks.
- The website alternative chooser shares the real design planner's sector and approved-photo rules, avoiding inconsistent family recommendations.
- New visual sector colours are part of the same safe CSS palette engine.

These are evidence-limited deterministic design choices, not a guarantee of screenshot quality or customer conversion.

## 2. Business App: appropriate modules without invented capability

The Business App planner considers these additional customer journeys and restricts its recommendations to the server catalogue's supported available modules. The selected app configuration provides current owner-supplied public details and offer terms. An unapproved gallery item, missing usable photo URL, unavailable module or unapproved promotion cannot quietly become a suggested working feature.

The builder shows a succinct reason for its layout and names any missing approved photos or offer terms. Booking requests remain unconfirmed until the actual business confirms; enquiries still need live submission and follow-up proof. Nothing enables a module, books a customer, charges a payment provider or publishes a draft. Marketplace and standalone delivery still require separate owner-approved distribution steps.

## 3. Private website and app journey consistency

A new version-scoped same-business review checks only the two existing private drafts and a bounded allowlist of facts. It looks for different business names, completely mismatched service names, contact/enquiry gaps, a potential booking-request handoff and possible approved-image reuse. The report contains counts and owner review suggestions, not customer data or raw business copy.

The existing Brand DNA section in **both** builders has one optional check button. It does not transfer content, copy photos, enable features or edit/publish anything. An explicitly wrong workspace, missing or invalid draft revision, and invalid enabled-navigation combinations fail closed. A locally valid revision is not independent server-side freshness proof; a future owner-approved edit must still recheck the server's current revision.

## 4. Automated tests and checks

New offline V3.209 regression script covers:
- Actual renderer palette-sector agreement and deterministic design;
- Creative gallery, instructor FAQs, sparse and explicitly unapproved-image cases;
- Approved hero images, owner-rejected alternative preferences;
- More varied app sector plans, unavailable modules, missing photo and unapproved-offer safeguards;
- Tenant mismatches, stale and invalid draft combinations;
- Source wiring in both builder screens.

The new V3.209 GitHub Actions workflow includes these plus V3.208 and older builder regressions, existing staging safety and production preflight checks, source syntax validation, and unsigned iOS/Android JavaScript exports for Busy and the standalone prototype.

## 5. Deliberate build-first approach and remaining limits

We have **not** reached the point where builder improvements are merely speculative or cosmetic. Continue substantial improvements with inexpensive automated verification. Do not spend on broad hands-on testing or paid builds until the website and app builders have reached theoretical maturity and diminishing returns.

Isolated staging still needs a separately reviewed and authorised database/Edge deployment. Real signed-in two-tenant journeys, live bookings, push/email receipts, screenshots across actual devices, app-store packaging and practical accessibility testing remain open milestones. Source-only checks must never be misrepresented as real customer outcomes.

**North star:** Busy should be distinctively capable, simple to use and honest about what is merely planned versus independently completed.
