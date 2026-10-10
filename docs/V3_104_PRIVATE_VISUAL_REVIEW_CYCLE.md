# V3.104 — Genuine private screenshot-review cycle

## Goal
BUSY should review the actual mobile/desktop website, suggest only safe design improvements, create a *new private candidate* with approved styling changes, take fresh screenshots and compare the results. The customer retains complete publication authority. Avoid billing surprises.

## Built
- A pure, reusable `runWebsiteDesignReviewCycle` orchestrator which checks authenticated business context supplied by a trusted caller, opt-in consent, a confirmed one-call credit reservation, and two actual screenshot payloads before invoking one authenticated vision-model callback.
- A strict provider-evidence requirement for the returned screenshot critique, then `applyApprovedVisualProposals` restricted to allowlisted design tokens. Changes to user-supplied business facts, services, contact details, media, SEO, brand and publish state are rejected.
- After a customer-approved design-only modification, the orchestrator rebuilds the **private** website candidate, captures another mobile + desktop screenshot pair and reports independently measured layout problems before/after. No public publication, no automatic repeat model invocation, and no mutation of the original draft.
- A new named `rebuildPrivateWebsiteDraft` export in the existing website renderer to re-create the real HTML, SEO/page model and factual first-pass review from revised design tokens.
- A Playwright Chromium (real browser, not a mocked screenshot) offline measurement runner for 390px phone and 1440px desktop, detecting document overflow, navigation clipping and invisible/undersized main headings. It writes real screenshots and JSON comparison results for human inspection.
- A test fixture generates both an original and separately customer-edited candidate of the **same fictional gardening business**, avoiding false comparisons between unrelated sites.
- A staged, tenant-owned SQL ledger: visual AI off by default, monthly cap defaults to two attempts if later enabled, service-role-only reservation and completion functions, and per-tenant serialised/idempotent request handling to prevent accidental repeated calls. The migration is committed but **not applied to a live database**.
- CI regression coverage for cross-tenant denial, owner consent, atomic-reservation precondition, one-call limit, verified model feedback, owner approval, content preservation, and measured candidate recheck. An independent GitHub Actions workflow compiles the Expo iPhone JavaScript, runs Playwright and archives four real browser screenshots **without calling Expo EAS or a paid AI API**.

## Safety and release boundary
These changes are a genuine review architecture and local end-to-end visual QA foundation; **the full AI screenshot improvement loop is not yet active in the customer app**. The live Supabase worker/website publish code remains untouched. No website was published and no signed iOS binary was submitted.

A production implementation still requires:
1. A private server-renderer able to capture the **specific immutable, authenticated customer's** hosted preview (never arbitrary remote URLs). Screenshots must never be publicly readable.
2. A backend API that checks business ownership and applies the committed DB migration; use credit reservations and signed/private evidence records for every model call. The customer must see the review price/allowance before opting in.
3. An actual vision model connection with a server-only key, a known configured supported model, a capped request, provider token/cost logging and a retry policy which never silently charges again.
4. Reviewed optional styling proposals delivered to the customer's device. Owner selects changes, sees new private before-and-after previews, and can Undo/Redo before expressly approving an eventual **hosted** website publication.
5. More genuine creative-editing controls (per-page design, drag-and-drop, accessible image crop/placement, form layout, navigation structure, type scales). "Every possible change" is a long-term goal, not a claim for V3.104.

## Next recommended step
Connect the tenant-verified visual review endpoint and private screenshot capture to the existing hosted deployment and founder usage dashboard; then make a single authorised, metered end-to-end model review on a synthetic business site before permitting customer use. Maintain privacy and per-tenant billing guardrails.
