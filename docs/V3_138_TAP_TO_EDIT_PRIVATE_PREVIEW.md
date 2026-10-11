# Busy Does It V3.138 — Tap-to-Edit Private Website Preview

## Goal

Make editing feel familiar on a phone: turn on editing in the private website preview, tap the specific element, make one deliberate change, see it in the refreshed draft and use Undo/Redo. Keep the customer-facing navigation simple. Work from V3.137; the builder remains our priority for future sweeps.

## Implemented in source

1. **Opt-in private preview edit mode.** The website draft preview has a "Start editing by tapping" control. Ordinary browsing keeps WebView JavaScript disabled. The owner can explicitly turn on interactive selection. The independently signed hosted preview remains non-editable, with its original JavaScript-disabled sandbox.
2. **Exact HTML element selection.** The private renderer annotates currently editable headings, body copy, service/FAQ/testimonial items, button wording, phone/email/opening hours, hero/approved gallery photos and photo-plus-text blocks only when `editablePreview:true`. Normal, hosted and ZIP HTML generation receive no editor markers, script or bridge.
3. **Bounded WebView bridge.** A static app-owned script highlights the tapped element, suppresses clickable CTA navigation during editing and posts only field and section identifiers. The native code verifies the current page, visible unique section, item ID, supported field and gallery photo index. It never accepts a supplied URL, HTML, CSS, publish instruction or credential from a page message. No external website is loaded by tapping its CTA.
4. **Plain-language editor panel.** A modal opens immediately for the selected element. Customers enter exact wording or pick from their previously approved image library. Supported visual photo controls: choosing an approved main image, substituting an approved photo in photo-plus-text blocks, adjusting main-photo focus/size, moving a gallery picture earlier/later, and confirmed gallery removal.
5. **Existing private-draft safeguards reused.** Text changes pass through `applyStructuredWebsiteEdit`; approved photo changes pass through `applyWebsiteLayoutChange`. Both use the same controller-level bounded Undo/Redo history. No AI call, public publication, live-site changes or cost arises from selecting or editing a field. Publishing still requires an explicit reviewed hosted version.
6. **Mobile/desktop regression:** the V3.138 Node contract tests exercise the real draft renderer, item and business boundaries, field correctness, immutable photo operations and publish restrictions. An independent headless Chromium test physically taps fields at 390px and 1440px, verifies the bridge events and ensures no navigation to a CTA destination or horizontal overflow. The workflow also runs earlier website regressions and unsigned iOS/Android JavaScript exports.

## Scope boundaries and open work

- This is **source-complete pending verified CI and real-device acceptance**. It is not a claim of a live production, staged cloud, or signed iOS/Android app deployment. Nothing in this sweep modifies production database records, public sites, DNS or paid AI services.
- Tapping selects elements that have been instrumented. It is **not yet arbitrary drag-and-drop/pixel-perfect editing**, and not every element (navigation labels, footers, backgrounds, bespoke interaction widgets) is selectable. Missing, unpublished, local-file-only or unapproved photos might not appear in this preview; their library workflow is separate.
- A successful native JavaScript export proves only source bundling; actual iPhone/Android WebView tap behaviour, modal keyboard ergonomics, gallery controls and photo rendering still require later signed-device testing.
- Offline static ZIP export remains limited to HTML/static styling/approved available photos. Bookings, forms, payments, hosting and domains do not move with the ZIP.
- Next sweeps should improve on-page selection guidance, safe per-page styling, richer block editing and stronger real-site page/media parity, before expanding to the intelligent app builder. Avoid adding clutter to the main Home screen.

## Evidence

- `scripts/check-website-tap-editor-v3138.mjs` — real renderer, item/section validation, safe draft mutations, regression safety.
- `scripts/check-website-tap-browser-v3138.mjs` — actual browser tap behaviour at small and desktop widths.
- `.github/workflows/website-tap-editor-v3138.yml` — dedicated test job, previous checks and native JS export checks.
