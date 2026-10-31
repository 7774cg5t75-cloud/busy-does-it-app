# Secure proposal gateway and central AI cost control — 30 October 2026

## Source and authority

Starting GitHub: `637c5d4e181ea152a444c24120b795e4df83f2d1`, tree `579bb0ee87b91770537963a308b7ed05f5cb344d`.

Published functional checkpoint: `02fed7fa0fb22106e89dc9f2c452ae1e9e8699e7`, exact tree `bdd0e3827085fcac1baf2a79aa0961d5a1e84c03`. Equivalent recoverable local commit: `4a5418aeb8bfe2df1dcc38d5da9bf79b9e35053d`, with the identical tree. The remote parent is the actual starting GitHub commit; local recovery retains equivalent additive trees without resetting/rebasing. This report follows in a separate documentation commit. PR #26 remains draft against Mission14; dependency branches are not modified.

Genuine private Master V22.66 reopened and checksum-verified: `11f7b3069894b40d4467d90ba6883eeb3e3584057ace5b37c511187c883a483a`, 2,684 paragraphs/19 tables. Apply Sections70 and72–76, reusing the prior complete review of this identical original. Private original/extraction remain outside Git. Security, simplicity, affordability, continuity and readiness requirements add no external execution authority.

## Implemented gateway

The new original-Supabase-Edge `busy-builder-proposals` entry point defaults disabled, rejects the production URL, and instantiates its privileged client only after the exact staging/offline-only server fuse. Its only provider is a deterministic offline simulation: there is no live OpenAI/model URL, provider credential, dynamic adapter selector, tool runner or code executor.

When separately enabled in an approved environment, source uses the pinned official SDK's server `getUser` and rejects anonymous users. Actor authority never comes from editable metadata or request fields. A finite service-only SQL reader independently locks current owner membership and verifies exact original business/profile/snapshot/project/page revisions. It selects only approved facts, the chosen private Website/App project and available original modules; no Inbox/customer workspace dump is exposed. The model envelope uses the existing bounded projection/structured proposal contract. Imported wording is data, and model output cannot change identity, budget, permissions or execution authority.

Requests are streamed with a4KB/3-second bound, goals capped at240 characters, structured output capped at16KB, simulation at5 seconds and SDK fetches at10 seconds. The database permits one dispatch attempt per operation, bounded account concurrency and60 recorded requests per business per UTC day. Default-denied live mode, unknown-tool/destination rejection, independent schema validation, current-source comparison, cancellation and unknown-result handling are implemented. Unauthenticated ingress abuse protection remains a deployment prerequisite; these application controls are not claimed to solve every Edge resource-exhaustion attack.

## Implemented real cost controller

Existing Website/App voice and conversation contracts are daily request counters; original standalone entitlements serve a separate purpose. They remain unchanged. No existing general monetary reservation ledger was found. This package adds one private cost controller tied to canonical business/membership records, not another billing/customer database.

Six private tables hold server policy, monthly entitlement accounts, global periods, immutable tariff versions, operations and audit events. All force RLS and deny direct mobile and service-role table/sequence access. Four finite public RPCs are executable only by the service role, with protected definer search paths. No client/model can mint an entitlement, tariff, allowance or policy change.

Admission checks current owner/source, verified current monthly entitlement evidence, expiry, current enabled tariff, exact feature binding, monthly account/feature limits, separate expensive-service allowance and global hard ceiling. Integer GBP micro-units, tariff currency, locked FX rate and uncertainty buffer make maximum reservations conservative and version-bound. Policy/account locking serialises concurrent admission, including across businesses sharing the global ceiling. The deliberately coarse global lock favours early correctness over high-throughput scalability.

The current model is centrally selected by the server; each enabled tariff defines finite token ceilings and cost bounds. Model/provider-specific aggregate caps beyond the global/feature/expensive controls, accurate provider tokenisation, real price feeds and vendor hard-limit enforcement still need provider integration before billable activation. There is no claim that every historical paid prototype already routes through this new ledger.

