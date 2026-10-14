# Busy Does It — V3.223: Master-led staging phase-one readiness and better outcome evidence

**Base:** v3.222. **Status:** source-only changes, staging read-only introspection, private owner UI, tests and approval-gated plans. No production/staging migration, Edge deployment, website publication, customer submission, paid build, provider message or external charge.

## Master reviewed FIRST

Before creating the v3.223 branch I read the GitHub ARCHITECTURE.md, README.md, docs/AI_BUILDER_COMPETITIVE_LEARNINGS_AND_OPEN_SOURCE_STRATEGY.md and the V3.222 report. Permanent rules retained: Build fast. Build properly. Reuse intelligently. Improve continuously. Industry-neutral capabilities; Business Brain and Brand DNA; no duplicate builder, CRM, request database or editing framework; evidence of real customer outcomes; privacy, consent and owner approval; responsible open-source adapters only when proven superior.

Reuse: V3.180 staging-only baseline, V3.221 source/RLS checks, V3.220–V3.222 staging gates, V3.218 aggregate Business Brain, V3.222 single-action planner, actual V3.222 GitHub test infrastructure. No unreviewed new external library added.

### Mandatory two-master governance — separately verified

During the sweep an updated standing GitHub policy required **both** the owner's saved Word product master and GitHub's technical master. The GitHub architecture and competitive strategy were checked before coding. The latest available saved Library document, **Busy_Does_It_Master_V22_4_AI_Builders_Open_Source(1).docx** (living product master V22.4, dated 14 October 2026), was located and read **after the branch had already been started**. This ordering is explicitly recorded rather than claiming full dual-master preflight was completed first.

The product master's product vision, section 33 (shared marketplace mini-app architecture), section 34 (privacy-first learning), and section 52 (intelligent website/app builders and safe open-source reuse) align with V3.223: one Business App runtime, one shared tenant-scoped customer data model, real verified connected outcomes, user ownership, owner approvals and simple advice. The app-builder business backend remains the primary release blocker and must receive proper functional investment, not just more source-only planning.

V3.223 introduces **no new product/pricing/experience decision** requiring a new Word-master version; the existing V22.4 Word master is left unchanged, and this technical checkpoint is committed to GitHub only. Future substantial sweeps must first check **both** masters before creating a development branch. Do not claim the two stay automatically synchronised.

## Real isolated staging check

On 14 October 2026 an authorised SELECT-only check of Busy Does It Staging (project ref pnjdlogwegnqbsfpcofw) again found only busy_staging_rls_canary with RLS enabled and migration versions 20261010224121 and 20261010224205. The shared customer request tables, Business App backend and guest RPC are still absent. Only metadata were queried: no customer rows, email, credentials or production data.

These are point-in-time observations and must be independently refreshed before any installation approval. No database write was made.

## Source-only business schema compatibility

New module: src/core/stagingBusinessParityV3223.mjs

Compare the existing STAGING-ONLY business core staging/ISOLATED_ONLY_business_core_v3180.sql to the historical production-bridge source supabase/schema/v3_25_production_bridge.sql, reusing V3.221's baseline/source RLS review.

The business table source expects id, name, created_by, created_at, updated_at. The membership table source expects business_id, user_id, role, created_at. The checker verifies baseline source columns and matching source FK targets in the bridge.

The bridge is NOT an authoritative/current production schema export: it also describes calendar connections and push delivery, and contains field names access_token, refresh_token and expo_push_token. Do NOT copy this bridge into staging, copy any production rows, or assume matching source names prove production permission/schema equivalence. The checker is a limited source scanner, never an installer.

New metadata-only SQL: staging/READ_ONLY_v3223_phase_one_schema_contract.sql. It selects column names/types/defaults, current RLS/FORCE RLS indicators, policy metadata, public function signatures and SECURITY DEFINER flags, visible busy_ table names and migration versions. It reads no business/customer rows and is not executable installation SQL.

## Recovery without destructive automatic rollback

New files:
- src/core/stagingPhaseOneRecoveryV3223.mjs
- scripts/prepare-phase-one-review-v3223.mjs

The offline script uses the already recorded canary snapshot, existing staging-only baseline, bridge reference and SHA-256 source hashes to generate a review-only JSON packet under /tmp/bdi-v3223-phase-one-review.

It models:
- Identical before and after metadata: no observed change, still independently re-check.
- Both candidate business and membership tables appear: a hypothetical valid shape needing genuine SQL constraints, owner Auth/JWT/RLS, grants and backup/restore verification.
- Partial table installation, extra objects, missing canary or unexpected ledger versions: STOP, preserve evidence and investigate.
- Claimed backup restoration or owner/operator approval: only caller assertions; real backup, restore and approval NOT verified.

It deliberately never creates a disposable database, applies migration SQL, generates automatic DROP CASCADE rollback, sends or bills. Real isolated disposable backup and restore rehearsal plus exact separate owner approval remain necessary.

## Business Brain intelligence and simpler owner experience

New: src/core/businessEvidenceFreshnessV3223.mjs and src/core/businessNextActionV3223.mjs.

Reuse V3.218's bounded, same-business aggregate quality checks and V3.222's one-action recommendation. A rollup for owner review must have a valid explicit start/end/as-of period, no contradictory counts, a report period no longer than 32 days and an end within seven days of the supplied server date. An invalid, stale, future or foreign-business rollup cannot influence recommendations.

A possibly saved request takes priority for original receipt verification; an outdated published app version requires owner review; timely same-business reports may suggest reviewing waiting enquiries; otherwise advise a verified available module or help plan a missing capability for any legitimate business.

The existing website/app review now uses the updated shared Business Brain adapter. It still presents one concise recommended action and optional deeper detail, not a new complicated editor.

Crucial provenance limit: even a server_authorized_rollup source label and reporting time are caller-supplied to these pure modules. They do not independently fetch, authenticate or verify a real backend, customer count, booking, message delivery or customer success; no cross-tenant learning or automatic provider activity is performed.

## Testing and credit control

New scripts/check-builders-v3223.mjs tests actual baseline and historical bridge content, missing columns/foreign-key targets, credential-bearing source warning, wrong project, changed/partial staging state, no automatic rollback, invalid/stale/future owner reports, tenant isolation, uncertain customer requests and stale app/version recovery.

New scripts/prepare-phase-one-review-v3223.mjs produces only a source-hashed hypothetical review packet.

.github/workflows/builders-major-v3223.yml executes the new suite before all inherited CI checks. It cancels superseded branch runs and keeps heavier unsigned platform exports behind an explicit manual workflow_dispatch; no paid signed native build or provider calls.

The first V3.223 GitHub run passed 118 focused assertions, both the V3.223 builder/safety workflow and the separate Production foundation check, along with 298 bundled Snack modules without unresolved imports. Five later checks were added requiring the metadata inspection SQL to remain SELECT-only. Verify the FINAL commit CI separately; this is not proof of a real database install, restore, authenticated RLS, signed app or customer request.

## Next proposal — V3.224

Advance real phase-one isolated staging readiness only with fresh independently checked target, authoritative production *schema-only* reference, verified dependencies/privileges and provider side-effect isolation, disposable backup/restore, true two-tenant Auth/JWT/RLS and explicit owner-approved phase scope. Preserve the canary and historical ledger. Only after actual shared request RPC and owner inbox work safely may public website-native forms be considered.

In parallel improve privacy-conscious per-business outcome capture and transferable Brand DNA across website, app and marketing, following the permanent open-source reuse principle and the simple owner UX.

**North star: You tell Busy what needs doing. Busy does it — properly, with verifiable outcomes.**
