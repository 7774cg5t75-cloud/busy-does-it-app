-- READ ONLY, exact AI Lab control-plane identity must be verified independently first.
-- Fixed target sbvkrvksnruiclcvclbd; owner accepted eu-west-1 for this fictional lab only.
-- One JSON result retains every check through runners that expose only the last result set.
BEGIN READ ONLY;
SELECT jsonb_build_object(
 'observedAt',now(),'transactionReadOnly',current_setting('transaction_read_only'),
 'installer',current_user,'postgresVersion',current_setting('server_version'),
 'databaseCreate',has_database_privilege(current_user,current_database(),'CREATE'),
 'publicCreate',has_schema_privilege(current_user,'public','CREATE'),
 'nativeAuthReferences',has_table_privilege(current_user,'auth.users','REFERENCES'),
 'nativeAuthUidExists',to_regprocedure('auth.uid()') IS NOT NULL,
 'unexpectedAuthRows',EXISTS(SELECT 1 FROM auth.users),
 'publicObjects',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',c.relname,'kind',c.relkind::text) ORDER BY c.relname),'[]') FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','f','S') AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_class'::regclass AND d.objid=c.oid AND d.deptype='e')),
 'busySchemas',(SELECT coalesce(jsonb_agg(nspname ORDER BY nspname),'[]') FROM pg_namespace WHERE nspname LIKE 'busy\_%' ESCAPE '\'),
 'publicRoutines',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',p.oid::regprocedure::text,'owner',pg_get_userbyid(p.proowner),'kind',p.prokind::text) ORDER BY p.oid),'[]') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e')),
 'eventTriggers',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',evtname,'event',evtevent,'enabled',evtenabled::text,'owner',pg_get_userbyid(evtowner),'function',evtfoid::regprocedure::text,'tags',evttags) ORDER BY evtname),'[]') FROM pg_event_trigger),
 'nativeHook',(SELECT jsonb_build_object('owner',pg_get_userbyid(p.proowner),'securityDefiner',p.prosecdef,'config',p.proconfig,'acl',p.proacl::text,'definitionSha256',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'),'anonExecute',has_function_privilege('anon',p.oid,'EXECUTE'),'authenticatedExecute',has_function_privilege('authenticated',p.oid,'EXECUTE'),'serviceExecute',has_function_privilege('service_role',p.oid,'EXECUTE')) FROM pg_proc p WHERE p.oid=to_regprocedure('public.rls_auto_enable()')),
 'roles',(SELECT jsonb_agg(jsonb_build_object('name',rolname,'superuser',rolsuper,'bypassRls',rolbypassrls,'inherit',rolinherit,'createRole',rolcreaterole) ORDER BY rolname) FROM pg_roles WHERE rolname IN ('postgres','anon','authenticated','service_role')),
 'defaultPrivileges',(SELECT coalesce(jsonb_agg(jsonb_build_object('schema',CASE WHEN d.defaclnamespace=0 THEN 'GLOBAL' ELSE n.nspname END,'kind',d.defaclobjtype::text,'acl',d.defaclacl::text) ORDER BY d.defaclnamespace,d.defaclobjtype),'[]') FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace WHERE d.defaclrole='postgres'::regrole AND (d.defaclnamespace=0 OR n.nspname='public')),
 'extensions',(SELECT jsonb_agg(jsonb_build_object('name',e.extname,'version',e.extversion,'schema',n.nspname) ORDER BY e.extname) FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace)
) AS preflight;
COMMIT;
