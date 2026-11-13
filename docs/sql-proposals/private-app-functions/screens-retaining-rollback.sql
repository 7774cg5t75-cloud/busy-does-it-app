BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'PRIVATE SCREEN ROLLBACK REVIEW FUSE: separate rollback approval required';END $$;
UPDATE busy_app_function_private.settings SET screens_closed=true WHERE id;
-- Scoped reads and immutable placement/artifact history remain. RPC writes and execution eligibility close.
COMMIT;
