# V3.67 — Verified Business Activity & Results

**Status:** Development branch `v3.67`; not released. Extends V3.66 with a source-attributed read-only evidence view.

## Deliverables

- `src/domain/verifiedBusinessActivityCloud.mjs` requests read-only **status** snapshots from the existing owner-authenticated `busy-website-publish`, `busy-social-publish` and `busy-mini-apps` Edge Functions. No database changes, admin keys, automatic retries, posting or publishing.
- `src/domain/verifiedBusinessActivity.mjs` derives a business-wide timeline and verification state only from server-returned receipts, deployments and version records. Safely distinguishes **provider-recorded live**, **private preview**, **scheduled**, **failed**, and **unverified**. Missing responses are explicitly marked unavailable.
- `src/screens/businessActivityCentre.js` provides a new **Verified Business Activity** dashboard accessible from Home and the Growth Command Centre. Shows per-provider response availability and read-only audit timeline with buttons to inspect the original owner-controlled website, Business App or social screens.
- `src/domain/businessActivityQuestions.mjs` + `AppController.js` intercept factual spoken/typed Operator questions such as "Did everything go live?" **before** the existing command action routing, and answer from authenticated provider records (when available) rather than model guesses. Existing voice transcription remains unchanged.
- `scripts/check-verified-activity.mjs` exercises true provider-identifiable receipts, no false live successes, mixed Facebook/Instagram outcomes, duplicate records, source outages, stale/missing evidence, tenant isolation, safe API method/action, and Operator navigation wiring.
- `.github/workflows/check-verified-activity.yml` runs current regressions plus V3.64–V3.66 tests.

## Truth and security boundaries

- **Provider-recorded** means BUSY's authenticated publishing backend stored evidence of a deployment, live-version or destination-specific post receipt. **It does NOT mean we separately fetched the public site or post and verified external reachability.** Website health and provider delivery tools remain the authority for that.
- A private `handed_off`, `reviewed` or `scheduled` stage is NEVER translated into a public-success claim.
- Website live requires a deployment that **matches `current_live_deployment_id`**, with `state=live` and valid `published_at`.
- Customer Business App live requires a version that **matches `current_live_version_id`**, with `state=live` and app status `live` or `update_pending`. This means the BUSY Apps release record, not an Apple/Google App Store approval or public reachability.
- Social channel publication requires **both** a server-side `published_at` and a destination-specific provider result identifier, with no error. A queue row saying `Published` without a receipt is **unverified**.
- Provider channel failure stays separate from successful destinations. UI offers to inspect the original item, where the existing explicitly approved retry-only-failed-channel pipeline lives. The new view NEVER calls `retry_post`.
- A completed website or social post record cannot be linked to a *particular* Growth Project without a server-stored project/source identifier. V3.67 explicitly avoids making such attribution. Future versions may add server-authoritative links plus provenance records.
- Each source request carries the existing owner access token, a publishable client key (never a secret/service-role key), and the active business ID. Each response with a business scope is rejected if mismatched. Cloud activity is scoped per account and masked immediately on account/business changes. The server's existing owner checks remain primary.
- The view retrieves up to the backend's existing returned items, displays 25 timeline events (bounded to 60 in the pure model), and refreshes on entering or explicit user action. It isn't a complete immutable compliance/audit ledger.
- No new AI costs for typed evidence questions. Spoken questions still pass through existing speech-to-text.
- No paid infrastructure changes or extra account signups were made.

## Outstanding acceptance — do not claim production-ready

- [ ] Authenticate on a real iPhone and ensure only the owner's business activity is visible.
- [ ] Publish a real, consented test Facebook post and an Instagram post; confirm genuine provider identifiers, timestamps and accurate per-channel classification.
- [ ] Test Instagram failure and successful Facebook result with an approved safe retry; ensure only the failed channel is retried.
- [ ] Deploy a website preview, approve hosting, verify deployment record and visit the actual public URL independently; inspect failed route status.
- [ ] Review BUSY Customer App preview and live-version record; test actual customer access (separate from external store distribution).
- [ ] Sign out/switch business while three requests are in flight; confirm previous account details never appear.
- [ ] Simulate offline/unauthorised status calls, successful responses from only one provider and malformed responses; no false green status.
- [ ] Ask the spoken and typed question "Did everything go live for my new service?" and verify BUSY never claims service-specific success without a project linkage.
- [ ] Confirm voice publishing instructions and existing approval requirements remain unchanged.
- [ ] Native iOS build acceptance and App Store approval remain blocked pending Apple Developer account issue.

## Next step

Introduce explicit server-stored project-to-provider action correlation IDs and a durable, append-only, owner-scoped audit event feed for **true** per-service completion. Avoid backfilling inferred links from text similarity or time proximity.
