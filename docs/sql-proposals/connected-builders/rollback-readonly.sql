-- Retaining rollback proposal; separately approved target-only operation.
-- No records or readers are removed. Also unset BUSY_CONNECTED_BUILDERS_ENABLED.
BEGIN;
REVOKE ALL ON FUNCTION public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
