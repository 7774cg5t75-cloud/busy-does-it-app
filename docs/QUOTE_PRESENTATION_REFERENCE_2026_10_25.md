# Exact canonical quote references, presentation and request evidence — 25 October 2026

## Authority and checkpoints

Starting GitHub head `cfbf5308a2cd7de51f3b993f38beaea9269f379f`; local mirror `64d069276d1df32cd18183760c71efc5726c8612`; matching tree `2e74746053954468df6e8f80b1af963d93cebb7e`. Clean worktree, correct Mission15 branch and all five open/draft/unmerged dependent PRs independently verified. No dependency branch changed.

Genuine private V22.51 remains accessible outside Git, SHA-256 `9740b05c5e523ef881e50a03f3fd65b29c65667b2c874992712575db20aa2c3b`, matching the previously fully reviewed original. Its individual authoritative engagement model is retained. This technical slice does not adopt new permanent presentation, acceptance, retention or booking policy.

Final functional local commit `44e9eb92468663599113d4b4c0b14e2b8c334b75`, tree `3ccbfc1f560ada2c5b2a899178acfb5251eb7756`. Equivalent GitHub functional commit `e85f4bcc5918ac45afb5ccfacee28b8b47be44c8`, same exact tree. Final complete application selection and original-component/database bridge cover this frozen implementation. Subsequent documentation commits do not change functional source.

## Actual customer outcome implemented

An authorised returning owner can open one existing canonical engagement in the original Work/Get Paid panel, inspect its exact **saved** internal Prepared quote, deliberately review the amount/date/wording, record a private server-minted version reference, independently read it, and deliberately reopen it in a fresh supported session. No local customer object is manufactured or inserted into arrays. Existing unsaved quote words, follow-up and Work notes remain untouched. Unsaved editor changes are explicitly excluded from the saved version being reviewed.

When the quote changes, the reference keeps its original version and exact terms; inspection compares captured and current terms and explains that the earlier preparation does not apply to the new version. The reference is always **Prepared, not presented**. It does not prove an offer, external presentation, provider submission/delivery, customer response, acceptance or booking permission. Its UUID is a private identifier, not a public customer capability or access token.

`CanonicalQuoteReference` is a focused child of the existing `CanonicalWorkPanel`, using original Card/Button/semantic styles and canonical session/ticket/outcome ownership. No AppController change, duplicate quote engine, customer registry, booking ledger or restore layer. Fresh reads are observations, not restored own-save receipts. Source/view/account/role/revision changes deny stale approvals; one-use callbacks prevent repeated execution. Shared pending/unknown outcomes disable new approvals. Independent readback failure retains an acknowledged receipt; a lost acknowledgement remains unknown after later matching observation and cannot be replayed.

## Finite storage proposal

`business_work_quote_references` is subordinate immutable evidence of reviewed private preparation, not an authoritative Work replacement. It contains server UUID, exact business/customer/canonical engagement/creator, quote revision, fixed server-produced terms, full compatible Work/source fingerprint, preparation-only state, operation nonce and actual server recording time. Composite engagement FK, once-per-creator/engagement/quote-version and operation-identity uniqueness protect exact ownership/collisions. RLS is enabled, effective raw grants remain denied, and immutable updates reject attempts to relabel a reference as sent. Unknown compatible Work fields participate in the opaque fingerprint without being disclosed or replaced.

Four finite RPCs reuse original live owner/creator membership, source validation, snapshot-before-engagement locking and narrow Work projection:

- `busy_work_quote_reference_review_v1`: current exact quote version and trusted server terms, explicit no execution authority; denies after writer rollback.
- `busy_work_quote_reference_create_v1`: compare exact expected revision and terms hash, mint one immutable private reference and return a target-specific receipt. No caller-supplied terms JSON, customer acceptance, event timestamp, status or provider evidence.
- `busy_work_quote_reference_list_v1`: bounded keyset summaries, no quote/private wording; 20/50 page controls are not lifetime history limits.
- `busy_work_quote_reference_read_v1`: exact creator-private target, captured/current terms, honest missing-evidence states, no earlier operation ID/receipt.

