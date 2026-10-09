# BUSY DOES IT V3.77 — Customer Experience & Go-Live Engine

**Branch:** `v3.77` from `v3.76`. Development milestone, **not** a public launch, successful test website deployment, or billing activation.

## Goal
Let a first-time tradesperson or small-business owner move from their saved business details to an accurate website draft, an exact hosted preview, explicit go-live approval and verified public delivery — while preserving customer ownership and safe rollback.

## Implementation completed
1. **Guided launch model:** `src/core/websiteLaunchJourney.js` derives six steps from real Brand Brain and website publishing state:
   - Check core business details and flag missing information without inventing facts.
   - Generate a private draft.
   - Review/edit real copy and photos.
   - Prepare the immutable hosted preview.
   - Review and approve Go Live.
   - Independently check the live deployment.
   The model NEVER treats a draft, queued job, hosted preview or an unverified `live` row as a confirmed reachable public site. For verified-live, it requires a matching live deployment ID, explicit `healthy` status and an actual recorded health-check timestamp.
2. **Customer navigation:** Website Builder now puts the next recommended step and six-stage progress at the top, with a real button taking the customer to business details, draft creation or website management. Website Management shows the same states.
3. **Exact-preview review:** The hosted preview open button marks only that opening was attempted successfully, not that the user has inspected it. The customer must separately confirm reviewing **that precise preview ID** before the screen enables the approval button. Review state clears when the hosted preview version changes.
4. **Server-side go-live preflight:** The existing authenticated `busy-website-publish` Edge Function gained `launch_preflight` (owner/admin members only) and `launchPreflight.mjs`. It checks the immutable preview artifact, its content hash and state, and confirms the selected deployment belongs to the current business's canonical main website. The existing publish action independently enforces this same preflight, even if a client bypasses the UI. Explicit `ownerApproved:true` is **still required**. A successful preflight is only permission to approve a queued publish, **not** proof of public website availability.
5. **Rollback ownership safeguard:** Restoring a previous version now additionally verifies that it is a previously published artifact belonging to the same business's **current main website**, not a different website under that business.
6. **Subscription/hosting transparency:** Website Management clearly states that paid subscription status and automated hosting cancellation are **not connected** and no payment/suspension is being claimed. Customer-owned domains should remain customer-controlled. A clear portability/export and grace-period policy is required before commercial release.
7. **Automated checks:** `scripts/check-website-go-live-v377.mjs` covers onboarding journeys for plumbing, landscaping, catering and grooming; missing facts, drafts, stale previews, preview receipts, go-live confirmation, live verification and safe rollback. The check was added to the existing GitHub production workflow without dropping older regression suites.

## Backend status
- `busy-website-publish` Edge Function **ACTIVE v18**, `verify_jwt=true`, deployed from the V3.77 branch with both `index.ts` and `launchPreflight.mjs`.
- No database schema or Stripe/billing changes were needed.
- No new external website or customer content was created or automatically published.
- Existing protected read-only monitoring, Cloudflare status and website worker infrastructure were not replaced.

## Suggested future subscription/hosting contract (not yet implemented)
- Access to ongoing **hosting, edits, new features, business marketing tools and support** makes the subscription valuable beyond a one-off website build.
- Define a clear paid entitlement only on **verified billing events**, not on draft creation or workspace creation.
- Consider a disclosed one-time setup fee **or** clearly stated minimum term for labour-intensive site builds; do not conceal obligations or trap customers.
- If a customer cancels, communicate renewal/hosting end dates, offer a reasonable notice and grace period, and provide an export/portability route before any future suspension.
- A custom domain purchased by the customer stays under their ownership and account control; do not seize or block transfer.
- Never enable payment collection, subscription suspension, domain revocation or automated deletions until billing, entitlement, export and data-retention rules are reviewed end-to-end.

## Test and launch gates outstanding
- A genuine test website must be prepared, hosted, explicitly approved, published and probed at its final default/custom domain. Production database previously showed **no live BUSY customer websites**, so end-to-end real publishing is not yet proven.
- Account sign-in, multi-business separation, failed job recovery, exact-hosted-preview review, rollback and on-device page inspection still need eventual iPhone acceptance.
- Complete GitHub Actions run is **not yet independently confirmed green**. A focused source/pure-logic check of V3.77 launch and permission safeguards passed (21 scenarios), but is not a substitute for the full CI suite.
- Confirm real payment billing provider, sustainable hosting pricing, cancellation/grace-period/export details before paid launch.

## Files
- `src/core/websiteLaunchJourney.js`
- `src/screens/websiteBuilder.js`
- `src/screens/websitePublishing.js`
- `src/app/AppController.js`
- `supabase/functions/busy-website-publish/launchPreflight.mjs`
- `supabase/functions/busy-website-publish/index.ts`
- `scripts/check-website-go-live-v377.mjs`
- `.github/workflows/production-check.yml`
