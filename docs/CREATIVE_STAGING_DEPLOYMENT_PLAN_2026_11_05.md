# Staging creative pilot deployment and rollback review

**No deployment or execution is authorised by this document.** Source preparation is complete for a default-disabled endpoint. Hosted experiment readiness is blocked by the missing original foundation and unverified provider/count/cost evidence.

## Exact proposed disabled deployment

- Repository: `7774cg5t75-cloud/busy-does-it-app`; branch `codex/builder-mission15-design-advancement`; PR26 against original Mission14, other drafts retained.
- Functional commit: **9f8378cfee17cf8498ed067f0092bebfc58df041**; tree **d707723456f536c36aebb25343e678215892ef33**. Use this frozen tree, not a moving branch checkout or report-only commit as an unexamined substitute.
- Staging project: **pnjdlogwegnqbsfpcofw**, independently confirmed name Busy Does It Staging, ACTIVE_HEALTHY, eu-west-2, PostgreSQL17. No other project is in scope.
- New endpoint source: `supabase/functions/busy-creative-pilot/index.ts`; original `busy-builder-proposals/index.ts` is byte-unchanged.
- Platform configuration: `[functions.busy-creative-pilot] verify_jwt = true`. Never deploy with JWT verification disabled. The handler independently verifies the user through original Auth `getUser`, rejects anonymous/foreign owners and uses original current membership/source checks.
- Server artifact: `disabledCreativeExecution`: `enabled:false`, `executionEnabled:false`, `execution:null`. No environment variable, existing secret, request property or client setting enables it. The deployment contains no owner execution/spending approval, actual tariff, token receipt or reservation.
- Secret reader: original lazy `Deno.env.get('BUSY_OPENAI_CREATIVE_PILOT_KEY')`. Never retrieve/export/log its value. The disabled entry exits before reading a service-role secret or constructing the live adapter. No live provider credential is touched in this mission.
- Deploy only the separately approved new function and its pinned imports/configuration. Do not deploy all functions, mutate SQL/Auth/storage, enable public acquisition or activate the original offline gateway. Deno compilation proves source graph resolution; the actual Supabase deployment/package/runtime remains untested until separately authorised.

Before seeking deployment approval: check the exact frozen CI outcome, package/import/configuration diff, server-only logs, JWT setting, target, rollback and no-call smoke procedure. Present those artifacts with an explicitly disabled deployment request. The deployment itself must wait for separate owner approval. This mission does not request immediate approval or treat the existing secret as permission.

After a separately authorised disabled deployment, record its function version/deployment identity and the deployed commit/tree. Confirm an invalid/missing JWT is denied by the platform and a valid authorised synthetic owner request reaches only the disabled response. Do not temporarily enable inference to perform a smoke test. Do not include credentials/JWTs in logs or artifacts. Runtime acceptance of the real Auth source remains a separate check from the synthetic transport tests.

## Actual database readiness and preservation blocker

Read-only catalogues show **none** of the four required original business tables, `busy_ai_private`, `busy_snapshot_private`, or public `busy_ai_*` functions. The original budget policy, entitlement, tariff, operation/event records and independent receipt reader are absent. Roles anon/authenticated/service_role and native auth.users/auth.uid exist; no Auth user rows were read. The Edge Functions list is empty. There is no deployed original gateway or pilot to smoke-test.

Existing public tables are `busy_marketing_waitlist` and `busy_staging_rls_canary`. They were inspected by catalogue name only; no waitlist contents were read. The original whole-app staging generator deliberately refuses public tables other than its canary, and its generated ACL pass is broad. **Do not remove its fuse, weaken its assertion, drop/move the waitlist or run the package unchanged here.** A compatible, preservation-reviewed installation artifact must explicitly retain existing waitlist data/schema/permissions and affect only required original Busy objects. That artifact and any hosted install require separate technical review and owner approval. This is an exact remaining installation blocker, not permission to expand into a general audit.

The source dependencies to review are the original business/membership/profile/snapshot foundation and its original protected profile projection, then `docs/sql-proposals/ai-budget/install.sql`, then the separate `docs/sql-proposals/ai-creative-receipt/install.sql`. Their SHA256 identities are in [source hashes](evidence/staging-creative-execution-2026-11-05/source-hashes.json). Preserve their review fuses. Do not introduce a substitute ledger, fake Auth service or parallel business store to avoid installation.

