# Busy Does It V3.143 — Visual website checks and photo-first mobile editing

## Customer benefit

The owner can tap an approved photo in the private website editor and **see the selected photograph**. On a hero or photo-feature block, “Choose another approved picture” expands a small image-backed chooser rather than immediately showing dozens of text-only buttons. The main photo, approved image replacement, crop, image fit and Undo/Redo continue to use the existing bounded private-draft operations. Preview sources are restricted to owner-approved `https://` or device-local `file://` image URIs; there is no web image search, raw user CSS or replacement by an unapproved URL.

The preview adds a simple button **“Check this page for layout problems.”** This briefly turns on a *separate, opt-in* inspection script in the local WebView. Its report is bound to the current page, draft generation and preview width; a stale or forged message is discarded. It scans the actual rendered HTML/CSS layout at that width for:

- Horizontally overflowing content;
- Images that did not load in the private preview (may be a preview/network limitation rather than a broken website);
- Missing photograph descriptions;
- Small tappable links/buttons;
- Broken on-page anchors and potentially clipped headings;
- Pages with no rendered sections or headings.

It shows plain-language suggestions without quietly changing the customer's wording, design, images, data or hosting. No AI credits or cloud calls are needed for the checker. The checker is **not an AI screenshot reviewer**, a replacement for accessibility audits, or proof that the hosted website will work. It is an extra bounded layout inspection before staging and human approval.

## Architecture

- `src/core/websiteVisualCheck.mjs` builds an app-owned, private-only inspection script and validates finite numeric metrics against an expected page/revision/viewport key. It rejects arbitrary scripts in the source HTML and oversized or malformed bridge messages.
- `src/screens/websiteBuilder.js` enables JavaScript only in explicitly requested tap editing or inspection mode, and never for the normal static preview. Changing page, preview width or generation clears the report. The signed hosted preview remains JavaScript-disabled. Public and exported website HTML do not contain the inspection bridge.
- `src/screens/websiteTapEditor.js` shows owner-approved local images in compact mobile-friendly controls. Replacement remains a manual selection of an existing approved business asset and does not publish.
- `scripts/check-website-visual-inspection-v3143.mjs` asserts guardrails, stale-message rejection, source wiring, and safe photo previews.
- `scripts/check-website-visual-browser-v3143.mjs` runs the actual website renderer in Playwright Chromium at 390px, 768px and 1440px and verifies its inspection report against actual document geometry and loaded controlled owner-photo fixtures. It deliberately injects a bad page with a clipped heading, too-wide layout, broken image, unlabeled photo, tiny target and broken anchor to verify detection.
- `.github/workflows/website-visual-preview-v3143.yml` runs these with V3.138–V3.142 source regressions, other browser tests, and unsigned iOS/Android JS bundles. The production foundation workflow retains the quick V3.143 safety check.

## Limitations and next work

A source/CI success is **not** signed iPhone acceptance, production deployment or proof of professional visual design quality. Actual screenshot-based review and safe before/after repair cycles across different businesses require a browser capture, evaluated screenshot and recheck in future sweeps. The current pass is diagnostic, not a publishing gate: the owner must still prepare and inspect the exact hosted preview and give separate approval. Real-device testing must also cover local vs privately backed-up photographs, permissions, very small iPhones and large text accessibility settings.

No signed device build, live domain change, public publish, storage migration or paid AI call occurs in this source sweep. Keep developing the website builder before tackling the intelligent app builder.
