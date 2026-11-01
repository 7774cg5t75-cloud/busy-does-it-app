BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'ENQUIRY PREPARATION ROLLBACK REVIEW FUSE: separate hosted approval required'; END $$;
UPDATE busy_work_private.enquiry_preparation_settings SET closed=true WHERE id;
REVOKE EXECUTE ON FUNCTION public.busy_work_enquiry_preparation_v1(uuid,text,text,uuid,text,bigint,bigint,jsonb,jsonb,text,jsonb,jsonb) FROM PUBLIC,anon,authenticated,service_role;
-- Retain records, immutable source, nonces, Undo and anti-duplication wrapper.
-- Original quote-only plans remain governed by their original independent gate.
COMMIT;
