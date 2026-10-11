# Busy Does It V3.134 — Structural and Visual Customisation

## Goal and operating boundary
Make the existing AI website builder editable **without rebuilding from an unrelated template**. The owner retains control over content and design decisions. These are source changes, not a public rollout or confirmation that the entire website service is ready for customers.

## Implemented in the actual private builder
- A hidden-by-default **Change layout and appearance** panel, separately expandable for styles and sections. The original simple Website Builder front end stays intact.
- Add owner-written text sections with exact copy and safe IDs; duplicate supported *text* sections into distinct owner-editable blocks, hide/show existing nonessential blocks, delete only extra custom text sections, and reorder enabled sections (main hero stays first). Limits prevent unchecked section explosions.
- Appearance presets for fonts, card presentation, navigation, spacing, hero size, approved-image focus and stronger contact/booking CTA. Values are whitelisted; no untrusted arbitrary CSS, external font downloads or HTML are accepted.
- Choose a hero image by its existing approved **gallery storage path** only. Image uploads/replacement remain the responsibility of the approved media library, not remote URL guessing.
- The native preview and hosted website renderer now carry the **same** scoped appearance class names and shared CSS. User-created text blocks are included in the hosted multi-page homepage selection.
- Explicit multi-step BUSY instructions separated by a semicolon or “and then” can apply up to four edits. If one part fails, the original draft remains unchanged. Supported phrase examples: “make website more premium; move about before services; make booking button stand out.” This is rule-based bounded interpretation, **not a claim that arbitrary natural language is fully understood**.
- Each successful edit regenerates the draft generation, design plan, SEO/page mapping, review and preview HTML; reuses private Undo/Redo, with no publish action.

## Evidence gates
- `scripts/check-website-layout-v3134.mjs` covers real generated HTML; immutable draft source; unique IDs; custom-section homepage inclusion; duplicate, visibility, deletion and ordering; actual CSS classes; approval requirements for hero photos; unsafe values and ambiguous targets; all-or-nothing multi-command edits; unapproved media refusal; no direct publication.
- `scripts/check-website-layout-browser-v3134.mjs` runs Chromium on fictional actual HTML at 390px and 1440px, verifying content, touch targets, computed layout, no horizontal overflow, and saves screenshots for seven days (GitHub artifact).
- `.github/workflows/website-layout-v3134.yml` checks previous editing regressions, V3.134 assertions, full Expo Snack modules, native offline iOS JS export and Chromium browser screenshots. This workflow **does not invoke EAS signed builds, charge AI credits, deploy Cloudflare or Supabase or access live customer data**.
- `.github/workflows/production-check.yml` runs V3.134 source regressions on future sweep branches.

## Still to develop before claiming a complete builder
- A direct WYSIWYG/touch interface and genuinely arbitrary page-level design freedom (custom blocks are presently text-only; specialist media, forms and richer blocks need dedicated safe editors).
- Broader photo/gallery management, verified asset provenance and upload interfaces; responsive crop/preview needs further user tests.
- Real owner-level hosted website generation, domain, preview, publication, rollback and export/portability E2E with secure tenant-scoped staging data. Existing staging Auth canary tests do not prove this.
- Independent visual quality evaluation of real mobile and desktop captures on varied businesses; accessibility, performance, SEO and user-experience audits.
- A full regression, security, permissions, payment and infrastructure test pass at the eventual release stage, followed by the owner's manual go-live decision.

## Next focus
Strengthen **actual page/section rendering parity, safe page customization and website export/ownership** before moving to the intelligent app builder. Continue efficient automated unit/browser checks while deferring the founder's comprehensive hands-on tests until the broader app is built.