A private server-generated request nonce binds reservation ownership, dispatch and cleanup. Duplicate identity/goal conflicts and lost acknowledgements cannot release another attempt's reservation. Dispatch rechecks current source, membership, entitlement, tariff and ceilings, and rejects expired/non-reserved work. Unknown dispatched liabilities remain reserved; time passing is not proof of non-execution and never triggers blind retries or automatic refunds.

Trusted settlement uses held tariff versions and server-supplied usage evidence, returns unused reservation amounts, rejects conflicting or reused receipts, and retains an audit trail. Unknown work can settle later even after membership revocation without granting new work. Cost/token overruns retain the liability, block the account and trip the global kill switch. This is genuine transactional local-PostgreSQL accounting, not an interface-only estimate. Local entitlements, prices and receipts are explicitly synthetic; live provider receipt/invoice verification and subscription provisioning are not implemented or claimed accepted.

Customer responses contain plain guidance, no model names, tokens, reservations or micro-prices. No automatic upgrade, credit purchase, quality downgrade or account charge is introduced. Supported manual editing remains an honest fallback when admission is unavailable.

## Website and App journeys actually tested

The offline authenticated-source fixture follows the real handler → original context reader → actual SQL reservation/dispatch → simulated structured proposal → independent validation → client review adapter. It prepares original Website changes, saves only through deliberate original owner-approved atomic writing, independently reopens the exact private draft and restores sections using original Undo. Stale sources and duplicate requests cannot replay the provider or writer. No publication occurs.

For App Builder, the test builds configuration through the original server helper and first-App RPC. Dog-walking and festival goals produce different users/entities/workflows, with unavailable bespoke features labelled. The validated result feeds original App Studio configuration preview. Supported appearance/navigation changes are explicitly approved, saved through the original transactional Studio writer, independently reopened and undone. Original profile/module content is retained. New bespoke databases, staff identity/dispatch, live customer submissions, generated native screens and standalone distribution are not implemented.

The source client adapter prepares existing owner reviews; no live mobile gateway transport or new signed app is enabled. Current deterministic goal handling and original UI/save/approval controls remain the fallback. Synthetic Auth callbacks and local auth.uid shims are not real hosted JWT authentication.

## Fresh verification

| Check | Evidence | Actual exit |
| --- | --- | --- |
| Complete application selection | 450 passed;0 failed/blocked/unexecuted | 0 |
| Final focused gateway checks | Actor/body/source limits, malformed/model attacks, timeouts, cancellation and original review passed | 0 |
| Final foundation | 105 assertions passed | 0 |
| Final security-by-design / secret-lock | Passed | 0 each |
| Final architecture | Passed | 0 |
| Final syntax | Five changed JS/MJS files parse | 0 |
| Actual Deno, all three gateways and original Mini App type contract | Real pinned dependencies, frozen config; passed | 0 |
| Actual disposable PostgreSQL source installation and journeys | 30 stages passed | 0 |
| Fresh npm audit | 3 high/5 low/0 critical affected nodes; unresolved | 1 |

The450 selection completed before the final nonce, streaming-timeout and capability-binding closure. Final changed paths then passed focused gateway, genuine Deno, essential security/syntax/architecture and the30-stage real SQL rehearsal. This is proportionate combined evidence, not a claim of a repeated frozen clean-commit450 selection. The unchanged original449 cases were not rerun solely to inflate counts.

The30 real PostgreSQL stages cover atomic install/failure rollback, effective ACL/RLS, missing/invalid entitlement/tariff/policy, exact feature/source binding, duplicate/stale requests, same-account concurrent reservations, two independent authorised businesses competing for one global ceiling, expensive-bucket separation, current membership and tariff revocation, expiry, duplicate receipts, lost reserve/dispatch/settlement acknowledgements, malicious/oversized output, both original builder journeys, overrun kill switch and retaining rollback with authorised settlement afterward.

