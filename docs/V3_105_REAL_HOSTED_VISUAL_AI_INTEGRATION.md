# V3.105 — Real Hosted Website Screenshot Review Integration

## What was completed

- Applied the **V3.104 disabled-by-default visual AI usage-meter migration** to the live BUSY Supabase project (`qgkmuiipicazmcxxmoxv`), including the service-role-only atomic reservation and completion functions. The live verification found **0 configured businesses, 0 enabled businesses, and 0 review attempts**.
- Deployed `busy-website-design-review` as a **new authenticated Supabase Edge Function, version 1** with `verify_jwt=true`. This endpoint does not replace or alter the existing website publishing, website worker, live website origin or public site.
- Strict owner/admin authentication and business membership, exact ownership of the current main website, exact `preview_ready` deployment and signed Storage preview provenance checks; client-supplied external URLs are never used.
- Added an internal-only Cloudflare Browser Rendering Worker source. It accepts only exact signed Supabase Storage preview HTML paths under the requested immutable deployment ID, has bearer secret authentication, blocks off-origin resources and scripts, and produces bounded 390px/1440px PNG screenshots. **Not deployed or billed.**
- Backend sends the two trusted images to one server-side configured vision model, requests a bounded JSON critique, validates only supported design-token proposals and records model token usage against one atomically reserved per-business monthly review attempt. Backend never updates a website or publishes it.
- Added a collapsible owner UI under Website Builder to check readiness without consuming a review credit; only when enabled does it offer `Use 1 review credit` explicitly. The owner sees suggestions and may choose to apply them to a NEW private draft; stale preview versions, changing business workspace/user, draft generation or updated time block approval.
- Private draft generation increments on edits so an earlier hosted preview is not incorrectly treated as current.
- Added automated checks for tenant permission, key/renderer fail-closed configuration, signed preview provenance, per-user consent, metering, frontend integration, and iOS JavaScript bundle compilation without paid EAS builds.

## What is currently enabled and what is not

**Enabled now:** Supabase usage schema (disabled initially), a deployed JWT-protected and owner-gated status/review API, V3.105 code branch, and tests. Existing website publishing continues unchanged.

**Not enabled:** The trusted screenshot renderer's Cloudflare deployment/browser binding, vision-model API key, per-business opt-in, any actual billable AI review, any signed iPhone V3.105 build, and any automatic public website modification. The user-facing V3.105 code is in GitHub, NOT installed on iPhone until a later signed release.

The backend defaults to `BUSY_WEBSITE_VISUAL_AI_ENABLED` being unset/false. The per-business `busy_website_visual_ai_limits.enabled` also defaults false. Both gates plus a funded monthly allowance are required. Current live counters: 0 enabled businesses and 0 review attempts.

## Next activation work (cost-sensitive and permission-gated)

1. Confirm a **Cloudflare Browser Rendering** subscription/limits and approve any provider charges. Install Cloudflare Puppeteer binding and deploy `cloudflare/busy-website-screenshot/` using its `wrangler.toml`. Supply a securely generated `BUSY_SCREENSHOT_SECRET` (never put in a tracked file).
2. Provision the same secret as Supabase `BUSY_WEBSITE_SCREENSHOT_RENDERER_SECRET` and the trusted fixed `BUSY_WEBSITE_SCREENSHOT_RENDERER_URL`. Add server-only `OPENAI_API_KEY` and an explicitly supported `BUSY_WEBSITE_VISUAL_AI_MODEL` such as a vision-capable `gpt-4.1-mini`. Confirm current pricing and monthly cap first. Do not use EXPO_PUBLIC for secrets.
3. Enable `BUSY_WEBSITE_VISUAL_AI_ENABLED=true` only after readiness tests of the exact private hosted preview, tenant isolation and signed-url rendering. Opt in a single test business via service-role-admin-controlled DB limit settings (not customer-controlled), with minimal monthly request cap.
4. Run precisely one owner-approved review of a fictional/test business hosted preview and inspect the true mobile/desktop critique, token metering and evidence. Test denial for other tenant users and non-owner/admin.
5. Only then consider enabling the feature for customers with visible allowances, clear billing disclosure, private before/after visual evidence, and explicit final publish approval.
6. For the iPhone, bundle V3.105 alongside the next larger group of customer improvements and use one signed Expo EAS build to conserve allowances. Free iOS JavaScript export is not an installable native binary.

## Known limitations / requirements before claiming full feature complete

- The Cloudflare Browser Rendering Worker is **source only**, not yet funded/deployed; actual screenshots and genuine vision feedback have not been executed on the user's live hosted preview. The status endpoint truthfully reports unavailable.
- Existing hosted website worker may still be an earlier design version; do not claim all V3.99–V3.105 visual improvements have been deployed until updated private-preview worker release is separately verified.
- Owner-approved AI suggestions currently regenerate the **private editable draft**. They do not automatically publish or produce a brand-new immutable hosted deployment; the existing prepare/review/approve website journey is still required.
- Credits are counted at reservation even if the provider or renderer fails after reservation; this is disclosed to the customer. A reservation is permanently consumed at most once per unique key, and concurrent requests cannot exceed the monthly cap.
- A real two-pass model critique and iterative automatic visual improvement should be enabled only when token budgets, provider costs, private screenshot retention, owner review, screenshot provenance and consent are thoroughly evaluated.

## Tests

- CI: `scripts/check-visual-review-gateway-v3105.mjs`, previous V3.104 review-cycle test, production checks and free Expo iPhone JS compile.
- Backend deployment: `busy-website-design-review`, V1, `verify_jwt=true`, Supabase project `qgkmuiipicazmcxxmoxv`.
