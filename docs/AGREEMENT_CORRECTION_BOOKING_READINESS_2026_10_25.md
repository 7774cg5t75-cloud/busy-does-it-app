# Agreement correction, exact quote evidence and booking readiness — 25 October 2026

## Authority and frozen source

Starting GitHub head: `8c972e65b148c8dd7ea1082d6058dd6d8fc935ae`. Starting local mirror: `b947099a0f073783735166ba365266b34947a3de`. Both share tree `d2cae44127d4dde9e2eb4efbf3fd8986f2ea3d94`. Branch remains `codex/builder-mission15-design-advancement`; the worktree was clean before implementation. All five PRs were independently checked open/draft/unmerged with bases preserving #21 → #23 → #24 → #25 → #26; dependency branches were not modified.

The genuine private V22.51 DOCX was reopened (2,198 paragraphs, 19 tables); SHA-256 `9740b05c5e523ef881e50a03f3fd65b29c65667b2c874992712575db20aa2c3b`. Complete original/extraction remain outside Git. The approved canonical engagement architecture remains authoritative; permanent correction/withdrawal, retention and acceptance policy is **not** adopted by this technical proposal.

Recoverable local checkpoints:

- `3a552f45e0604febef432d2f15d261ad94f71989`, tree `a8a0439137b337e9aa346fe90d154b0b0ce9e2c6`: finite append-only decisions, readiness inspection, original component integration.
- `309672590050dcdfbe5c33fc3971242def123d24`, tree `289214ed9bed0c801f10f27ca85223bbf4da1600`: source-scoped repeatable loss-probe IDs, preserving server nonce uniqueness.
- Final functional freeze `811abd3f87b86f312489c2e09215507c2d72904e`, tree `271edf1a063e898acd8983daae891744fff23cf4`: correction approval controls also disable during pending/unknown outcomes.
- Equivalent GitHub functional commit `6150854fdda22d274f787394197a794460d40d63`, same exact final tree. Documentation-only commits do not change this tested functional source.

## Completed owner journey, local synthetic implementation

The owner deliberately opens an existing exact engagement/report, inspects a fresh server-derived decision context, sees original and currently interpreted wording, types a correction or withdrawal reason, reviews old/proposed wording, records one decision, receives its exact target-specific receipt and independently reopens the status. An independent account session observes corrected or withdrawn status without inheriting an own-operation receipt. The quote stays Prepared throughout.

`CanonicalAgreementDecision` is a focused child of the existing agreement specialist inside the original canonical Work/Get Paid panel. It reuses Card/Field/Button, semantic appearance, canonical session and original dirty-editor/one-use navigation mechanisms. No local Customer is manufactured. Fields remain session-only until an acknowledged finite write; preserved running words do not imply device durability. New typing during context/readiness inspection is retained. Stale source, selected target, account/role, revision, source-review epoch or editor stamp prevents old callbacks. Explicit Keep consumes the review ticket. Shared pending/unknown outcomes disable new decision approvals, and session commit independently denies replay.

Readback failure after an acknowledged write retains the receipt and unfinished words. Inspection is an observation and cannot clear an unknown outcome. Fresh review replaces an older displayed readback; successful decisions invalidate an earlier readiness observation. Original follow-up and internal Work-note editors retain separate words/revisions.

## Append-only decision model and finite authority

The fused canonical proposal now includes `business_work_agreement_decisions`, subordinate to the existing immutable agreement report, **not** a generic event store or a second Work ledger. Each event has server UUID/time, exact creator/business/customer/engagement/report identity, independently increasing decision revision, action (`correct` or `withdraw`), exact bounded statement, original quote revision/terms hash and separately recorded current reviewed engagement/source revision. A composite foreign key binds attribution, target and original terms to the immutable parent. Unique report/revision and creator/operation keys reject collisions. Raw client/service-role access remains denied, RLS is enabled, immutable updates are rejected, and fixed search paths/private helper restrictions remain.

Finite APIs:

