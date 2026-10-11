# V3.135 — Owner-managed website pages and portable content

## Built in source
1. **Owner-controlled custom pages.** Add pages with owner-written introductory copy, up to eight extra pages, safe slugs under `/pages/<slug>`, stable URLs after renaming, up to 12 page sections, section movement, exact content editing via the existing private field editor, and non-destructive page removal.
2. **Single source of truth.** Existing generated Home/Services/About/Contact/FAQs pages remain. The canonical `src/domain/websiteManagement.js` produces safe page paths, output paths, page-specific titles, descriptions, and navigation. Custom page-only sections do not leak into the homepage. Sections can be reassigned with their exact wording preserved.
3. **Private and hosted renderer parity.** The native WebView preview now shows the selected actual page; hosted rendering uses that page's specific section order and semantic H1. Cross-page links use correctly calculated relative paths for nested pages and signed URLs for hosted private previews. Original page publishing and explicit owner approval remain separate.
4. **Ownership portability.** `src/core/websiteSourceExport.mjs` packages public website business copy, section text, page structure, theme and SEO into a readable JSON format that can be shared explicitly by the user via their phone. Private customer records, credentials, hosting tokens, signed media URLs and storage paths are deliberately excluded. A precise media inventory highlights original photographs that must be supplied separately. The UI clearly states this is **not** a complete, ready-to-host website archive or domain transfer.
5. **Familiar and simple UI.** Optional “Manage website pages” and “Keep a copy of my website content” sections, without adding setup screens to the default Home experience. Existing Undo/Redo and versioned private draft rules apply.

## Verification
- `scripts/check-website-pages-v3135.mjs`: actual draft mutations, stable/unique slugs, canonical page routes, SEO, separated page content, precise editing, undo/non-destructive design architecture, forbidden writes, JSON allowlist.
- `scripts/check-website-pages-browser-v3135.mjs`: offline Chromium renders generated fictional homepage and custom page at phone 390px and desktop 1440px, semantic H1, overflow, privacy and distinct content. Screenshots are retained for seven days.
- `.github/workflows/website-pages-v3135.yml`: production regressions, source tests, Playwright, free native iOS JavaScript export. No signed build, EAS expense, hosting provision, production Supabase migration, live deployment, or external AI use.
- Full `.github/workflows/production-check.yml` additionally gates the new page tests on later branches.

## What is NOT claimed
A successful source/build and fictional browser test does **not** prove the complete hosted staging publication/rollback flow, all user permissions, attached contact forms, domain setup, image transfer, or customer readiness. The separate staging signed iPhone login canary does not automatically acquire these page-builder changes without a future deliberate build.

## Remaining website-builder priorities
- True transferable static website ZIP, with original user-owned media assets, relative pages/links, and export validation on a different host; easy domain and content ownership explanations.
- Fully featured page-level editing for richer image, media, forms and block structures, plus accessibility and SEO per page, beyond V3.135's safe owner-authored text sections.
- Verified hosted HTTPS preview, publish, rollback and custom-domain lifecycle in isolated staging.
- Later: the user's requested comprehensive manual testing of all features once the app and the intelligent app builder have been developed.

These changes protect the core customer experience: the website is useful, editable on the go, and no one should be charged merely to update a headline, page or section.
