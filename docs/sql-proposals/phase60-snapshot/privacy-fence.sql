-- NON-DEPLOYABLE REVIEW FUSE. All client/service read paths need compatible cutover.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'PHASE60 PRIVACY REVIEW FUSE: compatible reads, privileged paths and staging approval required'; END $$;
-- A view owner can bypass base-table RLS/ACL for its callers. Require explicit review.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_catalog.pg_depend d JOIN pg_catalog.pg_rewrite r ON d.objid=r.oid AND d.classid='pg_rewrite'::regclass JOIN pg_catalog.pg_class v ON v.oid=r.ev_class WHERE d.refobjid='public.busy_business_snapshots'::regclass AND v.relkind IN ('v','m')) THEN
  RAISE EXCEPTION 'Unreviewed snapshot view dependency' USING ERRCODE='42501';
 END IF;
END $$;
-- PL/pgSQL/dynamic/service readers are NOT completely discoverable this way.
-- Their authenticated inventory remains a mandatory activation prerequisite.
REVOKE SELECT ON TABLE public.busy_business_snapshots FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE col record; BEGIN
 FOR col IN SELECT attname FROM pg_attribute WHERE attrelid='public.busy_business_snapshots'::regclass AND attnum>0 AND NOT attisdropped LOOP
  EXECUTE format('REVOKE SELECT (%I) ON public.busy_business_snapshots FROM PUBLIC,anon,authenticated,service_role',col.attname);
 END LOOP;
END $$;
-- Identifier-only visibility for the original invoker ON CONFLICT bootstrap.
-- Existing membership RLS still applies; no payload/revision/schema column read.
GRANT SELECT (business_id) ON public.busy_business_snapshots TO authenticated;
-- The earlier RPC returns unknown nested fields; it becomes INTERNAL-only.
REVOKE EXECUTE ON FUNCTION public.busy_snapshot_private_mutation_v1(uuid,bigint,integer,text,text,jsonb,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE role_name text; col record; BEGIN
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF has_function_privilege(role_name,'public.busy_snapshot_private_mutation_v1(uuid,bigint,integer,text,text,jsonb,text,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'Legacy RPC privilege remains' USING ERRCODE='42501'; END IF;
  FOR col IN SELECT attname FROM pg_attribute WHERE attrelid='public.busy_business_snapshots'::regclass AND attnum>0 AND NOT attisdropped AND attname<>'business_id' LOOP
   IF has_column_privilege(role_name,'public.busy_business_snapshots',col.attname,'SELECT') THEN RAISE EXCEPTION 'Raw snapshot read privilege remains' USING ERRCODE='42501'; END IF;
  END LOOP;
 END LOOP;
END $$;
COMMIT;
