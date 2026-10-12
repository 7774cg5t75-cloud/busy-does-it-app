# Busy Does It — V3.195 Architecture Health Report

**Audit type:** first scheduled five-sweep review after V3.191–V3.194.  
**Scope:** repository source census, static relative-import graph, targeted inspection/refactoring of critical builder seams, cross-business handoff safety, Brand DNA foundations, offline functional contracts, unsigned Expo exports.  
**Source ref:** `v3.195` based on verified `v3.194`. No hosted staging installation, signed app, paid AI-provider call, production mutation, RLS policy deployment or customer account test.  
**Evidence:** `scripts/audit-architecture-v3195.mjs`, `scripts/check-major-builders-v3195.mjs`, and `.github/workflows/builders-major-v3195.yml`.

## 1. Source-health baseline: measured, not guessed

The V3.195 CI census captured a baseline of **631 code files / 115,861 physical lines** at the first V3.195 builder check. It scanned supported source-code extensions in `src/`, `supabase/`, `cloudflare/`, `scripts/`, `standalone/`, `sites/`, `staging/`, `plugins/` and eligible repository-root files. Blank/comment lines count; README/Markdown, JSON config, package dependencies and build outputs do not. A later documentation/inventory-only commit may slightly change the final number.

- **1,089 statically resolved relative-import connections; 0 cycles found** in this limited graph. This is NOT a runtime module-system proof: dynamic imports, path aliases and package imports are outside the graph.
- **63 migration files and 128 GitHub Actions workflow files** present at the audit snapshot. They need governance, not automatic deletion.
- Largest source hotspots (physical lines):
  - `src/app/AppController.js`: **17,710** lines; **50** outgoing static relative imports (about 674 KB source)
  - `src/screens/miniApps.js`: **4,954** lines; **48** outgoing static imports
  - `src/screens/work.js`: **4,239** lines
  - `supabase/functions/busy-mini-apps/index.ts`: **4,105** lines
  - `src/screens/customers.js`: **1,986** lines
  - `src/core/runtime.js`: **1,641** lines, with many incoming references
  - `src/screens/websiteBuilder.js`: **1,424** lines; **37** outgoing static imports

This is a reliable size and connectivity **snapshot**, not a claim that the entire codebase has undergone manual line-by-line review.

## 2. What we actually simplified and strengthened

### Shared private handoff validation

Previously, independent App-to-Website transfer modules each implemented their own same-business identity, draft-revision and stale-preview checks. Now `src/core/ownerBuilderDraftGuardV3195.mjs` is the shared, strict source of truth used by:

- `src/core/ownerBuilderServiceBridgeV3192.mjs`
- `src/core/ownerBuilderBrandBridgeV3193.mjs`
- `src/core/ownerBuilderTypographyBridgeV3194.mjs`

Checks require the same nonblank business ID, a current PRIVATE website ID/generation, a valid current private Business App ID/revision and relevant draft modules. Confirmation rechecks exact identities/revisions before the original feature-specific reviewed content tests run. Previous useful handoff behaviour remains unchanged.

### One reviewed private website save/Undo transaction

The service-copy, palette-match and typography-match actions in `src/app/AppController.js` now use the same **`commitReviewedBuilderDraft`** transaction. This centralizes generation progression, one Undo entry, Redo reset, current draft reference update and owner notice. The validated, owner-reviewed actions still select their own bounded operation.

This is a *targeted seam extraction*, not a reckless rewrite of the 17,710-line controller. The controller needs further staged decomposition with regression coverage before a large move.

### First implemented Business Brand DNA foundation

`src/core/businessBrandDnaV3195.mjs` introduces a **versioned, tenant-scoped, private, read-only** Brand DNA snapshot drawn from actual owner-entered website and Business App drafts. It carries bounded business name/tagline/about, approved services, brand colour, typography, approved images only, optional explicitly selected tone of voice, and source draft revisions. Conflicts between the two drafts are reported rather than overwritten.

`planBrandDnaContentBrief` creates a structured **starting brief** for six channels: website, app, social post, advert, poster and video. No finished materials are generated, no external AI invoked, no account/private contacts copied, and no publication occurs. The single owner-facing `BusinessBrandDnaPreview` is connected to BOTH builders and visibly identifies what is known, missing and in conflict. Brand voice is marked *unspecified* until explicitly selected. A local snapshot is **not** persistent memory, logo recognition or self-training.

### Regression and cost controls

