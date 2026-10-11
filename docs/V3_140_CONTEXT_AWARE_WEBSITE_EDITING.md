# Busy Does It V3.140 — Context-Aware Private Website Editing

## Purpose
V3.140 extends V3.139's independent section design controls with exact **this/that** instructions. An owner taps one element in the private preview, opens an optional "Tell BUSY what to do with this part" panel, chooses an example or types one short command. The selected section, item, page and draft generation are explicit — no guessing based on other website sections.

## New source capabilities
- Local, zero-AI-credit interpreter in `src/core/websiteContextualEdit.mjs`. Only a small, named grammar is accepted: resize *this* heading, centre *this* section, add/remove section spacing, position *this* approved photograph, move a gallery item one slot, change safe hero/button emphasis and replace exact owner-written copy in the selected field. Unsupported or ambiguous instructions return a clear explanation and do nothing.
- Individual **service, FAQ and testimonial item heading sizes** are independently adjustable. `item-style` is an allowlisted reversible layout operation, not arbitrary CSS. Both private/static and real hosted site generation render the same approved class tokens from `designSystem.mjs`.
- Existing business-brand data refresh restores those item-heading choices by exact section and stable item ID, avoiding accidental transfer to another item's design.
- Selection messages from the sandboxed local preview are associated with a particular page and draft generation. Stale page/revision requests are refused. Commands use the existing `applyWebsiteFieldChange` and `applyWebsiteLayoutAction` paths, retaining Undo/Redo, the no-publish boundary, exact field validation and HTML escaping.
- Phone-width vs full-device-width preview control helps owners compare draft responsiveness without generating a hosted version.
- The private WebView tap-selection layer now offers keyboard focus, accessible edit labels and Enter/Space activation. Standard browsing keeps JavaScript disabled; signed hosted previews are not made interactive by the editor.
- The editor panel retains its earlier direct controls for pictures/wording/layout and hides the conversational controls until the owner requests them, keeping the default interface uncluttered.

## Verification
- `scripts/check-website-context-v3140.mjs` tests scope, stale selections, unrecognised commands, concrete field changes, safe item-level styling, resets, private draft immutability, real renderer and hosted parity, preservation through Brand Brain refresh.
- `scripts/check-website-context-browser-v3140.mjs` exercises actual keyboard selection at phone/tablet/desktop widths in Chromium and ensures that tapping the website button cannot navigate away from the local editor. Earlier responsive visual checks run too.
- `.github/workflows/website-context-v3140.yml` runs the above tests, earlier regressions and unsigned iOS/Android JS exports. The general production CI is to retain the context guard.
- No production deploy, DNS change, Supabase migration, public publication, signed EAS build or paid AI request is part of this source sweep.

## Honest limitations
This is deliberate **bounded command recognition**, not complete free-form conversational AI understanding; unsupported wishes are explicitly rejected. Spoken references to "this" will require a future integration that preserves on-screen selection during voice capture. Rich drag/drop, pixel-level controls, domain/booking transfer, real-device accessibility and signed iOS/Android acceptance remain future work. Release should only follow an end-to-end staging, real-device and full website builder check.
