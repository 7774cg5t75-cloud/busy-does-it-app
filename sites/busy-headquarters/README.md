# BUSY DOES IT · Marketing website design review (V22.70)

This is a **source-only preview** of the Busy Does It marketing site, deliberately isolated from the app builder, customer deployments, domains and live providers. The site is not published, and public signups, payments, contact capture and AI demos remain disabled.

## What changed
- Replaces the historical green/light theme with the approved Premium Midnight cyan/blue/violet/pink identity, using approved headline and founder-story positioning.
- `assets/busy-orb.svg` is a **faithful web vector adaptation** of the existing app component `src/components/BusyOrb.js`: same gradient stops, rings, light layers, arc paths and central microphone. `assets/busy-constellation.svg` adapts the existing `BusyOrbConstellation.js` source geometry and lines. They are not AI-generated alternatives or new canonical creative approvals; detailed visual fidelity still requires owner side-by-side review of actual app screenshots.
- Responsive semantic homepage, accessible navigation/FAQ, reduced-motion-aware ambient illustration and contextual development disclaimers.
- Does not solicit signups or payments; legal notice stays a clearly unapproved draft.
- Preserves the existing fictional `demo/` marketing sample without claiming live deployment.

## For local preview

From this folder: `python3 -m http.server 8765` then open `http://localhost:8765/`. For full sample-demo links, run within the original repository where `demo/index.html` is included; offline preview ZIP should include it.

## Publication gates (not passed)

Formal founder review of visual fidelity, correct and accessible copy, approved final privacy/terms, actual hosting/domain/HTTPS status, and specific owner go-live approval. No Cloudflare DNS, Supabase, payment, AI provider, analytics, GitHub merging or public website publication occurs in this source-only branch.

## Source provenance

- Product authority: private full Master V22.70 / Section 80. The original master remains outside Git.
- Website source reference: `sites/busy-headquarters/` from the Mission 15 branch.
- Native orb source: `src/components/BusyOrb.js` and `src/components/BusyOrbConstellation.js`; native palette: `src/theme/appearance.mjs`.
- Art direction: approved BUSY business-card visual and Premium Midnight design. Owner review pending.

## Website V2 — clear value above the fold (31 October 2026)

Owner feedback: visitors should immediately understand that BUSY aims to build websites and apps, and see the six core benefit areas without significant scrolling. The review branch now leads with the explicit website/app headline and an app-inspired 2-column-on-mobile / 3-column-on-desktop six-card feature navigation, while keeping the approved native-derived orb, Midnight brand and fuller detail sections below. The six cards link to existing feature details. Content remains explicitly in development; no registration, live voice, DNS, payment or public deployment is authorised. This is not the customer's app Home and does not introduce new product navigation tiles.

Local Chromium layout review used the real static HTML/CSS and original derived SVG assets with browser-rendered screen captures at 1440×1000, 390×844, 375×812 and 768×1024. All six card anchors resolve, images load, no local page errors or horizontal overflow were observed. This is a local static browser check, not hosted acceptance, native device testing or a live DNS/site health receipt. The local exported preview was assembled from the review source; the current GitHub branch is authoritative for the committed implementation. Publication, legal review and domain work remain separate gates.


## Premium sample website — ClearFlow exterior cleaning concept

The founder approved upgrading the earlier plain sample and the customer-facing phrasing **“See the kind of website Busy can build for your business.”** The new public review route is `showcase/index.html`, a standalone, mobile-responsive fictional exterior-cleaning website with a complete sales-oriented narrative: hero, example service promises, six services, interactive illustrative visual comparison, three-step process, photo gallery, no-fabrication review placeholder, Devon-area examples, FAQ and non-submitting quote section.

**Important provenance:** `showcase/index.html` is a bespoke *marketing design target* authored for this review. It is **not** evidence the existing automated Website Builder generated those layouts, image choices or interactions. The original real-builder generated `demo/index.html` and `demo-brand-brain.mjs` are preserved, remain reachable through the premium showcase, and remain authoritative for today's generator capabilities. Marketing FAQ explicitly distinguishes the two.

**Imagery:** Unsplash-licensed illustrative stock photography by Sergej Karpow, Sean Ferigan and Bin White is loaded from the Unsplash image CDN. Remote photo delivery and third-party request privacy/performance require review before the public launch. No images are identified as ClearFlow customer projects. The interactive before/after uses one photo with two CSS treatments, clearly labelled as an illustration rather than a real outcome. The mock trust strip contains only illustrative service propositions, not unsupported insurance ratings or credentials.

**Safety/UX:** No forms, analytics, real contact methods, collection, account login, checkout, testimonials, fictitious ratings or privileged script. `noindex,nofollow` remains in both website and showcase. All six service descriptions, menus, FAQs and comparison slider are client-side presentation only. Review the real hosted photo loads and actual mobile rendering independently. As with the marketing root, actual deployment and public discoverability are independent of code commit and require corresponding evidence.


