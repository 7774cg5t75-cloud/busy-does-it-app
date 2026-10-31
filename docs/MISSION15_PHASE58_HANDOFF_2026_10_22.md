> Historical Phase58 candidate and blocked-runtime evidence. Subsequent exact provisioning evidence, real local PostgreSQL execution and prepared client cutover are in [Phase59](MISSION15_PHASE59_2026_10_22.md). Original evidence below is preserved.

# Mission 15 Phase 58 — schema handoff, preservation candidate and architecture review

## Verified authority and checkpoints

Starting remote: `fb353894963944f1ecd01936bb0d28de229f3bc4`; starting local: `1b7d5aa5a0c9dcc90344e954c728f3a0134c4c76`; matching starting tree: `909c861c2d991de8bd97335110b7f0d33e60d7ea`. Existing branch: `codex/builder-mission15-design-advancement`. PRs #21 → #23 → #24 → #25 → #26 were independently verified open, draft and unmerged. No dependency branch was modified.

The complete accessible private V22.45 master remains SHA-256 `a04483eb47e53d682953dbdabafd5491f847fb2cbad32ddeba5f3b39c0d15bcf`; its prior full review is reused and original bytes reverified. Newer appearance refinements mentioned by the owner are not represented as an accessible newer Word original. No visual/product-scope change was made.

The owner-supplied original-project catalogue handoff was read completely: 11,205 bytes, SHA-256 `557d9fd2bc4dcdcbac02e3ef675936e18c4e71341500c3bd7801277857461cac`, original project `qgkmuiipicazmcxxmoxv`. The owner reports inspection on 22 October 2026. This runtime performed **zero hosted SQL queries**. Private original bytes, manifest and hashes are retained outside Git in a permission-restricted private evidence folder. Manifest SHA-256: `17e3696e27921dbaa4e822268b37e937af35efefee77bc1ccde0d003cdd92457`.

This supplies previously missing observed core schema/security authority. It is a targeted catalogue report with policy/function summaries, not a complete raw schema dump or exact provisioning function body. Historical access failures remain historical evidence; they do not negate the new handoff.

Functional local commit `ccfbc67dcf74db68ce0c810784e9a57fec85dc3b`; corresponding recoverable GitHub commit `6c58127fc013115708445360aea76653dc09d9f0`; identical frozen tree `6906b2f106f79d13eb3cec10438539eceb5f76b9`. API/local commit metadata differ; tree identity is verified. Documentation follows separately.

## What is implemented in source

Newly authored, review-only SQL and rationale are in [the candidate directory](sql-proposals/phase58-snapshot/README.md). These are not published copies of the private original schema.

* A finite transactional writer locks live membership before the original snapshot row; requires owner/admin, exact business, revision and supported schema; rejects unsupported operations, missing/duplicate targets and changed expected records.
* Three bounded operations: edit an eligible existing private reply's text, explicitly remove an eligible private reply, or explicitly remove an eligible newsletter record. Unrelated records, quote amounts/dates and unknown fields are preserved by targeted mutation. Catalogue-backed reply text editing is deliberately unsupported pending trusted catalogue dependencies. No general payload replacement or arbitrary caller-defined JSON path/merge exists.
* A legacy-write fence revokes direct broad writes, including column privileges and service-role direct writes; checks effective known-role privileges; and proposes only guarded empty-row initialization. It has an intentional abort fuse. It is **not deployable as-is**.
* Read-only rollback revokes candidate mutation/initialization access while retaining the legacy fence and existing data. It never reopens destructive full-payload writes.
* A reconstructed disposable PostgreSQL fixture and executable assertions prepare direct-write rejection, targeted preservation, explicit removal, stale replay, tenant and role cases. They are not original captured DDL, real authentication proof, or executed SQL evidence.

Authentication is server-derived in the candidate; membership/revocation locking and row mutation share its transaction. Omission is not deletion. Explicit removal targets an exact reviewed record. Lost acknowledgements remain uncertain and require readback, not automatic replay; no parallel receipt ledger was added.

## Customer and application impact

This phase advances the actual preservation boundary rather than adding more client-only guards. The existing application remains intact: Inbox/reply/save/reopen, newsletter comparison, Keep/Use, Home, builders, owner words, amounts, dates and media references are unchanged. No new customer-facing recovery capability is claimed in this handoff sweep.

