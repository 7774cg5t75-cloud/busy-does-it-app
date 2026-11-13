-- Fail closed. Retain original data, all raw-read and legacy-write restrictions.
BEGIN;
REVOKE ALL ON FUNCTION public.busy_owner_first_enquiry_v1(uuid,bigint,jsonb) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
