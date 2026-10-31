BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'CUSTOMER ACTION ROLLBACK REVIEW FUSE: separate hosted approval required';END $$;
REVOKE ALL ON FUNCTION public.busy_send_mini_app_message_v3184(uuid,uuid,uuid,text,text,text),public.busy_send_mini_app_message_v3185(uuid,uuid,uuid,text,text,text),public.busy_record_mini_app_push_submission_v3185(uuid,uuid,integer) FROM PUBLIC,anon,authenticated,service_role;
-- Retain every original message, event, request and outbox record; no old grants restored.
COMMIT;
