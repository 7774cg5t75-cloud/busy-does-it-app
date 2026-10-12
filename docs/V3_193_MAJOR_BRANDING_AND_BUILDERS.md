# Busy Does It — V3.193 Major Builder Sweep: Distinctive Branding and Customer Journeys

## Owner direction

The initial five preset standalone-app colours were a **technical foundation, not an adequate final design offer**. This sweep materially expands owner choice with individual brand-colour support and connects the App Builder and Website Builder without sacrificing safe publishing boundaries.

**Development-only branch:** `v3.193` from verified `v3.192`. No paid model/image provider, hosted staging migration, live customer data operation, production deployment, app signing, or store submission.

## 1. Twenty fully coordinated palettes PLUS an owner's own colour

- Twenty named curated colour systems, including deliberately distinct dark and light palettes. Names, previews and selection use one finite source: `src/core/nativePalette.mjs`. Owner-facing browsing shows eight popular options at first; a button reveals all 20, keeping the main screen less crowded.
- A separate **My brand colour** input accepts exactly `#RRGGBB`. It is a bounded, owner-reviewed design value, not arbitrary CSS, code, remote fonts or URLs.
- Deterministic design tokens coordinate native page backgrounds, cards, readable text, supporting copy, lines and customer buttons. Contrasts are calculated and low-contrast choices adjusted rather than rendering illegible buttons. The brand-colour *accent* may therefore be lighter or darker than the submitted hex; the original hex remains the approved source of truth.
- Each native app's private configuration can now persist a `brandPalette` or custom `brandAccent` through the existing trusted `set_appearance` Edge action, preserving revision checks and requiring explicit approval. Source and Edge allowlists are byte-identical and validated by CI. The standalone native packaging descriptor validates a custom hex only in its matching `custom` mode, rejecting mismatched/injected values.
- The native standalone runtime reads both tokens; the marketplace customer-facing preview now displays the same branded identity header/accent strip from the shared palette system. They remain different runtime shells, but draw from **one visual identity**. Existing navigation, bookings, payments, galleries and business-specific layout logic remain independently controlled.
- The same source is copied into unsigned native prototypes. The app screen and Expo Snack import from `src/core` rather than the standalone template, avoiding divergent palettes and unresolved preview imports.

## 2. Standalone Business Apps: better service-to-customer actions

On a verified live native app, an approved public service can now open either:
- the existing **booking request** form with its service preselected, when the corresponding module is enabled; or
- the verified **enquiry** form with a short editable question about that service, when the enquiry module is enabled.

Both routes gate on the loaded exact published public app and supported modules. Neither automatically submits anything. The previously implemented challenge, anti-duplicate safeguards, customer data limits, approval boundaries and owner-confirmed booking model remain in force. Nothing advertises unverified real-time availability.

## 3. Website Builder: review an optional shared brand colour

The Website Builder now presents a **Match website colour to my Business App** review when a valid same-business app and site draft exist and the change would be meaningful.

The proposed colour is derived from the owner's current private App Builder appearance; the customer is shown a preview before approval. The controller recomputes it against the current app and website revisions at the exact approval tap. A different tenant, stale versions, changed colour or invalid source are rejected.

The operation changes **only** `website.theme.primary` in the private website draft, reusing the existing contrast-aware website design factory, website HTML regeneration and Undo/Redo. It never changes or publishes either public application, never overwrites text/pages/photos, never calls an AI provider, and does not force two distinct platforms to use the same templates.

## 4. Automated quality and remaining gaps

- `scripts/check-major-builders-v3193.mjs`: checks all twenty palettes and extremes of hex colours for AA-level token contrasts, rejects HTML/control characters/invalid values, tests trusted client/Edge equivalence, exact native packaging, public service enquiry/booking selection, same-business evidence and revision freshness, and contrasts of website buttons following a private brand edit.
- V3.192 and earlier builder/security checks remain required. `.github/workflows/builders-major-v3193.yml` runs all new+inherited checks and generates unsigned iOS/Android JS asset exports for Busy and standalone prototypes. GitHub Actions runner usage, if any, is subject to GitHub allowances, but external paid providers are **not invoked**.
- Calculated contrast is **not** an actual device accessibility audit. Identity colours do not guarantee distinctive visual composition on real websites/apps; page architecture, images, typography and layouts require further development and screenshots.
- Custom exact brand colour is an **owner-entered hex**. Automatic picking from logos/photos, polished multi-colour brand extraction, reliable store-installable mobile app production, complete real-device QA and live signed app operation remain pending.
- The next major builder sweep should deepen actual industry-specific native screens/editing, coordinated design details, and outcome-verified customer workflows. **V3.195** remains the planned full code organisation and architecture review.

## Product policy

Customers should have enough branded freedom to build a recognisably individual app; five fixed palettes are insufficient. Busy should offer guided presets **and** direct ownership of brand choices, coordinate the visual system, preserve safe contrast, make every change previewable and reversible, and keep real business/customer actions tied to approved, verified services rather than flashy demonstrations.
