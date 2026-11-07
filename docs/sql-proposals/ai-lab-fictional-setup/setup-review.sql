-- REVIEW ONLY: Approval B2 original canonical business/membership data setup.
-- Target sbvkrvksnruiclcvclbd; organisation wrjfgasxtlznzfzmfrif; Free; Ireland eu-west-1.
-- This SQL cannot identify its control-plane project. Independently verify the
-- exact Lab-specific connection immediately before any separately approved use.
-- No Auth creation, profile/source write, DDL, ACL change or spending activation.
-- Native owner placeholder is deliberately unbound until separately approved B1.
-- The managed migration runner owns the complete data + native-history transaction.
DO $$ BEGIN RAISE EXCEPTION 'AI LAB FICTIONAL SETUP REVIEW FUSE: separate exact native-owner-bound Approval B2 required'; END $$;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
-- Brief SHARE locks prevent Auth deletion/identity changes during binding;
-- canonical locks serialize the fresh-only pair. Contention stops execution.
LOCK TABLE auth.users,auth.identities IN SHARE MODE;
LOCK TABLE public.busy_businesses,public.busy_business_memberships IN SHARE ROW EXCLUSIVE MODE;
DO $setup$
DECLARE
 expected_owner constant uuid := '__BUSY_NATIVE_AUTH_OWNER_UUID__'::uuid;
 owner_record record;
 created_business uuid;
 t record;
 r text;
