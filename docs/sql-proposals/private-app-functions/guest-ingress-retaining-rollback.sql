BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'FORM INGRESS ROLLBACK REVIEW FUSE: separate hosted approval required';END $$;
UPDATE busy_app_function_private.settings SET publications_closed=true,disclosures_closed=true,public_form_requests_closed=true WHERE id;
-- Retain immutable publication/disclosure approvals, original requests/history and receipt-only reconciliation.
COMMIT;
