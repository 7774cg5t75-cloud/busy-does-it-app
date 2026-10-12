# Busy Does It — V3.190 Advanced Builder Intelligence & Functional Completeness 1.0

Development branch: `v3.190`, created from verified `v3.189`. This is a build-first, low-provider-cost development sweep. **No paid AI calls, hosted staging installation, production change, customer message, payment, mobile signing or App Store submission.**

## 1. Standalone App Builder: real owner-approved public content

A native app linked to the exact published Business App version can now display two more finite modules:

- **Offers:** `publicNativeExtrasV3190.mjs` exposes at most 12 approved offers, only if the Offers module is enabled, the offer has a title and published terms, and its ISO date window is active on the server's UTC date. It exposes no arbitrary offer object properties, coupon secrets, unpublished drafts, customer records or payment actions.
- **Loyalty programme information:** only the programme name, reward wording, target and terms are exposed when configured in the published version. It shows **no personal stamp progress**, cannot issue rewards and cannot redeem anything.

`publicNativeProjection.mjs` now includes these server-filtered public fields. The standalone native client validates the returned shapes and immutable live version before displaying them. The native UI displays useful descriptions rather than pretending that payments, loyalty tracking or redemptions are live.

## 2. Standalone App Builder: services lead to booking requests

The native Services screen now offers **Request [approved service]** when the published app has an enabled booking-request module. This opens the existing real guest-request form with that public service name prefilled. The customer still chooses whether to submit. Sending still uses the protected challenge/submit service and cannot confirm a calendar appointment or charge anything automatically.

## 3. Website Builder: owner-created collection editing

The direct website editor now supports adding and removing owner-written service and FAQ entries, as well as editing existing text.

- Inputs use bounded plain text, unique names, generated stable IDs and private draft regeneration.
- Removal is two-stage and compares the selected entry's exact identity and title, refusing stale removals.
- Each action uses existing private draft Undo/Redo, not an immediate publish.
- Collection edits mark the section as owner-edited. A later Brand Brain regeneration **preserves those chosen entries**, including removals, instead of silently reverting them. Unedited collections still follow the new approved brief.
- Existing direct field editing, custom pages, imagery and publish approvals remain separate.

## 4. Quality checks and cost boundaries

- `scripts/check-builders-v3190.mjs` tests server/public projections, unavailable and expired offers, content sanitisation, live-version isolation, native readback validation, service booking navigation markers and direct website editing.
- The established `scripts/check-website-direct-edit-v3133.mjs` now also tests the generated private HTML and owner FAQ persistence across regeneration.
- `.github/workflows/builders-functional-v3190.yml` runs those plus prior native, website and security regressions, syntax parsing and four unsigned Expo exports. This does consume GitHub Actions runner time, though **it does not call paid external AI, transcription, screenshot or other provider services.** GitHub plan usage should be monitored.
- The source-level intelligence inventory includes these concrete new builder capabilities. Static source wiring, native exports and passing tests **do not prove usability, store distribution, customer conversion, actual device delivery or real paid service operation**.

## Remaining builder-development opportunities

1. Richer owner editing of services, photos, calls to action, menus, app screens and business-specific modules, with clear reversible approvals.
2. Native booking-date selectors, better enquiry/booking drafts and offline/poor-network resilience, while preserving server authority.
3. Complete, isolated, server-verified entitlement-based standalone packaging, customer-owned signing accounts, store release/review and independent update maintenance; exports today are **unsigned JS assets**, not installable apps.
4. Extend website editor scope to absent/new whole sections and coordinated multi-page changes, avoid inconsistent copies and improve adaptive responsive visual reviews.
5. Implement an owner-permissioned, measured AI design loop with explicit credit caps and actual screenshots once the build-first phase ends.
6. Final staging install approval, authenticated end-to-end journeys, signed iOS/Android and browser/device testing remain pending.

## Position

V3.190 adds useful **customer-facing functionality and editorial control**, not just design scores or another theoretical engine. The two builders remain pre-release; proceed with further low-cost development sweeps until substantial functional gaps become rare, then spend deliberately on comprehensive staging and real-device/provider tests.
