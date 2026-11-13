-- Fail closed: retain original rows and BOTH existing raw-read/full-write fences.
BEGIN;
REVOKE ALL ON FUNCTION public.busy_owner_booking_work_review_v1(uuid,uuid,text,text,bigint,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