`scripts/check-major-builders-v3195.mjs` performs **165** new focused assertions in the initial CI run: same-tenant isolation, stale revisions, negative authorization inputs, provenance, explicit photo approvals, malicious URLs, absence of owner contact/private fields, pure content briefs, both UI integrations and single reviewed private transaction. The inherited builder tests (V3.190–V3.194), production gates, syntax checks and unsigned iOS/Android exports run under the dedicated offline-only V3.195 workflow.

## 3. Priority risk register

| Priority | Finding and evidence | Action |
| --- | --- | --- |
| **High** | `AppController.js` is 17.7k lines and the most connected local module. Too many unrelated workflows and state responsibilities in one file make changes difficult to review. | Extract one related subsystem per future audit-aware sweep, retain controller contract, test before/after. Begin with cohesive private builder review workflows and state transitions. |
| **High** | `miniApps.js` is ~5k lines and imports 48 local modules; `work.js` is ~4.2k lines; trusted App Edge `index.ts` ~4.1k lines. | Separate owner editing, customer presentation, preview/review and request actions behind explicit typed contracts. Avoid changing real published APIs in untested restructures. |
| **Medium** | Business App appearance validation currently duplicates code between client and Edge; byte-identical contents is a checked workaround, not an ideal package boundary. | Keep strict parity assertion and investigate a safely deployable shared contract without introducing Expo/Deno import failures. |
| **Medium** | Cross-builder copy, colour and typography used to duplicate version/tenant and state-commit logic. | **Partially resolved V3.195** by shared guard and commit. Test old and new controls continuously; do not auto-sync previously published work. |
| **Medium** | **128 workflow files** make CI ownership, duplicate jobs and usage harder to manage. | Catalogue workflows by purpose and last successful run, deprecate redundant paths only after verifying triggers and owner usage. Avoid paid runner/provider expansion. |
| **Medium** | **63 migrations** plus RLS/Edge-service policies need a controlled compatibility ledger; source checks alone cannot establish live DB policy safety. | Review schema grants, tenant isolation, readback and migrations in an approved isolated staging test. No unsanctioned migrations. |
| **Medium** | Brand identity still lives across app/site private draft projections with differing approvals, meanings and values. No lasting Brand DNA record exists. | Introduce owner-approved Brand DNA persistence with version history, conflict resolution, per-business consent and export. Add readback tests before auto-reusing identity for live posts or ads. |
| **Medium** | Device screenshots, dynamic font sizing, accessibility, true signed apps, actual provider success and completed customer booking/enquiry outcomes are unverified. | Keep explicit offline/real-world test distinction and require owner approval for real environments/providers. |

## 4. Guardrails for future design and content use

- Brand DNA **belongs to one business**. Never share cross-tenant details or derive it from arbitrary customer records, private message contents, payments, or unapproved photos.
- An owner can accept, change, reject, export or intentionally diverge from a suggested identity. An edit does NOT silently change public websites, app-store binaries, scheduled posts, ads or materials previously sent.
- A new business website or app can optionally adopt the shared DNA, but needs platform-aware layout decisions: same brand **without** identical navigation or rigid template lock-in.
- Different media need medium-specific adaptation. A social post, video, advert or printable menu gets an owner's verified facts and approved assets; no invented prices, awards, events, reviews or business claims.
- Separate `brandVersion` history, confirmed owner provenance, asset licensing/approval flags, memory consent and per-surface publishing approvals will be necessary before broad reuse.
- Privacy-safe outcome evaluation and owner feedback are important, but **no model is automatically retrained** by this first foundation.

## 5. Delivery checklist and next review

- [x] Repository-wide code size and static dependency baseline
- [x] Identify highest-risk file/module and workflow growth hotspots
- [x] Replace repeated same-tenant cross-builder guards
- [x] Consolidate three private-website save/Undo paths
- [x] Add private shared Business Brand DNA preview to both builders
- [x] Cover six target channels without claiming content-generation integration
- [x] Run new + inherited automated source/contract checks and unsigned exports in CI
- [ ] Hosted authorization/RLS and real-device end-to-end verification: **requires separate approval**
- [ ] Persistent Brand DNA preferences, version history, explicit consent and media publishing integrations: **future development**

**Next full architecture checkpoint: ~V3.200**, with small maintainability checks every sweep. Next major feature sweeps should continue improving the App Builder and Website Builder while moving the Brand DNA foundation toward owner-approved, safe persistence and genuinely useful cross-platform design reuse.

**Interpretation:** This audit documents focused measured improvements and remaining risk. It is not an assertion of customer-ready release, production security certification, full live-service reliability or measured AI performance.
