# Multiple customer engagements — bounded original-domain implementation
24 October2026. Mission15; existing branch and draft26.

## Authority, starting point and frozen source

Starting GitHub `4ab10b6d1d84c1112f1596dda57bb384431c7e26`, local mirror `8b138607513a73576a98bd74c001c38c990777e7`, identical tree `4beb93eaab4b751f355968bb245c0ac0cbfa5cb9`; clean worktree. GitHub commit tree, actual local branch, AGENTS, architecture, previous Repeat Customer Work implementation/report and complete374-child evidence rechecked. PR21→23→24→25→26 independently confirmed open/draft/unmerged with original bases and dependency heads.

Actual private V22.49 Word/document/footer XML reopened; original SHA `6107043b5470741cbc0bdb67ee52cf99917d1f9886f39a14d22fa290f2dfef11` verified. Private bytes/extraction/provisioning evidence remain outside Git. This mission **does not formally amend the Product Master** or adopt a permanent multi-engagement storage policy.

Corrected frozen functional local `fe717552947ba3a3b6ccb7e8487fe60c791fe79b`, GitHub `fad4dcf800ad828afe8f21dace9bbe7b1b81c16f`, identical tree `ff26cef21c11c6a4268e530472301a1f45b2fc51`. API/local commit identities differ; exact trees are verified. Final report/evidence are additive documentation after this tested freeze; final branch commit/tree verified separately.

## 1. Original limitation and bounded model

Original `replyActions[customerId]` has one complete current action. `customer.history[]` completion entries are job summaries, not complete archives of original actions, quote wording, all dates/status/source fields or unknown extensions. Original private reply storage is also one customer slot. Nothing in this mission reconstructs missing history.

Implemented `src/core/workEngagementProposal.mjs` as a finite **proposal for evolution of that original slot**, not an additional authoritative Work store. Candidate discriminator `kind:customer-work-engagements,version:2`; business/customer/reviewing owner/base revision; primary ID; bounded2–20 entries. Each entry retains an entire compatible JSON action, source reference/current source stamp, stable ID, and explicit `workspace-record` or `session-proposal` evidence. The first original action is fully copied, not summarized or implicitly completed/archived; unknown compatible nested fields, zero values, exact words and dates survive.

IDs derive deterministically from the exact original filing tuple: business/customer/Inbox ID/reviewedAt/queuedAt. They do not derive from names, price, displayed booking date, similar text or an incremented client revision. Snapshot revision remains exact review evidence, not an ID allocator. Missing/duplicate/foreign sources, customers and record IDs fail closed. Only an existing manual quote/booking/reminder with a resolvable original Filed reference is eligible. Linked Business App bookings are denied because this proposal does not read their separate request/Work ledger authority; simulated/manual-without-source and missing-history cases are not guessed.

The recorded source stamp observes the current customer/source; an original filing reference alone **does not prove wording is unchanged since the historical Work was created**. No old source hash or receipt is fabricated. The proposal owner is the current reviewer, not an invented historical creator.

Additional entries are deliberately restricted to private Prepared quote proposals. New amount and planned date start blank; the original customer requirements specialist prepares wording from the new exact Filed enquiry and approved business facts. Historical prices and dates are not silently reused. Current profile/source/role/revision and unresolved operation evidence remain bound.

## 2. Actual owner journey

Original CustomerDetail now renders `CustomerEngagementReview`:

1. With an eligible original complete Work record and a second Filed enquiry, choose **Review separate quote for enquiry…**.
2. Review the actual current requirements; **Keep current Work** consumes approval, or **Prepare separate quote** creates a distinct session proposal.
3. Use the original quote field implementation and `useQuoteActionReview` to enter current amount, exact wording and planned date.
4. **Review quote proposal** shows existing/proposed values; **Keep editing** or **Keep reviewed proposal in session** is one-use and bound to current typing/source/selection/context.
5. Deliberately select the original Work or session quote by exact engagement ID. The original is read-only here; the second reviewed fields remain available on returning to it. Original Work/customer/history are unchanged.
6. Further editing requires another deliberate review. Dirty field selection uses the original Keep/Discard specialist; leaving the session uses original owner-navigation protection. Source changes retain words and block action; nothing is automatically replayed.

**Two complete independently identifiable records are retained and selectable in the session proposal. They are not two saved engagements.** The first authoritative legacy action remains unchanged. The second is not serialized to the device snapshot, account, customer array, second ledger or cache. Reviewed is not a device/account/save/delivery receipt. Deliberate discard/unmount ends the proposal; no process-death, fresh-login or cross-device survival is promised. Unsupported models/records show a clear limitation instead of an editable invented customer or broad restore.

The UI blocks pending/unknown/confirmed-review booking outcomes and saving/unknown device quote copies for the same customer. Actor/owner role/business/scope/view/customer/action/profile/row revision/Filed source/selection/typing changes invalidate retained approval. No source observation clears an unknown operation.

