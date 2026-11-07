# Trusted quote-recipient review and original request identity — 25 October 2026

## Authority and source checkpoints

Starting GitHub head `2ee2d93af9d501eef87ffb8b7d4b2e163458c008`; local mirror `5ac5bea5aa9d4b49e01c95fc1c5aea27e0e4f401`; matching tree `a3384f72bbfdc9d0a0427dcaa30e9d28010754a9`. Branch/worktree/source and all five PRs independently verified. PRs #21 → #23 → #24 → #25 → #26 remain open/draft/unmerged; no dependency branch modified.

Genuine private V22.51 original remains accessible outside Git; SHA-256 `9740b05c5e523ef881e50a03f3fd65b29c65667b2c874992712575db20aa2c3b` reverified against the previously reviewed full original. Individual authoritative engagements remain approved architecture. New recipient disclosure, presentation, acceptance and retention policy is not adopted here. No private master/provisioning content is published.

Initial implementation checkpoint: local `3e60043c9446a6e353e37a3a263efc0064977f18`, tree `009f276e9cb348ceda8e4c5d5b060e51fab90e34`. Final guarded functional freeze: local `1b0b2c1e5a10ac4c28378d0efddedf5ad3339486`, tree `c66fed7fd197959c32957b3a4e69f78a895cba42`. Equivalent GitHub functional commit `392f444d0001752f33b053bc9e436b762db8b4b5`, exact same tree. Final full application selection and actual component/database bridge cover this complete freeze. Later documentation commits do not change functional source.

## Supported trusted relationship found

The original V3.180/V3.181 owner transaction persists `request_links.customer_record_id`, `linked_by` and exact business/request/action identity. The original request persists its authenticated `consumer_user_id`, business/app/reviewed version and state. Joining those exact records can establish **which signed-in account was linked to a CRM customer according to the original owner's recorded link**.

This is not independently verified real-world personhood, a current consumer sign-in permission, or proof that the request concerns a particular quote. CRM customer ID and consumer auth UID remain different identities. No name/email/phone/price/service/date matching, cached-client inference or new account-linking registry is used. An owner's link could be mistaken; the provenance is explicitly owner-linked, not certified identity. It does not by itself satisfy a future disclosure policy.

The reader additionally requires current canonical creator/owner authority, exact current quote reference, current customer/enquiry fingerprints, original link by that same owner, compatible request/module/link state, signed-in consumer existence, current supported live app/version and no conflicting consumer associations for the exact CRM customer. Missing, closed, foreign, stale-version, incompatible, revoked or ambiguous source evidence does not produce a recipient identity. A customer's multiple legitimate contacts are not guessed away: conflicting consumer IDs remain unsupported pending a reviewed policy.

## Actual owner task completed

From the existing Work/Get Paid canonical engagement, the owner opens its saved private quote reference, browses bounded original request-link candidates, deliberately inspects one, sees exact app/version/request/link revision and consumer provenance, and may hold a one-use **session-only** private review. There is no IO write or operation receipt for holding that review. It is labelled not saved, sent, shared or associated with a quote request. A fresh session independently recomputes the supported inspection from the same canonical reference and original request; it does not restore an earlier review or receipt.

The final original-component/actual-PG bridge demonstrates this with empty returning-session local customer/Work arrays. Quote amounts/wording, the second engagement, original legacy Work and private follow-up/Work notes remain unchanged. No account-only customer object is inserted into local arrays. Switching scope, actor, business, role, quote/reference, source epoch or selected observation invalidates old callbacks. One-use Keep/hold callbacks deny repeats. Failed or unsupported inspection clears the current recipient/review rather than continuing to offer a stale identity; private owner wording remains untouched. Same-actor role loss hides the consumer details.

`CanonicalQuoteRecipient` is a focused child of the original `CanonicalQuoteReference`/`CanonicalWorkPanel`; it uses existing semantic Card/Button/Text styles and the canonical session's finite scoped observation boundary. No AppController, root storage, quote engine, identity registry or booking ledger is added. All original private purposes (`reply`, `followup`, `work_notes`) and report correction/withdrawal paths remain independent.

## Finite SQL/client implementation

