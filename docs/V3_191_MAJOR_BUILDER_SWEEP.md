# Busy Does It — V3.191 Major Builder Development Sweep 1.0

**Primary objective:** substantial, connected, customer-facing improvements in the App Builder and Website Builder. Branch `v3.191` is based on the completed `v3.190`. Preserve the owner's explicit budget policy: no paid AI-provider calls, no hosted staging installation, no live customer testing, no signed app distribution and no publication.

## App Builder — more useful standalone customer journeys

1. **Searchable services.** The standalone public Services screen gains a local text search when more than four approved services are returned by the exact live public version. Search uses the returned service names and descriptions only. It cannot discover private records or send a request. An empty search result is explained, not shown as a broken screen.
2. **Service to booking request.** The V3.190 navigation and selected-service prefill remain intact; customers still submit the protected guest challenge themselves. No calendar booking is confirmed automatically.
3. **Accessible images and visible captions.** The privileged, version-checked `publicNativeMiniAppProjection` returns only the owner-approved gallery's safe short alt descriptions and captions. The native client re-validates image URLs and bounded plain text before rendering. This code also exposes the written captions under photographs. The embedded Busy marketplace app now displays the owner's captions too.
4. **Safe public contact buttons.** Call and email buttons exist only for validated public contact values; the customer taps them. The implementation opens the device phone/email handler, never invokes an app server action or transmits owner tokens. Invalid/malicious values cannot become URL schemes.
5. **Explicit retry on a failed live projection.** A network failure no longer leaves customers with a dead end. Customers may tap `Try loading this app again`; the app checks the exact configured published version again and clears stale views rather than silently displaying a possibly invalid old result. This is not background polling or an offline customer-data cache.

The native project is still an unsigned standalone **prototype**. A secure backend and linked published configuration are required for live customer request actions; app-store identity/signing, store approvals, subscription entitlements, connected customer loyalty and real-device end-to-end delivery remain unfinished.

## Website Builder — practical direct editing

1. **Create a missing Services or FAQ section** in an already-built private website. Requires literal owner-written first-entry content; does not invent business claims.
2. **Move individual services or FAQs** up or down through the direct editor. Stable item IDs plus expected titles guard against acting on stale entries. Edits use the existing website Undo/Redo and require separate approval to publish.
3. **Preserve exact owner-directed item edits** through subsequent Business Brain rebuilds. V3.190 already persisted add/removal; V3.191 extends that protection to directly edited item names and descriptions. Newly created FAQ/Services sections also survive regeneration when omitted from the next factual brief.
4. **Respect adaptive page architecture.** A new section may appear as part of an intentional one-page layout or on a dedicated page according to the existing design plan; the test checks actual inclusion, not an assumed new URL.

## Quality and safety

- New focused offline regression script `scripts/check-major-builders-v3191.mjs`: live-version projection, approved image descriptions/captions, refusal of unsafe image/contact URL schemes, search, finite module content, new website sections, service/FAQ reordering, stale-operation prevention, private rendering and preservation after brand refresh.
- GitHub workflow `.github/workflows/builders-major-v3191.yml` runs the new checks **plus** V3.190, native booking, existing website, customer task, preflight, and foundation checks; it generates four unsigned iOS/Android JS exports in GitHub Actions without paid external AI or physical-device tests.
- New standalone dependency `nativeCustomerActions.mjs` is copied into the generated unsigned native prototype by `scripts/prepare-standalone-prototype-v3154.mjs`; this fixes an actual missing-file bundle failure caught by the first export pass.
- Existing source intelligence tracker now surveys the wired V3.191 capabilities. Source inventories and passing synthetic checks are implementation evidence, **not measured customer success, IQ scores or proof of live integration**.

## Next: larger sweeps and regular code reviews

Continue significant functional development in both builders, including richer industry-specific screens, customer-initiated service journeys, app-to-website content consistency, website section flexibility and safe editing. Preserve zero-extra-spend until separately approved. Keep automated tests on *every* sweep, with the agreed comprehensive maintainability audit around **V3.195** and every five major sweeps thereafter, using `docs/DEVELOPMENT_SWEEP_AND_ARCHITECTURE_POLICY.md`.

This report does not authorize hosted Supabase staging installation or external deployment.
