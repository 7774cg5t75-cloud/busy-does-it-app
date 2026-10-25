-- Retains all records and immutable versions. Does not undo erasure obligations.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'GROWTH ROLLBACK FUSE: separate hosted approval required'; END $$;
REVOKE ALL ON FUNCTION public.busy_growth_opportunity_write_v1(uuid,uuid,bigint,text,text,jsonb,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
-- Read RPCs still recheck live original-owner authority; raw reads remain denied.
COMMIT;
