# Busy Does It — V3.196 Major Builder Sweep

**Theme:** Business Brand DNA 2.0 — reuse a familiar design when moving between websites and Business Apps, with real owner-controlled editing rather than a mock AI handoff.

**Base:** verified `v3.195`; development branch `v3.196`. No paid AI/image/video generation, customer messages, real provider calls, cloud staging deployment, database migration, app signing or store submission.

## 1. Build a Business App from your existing website's design

A new `WebsiteToAppDesignTransfer` component is wired into the App Builder. It offers three clear, optional choices:

- **Match closely:** transfer validated brand hex colour, compatible typography and service presentation from the current website.
- **Adapt for an app:** preserve the identity but also prioritise a supported action according to business type and enabled modules: hair/beauty → booking request; food/catering → offers or services; trades → enquiry; other businesses → services where available. This rule is a deterministic, explainable starting point, not inferred availability or a guarantee of conversion.
- **Start fresh:** leave the existing private app untouched.

Owners may separately approve adding **only missing, owner-authored website services**, never replacing existing app service wording or enabling an app module without consent. Incompatible fields are explicitly omitted. Images are NOT silently carried across: their source approval and asset URI contracts differ between platforms.

The preview calls the existing bounded `proposeCoordinatedAppChanges` core, and the approval uses the existing authenticated `saveCoordinatedAppChanges` → `apply_coordinated_edits` Edge service. Up to eight supported operations are committed in **one server-verified private app revision**, retaining existing navigation/modules not explicitly approved. Private app design does not change a published marketplace or standalone app until separately previewed/published.

This feature requires **both an existing website draft and an existing app draft**. It does not yet create a complete native app with one tap directly from a website, provision developer accounts or sign/store-submit an app.

## 2. Adapt an existing Business App design into a website

A new `AppToWebsiteDesignTransfer` is wired into the Website Builder. Match, adapt or remain independent. The preview can coordinate the supported brand colour, typography and responsive service card/list styles. The owner may opt to add missing app services without overwriting existing website wording. Each proposed change is displayed before approval, and the current source/target identities and versions are checked again when tapped.

The controller applies supported private operations with the existing `applyWebsiteLayoutChange`, rebuilds HTML/content where service copying is necessary, then commits **one website Undo entry** through the V3.195 `commitReviewedBuilderDraft` helper. It does not publish the website or mutate live apps, bookings, contacts, messages or payments. The website design remains appropriate to browsers rather than becoming an identical native mobile screenshot.

## 3. Actual shared engineering and safety

- `src/core/websiteToAppBrandTransferV3196.mjs` and `src/core/appToWebsiteBrandTransferV3196.mjs` implement narrow, pure, versioned handoff contracts backed by the existing V3.195 same-business/private draft guard.
- All changes require the owner to select a mode and review the exact proposed operations. The owner can decline or choose a different design entirely.
- Negative cases reject foreign business IDs, explicit foreign website ownership metadata, missing drafts, changed app revisions, changed website generations, modified preview operations, unexpected field values and unsupported content.
- Services are de-duplicated by name and limited to 30. Existing app and website service details are preserved. Arbitrary HTML, CSS, scripts, unapproved photos, customer records and payments do not enter this flow.
- Consistency and expectations are covered in `scripts/check-major-builders-v3196.mjs`, plus the inherited test suite and `.github/workflows/builders-major-v3196.yml`.
- The trusted App Builder's real atomic save is reused; this does **not** add a new provider, cloud API endpoint or schema migration. Keeping the owner-control interface modular also avoids another large block of website/app review state in the oversized `AppController.js`.

## 4. Definition of done / remaining work

- Feature tested in **offline synthetic fixtures and source-verified wiring**.
- Signed app production, real-device responsiveness, authentic multi-owner staging/RLS tests, real customer booking outcomes, user acceptance and app-store releases are **not** established by unsigned Expo exports.
- Design transfer works best after both drafts exist; we should later offer a faster integrated creation journey that starts a new draft using Brand DNA while carefully retaining account, consent, asset approval and platform provisioning boundaries.
- Industry-first recommendations are finite rules and may need richer business categories, owner feedback and outcome evaluation before becoming truly intelligent.
- Business Brand DNA remains a private snapshot/brief foundation; durable per-business brand memory, asset rights, owner-approved versions, tone of voice learning, content creation outputs, social/video and cross-channel campaign execution need future development.
- Keep doing focused architecture checks every major sweep. The next full audit is approximately **V3.200**, per `docs/DEVELOPMENT_SWEEP_AND_ARCHITECTURE_POLICY.md`.

**Product principle:** “Build your business identity once. Let Busy adapt it everywhere.” Every reuse is optional, explainable, and owner-approved, with the current public business presence unchanged until the owner intentionally publishes.

**Notes on verification:** See the final GitHub Actions run for actual pass/fail evidence. Avoid treating the existence of this document as proof of signed builds or production delivery.
