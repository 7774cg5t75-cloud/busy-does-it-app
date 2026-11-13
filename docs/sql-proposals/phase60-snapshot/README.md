# Phase60 owner-private projections and first reviewed account operation

**Review candidates, not installed migrations. Both production abort fuses remain. Hosted client switch is hard-disabled.** These objects operate on the original snapshot row and reported original membership schema; there is no second store or JSON merge API.

## Proposed policy

* Application roles cannot SELECT snapshot payload/revision/schema/timestamps, including raw owner reads. `business_id` alone remains SELECT-able under existing membership RLS for the original invoker's bootstrap. Unknown top-level/nested payload fields are not returned by default.
* Owners/admins/members can call `busy_shared_business_read_v1` for exactly relational workspace ID, workspace name and current membership role. These are workspace metadata, not public marketing claims. No customer/contact/brand/private snapshot content is included.
* Only a **current owner-role member whose actor ID matches the stored private reply owner ID** can review/edit that one private reply. Admin role is not implicit private access. Even a different owner cannot read someone else's reply. Delegated private access requires a future separately reviewed policy; no client flag grants it.
* `busy_owner_reply_review_v1` returns an explicit narrow envelope: exact IDs/revision/schema, saved text, customer ID/name, filed enquiry ID/message, eligibility and SHA-256 expected-record/source tokens. It never returns sourceStamp, arbitrary record objects, unknown extensions or other customers. Hashes are compare-and-swap evidence, not permission or authenticated historical facts.
* `busy_owner_reply_text_v2` locks live membership and the original row, validates owner/target/source/revision/tokens and calls the existing original finite v1 validator/mutator internally. Only its text result and fixed receipt fields leave the server. Every unrelated/unknown JSON field remains in place.
* The older v1 RPC becomes internal-only: it returned a whole target including unknown fields. PUBLIC/anon/authenticated/service_role execution is revoked and effective known-role privilege is checked.

Functions are owned by postgres, use fixed pg_catalog/pg_temp search paths, schema-qualified relations, server auth.uid/live membership, explicit EXECUTE revocation and narrowly granted public entry points. Private helper schema/EXECUTE remain denied. Membership locks serialize with role changes; no user metadata, permission boolean or caller JSON allowlist is authority. Source-dependent v1 validation is reused on write, not replaced by a hash check alone.

Read-only rollback revokes the new RPCs while retaining raw-read and legacy-write fences and original data. Never reopen broad SELECT/full-payload PATCH to make an old client work.

## Scope and limits

Non-catalogue, existing version2 owner-private replies only. Changed/malformed/ambiguous/enquiry-mismatched sources fail safely; no create/upsert, newsletter mutation or public catalogue transition is added. Legacy device copies stay with their existing readable specialist; unsupported account records cannot be silently upgraded. Earlier saved evidence is not authenticated historical catalogue data.

The UI uses the original customer reply editor, private-save/reopen specialist, typing epoch, source/profile freshness and explicit Keep/Save review. Its source-level root bindings reside in the existing privateEnquiryReplyPersistence adapter. The original snapshot session owns IO, one-use tickets, exact receipts and uncertainty. The rollout constant in runtime.js is false and not driven by owner-editable data.

Confirmed target receipts do not replace the local payload, update a device copy, clear independent dirty fields or promote the global snapshot revision. A subsequent account change requires fresh workspace/revision reconciliation, which is still an explicit cutover dependency. Lost acknowledgements block further unsafe operations; there is no blind retry or full-payload fallback. This is not durable cross-device receipt storage.

Current legacy initialization, restore, general account checking and saving still need broad snapshot data. They must not be activated against the privacy fence until compatible finite projections/writers or explicit read-only recovery are available. The legacy raw account-check button is hidden in the new trusted-reply mode, not silently redirected to raw GET. Existing production behavior is preserved while the new mode remains disabled.

## Read-path inventory and activation prerequisites

Known raw readers: AppController initialization/restore/fetchCloudSnapshot; businessSnapshotSession account reads/CAS receipts; newsletter/account recovery consumers through that session; busy-production-watch service payload reader; busy-founder-ops counts requiring business_id/updated_at. Root full writes include conflict-ignore initialization and conditional PATCH; older clients also used merge-upsert. All need migrated contracts or explicitly disabled/read-only handling.

The original private handoff does not certify every view, SECURITY DEFINER function, service/Edge/cron/import/restore reader, inherited role, default privilege or exposed schema. The proposed fence aborts on catalogue-tracked view/materialized-view dependencies; it does not pretend this enumerates dynamic PL/pgSQL or external service paths. Complete privileged-reader inventory and real PostgREST/JWT checks remain deployment gates. A postgres administrator remains trusted authority, not an untrusted app role.

Full collaboration customer/Work permissions and delegated admin access are not defined by this minimal metadata projection. Do not claim all collaborative reads are compatible yet. Preserve current client behavior until those domains have explicitly reviewed, least-privilege projections.

## Disposable verification and ordering

Use the established Phase59 local PostgreSQL17 cluster and synthetic fixture only:

```
python3 scripts/testing/phase60_postgres.py --bin-dir /tmp/phase59-pg/root/usr/lib/postgresql/17/bin --socket /tmp/phase59-pg/socket --original-functions /PRIVATE/exact-functions.sql --output .test-artifacts/phase60-postgres.json --allow-disposable-reset
```

The runner accepts only a local Unix socket and verifies its sibling data directory. It resets only the synthetic busy_phase58_disposable database. Exact supplied provisioning functions stay private; other fixture DDL is reconstructed, auth.uid is mocked. This is genuine PostgreSQL execution but not real Supabase authentication/hosted enforcement. Fuses are removed only in ephemeral local rehearsal strings, never repository source.

Reviewed future order: inventory/version original schema and privileged routes; finish domain read projections/client read-only states; establish trusted operations and client compatibility; separately approve isolated staging; validate real JWT/PostgREST, roles, concurrency, deletion, unknown-field retention and rollback; coordinate legacy write fence + raw read fence + safe RPC exposure before protected data use; then separately approve client/service activation. Never leave the old returning RPC or a view as an unreviewed read bypass. Rollback keeps both fences. No migration/deployment is authorised here.