### Preserved failures and corrections

Initial SQL execution exposed an ambiguous `maximum` column/variable reference (exit1); the query now qualifies the actual operation column. Adversarial testing reproduced a genuine cleanup defect in unpublished code: a conflicting request released an earlier reserved operation (exit1). Private request ownership/nonces now prevent it, including duplicate requests with lost admission acknowledgements. A late capability-binding expression initially failed PL/pgSQL parsing (exit1); the parenthesised expression executes correctly in the final rehearsal. An interrupted correction had not run; it was detected from the actual file/log rather than assumed complete. No negative assertion was weakened.

Fresh audit node propagation differs from the previous3-high/28-low report, but dependencies and lockfile did not change and no remediation is claimed. Zod3.25.76 through Expo CLI devtools/MCP schemas remains affected by GHSA-mrhx-c7xc-m3w5; deepmerge4.3.1 through @expo/config remains affected by GHSA-gcqx-w48m-w2h4. The new Edge gateway does not feed model data to those toolchain validators/config merges. That narrows this path's exposure, not the findings or affected release gates. No incompatible major override, forced downgrade or audit suppression was used. Current official Auth guidance was consulted via the Supabase documentation tool; direct changelog retrieval was denied403 and was not bypassed.

## Review package and remaining gates

`docs/sql-proposals/ai-budget/manifest.json` binds exact install/rollback/runtime hashes and the disposable-only fuse transform. The executed SQL hashes match it. Installation requires the original reviewed connected foundation and a fresh private namespace; all changes occur inside one transaction. Default accounts/tariffs are empty, ledger disabled and hard ceiling zero. Retaining rollback disables/revokes admission and dispatch, preserving original business data, pricing, events, liabilities and trusted settlement/source readers.

Hosted activation is **not authorised or accepted**. The source package is locally rehearsed, but genuine current staging schema compatibility/identity, verified subscription/tariff provisioning, ingress controls, approved fictional Auth setup, deployment, real two-owner JWT/PostgREST checks and operational status/recovery remain gates. The older compatibility foundation is not captured production DDL. Real-provider pricing, usage/receipt/invoice reconciliation, quality/cost evaluation and migration of all intended paid features to central admission must precede actual paid inference.

No hosted SQL, Auth provisioning, gateway deployment, server-switch activation, production data access, real model call, customer communication, publication, booking/payment/invoice execution, DNS change, EAS build, signing, OTA or distribution occurred. Actual external spending: none. Owner Preview build29, accepted Home/orbs and existing release controls remain unchanged.

No new native/browser screenshots, device acceptance or genuine hosted verification occurred. Native entry/imports and dependencies were not changed; this server-focused mission did not repeat unchanged Hermes exports. Previous exports remain historical evidence, not new native acceptance. Broad owner manual testing is still deferred.

## Next substantial safe priority

Implement the trusted subscription/tariff provisioning boundary and a finite operation-status/reconciliation reader with safe client restoration. Extend real receipt/invoice adapters and disabled server admission integration to the original paid feature paths, with disposable concurrency/failure tests. Prepare genuine two-owner hosted Auth acceptance only after the exact separate staging activation approval. Keep live inference and native distribution closed until their independent evidence and approvals exist.

## Changed functional files

- `ARCHITECTURE.md`
- `docs/sql-proposals/ai-budget/README.md`
- `docs/sql-proposals/ai-budget/install.sql`
- `docs/sql-proposals/ai-budget/manifest.json`
- `docs/sql-proposals/ai-budget/rollback-retain.sql`
- `scripts/check-ai-budget-postgres.mjs`
- `scripts/check-ai-proposal-gateway.mjs`
- `scripts/testing/regressions.json`
- `src/core/builderGatewayReview.mjs`
- `supabase/functions/busy-builder-proposals/gateway.mjs`
- `supabase/functions/busy-builder-proposals/index.ts`
- `supabase/functions/busy-builder-proposals/offlineProvider.mjs`