1. `busy_work_agreement_decision_review_v1`: current live owner/creator/source/quote-revision checks, exact original evidence and latest state; refuses fresh mutation context after rollback revokes the writer.
2. `busy_work_agreement_decide_v1`: original membership/source/engagement lock precedes exact evidence lock; compare-and-set current engagement and decision revisions; fixed actions and ≤5,000 UTF-8-byte statement; append one event, never replace the report or quote. Receipt identifies engagement/report/decision, original quote version/hash, current reviewed engagement/source, actor, action and exact previous/next decision revision.
3. Existing `busy_work_agreement_read_v1` adds latest interpretation without changing its immutable report revision=1 or original `ownerAccount`/terms fields. Original clients retain their finite envelopes; summary/list responses still contain no private wording. No whole-workspace or arbitrary JSON mutation is added.
4. `busy_work_booking_readiness_v1`: bounded creator-private inspection of captured/current terms, report state and missing requirements; no external customer response or canonical/request association is asserted. It returns `bookingEligible:false`, `executionAuthorised:false`, and no mutation receipt.

Interpretation is explicit: **original**, **corrected**, or **withdrawn**. Corrections supersede earlier wording only for the supported current owner-report interpretation; original text and every decision remain stored. Withdrawal removes the current interpreted account, preserves the original and reason, and is terminal in this first slice. It is not deletion/erasure and does not prevent lawful future erasure handling. Reactivation, same-version replacement reports after withdrawal, event-by-event history pagination, correction migration and privileged erasure are unsupported pending policy. The UI does not tell owners to alter a quote to bypass these restrictions.

A correction can concern an older quote version while reviewing a currently eligible engagement: its original quote revision, amount, planned quote date, service/source and full compatible Work fingerprint remain immutable. Later quote edits do not inherit the report. Current-source eligibility remains mandatory even for correction/withdrawal; changed/removed/privacy-restricted source or revoked creator access denies rather than using historical inspection as mutation/disclosure authority. A separately authorised erasure/retention path is still required where these restrictions apply.

All three private kinds (`reply`, `followup`, `work_notes`) remain separate. No notes are copied, reclassified, migrated or used as acceptance evidence. Legacy private authorship is not invented. Unknown compatible Work fields and original legacy Work are retained unchanged.

## Canonical/request/ledger relationship: exact missing authority

Reviewed original `20261012183000_v3_180_atomic_business_app_handoff.sql`, `20261012193000_v3_181_durable_work_booking_ledger.sql` and `ownerBookingRevisionV3233.mjs`. The original V3.181 wrapper calls V3.180, which owns request/link/event/unread locking and atomicity. The wrapper validates dates/timezone, requires approved accepted booking request state, writes/validates the durable Work row and returns original ledger identity. It is service-role-only; the client must not call an older handoff to bypass that ledger.

Those records establish exact original business/app/request/customer/action/ledger relationships. They contain **no authoritative canonical engagement UUID + exact quote revision/terms hash + agreement-evidence relationship**. Similar customer/service/amount/date is not such evidence. User-controlled metadata cannot mint that relationship. This mission therefore adds useful finite readiness review, but **does not implement an association writer/table or claim an identified canonical booking request**. No request/ledger records are guessed, copied or relabelled.

A future finite association proposal must extend the original trusted transaction (not add a parallel writer): exact canonical UUID/business/customer/creator; original quote revision/terms hash; permitted active evidence ID/decision revision and provenance; original app/request/link/action/ledger identities and revisions; current membership; explicit reviewed owner decision; diary date/time/timezone/conflict authority; atomic compare-and-set and target-specific receipt. The original and canonical lock graph must be reviewed before implementation. Any persistent association would be subordinate relational linkage to the original ledger, never another booking ledger, and must retain the canonical UUID as lifecycle progresses. No generic JSON metadata merge, current-record matching, loss of acknowledgement or locally labelled Accepted state can substitute for this contract.

Readiness uses ordinary language to explain: report still unverified or withdrawn; captured versus current quote; no customer acceptance established by this protocol; no exact canonical/request association; original diary/transaction/approval/receipt requirements remain. No action issues a quote, changes acceptance, reserves a slot, writes the diary, sends a message or pays anything.

## Verification and retained failures

See companion application and SQL CHECKS for the final frozen execution and individual stage IDs/exit codes. Bulky successful stdout and fictional snapshot payloads are omitted from the public summary; original artifacts remain in `.test-artifacts`.

| Fresh final check | Result |
| --- | --- |
| Full application selection on clean final functional source | **383 passed, 0 failed/blocked/unexecuted; runner exit 0** |
| Production foundation | **105 passed; exit 0** |
| Original PostgreSQL stages | **262 passed, 0 failed/blocked/unexecuted** |
| Canonical PostgreSQL stages | **162 passed, 0 failed/blocked/unexecuted** |
| Original component-to-actual-PG bridge on final functional source | **118 RPC children; all SQL children exit 0; Node/runner exit 0** |
| Five changed JS/JSX parses, native-source parser, two Python compiles | Passed |
| Pinned offline tool integrity/health | Passed; 51 cached packages, no new dependencies |
| Architecture | 1,530 source files; zero static relative-import cycles |

