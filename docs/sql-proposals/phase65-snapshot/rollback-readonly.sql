BEGIN;
REVOKE ALL ON FUNCTION public.busy_owner_pending_review_v1(uuid,bigint,text),public.busy_owner_manual_source_v1(uuid,bigint,text,text),public.busy_owner_first_reply_review_v1(uuid,bigint,text,text),public.busy_owner_reply_create_v1(uuid,bigint,text,text,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
