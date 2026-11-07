-- Catalogue only. Never reads waitlist/canary rows, token hashes or sequence counters.
SELECT jsonb_build_object(
'relations',(SELECT jsonb_agg(to_jsonb(x) ORDER BY name) FROM (
 SELECT c.relname AS name,c.relkind::text AS kind,pg_get_userbyid(c.relowner) AS owner,c.relrowsecurity AS rls,c.relforcerowsecurity AS force_rls,c.reloptions AS options,
 CASE WHEN c.relacl IS NULL THEN NULL ELSE ARRAY(SELECT a::text FROM unnest(c.relacl) a ORDER BY a::text) END AS acl
 FROM pg_class c WHERE c.oid IN (to_regclass('public.busy_marketing_waitlist'),to_regclass('public.busy_staging_rls_canary'),to_regclass('public.busy_marketing_waitlist_id_seq'))
) x),
'columns',(SELECT jsonb_agg(to_jsonb(x) ORDER BY name,num) FROM (
 SELECT c.relname AS name,a.attnum AS num,a.attname AS column_name,format_type(a.atttypid,a.atttypmod) AS type,a.attnotnull AS not_null,pg_get_expr(d.adbin,d.adrelid) AS default_value,a.attidentity::text AS identity,a.attgenerated::text AS generated,
 CASE WHEN a.attacl IS NULL THEN NULL ELSE ARRAY(SELECT v::text FROM unnest(a.attacl) v ORDER BY v::text) END AS acl
 FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
 WHERE c.oid IN (to_regclass('public.busy_marketing_waitlist'),to_regclass('public.busy_staging_rls_canary')) AND a.attnum>0 AND NOT a.attisdropped
) x),
'constraints',(SELECT jsonb_agg(to_jsonb(x) ORDER BY table_name,name) FROM (
 SELECT c.relname AS table_name,k.conname AS name,pg_get_constraintdef(k.oid,true) AS definition,k.convalidated AS validated
 FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid WHERE c.oid IN (to_regclass('public.busy_marketing_waitlist'),to_regclass('public.busy_staging_rls_canary'))
) x),
'indexes',(SELECT jsonb_agg(to_jsonb(x) ORDER BY tablename,indexname) FROM (
 SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename IN ('busy_marketing_waitlist','busy_staging_rls_canary')
) x),
'policies',(SELECT jsonb_agg(to_jsonb(x) ORDER BY tablename,policyname) FROM (
 SELECT tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename IN ('busy_marketing_waitlist','busy_staging_rls_canary')
) x),
'user_triggers',(SELECT jsonb_agg(to_jsonb(x) ORDER BY table_name,name) FROM (
 SELECT c.relname AS table_name,t.tgname AS name,t.tgenabled::text AS enabled,pg_get_triggerdef(t.oid,true) AS definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
 WHERE c.oid IN (to_regclass('public.busy_marketing_waitlist'),to_regclass('public.busy_staging_rls_canary')) AND NOT t.tgisinternal
) x),
'sequences',(SELECT jsonb_agg(to_jsonb(x) ORDER BY name) FROM (
 SELECT c.relname AS name,s.seqstart::text AS start,s.seqincrement::text AS increment,s.seqmin::text AS min,s.seqmax::text AS max,s.seqcache::text AS cache,s.seqcycle AS cycle,
 pg_get_serial_sequence('public.busy_marketing_waitlist','id') AS identity_of
 FROM pg_sequence s JOIN pg_class c ON c.oid=s.seqrelid WHERE c.oid=to_regclass('public.busy_marketing_waitlist_id_seq')
) x),
'public_schema',(SELECT jsonb_build_object('owner',pg_get_userbyid(nspowner),'acl',ARRAY(SELECT a::text FROM unnest(nspacl) a ORDER BY a::text)) FROM pg_namespace WHERE nspname='public'),
'postgres_public_defaults',(SELECT jsonb_agg(to_jsonb(x) ORDER BY schema_name COLLATE "C",kind COLLATE "C") FROM (
 SELECT CASE WHEN a.defaclnamespace=0 THEN 'GLOBAL' ELSE n.nspname END AS schema_name,a.defaclobjtype::text AS kind,ARRAY(SELECT v::text FROM unnest(a.defaclacl) v ORDER BY v::text) AS acl
 FROM pg_default_acl a LEFT JOIN pg_namespace n ON n.oid=a.defaclnamespace WHERE a.defaclrole='postgres'::regrole AND (a.defaclnamespace=0 OR n.nspname='public')
) x),
'rls_function',(SELECT jsonb_build_object('owner',pg_get_userbyid(p.proowner),'definition',pg_get_functiondef(p.oid),'acl',ARRAY(SELECT v::text FROM unnest(p.proacl) v ORDER BY v::text),'config',p.proconfig) FROM pg_proc p WHERE p.oid=to_regprocedure('public.rls_auto_enable()')),
'rls_event',(SELECT jsonb_build_object('owner',pg_get_userbyid(evtowner),'event',evtevent,'enabled',evtenabled::text,'tags',evttags) FROM pg_event_trigger WHERE evtname='ensure_rls')
) AS preserved;
