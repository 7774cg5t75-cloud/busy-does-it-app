// Exact installer boundary, not an application permission or hosted executor.
export const stagingPreflight=`DO $$ BEGIN
 IF current_user<>'postgres' THEN RAISE EXCEPTION 'Reviewed postgres installer required';END IF;
 IF EXISTS(SELECT 1 FROM pg_namespace WHERE nspname IN ('busy_snapshot_private','busy_work_private','busy_creator_private','busy_growth_private')) THEN RAISE EXCEPTION 'Fresh reviewed staging only: existing private schema requires independent upgrade review';END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname<>'busy_staging_rls_canary' AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_class'::regclass AND d.objid=c.oid AND d.deptype='e') AND c.relkind IN ('v','m','f','S')) THEN RAISE EXCEPTION 'Fresh reviewed staging only: unexpected exposed relation requires review';END IF;
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e') AND NOT (p.proname='rls_auto_enable' AND p.pronargs=0 AND p.prorettype='event_trigger'::regtype AND p.proowner='postgres'::regrole AND p.proconfig=ARRAY['search_path=pg_catalog'] AND NOT has_function_privilege('anon',p.oid,'EXECUTE') AND NOT has_function_privilege('authenticated',p.oid,'EXECUTE') AND NOT has_function_privilege('service_role',p.oid,'EXECUTE'))) THEN RAISE EXCEPTION 'Fresh reviewed staging only: unexpected public routine requires review';END IF;
END $$;
REVOKE CREATE ON SCHEMA public FROM PUBLIC,anon,authenticated,service_role;`;
// Defaults are creator-specific. Exact installer ownership is checked above.
export const stagingDefaultPrivileges=`ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ALL ON TABLES FROM PUBLIC,anon,authenticated,service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ALL ON SEQUENCES FROM PUBLIC,anon,authenticated,service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC,anon,authenticated,service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC,anon,authenticated,service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC,anon,authenticated,service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC,anon,authenticated,service_role;`;
export const stagingPostflight=`DO $$ DECLARE f record; r text; BEGIN
 FOR f IN SELECT p.oid,p.prosecdef,p.proconfig,p.proowner FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE (n.nspname='public' AND p.proname LIKE 'busy_%') OR n.nspname IN ('busy_snapshot_private','busy_work_private','busy_creator_private','busy_growth_private') LOOP
  IF f.proowner<>'postgres'::regrole THEN RAISE EXCEPTION 'Unexpected function owner';END IF;
  IF f.prosecdef AND (f.proconfig IS NULL OR NOT f.proconfig&&ARRAY['search_path=pg_catalog, pg_temp','search_path=pg_catalog','search_path=""']) THEN RAISE EXCEPTION 'Unsafe definer search path: %',f.oid::regprocedure;END IF;
  IF has_function_privilege('anon',f.oid,'EXECUTE') THEN RAISE EXCEPTION 'Anonymous function exposure';END IF;
 END LOOP;
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP IF has_schema_privilege(r,'public','CREATE') THEN RAISE EXCEPTION 'Client schema CREATE exposure';END IF;END LOOP;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND NOT c.relrowsecurity) THEN RAISE EXCEPTION 'Missing RLS';END IF;
END $$;`;
