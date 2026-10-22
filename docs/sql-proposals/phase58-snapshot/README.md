# Phase58 original-row trusted writer — review candidate

**Not deployed; not ready to apply as a production migration.** Phase59 executes this candidate against a disposable local PostgreSQL fixture; see the Phase59 report for exact scope and remaining hosted gates. The owner supplied a private targeted catalogue handoff, SHA256 `557d9fd2bc4dcdcbac02e3ef675936e18c4e71341500c3bd7801277857461cac`. It establishes observed original table/role/grant/RLS/trigger facts, but contains policy paraphrases and provisioning-function summaries rather than exact captured definitions. Do not publish that handoff verbatim. This candidate is newly authored public review code, not purported original DDL.

## Actual advance and limits

`writer.sql` implements a PL/pgSQL candidate on the **original** busy_business_snapshots row. It derives auth.uid, locks live membership first, requires actual deployed owner/admin roles (member is denied), locks the snapshot, checks exact revision/schema and one exact target, and supports three finite operations:

- private_reply_edit_text: one existing version2 owner-private reply, unchanged original filed source and customer projection. Changes only the text leaf; unknown extensions and independent fields remain server-side. New text is conservatively limited to10,000 UTF8 bytes (stricter than JS UTF16 length); a rejection must preserve local owner wording. No catalogue provenance/listing references are accepted until actual trusted catalogue approval dependencies are reviewed.
- private_reply_remove: deliberate whole private field removal from one exact customer, with full expected-record equality. Removal does not require continued contact consent or pretend old source facts remain approved. Other customer fields remain untouched.
- newsletter_remove: deliberate removal of one exact private Draft newsletter from socialDrafts. It cannot edit/regenerate text, change sources, select recipients, publish or send. Current text/source/media/audience/channel metadata is part of exact expected-record equality.

There is no arbitrary path, caller-defined merge, create/upsert, finance operation, full-payload restore or second ledger. A trusted operation's fixed server policy is the capability, not a client flag or user metadata. Future record/schema versions require a reviewed implementation, not silent compatibility.

`fence.sql` revokes direct table/column writes, including DELETE/TRUNCATE and service_role writes, then grants SELECT and a **business_id-only blank initialization INSERT**. It adds a server insert guard requiring owner/admin membership and default empty payload/schema1/revision1. Effective table/column privilege checks abort if inherited roles retain writes. A review fuse intentionally aborts the file until separately approved rehearsal/cutover. No permissive legacy escape is retained.

`rollback-readonly.sql` revokes the new mutation entry and blank initialization while retaining the write fence, rows, insert guard and source fields. It does not re-enable a lossy old serializer or silently resurrect removed records. Do not drop/reconstruct data to roll back.

## Critical cutover prerequisites — currently incomplete

1. The private Phase59 exact-function addendum resolves the INSERT target list: original SECURITY INVOKER provisioning inserts business_id alone, after the creator-membership trigger. Keep both original security modes. Existing-business cases do not recreate a missing snapshot. Effective role/column inheritance and every privileged writer still require cutover review; do not relax the narrow grant.
2. Inventory all privileged/service/import/restore writers. They lose direct snapshot writes, including service_role. Existing source readers can retain SELECT, but unknown privileged writers must be migrated or explicitly disabled. No claim that function-name inventory found every writer.
3. Prepare a compatible client adapter. Current initialization POST sends full payload and current save PATCH replaces full payload; both deliberately fail under the fence. Keep unsupported clients read-only, retain unsaved device work and show upgrade/review status. Do not activate this SQL against the current application and call it seamless compatibility. Only three operations exist here; customer creation, quote/profile changes, general content saving and account restore need their own reviewed finite contracts. The existing app is **not switched** to this proposal.
4. Revoke original direct legacy writes **before** protected-field exposure. Table ACL alone is not enough if column or inherited grants remain. Existing member SELECT policies remain; this candidate does not solve owner-private-field read visibility within a business. Review that privacy boundary separately.
5. Verify auth.uid derives only from the genuine authenticated request; the local fixture mocks JWT context and does not prove that. SECURITY DEFINER postgres is deliberate privileged execution after ACL fencing: fixed pg_catalog/pg_temp search_path, qualified auth/public/private names, no dynamic caller SQL, no public helper execution. Review schema/function ownership and all default/function ACL inheritance. The new private schema fails on a name collision instead of reusing an unreviewed schema.
6. Inspect nullable/malformed legacy data and current approvals. The handoff does not supply every NOT NULL/default expression or historical migration body. Errors fail closed; do not normalize bad records or fabricate receipts.

