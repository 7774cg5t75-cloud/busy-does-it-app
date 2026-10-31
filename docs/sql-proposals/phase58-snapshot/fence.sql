-- REVIEW ONLY. FUSE INTENTIONALLY ABORTS: NOT deployable without reviewed cutover.
-- Do not remove the fuse until all README prerequisites and real staging tests pass.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'PHASE58 REVIEW FUSE: writer inventory, executed security tests and client cutover require approval'; END $$;
-- Stage/review copy only: remove the fuse in a separately approved disposable rehearsal.
-- Retain it in this public proposal, which is not in supabase/migrations.

-- Direct legacy full-row upsert/PATCH/delete/TRUNCATE must stop, including service writers.
REVOKE ALL ON TABLE public.busy_business_snapshots FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE col record; BEGIN
 FOR col IN SELECT a.attname FROM pg_catalog.pg_attribute a
 WHERE a.attrelid='public.busy_business_snapshots'::regclass AND a.attnum>0 AND NOT a.attisdropped LOOP
  EXECUTE format('REVOKE INSERT (%I), UPDATE (%I), REFERENCES (%I) ON public.busy_business_snapshots FROM PUBLIC,anon,authenticated,service_role',col.attname,col.attname,col.attname);
 END LOOP;
END $$;
GRANT SELECT ON TABLE public.busy_business_snapshots TO authenticated,service_role;
-- Only a blank default row may be inserted by the original invoker provisioning.
-- Phase59 private exact-function addendum verifies INSERT(business_id) only.
-- Preserve invoker/RLS/trigger semantics; no full-row INSERT compatibility escape.
GRANT INSERT (business_id) ON TABLE public.busy_business_snapshots TO authenticated;

CREATE FUNCTION busy_snapshot_private.guard_initial_snapshot()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 PERFORM busy_snapshot_private.lock_writer(NEW.business_id);
 IF NEW.payload IS DISTINCT FROM '{}'::jsonb OR NEW.schema_version IS DISTINCT FROM 1 OR NEW.revision IS DISTINCT FROM 1 THEN
  RAISE EXCEPTION 'Only blank snapshot initialization is supported' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END $$;
ALTER FUNCTION busy_snapshot_private.guard_initial_snapshot() OWNER TO postgres;
REVOKE ALL ON FUNCTION busy_snapshot_private.guard_initial_snapshot() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER busy_snapshot_initial_insert_guard BEFORE INSERT ON public.busy_business_snapshots
 FOR EACH ROW EXECUTE FUNCTION busy_snapshot_private.guard_initial_snapshot();

-- ACL revocation must be effective, not merely visible in an explicit ACL list.
-- Abort if PUBLIC/another inherited role still grants dangerous table/column powers.
DO $$ DECLARE r text; col record; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF has_table_privilege(r,'public.busy_business_snapshots','UPDATE')
  OR has_table_privilege(r,'public.busy_business_snapshots','DELETE')
  OR has_table_privilege(r,'public.busy_business_snapshots','TRUNCATE')
  OR has_table_privilege(r,'public.busy_business_snapshots','TRIGGER')
  OR has_table_privilege(r,'public.busy_business_snapshots','INSERT')
  OR has_any_column_privilege(r,'public.busy_business_snapshots','UPDATE') THEN
   RAISE EXCEPTION 'Inherited legacy write authority remains for %',r USING ERRCODE='42501';
  END IF;
  IF r='authenticated' THEN
   FOR col IN SELECT a.attname FROM pg_catalog.pg_attribute a WHERE a.attrelid='public.busy_business_snapshots'::regclass AND a.attnum>0 AND NOT a.attisdropped AND a.attname<>'business_id' LOOP
    IF has_column_privilege(r,'public.busy_business_snapshots',col.attname,'INSERT') THEN RAISE EXCEPTION 'Inherited non-bootstrap column insert remains' USING ERRCODE='42501'; END IF;
   END LOOP;
  END IF;
  IF r<>'authenticated' AND has_any_column_privilege(r,'public.busy_business_snapshots','INSERT') THEN
   RAISE EXCEPTION 'Unreviewed insert privilege remains' USING ERRCODE='42501';
  END IF;
 END LOOP;
END $$;
COMMIT;