## ClearFlow premium showcase — concept, not generated-output evidence (31 October 2026)

The owner requested a visually compelling example for prospective website customers, with the public-facing wording "See the kind of website Busy can build for your business." The separate, responsive `showcase/index.html` now presents **ClearFlow Exterior Cleaning**, an invented Devon exterior-cleaning business concept, with: distinctive hero, honest capability/proposition strip, six real-world service categories, a **labelled illustrative photo-filter slider**, workflow steps, visual gallery, a review-section **placeholder instead of fabricated testimonials**, illustrative geographic coverage, useful FAQs and an inert quote call to action. No actual business, booking, personal contact, rating, price claim or testimonial is represented as real.

**Evidence rule:** The premium showcase was hand-composed as an aspirational marketing concept using static HTML/CSS and limited on-page presentation scripting. It was **not** automatically generated by Busy’s currently implemented Website Builder. The earlier `demo/index.html` remains an explicitly separate technical demonstration generated from the original fictional brief. The marketing homepage links to both with this distinction disclosed near the showcase invitation and in the FAQ.

No source-generated features, provider connections, customer forms, payments, live booking or public domain configuration were activated by the showcase update. Styling does not borrow Busy’s Midnight chrome: the example is deliberately a customer-specific cream/pine/teal visual identity, demonstrating variety. It includes three credited illustrative Unsplash image URLs; actual remote image loading and license/source verification should be checked in the hosted preview. If external images fail, the background and text remain visible, but photographic presentation is incomplete. Real before/after work photos, insurer claims, local trading history, phone numbers and testimonials must be supplied and approved by a genuine customer before any real deployment.

**Review / next steps:** View `https://busydoesit-preview.pages.dev/showcase/` once Cloudflare Pages finishes deploying this review branch. Exercise the menu, comparison slider, anchor links, 390px/mobile layout and full-sized desktop composition. Verify asset loading in Safari. This review link is a public `pages.dev` preview, not `busydoesit.co.uk` and not a password-protected private preview. Protect access via Cloudflare Access if privacy is desired. No public release readiness is inferred from GitHub commits or local screenshots.


## Focused landing-page refinement — 31 October 2026

Owner-approved changes to the **existing Git-connected Cloudflare Pages preview** (review branch `site/busy-homepage-v2270-review`):

- Shorter, immediately understandable homepage lead: websites, apps and business support. Preserve the approved orb, headline, Midnight branding and first six compact capability tiles.
- Replace the second repetitive six large-card section with six native HTML `details` disclosures. The quick cards open the corresponding explanation, including on hash navigation. Keep useful descriptions and honest feature status without forcing every visitor to scroll through them.
- Replace the CSS-constructed miniature ClearFlow facsimile with a **read-only, same-origin embedded view of the actual sample page** (with an accessible independent overlay link). The view reflects the current sample source, not a separately drawn mock-up or an invented screenshot. Its external photos still require browser-level asset checks.
- Tighten the authentic founder story around Slow Roast festival catering and link to the real business website. **No fabricated founder photo** or stock photo is substituted for an actual trading image. Add a genuinely approved photo later; the public placeholder note is visually hidden.
- Replace the wordy trust section with the owner-approved “Powerful underneath. Simple on the surface” principle and concise transparency copy.
- Provide a visible, accurate “Early access — Not open yet” status rather than a fake waitlist form, checkout or collection of personal data. A real consent-based signup requires reviewed backend, retention and privacy work.
- Keep noindex development state, separate `busydoesit.co.uk` domain and original generated `demo/index.html` evidence unchanged. Premium `showcase/index.html` remains a separate aspirational concept, not evidence of current automatic-generation quality.

Security/release: none of the changes authorise live AI, spending, customer communication, payments or production domain connection. The `pages.dev` address is Internet-accessible until Cloudflare Access is configured, and no new private customer data is included. This is a static website preview; release acceptance, legal review, real photo selection, public analytics and signup consent are still separate.

Expected review URLs: `https://busydoesit-preview.pages.dev/` and `https://busydoesit-preview.pages.dev/showcase/`. GitHub commit does not by itself prove Cloudflare has finished deployment; inspect the actual browser after the build. Compare desktop and phone layout, tap all six quick links and verify the sample preview matches the actual sample.


## 1 November 2026 — email contact and manual early-interest (review only)

- Add the new founder-controlled business mailbox address to the contact section and footer, with a mailto link.
- A compact accessible contact form **only prepares** a message in the visitor's email application. It does not POST to a backend, store addresses, or claim successful delivery. The visitor must press Send in the email app.
- Early access remains **not open**. A separate email link allows voluntary expressions of interest, explicitly without automatic signup or a confirmed place.
- Clarify the draft privacy notice to describe voluntary email enquiries. This is not approved legal text; an approved notice, retention process and any automated signup service require legal/security review before launch.
- No provider secrets, live website DNS changes, AI operations or payments are introduced. Keep noindex and existing development notices; review actual renders before production publication.


