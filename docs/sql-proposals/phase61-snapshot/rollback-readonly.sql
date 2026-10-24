-- Reviewed rollback candidate only. Preserve both fences, rows and revisions.
BEGIN;
REVOKE ALL ON FUNCTION public.busy_owner_account_revision_v1(uuid) FROM PUBLIC,anon,authenticated,service_role;
-- Apply Phase60 rollback-readonly.sql as well to pause finite reply operations.
-- Never restore raw SELECT, full-payload writes or unrestricted v1 RPC access.
COMMIT;
