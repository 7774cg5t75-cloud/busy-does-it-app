# Busy Does It V3.139 — Individual Website Section Design

## What changed

This sweep improves the V3.138 tap-to-edit website builder with **independent controls for each visible section**. A business owner can tap a heading, description, button or approved photograph in the private preview, then open the optional "Change how this section looks" controls. Existing word/photo changes remain available; the new design controls are collapsed until requested.

The owner can change one section's heading size, text alignment and vertical space, choose the crop of an approved image, put an existing photo-and-text section's image on the other side of its copy on desktop, and switch between three gallery tile sizes. Defaults return to the original brand-specific website style. The owner may restore the selected section's original styling without resetting any other page or section.

All changes use the **same existing reversible private-draft operation** as earlier owner edits. They do not publish the site, consume AI credits, change business facts or fetch unapproved images. Mobile stacking overrides desktop left/right placement to avoid narrow-screen layout breakage.

BUSY now also interprets limited **explicit named-section** requests, such as "make the services heading larger", "centre the about section", "give the contact section more space" and "make gallery photos bigger". It deliberately does not guess what "that section" refers to; the tap editor uses an exact selected section ID.

## Engineering and safety

- `websiteLayoutEditing.mjs` allowlists a finite set of style fields and permitted values. The controls never accept raw CSS/JavaScript, arbitrary photo URLs, HTML or free-form DOM manipulation. Appearance metadata is stored only on the existing chosen section.
- `src/domain/websiteBuilder.js` renders only known CSS class names in the private draft and static owner ZIP, while `busy-website-worker/index.ts` does the same in the hosted renderer. The shared `designSystem.mjs` stylesheet supplies responsive rules for both. The normal style remains unchanged for any section without an owner override.
- Individual design overrides follow the exact section ID and type through factual Brand Brain refreshes, so rebuilding from business details does not erase owner decisions or apply those decisions to unrelated sections.
- The immutable draft history supplies Undo/Redo. A new hosted preview and explicit customer approval are still required before any changed version can become publicly live.
- `scripts/check-website-section-styling-v3139.mjs` covers scope isolation, invalid styling rejection, private render output, worker wiring, preservation across rebuild, explicit named-section requests, draft immutability and unchanged publication status.
- `scripts/check-website-section-browser-v3139.mjs` uses the actual shared CSS in Chromium at 390px, 768px and 1440px, checking heading sizes, spacing, alignment, photo layout, gallery density and overflow.
- `.github/workflows/website-section-design-v3139.yml` runs these checks with prior regressions and unsigned iOS/Android JS exports. Do not conflate those checks with signed development-build testing.

## Still outstanding

- No production database/function, DNS or public website was changed in this sweep. A signed iPhone/Android build and visual checks across customer website types are still required before release.
- This is not yet pixel-perfect arbitrary drag-and-drop, a universal picture upload/cropper, fully contextual spoken "this/that" selection, or dynamic publishing of dependent booking/payment services.
- Continue the website builder before moving to the app builder: stronger on-page context for voice, accessible section controls, per-device preview quality and more complex design choices without sacrificing a simple front end.