- `busy_work_quote_recipient_candidates_v1`: creator-private, current-reference-bound, keyset-paginated original owner-linked requests. Summaries expose request/app IDs and request revision, no consumer identity, message, contact or quote wording. Candidates remain unverified until explicit inspection; stale/unsupported app candidates can be rejected by the second reader.
- `busy_work_quote_recipient_review_v1`: revalidates the current exact quote/reference and source, then checks original request/link/app/version/consumer records. Shared request/link/app/version locks stabilise metadata during the observation; they are not slot reservations or future operation authority. Request type/module/link state must agree. An enquiry requires enquiry/enquiry_linked; booking-request identity inspection requires booking_request/booking_draft and an original action ID. Neither case executes a booking.
- Supported output: `recipientIdentified:true`, provenance `owner_linked_signed_in_request`, exact original consumer/request/link/app/version identifiers and persisted request/link revision timestamps. Unsupported output carries an explicit reason and **recipient:null**. Foreign request IDs do not disclose foreign consumer fields.
- Every result retains `notOwnReceipt:true`, `consumerAccessAuthorised:false`, `quoteRequestAssociated:false`, `customerResponseLinked:false`, `executionAuthorised:false`.
- A narrow index on original link `(business_id,customer_record_id,linked_by,request_id)` supports candidate lookup. The ambiguity check can scan the exact customer's linked requests; no artificial lifetime limit is imposed. Pagination remains bounded 20/50. No new identity table, generic JSON API or writer is introduced.

SECURITY DEFINER readers are necessary to inspect original restricted tables without granting raw SELECT. They first reuse original live owner/creator/customer/source authority and only inspect auth-user existence for the consumer already referenced by the permitted request. No arbitrary user-ID lookup, auth-user profile, token, contact details, private message body or unrelated snapshot is returned. Fixed search paths, qualified objects, original raw-read/write fences and restricted RPC grants remain. Authenticated database EXECUTE alone is not authorisation; member/admin/co-owner/consumer/foreign/revoked actors fail the trusted predicates.

`CANONICAL_RECIPIENT_REVIEW_ENABLED=false` is a separate hard-disabled client gate; every earlier gate remains false. SQL remains production-abort-fused, undeployed and CREATE-only, not an upgrade migration. The existing read-only rollback retains this inspection but grants no writes, disclosure or request continuation. Live source/creator restrictions still apply after rollback. The reference reader denies stale quote versions for recipient review even when private historical terms remain inspectable.

## Original request and response authority remains decisive

The original `submitRequest` resolves signed-in consumer identity, app/version/modules, sanitised payload and idempotency; it does not carry a canonical quote reference. This mission leaves that writer unchanged. The original V3.184 conversation transaction authenticates the request's customer/business actor and records request-scoped messages, but has no structured exact quote-version relationship and explicitly does not prove provider delivery. Free text mentioning an amount or private quote UUID is not a structured response or acceptance.

The new API's request is **identity evidence**, not the canonical quote's associated request. Two quotes for one CRM customer may legitimately observe the same recorded consumer, but neither adopts that request. Actual SQL proves the wrong engagement/reference pairing is denied even under the same customer. No request/link/ledger row is assigned a canonical UUID, and no acceptance, date/time/diary reservation, communication, financial state or quote lifecycle changes.

Missing contracts before a writer is justified: approved intended-recipient/disclosure policy (including whether the owner-linked evidence is sufficient), permitted exact-term presentation and revocation/expiry, original-request idempotency extended to an immutable quote reference, explicit source-bound response semantics, current actor/role/source/app revisions, lock ordering and atomic target receipts. A private reference UUID alone must never grant consumer access. Any later finite writer must extend original `submitRequest`/V3.184/V3.180/V3.181 ownership, not create a parallel request/booking service. Recipient metadata and session-held reviews are not mutation authority.

Historical authorship, source rebase, legacy private disclosure, erasure/retention and privileged migration remain separately gated. No automatic migration or public quote access occurs. Withdrawal remains an owner evidence decision, not legal erasure or acceptance.

## Fresh verification and corrected defects

| Fresh final check | Actual result |
| --- | --- |
| Full application selection on clean final source | **385 passed, 0 failed/blocked/unexecuted; runner exit 0** |
| Production foundation | **105 passed** |
| Original PostgreSQL stages | **262 passed, 0 failed/blocked/unexecuted** |
| Canonical PostgreSQL stages | **206 passed, 0 failed/blocked/unexecuted** |
| Final original-component/actual-PG bridge | **138 RPC children; Node/runner exit 0, all RPC SQL children exit 0** |
| Final changed-source parses, Python compile and native-source parser | Passed (5 JS/JSX, 2 Python files; not native build) |
| Pinned tool/dependency health | Passed; 51 cached packages, no new runtime dependency |
| Architecture | 1,534 source files, zero static relative-import cycles |

