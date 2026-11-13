BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'FORM DISCLOSURE ROLLBACK REVIEW FUSE: separate staging approval required';END $$;
UPDATE busy_app_function_private.settings SET disclosures_closed=true,public_form_requests_closed=true WHERE id;
-- Retain approved definitions, revocations, original requests/events and exact receipt inspection.
COMMIT;