The reviewed original contract must supply:

- `busy_ai_context_v1(uuid,uuid,jsonb)` — current original owner membership, exact profile/snapshot/website revisions and bounded approved sources.
- `busy_ai_reserve_v1(uuid,uuid,uuid,text,text,jsonb,text,uuid)` — service-only central GBP admission; current enabled policy, verified entitlement, exact tariff, limits and immutable operation/nonce/source binding.
- `busy_ai_dispatch_v1(uuid,uuid,uuid,uuid)` — service-only, source recheck, 30-second reservation validity and durable at-most-one dispatch.
- `busy_ai_finish_v1(uuid,uuid,uuid,text,integer,integer,text,uuid)` — service-only actual usage settlement or retained unknown liability, never client/model-supplied charges.
- `busy_ai_operation_read_v1(uuid,uuid,uuid,uuid)` — separate exact service-only readback of operation, pricing, attempts, usage and receipt. Public/anon/authenticated must not execute these service ports. Private accounting tables retain RLS and no direct caller writes.

Only independently read-back installation/ACL/policy/source evidence may establish hosted readiness. Do not call reserve or any other mutation to test a read-only assessment. JIT reservation is performed after execution approval, not during a long owner-review period. Missing registration, entitlement or any freshness/cost evidence denies execution.

## Later live execution is a separate approval

After the foundation is independently accepted, establish only a genuinely authenticated fictional Quiet Light source through original authorities with separately authorised fixture setup. Capture its actual owner/business/project IDs and revisions, current words/branding and exact candidate. Rebind and regenerate every approval/input/wire digest if any identity, model, tier, schema or source changes. No client can select a different source, model, tariff, count, key, nonce or goal; the request is only `{version:1,operationId}`.

A later immutable **server-reviewed execution artifact** may contain the exact explicit owner approval receipt, source binding, operation/nonce, current tariff/account availability evidence, exact wire-bound token receipt and expiry. It is not a generic database store or a frontend configuration. Its authenticated/founder labels are trusted only because it is an independently reviewed server deployment artifact carrying the owner's exact approval; request properties or model output can never create it. The checked-in artifact contains none of those claims and cannot run. Any activation/configuration artifact must itself be separately reviewed and authorised. Original ledger CAS/readback, not a module-local flag or a billing alert, supplies durable single use.

The eventual maximum remains one fictional image-free request, <=4,000 full-request inputs, <=1,000 billed outputs including reasoning and <=£0.10 total admitted exposure. No tools, retry, fallback, customer records/media, automatic Studio save or publication. Verify real account/model access, intended processing tier, exact token counting (including full schema), current price/cache-write effects and GBP FX/fees/tax. Neither public documentation nor the owner-reported key proves those account permissions. Do not contact provider metadata/count/inference endpoints in this mission. The $5 project alert is not a hard cap.

## Rollback and uncertain outcomes

For an initial disabled deployment, rollback is a separately authorised redeployment/removal of **only** the new function with its artifact disabled; no database rollback is needed because no installation is authorised here. Preserve the original public gateway, waitlist and existing secret. Do not revoke/delete keys or change account settings without their own approval.

For a later enabled pilot, close both server settings, stop new entry/reserve/dispatch, and preserve operation, exact pricing, receipt and audit history. Under separately approved original budget retaining-rollback procedures, disable the original policy and revoke reserve/dispatch while retaining finish **and the independent receipt reader** for reconciliation. Do not apply `ai-creative-receipt/rollback-retain.sql` while liabilities remain: it revokes that reader. Do not drop tables or erase failed/invalid/unknown attempts. The reserved-acknowledgement guard prevents duplicates from releasing another handler's admission; lost reserve acknowledgement retains a pending reservation for inspection. A dispatched timeout remains unknown and cannot replay. Confirm actual provider/budget evidence before any future separately approved request. Returning to the deterministic candidate leaves the original website unchanged.

After any authorised execution, reconcile real input/output usage and provider request ID even if the design is rejected. Render both candidates with identical source/capabilities, review full pages blind where practical, and preserve inferior/no-op/invalid results. Original Studio is the only eventual save authority; CAS/readback/Undo and owner wording remain mandatory. One exploratory request proves neither reliable superiority nor Gold Standard approval.
