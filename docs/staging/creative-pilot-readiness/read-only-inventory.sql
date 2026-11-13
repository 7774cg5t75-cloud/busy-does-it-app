-- Read-only catalogue inspection. No key, auth.users rows, business rows or private media.
SELECT to_regnamespace('busy_ai_private')::text AS ai_namespace,
 to_regclass('public.busy_businesses')::text AS businesses,
 to_regclass('public.busy_business_memberships')::text AS memberships,
 to_regclass('public.busy_business_snapshots')::text AS snapshots,
 to_regclass('public.busy_public_business_profiles')::text AS profiles,
 to_regprocedure('public.busy_ai_context_v1(uuid,uuid,jsonb)')::text AS context_reader,
 to_regprocedure('public.busy_ai_reserve_v1(uuid,uuid,uuid,text,text,jsonb,text,uuid)')::text AS reserve,
 to_regprocedure('public.busy_ai_operation_read_v1(uuid,uuid,uuid,uuid)')::text AS receipt_reader;
SELECT p.proname,pg_get_function_identity_arguments(p.oid) AS arguments,p.prosecdef,p.proacl::text,p.proconfig
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname LIKE 'busy_ai_%' ORDER BY p.proname;
SELECT n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relacl::text
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE c.relkind IN ('r','p') AND (n.nspname='busy_ai_private' OR (n.nspname='public' AND c.relname IN
 ('busy_businesses','busy_business_memberships','busy_business_snapshots','busy_public_business_profiles')))
ORDER BY n.nspname,c.relname;
SELECT c.relname AS public_table FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p') ORDER BY c.relname;
