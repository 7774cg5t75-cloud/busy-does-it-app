# V3.101 — Customer individuality + design-review foundation

## Product promise
BUSY DOES IT should deliver **consistent quality, not identical-looking websites**. Two businesses in the same sector can have the same services, but their websites must still feel individually designed. Customers should not have to learn typography or CSS, and BUSY must not invent credentials, customer reviews, offers, photos or contact details.

## Shipped in the branch
- **Per-business stable design identity.** A deterministic, local seed based on business name/type selects independent hero composition, service card rhythm, decoration, navigation treatments, typography and one of several curated industry colour variants. A preview or edit of the same brand won't randomly scramble its visual identity.
- **Customer preferences still take precedence.** Explicit, allowlisted theme fields override automatic choices when compatible with the available media. Bright client-selected accent colours retain existing contrast safeguards; raw CSS/script strings are rejected.
- The **same shared planner** runs inside native previews and the Supabase website-hosting worker's source. Generated HTML receives specific responsive classes; no third-party stock media or fonts are automatically added.
- The draft receives a **first-pass, deterministic, zero-API-cost design quality review**. It checks confirmed business identity, useful heading/services, sensible page structure, selected visual identity, real contact/service area and photo-free hero handling. It supports fingerprint comparisons when comparison fingerprints are intentionally supplied.
- Feedback is behind an optional expandable card so the customer journey stays simple. The card explicitly says that this **is not yet a screenshot-based AI visual inspection** and that the owner must approve publishing.
- Review reruns after draft edits. Private hosted-preview security and publication gates are unchanged.

## What is not claimed
- A fingerprint does **not** establish global uniqueness or visual dissimilarity on its own. There is **no cross-customer design database**, no sharing of customer site content across accounts and no claim of exclusive rights to one design.
- An algorithmic design score is **not a visual AI quality score**. A screenshot-based multimodal reviewer is the next separate engineering step, with strict user privacy, authentication, metered cost limits and an explicit no-fabricated-facts rule.
- The modified website worker is **not deployed simply because GitHub source was updated**; verify a newly prepared private hosted preview before approving any production release.
- **No Expo EAS signed native build is submitted in this sweep.** This avoids spending the Starter plan's iOS build credits.

## Future AI visual critic
1. Privately render representative desktop and mobile screenshots from the exact approved draft, not a public URL.
2. Send only authorised, minimum-necessary artefacts to a supported multimodal model behind server-side billing limits/credits. Avoid cross-business exposure.
3. Request structured critique of hierarchy, legibility, mobile navigation, whitespace, imagery provenance, accessibility, consistency and resemblance to a consented design baseline.
4. Apply only safe bounded edits automatically (layout spacing, approved design tokens). Requests touching customer facts, publication, photos, pricing or claims require owner review.
5. Re-render and compare; cap iterations and credit usage. Explicitly report when the system cannot establish quality or uniqueness rather than inventing a score.

## Verification
- CI includes regression tests generating twenty fictional websites for the same industry and checking a wide spread of real composition fingerprints, stable edits and allowed customer overrides.
- An offline no-EAS workflow generates nine example websites and compares mobile/desktop Chromium screenshots, particularly five exterior-cleaning examples. It uploads screenshot evidence as a GitHub Actions artifact.
- Real-device acceptance and signed hosting-worker deployment remain release gates.
