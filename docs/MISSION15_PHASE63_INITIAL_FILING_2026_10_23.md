# Phase63 initial filing — source-grounded specification, not an implemented RPC

## Actual source and current blocker

`AppController.saveQuickCapture` owns manual capture; `fileSafeInboxItem` owns conservative existing-customer reconciliation. Original parsing, matching and stage-strength rules are reused throughout Intake, Inbox and Work. Manual capture requires name, service and phone/email, performs original findCustomerMatch unless explicitly forced new, then creates/updates sourceRecords, activity/history, lifecycle, intakeLog and filed Inbox state. Other capture stages can update recorded quote/booking/completed-work context. These are not equivalent to inserting {name,message} into a new array.

Original `fileSafeInboxItem` requires Safe mode, evaluated safety and an existing matched customer; it is not a first-customer creation contract. Manual review uses pending source identity, owner-corrected capture fields, reviewedAt/filedCustomerId/filedStage and associated source history. Client-generated IDs and timestamps are local evidence; they are not independently authenticated server receipts. Source screenshots may be local URIs with unfulfilled ownership/byte contracts. Existing standalone/request/Work records have their own permissions and must not be normalised through a generic snapshot merge.

The database schema and live membership authority are now known. The remaining gap is the reviewed **domain construction and reconciliation contract**, not another missing-schema investigation. No narrowed trusted atomic initial filing currently implements the original source/matching/history semantics. A new simplified model would conflict with those owners. Therefore no initial-filing RPC, production SQL or optimistic success test is supplied this phase.

## Minimum reviewed implementation to complete next

1. Initially permit only deliberately owner-reviewed **new Enquiry** capture, not recorded quote/booking/completed-job stages. Preserve original owner correction and contact evidence; an incoming message is source data, not executable instructions or marketing consent.
2. Define the exact immutable source packet and whether first filing originates from an existing authenticated Pending Inbox item or an explicitly owner-supplied manual capture. Do not fabricate a previously filed receipt. If Pending is absent, review atomic source registration + filing semantics rather than pretending a local JSON stamp is an authenticated original.
3. Reuse original stable customer/enquiry/source IDs and duplicate/matching policy. Match ambiguity must require owner review; forced-new intent cannot overwrite an existing target. Derive actor/business/role and committed timestamp/revision on the server. Any new ID allocation must be reconciled with original local IDs, not silently replace them.
4. One finite operation on the original row: exact expected schema/revision, server-derived live owner authority, reviewed input epoch/source tokens and fixed owned fields. Construct only the reviewed customer/source/history/intake/filing fields required by the original workflow. Preserve all unrelated and unknown payload/extensions. No arbitrary keys/paths, generic merges or complete customer-array upload.
5. Keep creation separate from removal/revocation. Omitted fields are no instruction. Never create a booking, imply availability, set accepted quote/delivery/payment outcomes or activate marketing. Record any owner-supplied contact permission as attributed evidence, not independently verified customer consent.
6. Lock membership/revocation before the original row. Validate exact absence/identity, source and expected revision atomically. Return target IDs, exact resulting revision and finite committed receipt. Lost acknowledgement stays uncertain; read back without reissuing. There is no durable receipt/idempotency ledger to invent.
7. Client acceptance must bind original scope, capture source, corrected fields, target, view and typing epoch. Preserve newer owner input. Do not show quickCaptureSaved until the appropriate original receipt is actually confirmed; retain explicit local-only and unresolved states.

## Executable denial/preparation evidence delivered now

* Original `saveQuickCapture` parent, with secure startup enabled, returns false before local mutation and explains that capture fields are kept and nothing was filed/uploaded. Legacy mode is unchanged. This is a fail-closed client preparation gate, not server authority.
* Real disposable PostgreSQL asserts that no unreviewed initial-filing RPC exists (undefined_function expected), and retained prior stages deny raw full-payload POST/upsert/PATCH. This proves non-activation, not successful first filing.
* Original recovery discovery/opening never invokes a mutation, registers a customer, manufactures source fields or mints an own-save receipt.

Required next executable implementation matrix: valid owner-first enquiry; original source and correction; wrong tenant/role/revocation; changed epoch/source; duplicate IDs/match ambiguity; non-Enquiry stage denial; unsupported media; unknown extensions retained; concurrent winner/loser; committed receipt/lost acknowledgement; explicit removal/no stale resurrection; original QuickCapture→Inbox→Customer→private reply parent integration. These are specifications, not reported passes.

No hosted migration/deployment or new store is authorised. Review this finite domain contract before implementing or enabling initial account population.