Current-source privacy restrictions still deny reads/writes; historical availability cannot bypass deletion, revocation or source correction. The original three private purposes (`reply`, `followup`, `work_notes`) and agreement original/corrected/withdrawn records remain separate and unchanged. No legacy wording is migrated or interpreted as presentation evidence.

`CANONICAL_QUOTE_REFERENCE_ENABLED=false` is a separate hard-disabled client gate; all earlier gates remain false. The SQL is still production-abort-fused and undeployed. The client flag is not server authorisation. This CREATE-only package is not an upgrade migration for an installed earlier candidate. Read-only rollback revokes reference creation/fresh review while retaining narrowly authorised observations and protected records.

## Original presentation and response authorities actually found

| Existing authority | What it establishes | What it does not establish |
| --- | --- | --- |
| Canonical Prepared quote | Internal saved terms/version with independent revision | External presentation, sending or acceptance |
| New private quote reference | Reviewed exact private version and actual preparation recording time | Approval to issue, proof of presentation or public access |
| Existing owner-reported agreement | Creator-attributed unverified account, with corrections/withdrawal | Independently verified customer agreement or presentation |
| `busy_send_mini_app_message_v3184` | Authenticated original request customer or permitted business actor; stored request-scoped message, atomic review/unread updates | Exact canonical quote-version link or provider delivery |
| `messageDeliveryEvidenceV3185` | Bounded push-submission intent evidence, explicitly delivery-unverified | Customer saw a quote/notification or accepted terms |
| Communications Hub | Recorded customer/journey/source rows, honest draft/approved/recorded-sent distinctions | A provider receipt, canonical quote-version response or acceptance authority |

V3.184 explicitly returns `databaseMessageSaved:true`, `providerDeliveryVerified:false`. Its message rows contain business/app/request/sender/body/time, but no canonical quote UUID/version/terms reference. A message body mentioning a quote or similar amount is not a trusted structured relationship. Guest enquiries without signed-in identity do not gain an in-app chat recipient through this work. Date-only local communication summaries and locally recorded Sent labels are not imported as proof of exact event time or provider delivery.

Consequently **no exact quote-to-customer-response association is implemented or claimed**. The new inspection reports `customerResponseEvidence:no_exact_quote_reference_in_original_protocol` and provider/request evidence not established **by this protocol**, not that no messages or requests exist anywhere. No private customer messages are read across an unproven link.

## Original request creation and booking association boundary

Reviewed `submitRequest` and `customerRequestReceipt` in the original `busy-mini-apps` Edge specialist; V3.39 request schema, V3.184 message authority, V3.180 atomic handoff, V3.181 durable Work ledger and V3.233 classifier. Original signed-in request creation resolves live app/version/modules on the server, validates/sanitises request details, scopes actor/idempotency, checks reviewed app version and rate limits, and inserts the original request. Its payload whitelist has no canonical quote reference, and its customer identity is the authenticated consumer account, not an arbitrary owner CRM customer ID.

The request/link/ledger establish original business/app/request/customer/action/date/time/timezone identities; they do not establish a specific canonical quote revision/terms relationship. Customer-level source request hints, names, service, matching amounts/dates or owner-supplied UUID metadata cannot fill that gap. Two canonical quotes for the same customer must not adopt the same unrelated request through customer identity alone; actual SQL denies reading a reference through the wrong engagement even under that same customer.

A future **new** request carrying a server-minted immutable quote reference is preferable to reconstructing a missing historical link, but remains blocked by three concrete contracts: (1) deliberate permitted presentation of exact terms to a verified intended recipient, (2) a trusted recipient/consumer-to-canonical-customer relationship and response protocol, and (3) extension of the original request creation/idempotency and V3.180/V3.181 transaction authority to validate/store the exact reference. A private UUID alone must never grant consumer access. No original request input is expanded, and no accepted status or new request is minted during this mission.

Proposed finite future envelope: exact reference ID plus canonical UUID/revision/terms hash; server-established business/customer/recipient/app/version; original request/link/action/ledger IDs and expected revisions; independently authorised presentation/response evidence; explicit reviewed owner decision; original diary conflicts and transactional receipt. Validation belongs in the existing trusted original path, with a reviewed lock graph, atomic conflict handling and rollback—not a parallel association writer or generic JSON payload. This is a technical design requirement, **not an implemented association candidate or deployable writer**. There is insufficient current trusted data to safely commit that relationship; private reference storage is the implemented abort-fused preparatory subset.

