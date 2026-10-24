# Phase61 account revision observation — review candidate, not deployed

Requires the original provisioned snapshot/membership contract and the Phase58/60 candidates. `revision.sql` adds one owner-only, metadata-only function. It returns exactly business ID, authenticated owner ID, current revision and schema version. It does not return payload, timestamp, customer IDs, arbitrary fields or unknown extensions. Admin/member access is denied; the separate Phase60 relational shared-business projection remains unchanged.

The function reuses the private trusted membership lock, checks the current owner role, then locks the original snapshot row FOR SHARE. It follows the writer's membership-before-row order. SECURITY DEFINER ownership, fixed search path, qualified names, PUBLIC/anon/service revocation and authenticated-only EXECUTE must be reviewed alongside inherited/default privileges and every existing privileged route. Local mock UID tests do not establish real Supabase identity or PostgREST exposure.

## What reconciliation means

An exact own-operation receipt is held only in the original in-process session. A narrow revision observation can confirm that the account still has that receipt's revision. Before another review, the original private-reply projection must additionally match the exact record hash, source hash, text, customer and enquiry at that revision. Only then can an owner deliberately approve a new one-use text mutation. The next expected revision comes from the authenticated observation, not client arithmetic.

The local workspace revision, payload, device records and dirty fields are never advanced, cleared, merged or restored. Target evidence is not a whole-workspace save receipt. A different revision or target/source hash requires review; this candidate does not implement a general rebase. An uncertain acknowledgement remains unresolved even if metadata matches. Recheck never writes, replays or settles attribution. A new process has no retained receipt: it must not reconstruct one from matching text or a revision number.

The original reply editor owns typing/source checks and owner approval; the existing session owns account IO, receipts and pending/uncertain state. The existing adapter supplies the genuine editor epoch. No AppController state or new production module/store was introduced. Hosted switch remains false; both original fence abort fuses remain intact.

## Local rehearsal and rollback

Run `scripts/testing/phase61_postgres.py` with the same explicit local socket, binary directory, private exact-function file and disposable-reset acknowledgement as Phase60. It first executes the complete 54-stage Phase60 rehearsal, then the new projection, committed sequential operations, independent-field comparisons, denials, concurrent mutation/revocation and rollback checks. Synthetic forward repair regrants only the two owner entry points that the baseline rollback revoked. It is not a production migration or blanket privilege relaxation.

`rollback-readonly.sql` revokes the new metadata function. To pause writes, apply the separately reviewed Phase60 read-only rollback too. Preserve both fences and all rows/revisions. Never restore full-payload PATCH, old returning RPC execution or raw payload SELECT for compatibility. Actual installation, fence activation and staging require separate approval and the dependency matrix in the combined Phase61 report.
