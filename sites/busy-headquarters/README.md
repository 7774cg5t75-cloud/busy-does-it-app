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