## Fresh verification

| Fresh check | Actual result |
| --- | --- |
| Complete application selection, clean frozen source | **384 passed, 0 failed/blocked/unexecuted; runner exit 0** |
| Production foundation | **105 passed** |
| Original disposable PostgreSQL stages | **262 passed, 0 failed/blocked/unexecuted** |
| Canonical disposable PostgreSQL stages | **185 passed, 0 failed/blocked/unexecuted** |
| Final original-component/actual-PG bridge | **129 RPC children; Node/runner exit 0, all RPC SQL children exit 0** |
| Five changed JS/JSX parses, two Python compiles, native-source parser | Passed |
| Pinned offline tools/dependency integrity | Passed, 51 cached packages, no new dependencies |
| Architecture | 1,532 source files, zero static relative-import cycles; AppController unchanged at 18,287 lines |

Frozen SQL SHA-256 `b011849191223701b516413d986bd603f8a167e7d96831124324cdeb2a3c9c72` matches both SQL execution and final bridge. PostgreSQL expected-denial children have intentional nonzero SQL exits; a stage passes only when its denial assertions hold. No pre-existing production defect is claimed fixed: the implemented change closes a supported private quote-version continuity gap while leaving unproven external associations unavailable.

Security cases cover exact quote version and terms; same-customer wrong-engagement and foreign-business denial; member/admin/co-owner/revoked/anonymous denials; raw authenticated/service-role table denials; stale revision/forged hash; original-record preservation; immutable status; true competing reference creators; changed source; bounded private-free summaries; previous versus current versions; no send/accept/request/booking/payment writer in finite reference functions; and read-only rollback. Original SQL and old-client destructive-write/privacy checks are retained. Phase52 loss counterexample is byte-for-byte unchanged (`1480655ab323ce18b6fcfc99e635f4abc77692e18c3d419b7debf201598b95c7`).

The owner interrupted one intended bridge command before an execution artifact was created. No success is claimed for that cancelled attempt; after explicit Continue, the bridge ran successfully. The candidate and final bridge each pass separately; only the final frozen 129-call execution is credited as final parity. No failing application/SQL candidate was weakened or relabelled. Earlier mission failure evidence remains in its original reports. Companion CHECKS omit bulky successful stdout/fictional payloads; original raw artifacts remain in `.test-artifacts`.

## Architecture, performance, remaining policy and next value

No production dependency added. Original appearance modes, six Home areas, voice, builders, Creator/Growth, financial approvals and operation uncertainty boundaries remain intact. New source adds a focused specialist and finite session operation, not root state. Indexed per-engagement keyset pagination bounds summaries; each exact read inspects one canonical/source record and one reference. Full Work hashing is bounded by the original record-size contract; no broad snapshot restore/read grant or new source scanning strategy is introduced. Immutable private reference history grows without a lifetime record limit.

Permanent presentation/acceptance evidence classes, recipient disclosure, expiry/revocation of future offers, retention/erasure, legacy authorship, source rebasing, migration/backfill and hosted grant/rollout policy remain separately gated. A reference to an earlier quote cannot automatically become current or Accepted, and immutable storage does not override lawful erasure. No owner-private wording is reassigned.

Highest-value next stage: review the exact intended-recipient and quote-presentation protocol, then implement a finite new-request/reference association in the original request authority using local original schemas/fixtures. Only after genuine response, conflicts, permissions and receipt contracts are complete should booking lifecycle execution be considered. In the meantime the owner can safely retain, compare and reopen exact private quote versions without losing current work.

External additional spending **£0**. No hosted Supabase project access, migration, deployment, rollout enablement, real communication/provider action, quote issuance, booking/diary/payment mutation, publication, campaign/tax action, screenshot workflow or dispatch. Actual PostgreSQL17 used the approved private Unix socket with TCP explicitly disabled and fictional fixtures; it was stopped after verification. Mock UID tests do not establish real Supabase JWT/PostgREST, native/device/provider acceptance or release readiness. Full Expo/native compilation remains unavailable; parser/component transformation is not a native build. No owner manual testing requested.
