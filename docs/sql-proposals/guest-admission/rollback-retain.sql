BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'GUEST ADMISSION ROLLBACK REVIEW FUSE: separate approval required'; END $$;
-- Preserve receipts/challenges and the hardened source. Do not restore race-prone admission.
REVOKE ALL ON FUNCTION public.busy_mini_app_guest_challenge_v1(uuid,uuid,uuid,text,text,text,text),public.busy_mini_app_create_guest_request(uuid,text,text,text,text,jsonb,text,text,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
