# Busy Does It — V3.228 Customer Enquiry Truth, Owner Follow-Through and Staging Review

**Base:** V3.227, source commit e1baab9c7a02ac9f14a93ebe41cd01195bf704c7.
**Scope:** Source-only improvements and no-network GitHub Actions. No actual staging installation, provider sends, production changes or paid mobile signing were authorised.

## Mandatory dual-master checkpoint
We consulted the latest saved Word product master **V22.13 — Quality-Controlled Content Improvement** and the GitHub **ARCHITECTURE.md** plus sweep policy and V3.227 checkpoint. Product master remains unchanged because this is implementation of already agreed technical goals: one shared Business App/request system, real rather than imagined customer outcomes, simple owner UX, privacy, legitimate website search improvements and explicit paid/deployment permissions. V22.13's new evidence-led website content improvement rule stays on the product roadmap; no bulk article generator was added.

## Actual source changes

1. **Mixed-device notification safety fix.** The original V3.227 Expo ticket classifier had treated a batch containing one accepted ticket plus a failed ticket as a blanket gateway-accepted outcome. V3.228 now requires *all* expected tickets to be valid accepted tickets for aggregate `provider_accepted`. Fully explicit rejection remains bounded retry-eligible via the original SQL machine. Mixed acceptance/rejection, missing, malformed, timed-out, partial or transport-unknown results become `uncertain` → `manual_review`; never automatically resend what may already have arrived on one device. Neither gateway acceptance nor request storage means actual device delivery.

2. **One Business App owner next step.** `supabase/functions/busy-mini-apps/ownerNextStepV3228.mjs` composes the *existing* private `owner_queue_summary` and four live alert states. It checks matching business/app IDs, count agreement and original latest-request receipt. The existing authenticated owner/admin Edge action calls this helper after its exact business-scoped server readback. The existing native Business App inbox then displays one simple recommendation, prioritising a saved new enquiry, uncertain alerts, reviewing requests or pending alerts. It sends no replies, makes no bookings, does not expose customer contact data, and introduces no new CRM or database.

3. **Full staged source hash-review packet.** `scripts/prepare-staging-gates-v3228.mjs` inventories **all 66** versioned migration SQL files and seven critical staging/business-app source files including the isolated business baseline, with SHA-256 hashes, byte counts and heuristic manual review flags. This corrects previous partial reference hashing; it does not deem any migration safe or installable. Results are a non-executable JSON in `/tmp/bdi-v3228-staging-review`. It fails on migration count or historical project/canary snapshot drift and marks every live safety/approval gate unverified.

4. **Regressions and maintainability.** New `scripts/check-customer-journey-v3228.mjs` tests mixed and malformed gateway results, every owner-next-step case, tenant mismatch/contradictory counts, original Edge/UI wiring, and the complete SHA manifest. The new `builders-major-v3228.yml` inherits existing builder, source, production and actual disposable PostgreSQL rollback suites. No new provider dependency, table, paid AI request or duplicative domain engine was added.

## Verification status — truth before claims
CI establishes source contracts and the disposable PostgreSQL transaction machine only. Check all final-commit GitHub Actions conclusions before calling the sweep green; earlier runs may be cancelled when additional commits land. This has **not** tested genuine hosted Supabase Auth/JWT or authenticated business A/B separation, a real browser enquiry, actual owner inbox on staging, Expo push acceptance or per-device delivery receipts. The dispatcher remains disabled/unscheduled and separate receiver-level delivery reconciliation requires another migration and owner-approved provider tests.

Fresh read-only connected Supabase checks at plan time found **Busy Does It Staging** `pnjdlogwegnqbsfpcofw` active with only `busy_staging_rls_canary`, two canary migrations (`20261010224121`, `20261010224205`) and no deployed Edge Functions. A historical JSON snapshot in CI must not be treated as fresh hosted proof.

## Required independent next gates
- Recheck precise isolated project identity, current catalog/schema/ledger, extensions, policies, cron and all SQL dependencies.
- Confirm exact migration selection and source parity; independently prove a real backup/restoration on a disposable isolated environment.
- Verify genuine signed-in two-tenant and revoked-membership JWT/RLS checks; obtain explicit owner's **separate installation approval** with scoped environment and reversible runbook.
- Install **only the separately approved isolated staging phase** and then verify fictional guest challenge → stored original receipt → one notification intent → exact matching owner inbox; denial for other tenant/replay.
- Per-device push ticket/receipt reconciliation, real provider call and scheduled dispatcher remain distinct explicit-approval stages; do not claim gateway acceptance as delivery.

**North star:** You tell BUSY what needs doing. BUSY does it correctly, tells the truth about the outcome, and asks the owner only for meaningful decisions.
