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