## 3. Reused specialists and correctness

Reuses original CustomerDetail, quote source/requirements contracts, `useQuoteActionReview`, `useOwnerEditNavigation`, `protectQuoteDraftTransition`, shared semantic Card/Field/Button/styles and existing current customer context. No new quote, booking, memory or workflow engine; no AppController/MiniAppBuilder additions.

The original quote amount/message controls were extracted into hook-free `PrivateQuoteFields`, called directly by the existing Work parent so original parent traversal/callback behavior stays intact; bounded proposal review uses those same controls. No theme or owner-created content changes.

Quote review now accepts optional exact engagement/editor-session identity for deliberate session selection/review. This prevents one customer's selection from rebinding another engagement's callbacks or leaving a deliberately reviewed proposal in a false stale-source state. Without those optional inputs, original single-quote behavior remains unchanged. This volatile editor identity is **not** a server revision or own-save receipt.

## 4. Actual compatibility safeguard versus proposed enforcement

`completeBusinessSnapshot` now rejects the candidate Work-kind marker before legacy one-slot state setters run. Existing v1 snapshots remain unchanged. Original bytes are not flattened, repaired or downgraded. A pure legacy-write compatibility classifier rejects any change/removal of a v2 model; it is a design/classifier test, **not deployed server enforcement or a new legacy write fence**.

No v2 container is written by production persistence in this mission. Existing SQL writers still support only their reviewed original schema/finite operations. Original read/write fences, production fuses, disabled hosted flags, account session and exact receipts are untouched. No new SQL/RPC/grant is necessary for the session subset. No actual PostgreSQL tests were run; previous SQL counts remain historical.

The original Phase52 older-serializer counterexample is unchanged and freshly executed as the expected **known-loss** probe. Passing it is not a retention fix. A future migration must activate and verify compatible server protection **before any protected multi-engagement data exists**; this candidate does not make current hosted legacy saves safe.

## 5. Reviewable permanent transition design — NOT implemented/deployed

Proposed ownership: evolve the existing `replyActions[customerId]` value into the versioned container, with each complete action stored exactly once. Do not keep a competing authoritative active-slot projection, external ledger or customer database. View selection is separate volatile UI state; selecting a row does not mutate lifecycle/status or mark another action complete.

Mandatory ordering:

| Dependency | Required behavior | Current status |
|---|---|---|
| Original provisioning | Keep original SECURITY INVOKER busy_ensure_business and creator-membership semantics/business_id-only insert | Existing evidence/proposals preserved |
| Permanent domain decision | Approve container, simultaneous engagement semantics, source identity policy and role/private-field boundaries | Owner review needed |
| Canonical legacy mapping | Only map an actually retained complete action with exact filing/other trusted original identity; unknown fields preserved; no fabricated older records | Current Filed/manual subset prepared; other sources blocked |
| Privacy-safe readers | Fixed per-engagement metadata/field projections, live trusted actor/membership, exact tenant/source/schema; unknown private fields remain non-disclosed | New v2 readers not implemented |
| Finite writers | Server-derived owner, membership-before-row locking, exact expected original record/row revision/schema/source, finite append/quote-edit/removal, preservation of unrelated roots/unknown fields | New v2 writers not implemented |
| Mixed clients | Effective inherited/table/column ACLs, RLS/views/RPC/service bypass audit and both read/write fences; old unrestricted POST/PATCH/upsert/GET denied | Existing fused proposals; no hosted acceptance |
| Explicit migration | Reviewed old-record fingerprint/source/identity; construct original-slot container once; increment row revision only on actual server commit; supported schema changes only after client/service compatibility | No executable migration added |
| Exact receipt | Business/customer/engagement/operation/source and actual committed schema/revision; target-specific only; lost ack uncertain, no blind replay/matching-text reconstruction | Specification only for v2 |
| Diary/ledger/services | Per-engagement calendar/source linkage and original ledger semantics; no single-customer shortcut may overwrite or count the wrong action | Blocked pending finite domain support |
| Rollback | Stop new v2 operations, retain complete v2 data and both security fences; compatible read-only inspection, no flatten-to-v1 or unrestricted fallback | Required plan, not rehearsed |
| Isolated staging | Real owner/admin/member/revoked/foreign JWT/PostgREST, effective grants, two devices, concurrency, lost ack, mixed clients and fail-closed rollback | Separate approval and implementation required |

Before any privileged SQL exists, review fixed search paths/ownership, explicit live owner/business checks, private helpers and PUBLIC/default EXECUTE/role inheritance. Authentication grants alone are never authorization. Existing original snapshot remains the one account row; generic JSON paths/merge/replacement APIs are prohibited.

### Specific owner decisions still required

