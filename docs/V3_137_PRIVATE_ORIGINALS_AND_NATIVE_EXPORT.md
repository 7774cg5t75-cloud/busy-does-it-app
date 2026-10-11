# Busy Does It V3.137 — Private Originals and Portable Export

## What has been implemented in source
1. **Authenticated, business-scoped original media gateway**: the new `busy-website-original-media` Supabase Edge Function authenticates each bearer token using Auth, verifies the selected business's owner/admin membership, checks a private originals registry, and denies cross-business or unregistered storage paths. It enforces a 9 MB per-photo limit, signature checks, bounded requests, a per-owner rate limit and a transfer audit. No signed storage URL or arbitrary URL proxy is returned.
2. **New private storage foundation**: a migration creates `busy-website-originals`, a media registry and transfer audit with RLS and no direct anonymous or client role access. Existing social-media photos continue to use their original storage references and are **not** silently exposed or migrated.
3. **Owner-triggered backup**: the website page editor has an optional "Privately back up my original photos" button. While original files are still readable on the owner's device, it uploads only approved, referenced website images into business-owned private storage. It adds an `exportOriginalPath` marker to the private draft, preserving legacy `storagePath` so that hosted previews are not broken. Matching images are deduplicated, and backup references survive Brand Brain draft rebuilds.
4. **Cloud recovery during ZIP creation**: the export checks local originals first, and only falls back to an authenticated, bounded read of a verified `exportOriginalPath` belonging to the current cloud business. All image signature checks and all-or-nothing ZIP validation from V3.136 continue to apply. The static website ZIP does **not** move a domain, DNS, bookings, forms, payments, customer data or hosting.
5. **Native share sheet for both platforms**: the explicit ZIP control uses Expo Sharing's file-attachment API for both iOS and Android. JSON source sharing remains available. The app does not claim that a user actually saved the file merely because the share panel opened.

## Safety and explicit limitations
- This is **source-integrated** on the `v3.137` development branch. The new database migration and Edge Function still require separately approved deployment, isolated staging checks and signed-device validation. No production Supabase data, live site, EAS build or DNS has been changed by this version.
- **Existing cloud-only legacy social photographs remain unsupported** unless their original files are deliberately reattached and backed up through the new trusted pathway. Previous shared-bucket provenance cannot be safely inferred from a supplied path alone. Do **not** weaken this check to make a demo pass.
- Expo Sharing supports native iOS/Android file attachments but the final real-device save/share behaviour is still unverified. A **new development build** may be required because `expo-sharing` is a native module.
- The 25 MB collection limit and 9 MB individual photo limit are mobile protections, not claims about every possible commercial website size. Large media sites need a separate scalable transfer/export design.
- Originals backup is a separate manual action; export does not silently upload, publish or modify remote customer sites.
- SQL credentials, tokens, customer details and storage object URLs must never be embedded into the portable ZIP.
- The Edge API is intentionally not publicly available before staging migration + deployment review. Unreachable or incomplete service returns an explicit, fail-closed status.

## Automated checks
- `scripts/check-website-original-media-v3137.mjs` covers business path isolation, malicious/traversal URL rejection, matching-asset propagation, immutable private drafts, repeated image deduplication, rebuild preservation and guarded integration wiring.
- Dedicated `.github/workflows/website-original-media-v3137.yml` runs this, prior ZIP/page/layout regressions, Deno type checking and both iOS and Android JavaScript exports. These checks do **not** constitute a live authenticated transfer or a device test.
- The general production foundation CI also executes the V3.137 contract test.

## Next website-builder improvement sweeps
1. Staging execution: apply private schema in an isolated disposable Supabase project, deploy the function there, verify a genuine signed-in owner, independent tenant and unauthorized user; record audit, quota and image recovery evidence.
2. Richer mobile-first editing: direct gallery manipulation and page-specific visual controls with undo/redo and checked desktop/mobile parity, without overwhelming the default interface.
3. Larger exports, transparent migration of independent booking/form services, accessible internationalised page quality and hardened publish/rollback user flows. Keep website builder as the priority until it is genuinely easy and robust; intelligent app builder comes afterwards.
