# Busy Does It — V3.197 Major Development Sweep

**Theme:** Business Brand DNA 3.0 — begin a **real FIRST App draft** from an existing owner website, and recommend the app only when the business may actually benefit. A provider-verified subscription benefit can be acknowledged, not invented.

**Base branch:** verified `v3.196`. **Development only:** no paid AI/image/video providers, external marketing contacts, live customer calls, authenticated hosted staging, production migration, domain deployment, app signing or app-store submission.

## 1. Website → FIRST private Business App

Previously, V3.196 design transfer required both website **and app drafts**. V3.197 adds a genuinely actionable `FirstAppFromWebsite` component inside the App Builder when a private website exists but no app exists.

Owner flow:
1. Choose **Adapt for app** / **Match closely** / **Start fresh**. The third route leaves the website and app untouched; ordinary independent App Builder controls remain.
2. Review the trading name, business type, website intro/description, owner-visible services, and compatible colours/layout decisions.
3. Explicitly approve. The controller rechecks the same website identity and generation, current tenant, exact reviewed content and absent app. It prevents duplicate taps locally.
4. Existing **authenticated `build_draft`** creates the **private** App record, using sanitized public profile fields. A new opt-in `expectedNoExistingApp` guard on the trusted Edge rejects the shortcut when an app already exists; ordinary existing draft refreshes work as before.
5. The returned server-created app ID/revision are checked, stored in the existing app view, and the existing V3.196 planner prepares a **separate**, owner-approved bounded atomic visual editing batch. This uses existing `apply_coordinated_edits` on the trusted backend. If the appearance update is unavailable or cannot be verified, the private app remains and Busy explicitly says the design step needs review instead of encouraging a duplicate.

This is **not** one atomic database transaction across app creation and appearance updates. A concurrent change from another device and hosted first-create behaviour still merit isolated live staging tests before calling the journey completely race-proof.

The direct website-to-app flow does **not** import gallery images/URLs automatically: website rights/approvals and native app asset storage contracts differ. It does not invent discounts, booking availability, reviews, events, customer records or private business contact details, and does not enable unsupported modules or publish the app.

## 2. Busy recommends an app — when it makes practical sense

`src/core/ownerAppOpportunityV3197.mjs` now provides an evidence-based, explainable, dismissible suggestion. It takes business type, existing website/private services and whether an App exists. Examples:

- Appointment-led businesses might benefit from approved services and booking **requests**.
- Trade/service businesses might benefit from a simpler enquiry route.
- Food/returning-customer businesses might benefit from menus, offers and contact options, when corresponding features are actually approved and enabled.

The suggestion appears in the Home marketing/opportunity list (not a forced interrupt, notification campaign, repeated external follow-up, or purchase action). A customer may ignore/dismiss it. It does not outrank urgent customer and booking work, and it never guarantees that an app will attract customers.

## 3. Verify any already-included benefit without pretending a tier is live

Busy can offer **Check if standalone app creation is included** in the new App Builder flow. This calls the existing read-only authenticated `standalone_eligibility_status` Edge action, which uses service-side billing ledger data and `decideStandaloneEligibility` from `standaloneEligibility.mjs`.

- The owner-facing **included creation allowance** statement is only permitted when the response is verified, eligible, same-business and has a positive remaining allowance.
- An arbitrary subscription tier name, user-provided paid claim, local checkbox or marketing promise **never** counts as entitlement proof.
- If verification is missing, Busy suggests checking their plan. They may still prepare a private Business App draft without claiming a complimentary standalone app.
- An allowance does **not** approve paid provider usage, create an app-store developer account, pay Apple/Google fees, sign packages, ship a store-installable binary, submit an app or promise every extra cost is included. Verified allowance can be used only within its actual provider and period terms.
- Wording should favour **“included in your current verified subscription”** over the misleading “free app”; this is a benefit the customer already pays for.

## 4. Quality, safety and architecture

- Pure first-build contract: `src/core/firstAppFromWebsiteV3197.mjs`
- Pure practical app-opportunity policy: `src/core/ownerAppOpportunityV3197.mjs`
- Reusable owner-review surface: `src/screens/firstAppFromWebsite.js`
- Genuine calls in `src/app/AppController.js`, `src/screens/miniApps.js`, and dismissible Home opportunity `src/screens/home.js`
- Opt-in only-first-app trusted guard in `supabase/functions/busy-mini-apps/index.ts`. The existing `build_draft` and `apply_coordinated_edits` server authentication and tenant authorization are reused, not replaced.
- Tests in `scripts/check-major-builders-v3197.mjs` cover field allowlists, client action wiring, wrong tenants and revisions, existing app refusal, tamper resistance, photo/privacy exclusions, original website preservation, verified/unverified allowance claims, and continued V3.196 brand transfer.
- Dedicated `.github/workflows/builders-major-v3197.yml` also runs all prior major builder regressions, product foundation checks, source parsing and four unsigned iOS/Android JS exports. Always inspect the final workflow conclusion.

## 5. Next development

Continue app-first practical industry screens, proper first-draft layout review, tenant-safe image approval/license portability, seamless onboarding and persistent opt-in Business Brand DNA. Strengthen server-side **first creation as a true atomic conditional operation** under an isolated authenticated staging test, rather than relying on a preflight read alone. Build a verified subscriber-benefits overview only after real provider billing entitlements and precise allowances are ready.

**Business north star:** Busy notices something useful the owner might have overlooked, explains why, helps them use what they are already entitled to, and prepares a reviewed result without hidden spend, unwanted notifications or owner effort.
