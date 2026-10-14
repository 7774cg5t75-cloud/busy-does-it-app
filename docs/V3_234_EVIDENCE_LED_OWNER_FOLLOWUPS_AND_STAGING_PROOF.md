# Busy Does It — V3.234 Evidence-Based Owner Follow-up and Staging Proof

**Base:** Latest verified V3.233 head `2b874681b301df2aed42a0d9ab894067ec7f779c`, including prior master strategy update.
**Implementation:** Original business-scoped request, authenticated owner conversation and existing editable reply UX reused; **NO** new SQL migrations, purchase, external API job, hosted Edge deployment, real send or paid signing.

## Dual master preflight

Read newest available saved **Word product master V22.16 — Bespoke Software and Profitable Pricing**, specifically the customer-outcome promise, ordinary-owner simplicity, measured useful results and owner approval standard, and GitHub `ARCHITECTURE.md` including its latest three-level software vision, latest V3.233 verification, and standing dual-master/sweep policy. This is an implementation of existing Business Brain and customer-request functionality, not an unrelated bespoke code-writing platform. Current arbitrary-code builder/independent software/export and profitability commitments remain roadmap and were not represented as live functionality.

### Gap ranking from both masters
- **Source-proven:** original single-business saved request/conversation, owner-scoped fresh-check, editable owner-approved reply, Work booking ledger, source-tested safe booking cancellation and rollback.
- **Unverified live:** actual hosted staging Business App installation, signed-in owner A/B JWT isolation, genuinely private messages and customer receipt, backup/restore, physical notification delivery, calendar-provider propagation.
- **Chosen now:** explain one useful next step without falsely promising an appointment or contact; use original fresh conversation evidence; retain per-owner approvals; prepare a realistic live acceptance packet.
- **Deferred intentionally:** paid provider tests, live schema, custom software-code generation, new billing/add-ons, automatic external messages and full native device QA.

## Delivered code

1. **Evidence-led next action, not an AI-generated promise.** New pure `ownerConversationActionV3234.mjs` converts the CURRENT tenant-scoped `freshOwnerFollowupV3207` decision into one of: prepare an owner-approved reply, wait because the business replied last, manually review guest contact route, check a Work booking rather than infer confirmation, do nothing for a closed request, or refresh uncertain evidence. It includes a bounded urgency derived from actual last recorded conversation activity and emphatically no send, booking, charging or delivery authority.
2. **Improved actual activity evidence.** Existing `freshOwnerFollowupV3207.mjs` now returns `latestRecordedActivityAt` from the original request creation or last stored message. This corrects the misleading risk of using `request.updated_at` when opening/reading an inbox can change it. A stale customer request does not become 'fresh' merely because an owner viewed it.
3. **Connected to authenticated Edge owner action.** The existing `currentOwnerFollowup` reads exactly one business/app/request and at most two latest same-tenant messages, invokes the new helper and returns `nextAction` alongside its original proof. Existing same-request sourceStamp, permission checks, `guardReviewedOwnerSend`, owner-only draft review and idempotent message save remain authoritative.
4. **Strict owner app proof + simple UX.** New pure `followupNextActionV3234.mjs` verifies exact business/app/request IDs, sourceStamp, compatible follow-up category, owner approval and negative flags for sending, payment, booking and provider delivery. The previous reusable `followupProofV3207.mjs` validates this before exposing `nextStep`. Existing `miniApps.js` conversation shows a single plain-English BUSY suggestion next to the editable-draft button; no new navigation, store or settings complexity. Nothing sends automatically.
5. **Real staging acceptance preflight, not performed.** New `prepare-followup-staging-v3234.mjs` composes the original V3.231 two-business Auth/JWT review, V3.233 booking checklist and **12 additional follow-up cases**, including guest handoff, stale messages, mixed owner/customer timing, no auto-send, provider uncertainty, and review/approval. It SHA-256 pins six key source files, keeps all **34** genuine real-account/booking/follow-up scenarios **not verified**, retains the **69** SQL migration source count, and refuses to treat generation as permission to install.

## Independent checks

- `scripts/check-owner-next-action-v3234.mjs` exercises the real pure server helper + client proof together: original author roles, ageing, equal-time messages, guest/manual/booking status, stale/foreign/tampered source stamps and all negative side-effect flags. Initial GitHub integration run reported **199 V3.234 assertions passed**.
- Inherited **111 V3.233** and **108 V3.232** focused assertions passed, alongside the builder/customer UX modules, **105 Production Foundation** checks, and the original no-paid Snack preview workflow.
- Disposable PostgreSQL 16 runs original guest request → alert outbox/leases → device-gateway evidence → push-service receipt → owner status CAS with complete ROLLBACK. Disposable PostgreSQL 17 executes actual original V3.180/181 Work booking + V3.232 closure and deliberate fault-injected rollback. **Both passed** on the source-test commit.
- Recheck all three workflows against the final application-code/documentation head before declaring the branch green. A trailing Snack preview metadata commit after passing source checks is not further application-code modification.

## Current real staging boundary

Fresh **read-only** connected Supabase preflight found project `pnjdlogwegnqbsfpcofw` still contains only `busy_staging_rls_canary`, two initial canary migration ledger entries and no deployed Edge Functions. V3.234 did **not** install any of the 69 source migrations, create a staging user or exercise signed JWTs, execute backups/restores, contact Expo, send a customer message, schedule a dispatcher, pay for signing or modify production.

Before any hosted installation, separately confirm project catalog/ledger, required extension/service-role/cron risks, real backup and disposable restore, genuine isolated Auth/JWT owner A/B and revoked-user checks, and explicit owner's scoped installation permission. Then test fictional customer enquiry → stored request → correct owner inbox → approved reply → durable Work booking and delivery distinctions.

## Next candidate

**V3.235:** deeper code-health audit of very large AppController/Business App screens and one narrowly scoped extraction; strengthen outcome/feedback evidence; identify remaining Business App and Website Builder user-completion gaps. If user chooses, start the separately gated genuine staging installation prep, but never treat that consent as granted by this report.

**Standard:** BUSY chooses the right next action using trustworthy customer evidence, helps the owner do it, and reports only what has been proved.