Final SQL SHA-256: `7fa3fa423beac13c3da874d44e2103e067460729777f7548bf34b444986fe7f4`. SQL itself is unchanged between its actual 162-stage execution and the final frozen component bridge. Final UI/test-harness refinements are covered by that final bridge and the complete final application selection. PostgreSQL expected-denial children use nonzero exits intentionally; they are passing stages only when the original denial assertions hold.

Security coverage includes exact parent/quote terms, immutable original records, source change, creator/member/admin/co-owner/foreign/revoked/anonymous access, stale revisions, true competing writers, duplicate/stale decisions, wrong engagement under the same customer, private raw-read denial, compatible unknown data, unchanged independent Work/private purposes/snapshot, no acceptance/booking/provider writer in finite evidence definitions, and fail-closed rollback. Rollback retains data and scoped inspection while revoking decision writes and fresh contexts.

Retained unsuccessful/intermediate evidence:

- Earlier SQL candidate: 159 passed; final new readiness/FK/no-execution checks produce 162, superseding it rather than adding historical credit.
- Earlier bridge candidate: 118 passed before the final presentation/approval corrections; not final parity credit.
- `.test-artifacts/agreement-correction-bridge-final.json`: Node exit 1 after 114 RPC children. A fixed lost-report operation ID collided with an earlier fictional run; PostgreSQL correctly rejected it (23505), so the test's expected report did not exist. Source-scoping test nonces fixed repeatability without relaxing any unique constraint, denial assertion or production check. Subsequent complete bridges pass; the failed original is retained.
- Two superseded application selections were deliberately stopped with exit 2 (102 passed/281 unexecuted and 161 passed/222 unexecuted, zero failed/blocked); neither is credited as a completed final selection.
- A shell parser helper attempted Node child-process Git enumeration and hit sandbox EPERM; the explicit five-file Babel parse then passed. No sandbox bypass was used.
- Public Supabase changelog/API-security documentation fetches were blocked by proxy 403. No hosted project endpoint was contacted. Existing reviewed PostgreSQL17 contracts and actual local security fixtures remain the verification basis; no Supabase SDK/API change is claimed.

## Engineering, rollout and next decisions

No new production dependency, AppController state, duplicate quote engine, customer store or booking engine. AppController remains unchanged at 18,287 lines. Latest-state lookup uses an indexed `(evidence_id,decision_revision DESC)` query; finite reads remain one exact source/engagement plus one indexed evidence chain lookup. Events grow independently without a lifetime engagement cap; original bounded 20/50 pagination controls remain unchanged. Quote hashing remains bounded by the existing Work-record size. A future read-all event history needs its own finite pagination/privacy review.

`CANONICAL_WORK_ACCOUNT_ENABLED`, `CANONICAL_OWNER_REPORT_ENABLED`, and new `CANONICAL_AGREEMENT_DECISIONS_ENABLED` remain hard false. The SQL production abort fuse, raw snapshot/full-write fences, immutable provenance, original provisioner and Phase52 loss counterexample remain intact. Client gates are not server authorisation; hosted grants, installed-package upgrade, real JWT/PostgREST and isolated staging acceptance require separate explicit approval. This CREATE-only package is not a migration for a database with the earlier candidate installed.

Next customer-value stage: review the proposed correction/withdrawal/retention rules and the exact quote-presentation/customer-agreement policy, then implement a finite canonical/request association inside the original transaction authority. Owner-attested offline records must remain distinct from independently verified acceptance. Resolve legacy authorship/disclosure and lawful erasure separately; do not make immutable storage a policy override. Booking execution remains unsupported until genuine acceptance, exact linkage, diary conflict, permissions and receipt contracts exist.

External additional spending **£0**. No hosted Supabase reads/writes, migrations, deployment, rollout activation, real customer/provider operations, bookings, payments, quote issuing, publishing, tax actions, screenshot work or workflow dispatch. Cached PostgreSQL 17.11 packages matched the retained official Debian signed-index SHA-256 manifest; no download or system install was performed. All database execution used fictional local fixtures with explicitly disabled TCP and the verified private Unix socket; the server was stopped after final verification. Local mock UID/roles do not prove real JWT/PostgREST, native/device rendering, provider delivery or release readiness. No owner manual testing was requested.
