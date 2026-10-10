# V3.99 — Professional websites by default

## Goal
A customer can say only “I'm a gardener in Exeter, I offer lawn care and hedge trimming” and get a website that is *designed* rather than a list of blocks, without BUSY inventing testimonials, photos, credentials, prices or business facts.

## What has been built
- The native editable draft preview displays its generated HTML through a JavaScript-disabled in-app WebView. Customers can judge the actual design while editing, without navigating away into source cards. It is not a published site.
- The website generator now has an accessible, mobile-first visual system, including typography hierarchy, whitespace, styled service cards, clear call-to-action buttons, visual navigation and a proper footer.
- Industry-aligned palettes use saved business type (nature, hospitality, wellness, professional, trades, neutral), with safe overrides from supplied colours and moods. Bright chosen colours are darkened as needed for white button contrast; invalid CSS expressions are ignored.
- With no approved photo, BUSY generates a CSS-only branded hero composition rather than showing an empty block or inventing a stock photograph.
- Only sections with meaningful saved content are shown. A contact button remains truthful to known phone/email/sections.
- Semantic main/navigation landmarks, visible keyboard focus, a skip link, mobile layouts and reduced-motion fallbacks are included.
- The local editable HTML and signed-website worker use the same pure design rules; both escape the owner's text. The website workers preserve stored pages, provider security rules, form opt-in and explicit publication approval.
- The V3.98 customer branding, recurring hosted-preview access and guided briefing features remain unchanged.

## What is *not* yet established
- Updated code in GitHub is not proof of a real hosted deployment. Supabase's website worker still requires deployment/release checks before newly prepared websites use these styles.
- The native app requires a signed iPhone acceptance build to see V3.99 on device. No Expo EAS build should be requested until the whole design sweep is reviewed.
- The local HTML preview can be different from the final stored file when approved photos require provider-side asset copying; always inspect the **hosted exact preview** before public approval.
- These visual foundations are not yet a whole library of multi-layout professional design families or a guarantee of excellent copy with only a business name. Future sweeps should add template selection, clear customer questioning, visual snapshots and scored quality checks across industries.

## Release & acceptance plan (low Expo usage)
1. Run production regression suite and static professional-design test.
2. Compile the native JS bundle and parse the website worker with GitHub Actions only (no EAS credits).
3. Review visual snapshots across a gardening service, catering business, local tradesperson, professional practice and a sparse two-service brief.
4. Bundle refinements into **one signed iPhone build** once screenshots and backend preview generation are tested.
5. Deploy website worker carefully, then prepare and inspect a new private hosted preview. Do **not** publish a real customer site without explicit owner approval.

BUSY can supply good visual design and ask for missing facts. It must not claim services, reviews, licences, discounts, photographs or guaranteed outcomes that the customer never supplied.
