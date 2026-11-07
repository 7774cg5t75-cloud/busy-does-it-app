-- Review-only pause of discovery. Preserve all original rows and both fences.
BEGIN;
REVOKE ALL ON FUNCTION public.busy_owner_reply_discover_v1(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