## Gated automatic forms: review / activation checklist

Cloudflare Pages Functions routes under `functions/api/` are deployed but **fail closed**. The source-only review has no real registration without explicit secret bindings and flags. A real consent-based waitlist uses private Supabase storage and double opt-in. Contact messages go through a verified business sender to the Namecheap mailbox. Resend is currently configured for a *different business's* domain and must NOT be used for this brand.

Required Pages variables/bindings (set as production secrets, NEVER commit): `MARKETING_FORMS_ENABLED=1`, `MARKETING_PRIVACY_APPROVED=1`, `MARKETING_WAF_APPROVED=1`, `MARKETING_RETENTION_APPROVED=1`, `MARKETING_ALLOWED_HOSTS=busydoesit.co.uk`, `MARKETING_PUBLIC_ORIGIN=https://busydoesit.co.uk`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET`, `MARKETING_RATE_KV` (KV namespace binding), `MARKETING_IP_PEPPER`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `MARKETING_FROM` (on a verified **Busy-owned** sending domain). The optional site key is public; the secret and server-only secret key must remain server-only.

**Before enabling**: apply and test the separate marketing schema in approved production environment; verify RLS deny-by-default and owner-only data access; configure Turnstile domain and Cloudflare WAF rate limiting (KV rate gate is non-atomic defense in depth); verify the Busy sender's DNS, delivery and reply-to; publish founder-reviewed UK privacy notice identifying controller/legal basis, processors, retention/deletion rights and contact; implement the operating procedure for deleting unconfirmed entries after seven days and respecting erasure requests; confirm email and sender journeys with test accounts; final approval before changing live hostname and flags. No bulk launch notices, newsletters or automatic follow-ups are included. An unsubscribe/suppression facility is required before any campaigns beyond the single expressly consented launch notification.

Manual mailto fallback remains when the safe form is unavailable. Early-access email link is explicitly NOT a stored or confirmed registration. Preview and production website must be rendered on actual devices. No DNS/provider/production releases are authorised by this code alone.


## 2 November 2026 — signup integrity follow-up

- Replaced read-then-upsert with insert-first, conflict-aware logic: duplicate requests may refresh **pending only**. A confirmed or unsubscribed record is never silently reset to pending, even if two requests race to insert the same email.
- The draft privacy notice explicitly explains the temporary pending address created to send a verification email; confirmation determines launch-notification eligibility.
- A provider's email acceptance is not a delivery receipt. The contact form accordingly reports acceptance for delivery, not that the email reached the recipient. End-to-end delivery to Namecheap remains a separate release gate.
- Before activation, approve an automated, audited purge of pending records older than seven days and an erasure/suppression workflow for confirmed records. Test with fictional data in staging and check consent scope against the ICO's current PECR guidance. No live marketing or capture has been enabled.


## 2 November 2026 — customer-first copy and ClearFlow colour refresh

**Owner approval:** implement the recommendations from the full homepage copy review and improve the excessive white background in the premium example website. This change is visual/copy only and deliberately stacked on the gated website branch. It does not make the website or forms publicly active.

Homepage:
- Keep the owner-approved headline, “Busy Does It — the team behind your one-person business,” “You tell Busy. Busy does it,” founder story/Slow Roast link, six feature categories and nine FAQs.
- Replace technical terms with examples: websites on phones/computers, booking or bespoke apps, posts and printed marketing, finding work, organised messages/bookings, clear quotes and invoices.
- Make the development status and manual-versus-verified early-access email action truthful without repeatedly interrupting the main narrative.
- Update early-access introduction/note dynamically if the verified form is eventually enabled.

ClearFlow:
- Keep the fictional demonstration label and important claims that it was hand-designed rather than actual current automated builder output.
- Replace the all-white look with a professionally coherent pine/teal/seafoam + warm sand/clay palette, layered hero glow, contrasting service cards, distinct process/reviews/gallery/FAQ sections and a stronger closing call-to-action.
- Preserve section navigation, service offerings, accessible comparison slider, photographic attribution and responsive breakpoints; avoid invented results, businesses or customer reviews.
- Replace “curb appeal” with natural UK wording.
- New screenshots are captured by the `marketing-visual-review.yml` workflow directly from browser-rendered local source at 1440px and 390px for both pages. They are NOT AI mockups or claims of a completed deployed-site acceptance review. Compare with the approved preview before merging.

Security/release:
- The manual contact email remains available; gated automatic collection remains OFF by default.
- Do not change Cloudflare DNS, keys, payment integrations, customer records or marketing service flags.
- Cloudflare production branch and public domain are unchanged; the screenshot workflow and PR are review evidence only.