SQL SHA-256 `5d0147ced4b5e4b410f51827b58c309b137e4b947ff8ead7230e4e01d5861317` matches final actual SQL and bridge execution. Successful expected-denial stages intentionally contain nonzero SQL children; no failed assertion is counted as a pass. Supplemental rollback counterexample is reported separately, not added to the stage/RPC totals. Companion CHECKS omit bulky successful stdout and fictional snapshot payloads; original artifacts remain in `.test-artifacts`.

The SQL runner now loads the **original unchanged** request/app/version/link/notification-column and V3.180/V3.181 schemas/functions using the established account-Work scaffold method. Fictional request rows are seeded in those original schemas and linked through actual V3.181 enquiry-link execution; no claim of actual JWT-authenticated request submission is made. Synthetic live app/version fixtures are local data, not published applications. No booking ledger row is created by the recipient fixture or inspection.

New cases include explicit consumer-vs-CRM identity, co-owner/admin/member/consumer/foreign/revoked denial, same customer/two quotes and wrong-reference denial, missing/foreign request, wrong customer/link author, conflicting consumer identities, stale app version, malformed request/module/link tuple, corrected source, private non-disclosure, unchanged requests/links/Work and no booking mutation. Original concurrent revision, one-use, lost-acknowledgement, private-purpose, old-client and rollback tests remain intact.

Retained failures and intermediate runs:

1. `recipient-sql-candidate1.json`: 190 passed, 1 failed, 14 unexecuted. The fixture's fictional co-owner membership lacked its `auth.users` row; the original link FK rejected test setup (23503). Added the missing fictional user, preserving FK/denial assertions.
2. `recipient-sql-candidate2.json`: 194 passed, 1 failed, 10 unexecuted. The ambiguity fixture emitted its own JSON before the review; the harness parsed the wrong object. It now requires exactly one recipient-review-shaped result, retaining all assertions.
3. Earlier guarded-predecessor SQL/bridge: 205/138 passed, not credited as final guarded coverage. `recipient-app-final.json` was deliberately cancelled with exit 2 at 254 passed, 131 unexecuted (0 failed/blocked), when the additional request/module consistency guard was added. It is not a completed final selection.
4. Actual rollback counterexample reproduced that production-candidate defect: the earlier reader identified an inconsistent request tuple, while the final reader denied it. Original final function text and request type were verified restored after both transactions rolled back. The supplemental probe initially lacked a terminator after `pg_get_functiondef`; PostgreSQL rejected syntax, the probe was corrected without changing production source/assertions, and the successful proof plus intermediate error are retained.

## Engineering, readiness and next milestone

No production dependency or unnecessary controller expansion. AppController remains unchanged at 18,287 lines; source audit reports zero static relative-import cycles. All six areas, appearance modes, voice, builders, Creator/Growth and financial approvals are preserved by the broad regressions. No native rendering/visual acceptance is claimed. The Phase52 older-serializer loss counterexample is unchanged (SHA-256 `1480655ab323ce18b6fcfc99e635f4abc77692e18c3d419b7debf201598b95c7`), along with original provisioning, database fences, immutable evidence, rollback and disabled switches.

Highest-value next stage: settle the limited recipient/disclosure policy, then implement a finite, reviewed presentation/message attachment to the exact quote reference inside the original request/message authority, followed by an explicit source-bound response protocol. Retain the same canonical engagement UUID. Provider delivery, structured acceptance and booking execution are later separate gates; do not infer them from a saved message or owner link.

Additional external spending **£0**. No hosted Supabase reads/writes, deployment, migration, activation, actual messages/quotes/bookings/payments/provider actions, publishing/campaign/tax action, screenshots or workflow dispatch. PostgreSQL17 used explicitly disabled TCP and the verified private Unix socket with fictional fixtures, and was stopped afterward. Local mock UID/roles do not prove genuine JWT/PostgREST, device/provider acceptance or release readiness. Full native compile/runtime remains unavailable; parser/component transformation is not a native build. No owner manual testing requested.