**The client is not wired to this candidate.** Its existing full-payload initialization/save routes would fail under the fence. Provisioning and compatible client cutover must be reviewed before activation; unsupported clients must retain local work and become read-only. This is not yet a working cloud-retention fix.

## Verification, unsuccessful attempts and limits

Frozen functional source complete selection:

`python3 scripts/testing/regressions.py --fail-fast --output .test-artifacts/phase58-handoff-complete.json`

**331 passed / 0 failed / 0 blocked / 0 unexecuted; actual runner exit 0; all selected child exits 0.** Selection SHA-256 `7bbed926ddcbc9b084121100109496294a8881ca019e2a881bf50d454566566e`. Original pinned offline dependencies, inert IO, isolation and 10,000ms VM execution limits remain unchanged. The new proposal check validates source intent/shape, not PostgreSQL semantics or security enforcement. Focused selection: 1 passed, 330 unexecuted, exit 0; it is not represented as a full run.

JavaScript syntax check and architecture audit each exited 0. Architecture: 1,438 source files, 155,515 physical lines, 2,898 static relative edges, zero detected static cycles. AppController and production application dependency/state graphs are unchanged. The candidate separates trusted mutation, fence, rollback and disposable tests; it does not transfer application state to a shared controller. PostgreSQL functions remain substantial security-sensitive review surfaces.

Separate SQL execution preflight: **0 passed / 0 failed / 1 blocked / 2 unexecuted, exit 2**. PostgreSQL executables are absent. Docker socket access was denied; a subsequent sandbox socket-mount attempt exited 101. No database/container was created. Candidate SQL loading and SQL assertions were not executed, parsed by PostgreSQL or proven correct. These limitations must not be hidden by the 331 source/application passes. There was no failed source-regression candidate in this resumed sweep; earlier phase failures remain preserved.

The original Phase 52 loss counterexample remains byte-for-byte unchanged: SHA-256 `1480655ab323ce18b6fcfc99e635f4abc77692e18c3d419b7debf201598b95c7`. It ran successfully as a demonstration of the unresolved older-serializer loss scenario, not proof that the candidate defeats it.

Full results, child exits, source hashes and separate SQL preflight: [CHECKS](MISSION15_PHASE58_HANDOFF_CHECKS_2026_10_22.json).

## Remaining authority, security and integration gates

1. Obtain the exact original `busy_ensure_business` body and INSERT target columns. Its reported SECURITY INVOKER contract may not work with the narrow initialization grant. Do not relax the fence to guess compatibility.
2. Complete original/inherited/column/default privilege and all privileged writer/import/restore inventory. Known-role checks do not establish the absence of other SECURITY DEFINER bypasses. Existing member-readable data permissions require separate privacy review.
3. Review candidate SQL against exact original definitions, then execute disposable PostgreSQL tests. Add two-session concurrency/revocation, malformed/duplicate targets, unknown extensions, source changes, dropped acknowledgements and rollback cases. Mock UID fixtures do not verify JWT identity.
4. Complete compatible client adapters and supported finite operations for other legitimate application writes. Block incompatible full-payload writers before protected fields are exposed. Preserve unsaved work during cutover.
5. Separately authorise isolated hosted staging: real membership/RLS/grants/CAS, direct REST POST/upsert/PATCH/DELETE/TRUNCATE denial, provisioning, service writers, two-device behaviour, deliberate removal/no resurrection and rollback retaining the fence. No hosted enforcement has been tested.
6. Maintain oldest-first separately approved dependency review #21 → #23 → #24 → #25 → #26. Catalogue migration ordering, client/Edge/worker/standalone parity, source approvals, provider receipts/idempotency and uncertain outcomes remain acceptance prerequisites. No merge/readiness claim follows from offline tests.
7. Browser, physical-device, mixed-client, provider and release acceptance remain gated. Newsletter sending, images/consent, publication, finance and booking authority remain unchanged and unavailable here.

## Recommended Phase 59

Prioritise exact provisioning/privilege/writer evidence and executable isolated PostgreSQL review of this candidate. Correct real SQL failures, extend transactional security tests and design compatible client cutover only after those results. Do not deploy the abort-fused candidate or treat a source check as server enforcement. The detailed operation and rollout review is in the candidate README.

Additional external spending: **£0**. No hosted database access/mutation, migration, deployment, customer/provider contact, publication, paid build/generation, financial action, workflow dispatch, merge, rebase or PR closure occurred. Only normal expected-head non-force updates on the existing branch were used.
