-- READ ONLY. Operator must independently select pnjdlogwegnqbsfpcofw.
-- No tokens, customers, auth-user rows, function bodies or business data returned.
BEGIN READ ONLY;
SELECT current_database() AS database_name,current_setting('server_version') AS postgres_version;
SELECT schemaname,tablename,rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
SELECT n.nspname,c.relname,a.attname,pg_catalog.format_type(a.atttypid,a.atttypmod),a.attnotnull,pg_get_expr(d.adbin,d.adrelid) AS default_expression
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
WHERE n.nspname='public' AND a.attnum>0 AND NOT a.attisdropped AND c.relkind='r' ORDER BY c.relname,a.attnum;
SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname;
SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname;
SELECT n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) AS arguments,p.prosecdef,p.proconfig,pg_get_userbyid(p.proowner) AS owner,
 r.role_name,has_function_privilege(r.role_name,p.oid,'EXECUTE') AS effective_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace CROSS JOIN (VALUES('anon'),('authenticated'),('service_role'))r(role_name)
WHERE n.nspname IN ('public','busy_snapshot_private','busy_work_private') ORDER BY n.nspname,p.proname,arguments,r.role_name;
SELECT n.nspname,c.relname,r.role_name,privilege,has_table_privilege(r.role_name,c.oid,privilege) AS effective_grant
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN (VALUES('anon'),('authenticated'),('service_role'))r(role_name) CROSS JOIN (VALUES('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'))v(privilege)
WHERE n.nspname='public' AND c.relkind='r' ORDER BY c.relname,r.role_name,privilege;
SELECT n.nspname,c.relname,t.tgname,t.tgenabled FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE NOT t.tgisinternal AND n.nspname='public' ORDER BY c.relname,t.tgname;
SELECT defaclrole::regrole,defaclnamespace::regnamespace,defaclobjtype,defaclacl FROM pg_default_acl;
COMMIT;
