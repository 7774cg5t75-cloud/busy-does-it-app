# Phase62 workspace and service projections — review candidates only

No hosted installation, migration or fence activation is authorised. Both Phase58/60 production abort fuses and all client/service rollout switches remain disabled. These functions reuse the original snapshot, business and membership rows; no new table/store is introduced.

## Workspace identity is not recovery

`busy_workspace_status_v1(uuid)` authenticates auth.uid, locks live membership then business/snapshot rows, and returns an exact metadata allowlist. Owners can observe revision/schema and empty/present/missing/incompatible status; admins/members receive only shared business identity and restricted status, with null revision/schema. No payload, private records or unknown extensions leave this endpoint. Existing original invoker/creator-trigger provisioning remains unchanged; a missing existing snapshot is reported rather than repaired.

The original AppController startup has a disabled secure branch after `busy_ensure_business`. The original session checks the narrow packet. This branch keeps cloudInitialised false, preserves all current state/revisions/cache copies, does not rebind existing local records to a newly discovered business, and explains domain recovery is unavailable. It performs no raw GET or full POST. Entering this protocol pauses legacy read/save/restore in the session; fetchCloudSnapshot also refuses raw fallback. This is useful safe identification/read-only compatibility, NOT cross-device domain restoration or a complete account startup replacement. Existing legacy behaviour stays unchanged while the switch is false.

## Service scope

`busy_service_alert_facts_v1(business,recipient)` is EXECUTE-able only by service_role. It verifies and locks a current owner recipient, then reads one business row. It returns only original candidateAlerts inputs: customer ID/name/service and finite recorded booking/quote status/date fields. Unknown/nested values, private reply text, sourceStamp, arbitrary customer details and ambiguous/foreign records are excluded. Missing booking confirmation is not inferred as confirmed. This does not prove actual booking, quote delivery, consent or permission to send a push.

`busy_service_snapshot_count_v1()` returns exactly the 7-day active-workspace count; no raw rows/identities. Existing founder endpoint still independently authenticates founder identity. Both Edge consumers have hard-false cutover switches; when enabled, a denial never falls back to raw snapshot data. Service identity is established by database EXECUTE privilege and existing server credentials, not a client permission boolean. Real PostgREST service-key mapping, exposed schemas, inherited/default ACLs and deployments remain separately gated.

## Local test and rollback

`phase62_postgres.py` executes the entire Phase61 rehearsal first, then new workspace/bootstrap/service/negative/concurrent tests in the same dedicated synthetic PostgreSQL17 cluster. Original exact provisioning functions stay in a private externally supplied file. Local UID emulation is not Supabase JWT proof. No hosted URL is accepted by the underlying runner.

Read-only rollback revokes these new functions while retaining original data and both fences. Pausing other finite operations also requires the Phase60/61 reviewed rollback sequence. Never restore raw service/user SELECT or full-payload writes for old-client compatibility. The combined Phase62 report contains the six-area dependency matrix and unresolved domain recovery/initial-population gates.
