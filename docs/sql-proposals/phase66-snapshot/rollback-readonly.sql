-- Fail closed: disable this read capability, retain data and both fences.
BEGIN;
REVOKE ALL ON FUNCTION public.busy_owner_enquiry_discover_v1(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
