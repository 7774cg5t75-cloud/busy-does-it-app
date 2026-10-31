-- Fail closed: retain BOTH raw-read and legacy-write fences, all original data.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.busy_owner_reply_text_v2(uuid,text,text,bigint,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
REVOKE EXECUTE ON FUNCTION public.busy_owner_reply_review_v1(uuid,text,text,bigint) FROM PUBLIC,anon,authenticated,service_role;
REVOKE EXECUTE ON FUNCTION public.busy_shared_business_read_v1(uuid) FROM PUBLIC,anon,authenticated,service_role;
-- No raw SELECT/PATCH fallback. Original Phase58 read-only rollback may also pause bootstrap.
COMMIT;
