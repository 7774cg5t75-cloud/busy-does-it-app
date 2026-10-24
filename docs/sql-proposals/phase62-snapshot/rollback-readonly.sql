-- Review-only rollback: retain both fences, original rows and revisions.
BEGIN;
REVOKE ALL ON FUNCTION public.busy_workspace_status_v1(uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.busy_service_alert_facts_v1(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.busy_service_snapshot_count_v1() FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