## Transaction, revocation and receipt semantics

Membership SELECT FOR UPDATE precedes snapshot SELECT FOR UPDATE in one RPC transaction. A concurrent membership UPDATE/DELETE must wait or win first; after a prior revocation commits the writer must find no permitted membership. Test both interleavings, cascades and other writer lock orders. Deadlock/serialization errors abort; they must not be blindly retried after uncertain transport outcomes.

The response binds actor/business/operation/target and old/new row revision to the returned target. A successful RPC response is usable as a receipt only after its surrounding server transaction commits. There is no durable idempotency/receipt ledger here. A dropped acknowledgement is unknown; read back without replaying the mutation. Matching target text alone is not proof this request committed. Old expected revisions conflict; removal cannot be resurrected by any operation in this finite set. Privileged administrators outside the fenced API remain trusted authority.

## Prepared tests and actual evidence

`staging/phase58-snapshot/fixture.sql` and `assertions.sql` are executable **prepared** PostgreSQL test source, explicitly reconstructed from the reported schema facts, with fictional rows and mock auth.uid. They refuse databases not named busy_phase58_disposable. They are not original migrations, a genuine Auth test or executed evidence.

Fixture order for a separately authorised disposable rehearsal:fixture → writer → reviewed copy of fence with its deliberate fuse removed → assertions. Keep the fuse in the repository proposal. The fixture first demonstrates a direct authenticated whole-payload loss under reconstructed original RLS, rolls it back, then tests candidate ACL denial, bounded text mutation/unknown-field preservation, explicit removal, stale replay, wrong tenant and member denial. Source checks only lint the proposal's intended boundaries; they are not PostgreSQL parse/execution or security tests.

Historical Phase58 local execution was not available:psql/Postgres binaries were absent, Docker socket access denied, and a sandboxed socket-permission attempt failed with a mount error. No container, SQL database or hosted project was modified. Do not count prepared assertions as passes. Original Phase52 retention regression remains byte-unchanged and must remain until actual trusted enforcement defeats it.

## Mandatory isolated acceptance before any rollout

- Execute the exact SQL, not a JS mirror; validate syntax, ownership, grants/defaults, RLS and helper-execution denial.
- Real restricted Supabase tokens/PostgREST: anon/member/owner/admin, wrong tenant, forged user metadata, revoked membership and source changes. Check direct POST/upsert/PATCH/DELETE/TRUNCATE denial including column/inherited/service paths.
- Both same/stale revision and concurrent-device interleavings:one winner, one conflict; two-session membership revocation; business/auth-user cascades; no mutation after revoked authority wins. Include lost acknowledgements without blind replay and unchanged readback distinctions.
- Missing/duplicate/malformed targets, unsupported versions, null fields, unknown top-level/nested extensions, current/changed filing receipts, sourceStamp key order, catalogue-bound denial, deliberate removal and cached resurrection attempts.
- Original invoker provisioning/creator trigger/default business names, blank initialization, legacy full INSERT failure, current client device recovery, original catalogue migration ordering, Edge/worker/standalone and service readers.
- Rehearse fail-closed rollback and forward repair with all data retained. Separate oldest-first PR integration21→23→24→25→26, database approval, hosted security/CAS, browser/device and provider gates remain required.
