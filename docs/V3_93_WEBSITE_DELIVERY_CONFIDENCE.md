# V3.93 — Trustworthy Website Delivery Status

**Branch:** `v3.93`, based on `v3.92`. This is a development change, not proof that a customer or headquarters website was launched.

## Customer problem fixed

The six-stage website launch journey and detailed "Real-world launch proof" panel had diverged. Previously, the journey could mark a site *live verified* merely because a matching live-deployment ID, an old health-check timestamp and a text `healthy` status existed. That omitted the independently checked public HTTPS domain, fresh matched observations, explicit published artifact and Cloudflare activation required by the stricter panel.

## Changes

- `buildWebsiteLaunchJourney` now requires an explicitly supplied locally computed `deliveryProof.verified === true` **and** a recorded live deployment before the journey may show "verified", "published/public" or "maintain". It no longer trusts the weaker status fields in publishing response to make a verified claim. Missing proof fails closed.
- Website Builder and Website Management both calculate `buildWebsiteLaunchProof` from the same read-only publishing state and pass the result to the journey. The six-stage status and seven evidence checks now use the same truth standard.
- A customer with a recorded deployment but unverified delivery sees an explanation of the missing evidence and a direct route to website hosting/recovery. Detailed Website Management likewise surfaces the next missing check.
- The prior publish, exact-preview inspection, owner approval, tenant isolation, health scheduling, failed-update recovery, billing boundaries and undo/rollback workflows are **unchanged**.
- `scripts/check-website-proof-v393.mjs` tests a positive complete evidence fixture plus stale/mismatched/unapproved/unhealthy/incorrect-HTTPS failures, missing-proof failure, and UI integration. It is part of the normal GitHub Actions production-foundation workflow.
- The V3.77 test fixture was corrected to stop treating an old health timestamp as proof. V3.83–V3.92 regression scripts still run after the version bump.
- App version updated to 3.93.0; iOS build 13, Android versionCode 13. **No new native binary is built or installed by this repository commit.**

## Not claimed / next live verification

- No new hosted customer website, DNS record, Stripe/paid entitlement or public enquiry form was created or activated.
- Source/CI checks are not a real HTTPS probe. The first approved staging business still needs **actual** controlled create → private preview → owner approval → publish → public DNS/HTTPS/route probe → visitor enquiry test (with public intake consent/Turnstile infrastructure separately enabled) → update → rollback.
- Public form intake remains disabled unless the existing independent security/privacy gates are intentionally met.
- App Builder's end-to-end native and public-customer journey remains a separate release acceptance task.
- Before any public DNS changes, paid staging, or customer content publication, obtain the owner's explicit approval; the next sweep can first build an isolated read-only staging evidence report.
- Validate on the signed iPhone: open Website Builder with an existing draft, open Website Management, and confirm neither page says "verified" when only an unverified deployment record exists. After a *real* passing public HTTPS route check, the same site should show verified on both pages. Recheck medium Display Zoom.

**North star:** show truthful progress and specific next action, so customers can self-serve with fewer founder support interventions.