BEGIN
 IF current_user<>'postgres' OR current_setting('server_version_num')::integer NOT BETWEEN 170000 AND 179999 THEN RAISE EXCEPTION 'Reviewed PostgreSQL17 postgres setup runner required';END IF;
 IF (SELECT count(*) FROM supabase_migrations.schema_migrations)<>1 OR NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261106221950' AND name='mission18_ai_lab_foundation' AND cardinality(statements)=1 AND encode(sha256(convert_to(statements[1],'UTF8')),'hex')='231b7eecdab788f3829d93c4f1995ce111a6b2b4a953644bdc6d0f785b6a5987') THEN RAISE EXCEPTION 'Exact independently verified installed foundation receipt required';END IF;
 IF (SELECT array_agg(tablename::text ORDER BY tablename) FROM pg_tables WHERE schemaname='public') IS DISTINCT FROM ARRAY['business_work_agreement_decisions','business_work_agreement_evidence','business_work_engagements','business_work_private_drafts','business_work_quote_recipient_bindings','business_work_quote_references','busy_business_content','busy_business_memberships','busy_business_snapshots','busy_businesses','busy_creator_draft_heads','busy_creator_draft_versions','busy_growth_opportunities','busy_growth_opportunity_versions','busy_mini_app_entry_daily','busy_mini_app_entry_events','busy_mini_app_message_delivery_outbox','busy_mini_app_module_catalog','busy_mini_app_request_links','busy_mini_app_request_messages','busy_mini_app_requests','busy_mini_app_versions','busy_mini_app_work_bookings','busy_mini_apps','busy_public_business_profiles','busy_push_deliveries','busy_website_deployments','busy_websites'] THEN RAISE EXCEPTION 'Original public table closure changed';END IF;
 IF (SELECT array_agg(tablename::text ORDER BY tablename) FROM pg_tables WHERE schemaname='busy_ai_private') IS DISTINCT FROM ARRAY['accounts','events','operations','periods','policy','tariffs'] THEN RAISE EXCEPTION 'Original private AI table closure changed';END IF;
 IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND left(p.proname,5)='busy_')<>74 THEN RAISE EXCEPTION 'Original public function closure changed';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid=to_regprocedure('public.rls_auto_enable()') AND p.proowner='postgres'::regrole AND encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')='b21d88816c445d14cef5032c3cd4abaebc1db2001fcb3435022ab6b496182ca4') OR NOT EXISTS(SELECT 1 FROM pg_event_trigger WHERE evtname='ensure_rls' AND evtenabled='O' AND evtowner='postgres'::regrole AND evtfoid=to_regprocedure('public.rls_auto_enable()') AND evttags=ARRAY['CREATE TABLE','CREATE TABLE AS','SELECT INTO']) THEN RAISE EXCEPTION 'Native automatic RLS guard changed';END IF;
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF has_schema_privilege(r,'public','CREATE') OR has_schema_privilege(r,'busy_ai_private','USAGE,CREATE') OR has_function_privilege(r,'public.rls_auto_enable()','EXECUTE') OR has_table_privilege(r,'public.busy_businesses','INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN') OR has_table_privilege(r,'public.busy_business_memberships','INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN') OR has_any_column_privilege(r,'public.busy_businesses','INSERT,UPDATE,REFERENCES') OR has_any_column_privilege(r,'public.busy_business_memberships','INSERT,UPDATE,REFERENCES') THEN RAISE EXCEPTION 'Original setup security boundary changed';END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND (c.relowner<>'postgres'::regrole OR NOT c.relrowsecurity OR c.relforcerowsecurity IS DISTINCT FROM (c.relname::text=ANY(ARRAY['busy_businesses','busy_business_memberships','busy_business_snapshots'])))) OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='busy_ai_private' AND c.relkind='r' AND (c.relowner<>'postgres'::regrole OR NOT c.relrowsecurity OR NOT c.relforcerowsecurity)) THEN RAISE EXCEPTION 'Original table ownership or RLS changed';END IF;
 IF NOT EXISTS(SELECT 1 FROM busy_ai_private.policy WHERE singleton AND enabled=false AND monthly_hard_limit=0) OR (SELECT count(*) FROM busy_ai_private.policy)<>1 OR EXISTS(SELECT 1 FROM busy_ai_private.accounts) OR EXISTS(SELECT 1 FROM busy_ai_private.periods) OR EXISTS(SELECT 1 FROM busy_ai_private.tariffs) OR EXISTS(SELECT 1 FROM busy_ai_private.operations) OR EXISTS(SELECT 1 FROM busy_ai_private.events) THEN RAISE EXCEPTION 'AI policy and ledger must remain disabled zero and empty';END IF;
 IF (SELECT count(*) FROM auth.users)<>1 THEN RAISE EXCEPTION 'Exactly one separately approved native laboratory owner required';END IF;
 SELECT id,email,email_confirmed_at,is_anonymous,role,aud,deleted_at,banned_until,is_super_admin,is_sso_user INTO STRICT owner_record FROM auth.users WHERE id=expected_owner;
 IF owner_record.email IS DISTINCT FROM 'quiet-light-owner@busy-ai-lab.invalid' OR owner_record.email_confirmed_at IS NULL OR owner_record.is_anonymous IS DISTINCT FROM false OR owner_record.role IS DISTINCT FROM 'authenticated' OR owner_record.aud IS DISTINCT FROM 'authenticated' OR owner_record.deleted_at IS NOT NULL OR owner_record.banned_until IS NOT NULL OR owner_record.is_super_admin IS TRUE OR owner_record.is_sso_user IS DISTINCT FROM false THEN RAISE EXCEPTION 'Current confirmed native laboratory owner does not match';END IF;
 IF (SELECT count(*) FROM auth.identities)<>1 OR NOT EXISTS(SELECT 1 FROM auth.identities WHERE user_id=expected_owner AND provider='email') THEN RAISE EXCEPTION 'Exactly one native email identity required';END IF;
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename<>'busy_mini_app_module_catalog' LOOP
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I)',t.tablename) INTO r;
  IF r::boolean THEN RAISE EXCEPTION 'Fresh fictional business setup only; unexpected existing record in %',t.tablename;END IF;
 END LOOP;
 IF (SELECT count(*) FROM public.busy_mini_app_module_catalog)<>9 THEN RAISE EXCEPTION 'Original static module registry changed';END IF;
 INSERT INTO public.busy_businesses(name,created_by) VALUES('Quiet Light Studio',expected_owner) RETURNING id INTO created_business;
 INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES(created_business,expected_owner,'owner');
 IF (SELECT count(*) FROM public.busy_businesses)<>1 OR (SELECT count(*) FROM public.busy_business_memberships)<>1 OR NOT EXISTS(SELECT 1 FROM public.busy_businesses b JOIN public.busy_business_memberships m ON m.business_id=b.id WHERE b.id=created_business AND b.name='Quiet Light Studio' AND b.created_by=expected_owner AND m.user_id=expected_owner AND m.role='owner') THEN RAISE EXCEPTION 'Exact canonical setup readback mismatch';END IF;
END $setup$;
-- This is transaction acknowledgement only. Independently read back afterward.
SELECT jsonb_build_object('kind','busy.ai-lab-fictional-business-setup.v1','projectRef','sbvkrvksnruiclcvclbd','ownerId',created_by,'businessId',id,'businessName',name,'privateOnly',true,'providerDispatched',false) AS setup_result FROM public.busy_businesses WHERE created_by='__BUSY_NATIVE_AUTH_OWNER_UUID__'::uuid AND name='Quiet Light Studio';
