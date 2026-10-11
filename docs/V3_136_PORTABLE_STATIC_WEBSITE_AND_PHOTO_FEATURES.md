# Busy Does It V3.136 — Customer-Owned Portable Static Websites

## Delivery goal
Give business owners a credible **way to take a copy of their website with them**, not just a JSON description or another recurring editing charge. Keep the website builder simple, self-service and private-by-default.

## Implemented
1. **Bounded ZIP32 archive generator** (`src/core/websiteZipArchive.mjs`): deterministic standard ZIP with correct CRC32, 32 MB overall limit, 12 MB per member, 96 file maximum, portable UTF-8 filenames, safe path validation and duplicate rejection. No third-party ZIP service, upload, network operation or hidden subscription cost.
2. **Standalone HTML + original images** (`src/core/websiteStandaloneArchive.mjs`): every generated page is rendered with correct relative links, inline responsive CSS and local `assets/photo-xxx.(png|jpg|webp)` paths. A photo included in several sections is archived once. Original approved media is embedded only when the byte reader can retrieve it and validate the type/size/integrity. A missing/cloud-only, unapproved, oversized or corrupt photograph **aborts export**; it never produces a misleading half-complete website. PNG CRCs are verified before inclusion.
3. **iPhone owner-initiated export** (`src/app/AppController.js`): writes a ZIP into app cache with Expo's File/Paths API and opens the iPhone's native share sheet so the user can select **Save to Files**. Images must still exist as an approved **local file or content URI available to this app**. No automatic remote media downloads, credential-bearing Storage URLs, publishing or edits to the existing live site occur.
4. **Richer page blocks**: create a photo-plus-written-description block from the business's already approved gallery. Render through the local preview and hosted worker with a responsive layout. Owner can edit its heading and wording, and it survives Brand Brain website rebuilds.
5. **Ownership instructions**: `README.txt` explains how to unzip and upload to a different static host, and clearly distinguishes what moves (HTML, CSS, images) from what does not (domain registration, DNS, Busy-managed forms/bookings/payments, customer records and cloud credentials). `EXPORT-MANIFEST.json` contains only safe public filenames/pages and counts.

## Important limitations
- **Cloud-only photographs are not yet downloadable through the ZIP control**. Original source files accessible locally on an iPhone can be included. Cloud-only image recovery needs a separately secured, explicitly authenticated business-owned media transfer pathway with safe asset provenance; this has NOT been built. The early content-only JSON export remains available when local images cannot be found.
- React Native iOS ZIP file sharing and original-photo access are source-integrated and **JavaScript-export checked**, but **not yet confirmed by human device testing**; only actual founder/device QA later can confirm Save to Files behaviour in every case. Android file-sharing still needs its own support and test.
- The ZIP is **static**. A customer can host it elsewhere, but dynamic contact forms, booking systems, AI services, payment flows and DNS are not part of this static output. Extra migration work is required for those capabilities.
- No staged live HTTPS publish or domain migration was performed; existing live customers and the production app are untouched.

## Automated independent evidence
- `scripts/check-website-standalone-v3136.mjs`: creates a real ZIP from a fictional website, proves media deduplication, safe image signatures, all pages and links, source immutability, refusal of missing/unapproved media, no ZIP slip, no silent customer data leakage or implicit publication.
- `scripts/check-website-zip-content-v3136.py`: independently opens the generated ZIP via the Python standard library, verifies CRC32, safe extraction, filenames and every relative page/media resource.
- `scripts/check-website-zip-browser-v3136.mjs`: unzipped HTML loaded directly from disk in Chromium at 390px and 1440px, verifies working navigation in both directions, original photo decoding, no external requests, phone responsiveness, no remote hosted dependencies and saves fictional screenshots.
- `.github/workflows/website-standalone-v3136.yml`: runs all previous website regressions, standalone ZIP tests, independent ZIP extraction, Chromium, Expo Snack modules, and a free native iOS JavaScript export. **No EAS signed build, chargeable AI use, public deployment or live account testing.**
- `.github/workflows/production-check.yml` now includes new portable ZIP regressions for future versions.

## Roadmap onward
1. **V3.137 candidate:** securely retrieve customer-owned cloud-only original assets with verified tenant/member Auth, bounded transfer, auditing and opt-in; add Android-native ZIP sharing.
2. Finish rich page editor beyond text/photo basics, preserve compatibility with hosted previews, work towards safe visual editing at phone size.
3. Build a thorough isolated staging hosted HTTPS preview / publish / rollback integration pass only when the entire website and app development phase is ready for wider testing.
4. Move to the intelligent app builder and remaining Busy Does It app capabilities as requested; complete end-to-end founder testing later.

This is an engineering milestone toward meaningful customer ownership, not a claim that every website can already be exported or hosted without further work.