- Adopt the candidate original-slot model, and decide which types may be simultaneous versus lifecycle-linked.
- Decide how source-less manual records receive genuine stable original authority; until then retain them in legacy read-only form.
- Define collaboration/private-field permissions; no automatic admin/member access.
- Decide per-engagement private reply ownership/migration; original single reply slot is preserved, not silently multiplied.
- Approve corresponding client/service/read/write/migration compatibility scope and separately authorize hosted staging. No broad production cutover is implied.

## 6. Fresh verification and retained candidates

Corrected clean frozen source: **376 application passes,0 failed,0 blocked,0 unexecuted**, all child exits0 and runner0. The prior374 baseline is historical, not credited again. New original-domain/parent checks are included in the376, not added a second time.

Corrected-source production foundation **105 passes,exit0**; ten changed JS/MJS sources parse,exit0; original native-shell/AppBuilder/controller/Deno endpoint source parser exits0; static architecture audit exits0. These are source/synthetic tests, not native rendering, Deno semantic verification or hosted authorization acceptance.

Dependency preflight exits0: Node24.19.0/npm11.9.0,51 verified isolated packages, lock SHA `27d64370fa5d0efba6d5d7426b09e5cf92093ce14593848bb4bc92615e0f503d`. No new dependencies; VM10000ms and original process isolation unchanged. Full Expo/native build not executed: application installation/root lock unavailable in this offline environment. PostgreSQL execution0: no SQL/provisioning/ACL/privileged function changed. Genuine JWT/PostgREST, device/process-death/provider and rendered acceptance remain unexecuted. Original Phase52 probe hash `1480655ab323ce18b6fcfc99e635f4abc77692e18c3d419b7debf201598b95c7` unchanged.

Original-parent tests execute actual CustomerDetail, the new bounded specialist, original quote hook/shared fields and navigation with inert IO. Positive/negative coverage includes two complete records, exact selection/return, full prior unknown-field/wording preservation, zero/new price, source-specific stable IDs across observed revisions, different businesses with identical customer/Inbox IDs, duplicate/missing/malformed IDs, stale source/action/profile/revision, owner/admin/member/revoked/foreign contexts, pending/unknown operations, changed typing/view, consumed Keep/Discard, repeated callback denial and actual legacy bootstrap rejection.

Unsuccessful candidates retained: initial parent fixture exited1 at original CustomerDetail because customerNoteText was missing; added the actual original empty field to the synthetic fixture. First shared-fields extraction caused an original quote-parent regression to fail with a missing TextInput in inert traversal; corrected the hook-free extraction call in the original parent, retaining every original assertion and callback. Focused original quote/source/private device regressions then passed. The pre-correction candidate also dropped a second genuine typing event before rerender. Separated live input-source validity from approval/typing freshness; retained callbacks still fail after typing while consecutive input events are accepted. The new original-parent assertion was deliberately run against the retained pre-fix source and failed: actual First input event versus expected Second input event before render (exit1), then passed on corrected source. A Node child-process reproduction route was blocked by spawnSync git EPERM (exit1); reading retained Git source through the existing command tool avoided that unavailable nested-spawn route without relaxing sandbox protections. The initial full selection at local a9bc865f/GitHub105d840d was deliberately terminated (runner143) after342 passed,0 failed,0 blocked,34 unexecuted/unfinished in its retained evidence; no completion credit is claimed for it. The complete selection was restarted on the clean corrected freeze. No VM timeout, source assertion or security fence was relaxed.

## 7. Architecture, limits and next customer value

Three new production modules: bounded original-domain proposal, Customer proposal review, and shared stateless quote controls. No new package/store/API/account controller. AppController18,285 lines/96 imports and MiniAppBuilder5,403 lines/94 imports are unchanged; original monolith risks remain. Static audit1,513 files/159,641 physical lines/3,022 relative edges/zero detected cycles; dynamic coupling is not certified. Review stamps currently traverse loaded source collections; the20-entry candidate cap does not itself bound total workspace hashing cost. Benchmark and narrow that evidence before a broad permanent rollout. Required-field feedback and native/accessibility rendering also remain acceptance work.

Original Midnight/Daylight/Automatic, six Home areas, voice/orbs, quote/booking/privacy/approval/receipt controls and previously completed Creator/builder work preserved. No rendering or native acceptance claimed.

Highest-value next mission: owner review of this concrete permanent domain proposal, then original scoped-device encode/readback and one exact finite account append/read/edit contract only after schema/role/source compatibility is established. Complete per-engagement quote/follow-up continuation before booking execution. Preserve source-less legacy records and protected unknown fields; never use summaries to invent archives. Broad repeat-customer account filing, multiple durable quotes/replies, linked ledger/diary concurrency and hosted JWT/device acceptance remain unfinished.

Additional spending **£0**. No hosted Supabase access, SQL migration/deployment, screenshots/simulator/capture work, workflow dispatch, customer/provider messages, actual quote issuance/booking/payment/tax action, publication/campaign or paid build. No merge/rebase/force-push/history rewrite/dependency modification/PR closure. Private master and original confidential evidence remain outside Git.
