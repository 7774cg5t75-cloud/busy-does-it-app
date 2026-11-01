BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'PRIVATE FORM ENQUIRY ROLLBACK REVIEW FUSE: separate staging approval required';END $$;
UPDATE busy_app_function_private.settings SET form_enquiries_closed=true WHERE id;
-- Retain historical scoped context/readback; reject new form enquiry review/import/file.
COMMIT;
