# Busy Does It — V3.230 Push-Service Receipt Truth, Enquiry Clarity and Staging Readiness

**Starting point:** V3.229 source head `b89e9ea54a2757698b5a28be6f97d5f72f5c2b07`.
**Scope:** Source-only implementation and isolated, automatic rollback testing. Not a hosted staging install, real delivery test, device-signing build or permission to activate push workers.

## Mandatory two-master checkpoint

Reviewed owner Library product master **V22.13 — Quality-Controlled Content Improvement** (most recently saved master), GitHub `ARCHITECTURE.md`, `DEVELOPMENT_SWEEP_AND_ARCHITECTURE_POLICY.md`, actual V3.229 source and its green GitHub Actions. Continue one existing Business App customer request/outbox/notification ledger, explicit owner approvals, no duplicate CRM, straightforward customer experience, verified results, safe costs and privacy. No product pricing/content policy changed; saved Word product master need not be versioned again for this technical source sweep.

## What changed

1. **Real Expo receipt classification, not device-delivery theatre.** Pure `pushServiceReceiptV3230.mjs` validates response provenance and ticket ID, maps a provider-reported `ok` to **push-service accepted** (handoff to Apple/Google) and provider `error` to bounded codes; unknown, incomplete and malformed outcomes remain **unverified**. None of these states proves the phone displayed a notification or owner read it.
2. **Monotone private database receipts.** Additive `20261014211500_v3_230_push_service_receipt_truth.sql` extends the existing private V3.229 service-only device-attempt ledger (not another notification database) with `push_service_state`, checked timestamp and a safe bounded error-code field. A SECURITY INVOKER service-only RPC binds the original intent, attempt number, recipient slot and exact ticket. First terminal result wins: duplicates and conflicting results cannot overwrite it; expired tickets can only become `expired_unverified`. The previous legacy `receipt_state` field is not taken as evidence of phone delivery.
3. **Disabled on-demand receipt worker.** New `busy-mini-app-guest-alert-receipts/index.ts` requires `BUSY_GUEST_ALERT_RECEIPT_CHECK_ENABLED=true`, a separate long worker secret and service-role server context. When separately approved and enabled, it would read at most 10 previously accepted ticket IDs, perform a receipt-only POST to `/push/getReceipts` (never `/push/send`), reconcile terminal receipts through the compare-and-swap RPC, and leave missing/uncertain receipts unverified without sending a duplicate alert. No schedule, hosted deployment, provider request or token contact happened during this sweep.
4. **Truthful, simple owner inbox.** The already-authorised `owner_queue_summary` reads a same-business count of gateway-accepted intents and shows them as **push gateway accepted — not phone delivery**, alongside pending and manual-review counts. The one-next-action label is now **Open new request** when a new enquiry exists, otherwise **Continue request review**. No new workflow, no owner messages or automatic bookings.
5. **Staging source parity and code health.** Migrated the existing offline source inventory, phase-one review and inherited checks to **68 SQL migrations** plus the separate staging-only two-table baseline; still refuses installation based on any historical canary snapshot. Reviewed current tree (789 JS/TS/SQL files), revealing largest coupling risks: `src/app/AppController.js` ~682 KB, `src/screens/miniApps.js` ~255 KB, `src/screens/work.js` ~183 KB, `supabase/functions/busy-mini-apps/index.ts` ~171 KB. The new receipt functionality remains bounded in small helpers and a distinct disabled Edge function rather than increasing the giant controller.

## Test evidence (source-only)

- New `scripts/check-push-service-receipts-v3230.mjs` ran **80 offline assertions** for receipt classification, no device claims, malformed ticket/tenant scope, source wiring, plain-language UX and strict no-install staging gates. Inherited V3.229 suite: **85** assertions; Production Foundation: **105** checks.
- Real `PostgreSQL 16` in CI executed original guest request → outbox → dispatch lease → original device gateway evidence → V3.230 push-service reconciliation with accepted/error/expiry conditions, restricted privileges, original customer preservation, no duplicate overwrites, **full transaction ROLLBACK**. It emitted `V3.230_PUSH_SERVICE_RECEIPTS_MONOTONE_AND_PRIVATE_PASS` and `V3.230_EPHEMERAL_RECEIPT_ROLLBACK_PASS`.
- Old website/app, staging, production and Snack preview checks are included in the inherited GitHub workflow. Confirm results for the final application-code commit before reporting all three green.
- These results DO NOT confirm a real Expo receipt, actual phone delivery, signed-in tenant A/B Supabase RLS, a real browser enquiry or ability to install in hosted staging.

## Current staging boundary / next decisive dependency

At the start of V3.230 a fresh read-only connected Supabase check returned `Busy Does It Staging` project `pnjdlogwegnqbsfpcofw`, with only `busy_staging_rls_canary`, original two migration ledger rows and **no deployed Edge Functions**. No SQL, secrets, cron, migrations, external provider receipts or build-signing actions were executed here.

Before *any* real staging phase: independently recheck exact isolated project identity/ledger/schema and true production–staging source parity; review all 68 migrations plus separate baseline, scheduler/http extensions and privileged functions; prove actual backup + disposable restore; test two genuine signed-in users and revoked membership with JWT/RLS; then obtain **specific separate owner approval for the exact phase**. Public guest request → matching owner inbox and provider receipt tests come only after these prerequisites and further separate provider approval.

**Next candidate:** V3.231 source work on real business-scoped inbox request status transitions, stale owner actions, signed-in staging test harness, provider reconciliation operational safeguards and gradual architecture simplification. Do not claim customer outcomes before real evidence.
