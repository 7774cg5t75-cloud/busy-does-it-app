import {createHash} from 'node:crypto';
import {aiLabRunnerFoundationPackage,assertRunnerOwnedSql} from './ai-lab-runner-foundation-package.mjs';

// Pure proposal composition. No transport, credentials, Auth administrator,
// database executor, migration, publication or AI admission is provided here.
export const AI_LAB_SETUP_PROJECT='sbvkrvksnruiclcvclbd';
export const AI_LAB_SETUP_ORGANIZATION='wrjfgasxtlznzfzmfrif';
export const AI_LAB_SETUP_EMAIL='quiet-light-owner@busy-ai-lab.invalid';
export const AI_LAB_SETUP_NAME='Quiet Light Studio';
export const AI_LAB_SETUP_MIGRATION='ai_lab_quiet_light_owner_setup_v1';
export const AI_LAB_SETUP_OWNER_TOKEN='__BUSY_NATIVE_AUTH_OWNER_UUID__';
export const AI_LAB_SETUP_FUSE="DO $$ BEGIN RAISE EXCEPTION 'AI LAB FICTIONAL SETUP REVIEW FUSE: separate exact native-owner-bound Approval B2 required'; END $$;";
const INSTALLED_VERSION='20261106221950';
const INSTALLED_NAME='mission18_ai_lab_foundation';
const INSTALLED_SHA='231b7eecdab788f3829d93c4f1995ce111a6b2b4a953644bdc6d0f785b6a5987';
const NATIVE_HOOK_SHA='b21d88816c445d14cef5032c3cd4abaebc1db2001fcb3435022ab6b496182ca4';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join('|')===[...keys].sort().join('|');
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function original(root){
 const p=aiLabRunnerFoundationPackage(root);
 if(p.sha256!=='b825989b37e2fef0f874ccdb03405a6650f8dc6ddfe27f94086952cc1cec225d'||p.executionDerivativeSha256!==INSTALLED_SHA)throw Error('Original reviewed foundation changed');
 return p;
}
function source(p){return `-- REVIEW ONLY: Approval B2 original canonical business/membership data setup.
-- Target ${AI_LAB_SETUP_PROJECT}; organisation ${AI_LAB_SETUP_ORGANIZATION}; Free; Ireland eu-west-1.
-- This SQL cannot identify its control-plane project. Independently verify the
-- exact Lab-specific connection immediately before any separately approved use.
-- No Auth creation, profile/source write, DDL, ACL change or spending activation.
-- Native owner placeholder is deliberately unbound until separately approved B1.
-- The managed migration runner owns the complete data + native-history transaction.
${AI_LAB_SETUP_FUSE}
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
-- Brief SHARE locks prevent Auth deletion/identity changes during binding;
-- canonical locks serialize the fresh-only pair. Contention stops execution.
LOCK TABLE auth.users,auth.identities IN SHARE MODE;
LOCK TABLE public.busy_businesses,public.busy_business_memberships IN SHARE ROW EXCLUSIVE MODE;
DO $setup$
DECLARE
 expected_owner constant uuid := '${AI_LAB_SETUP_OWNER_TOKEN}'::uuid;
 owner_record record;
 created_business uuid;
 t record;
 r text;
BEGIN
 IF current_user<>'postgres' OR current_setting('server_version_num')::integer NOT BETWEEN 170000 AND 179999 THEN RAISE EXCEPTION 'Reviewed PostgreSQL17 postgres setup runner required';END IF;
 IF (SELECT count(*) FROM supabase_migrations.schema_migrations)<>1 OR NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='${INSTALLED_VERSION}' AND name='${INSTALLED_NAME}' AND cardinality(statements)=1 AND encode(sha256(convert_to(statements[1],'UTF8')),'hex')='${INSTALLED_SHA}') THEN RAISE EXCEPTION 'Exact independently verified installed foundation receipt required';END IF;
 IF (SELECT array_agg(tablename::text ORDER BY tablename) FROM pg_tables WHERE schemaname='public') IS DISTINCT FROM ARRAY[${p.canonicalPublicTables.map(n=>"'"+n+"'").join(',')}] THEN RAISE EXCEPTION 'Original public table closure changed';END IF;
 IF (SELECT array_agg(tablename::text ORDER BY tablename) FROM pg_tables WHERE schemaname='busy_ai_private') IS DISTINCT FROM ARRAY['accounts','events','operations','periods','policy','tariffs'] THEN RAISE EXCEPTION 'Original private AI table closure changed';END IF;
 IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND left(p.proname,5)='busy_')<>74 THEN RAISE EXCEPTION 'Original public function closure changed';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid=to_regprocedure('public.rls_auto_enable()') AND p.proowner='postgres'::regrole AND encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')='${NATIVE_HOOK_SHA}') OR NOT EXISTS(SELECT 1 FROM pg_event_trigger WHERE evtname='ensure_rls' AND evtenabled='O' AND evtowner='postgres'::regrole AND evtfoid=to_regprocedure('public.rls_auto_enable()') AND evttags=ARRAY['CREATE TABLE','CREATE TABLE AS','SELECT INTO']) THEN RAISE EXCEPTION 'Native automatic RLS guard changed';END IF;
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF has_schema_privilege(r,'public','CREATE') OR has_schema_privilege(r,'busy_ai_private','USAGE,CREATE') OR has_function_privilege(r,'public.rls_auto_enable()','EXECUTE') OR has_table_privilege(r,'public.busy_businesses','INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN') OR has_table_privilege(r,'public.busy_business_memberships','INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN') OR has_any_column_privilege(r,'public.busy_businesses','INSERT,UPDATE,REFERENCES') OR has_any_column_privilege(r,'public.busy_business_memberships','INSERT,UPDATE,REFERENCES') THEN RAISE EXCEPTION 'Original setup security boundary changed';END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND (c.relowner<>'postgres'::regrole OR NOT c.relrowsecurity OR c.relforcerowsecurity IS DISTINCT FROM (c.relname::text=ANY(ARRAY['busy_businesses','busy_business_memberships','busy_business_snapshots'])))) OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='busy_ai_private' AND c.relkind='r' AND (c.relowner<>'postgres'::regrole OR NOT c.relrowsecurity OR NOT c.relforcerowsecurity)) THEN RAISE EXCEPTION 'Original table ownership or RLS changed';END IF;
 IF NOT EXISTS(SELECT 1 FROM busy_ai_private.policy WHERE singleton AND enabled=false AND monthly_hard_limit=0) OR (SELECT count(*) FROM busy_ai_private.policy)<>1 OR EXISTS(SELECT 1 FROM busy_ai_private.accounts) OR EXISTS(SELECT 1 FROM busy_ai_private.periods) OR EXISTS(SELECT 1 FROM busy_ai_private.tariffs) OR EXISTS(SELECT 1 FROM busy_ai_private.operations) OR EXISTS(SELECT 1 FROM busy_ai_private.events) THEN RAISE EXCEPTION 'AI policy and ledger must remain disabled zero and empty';END IF;
 IF (SELECT count(*) FROM auth.users)<>1 THEN RAISE EXCEPTION 'Exactly one separately approved native laboratory owner required';END IF;
 SELECT id,email,email_confirmed_at,is_anonymous,role,aud,deleted_at,banned_until,is_super_admin,is_sso_user INTO STRICT owner_record FROM auth.users WHERE id=expected_owner;
 IF owner_record.email IS DISTINCT FROM '${AI_LAB_SETUP_EMAIL}' OR owner_record.email_confirmed_at IS NULL OR owner_record.is_anonymous IS DISTINCT FROM false OR owner_record.role IS DISTINCT FROM 'authenticated' OR owner_record.aud IS DISTINCT FROM 'authenticated' OR owner_record.deleted_at IS NOT NULL OR owner_record.banned_until IS NOT NULL OR owner_record.is_super_admin IS TRUE OR owner_record.is_sso_user IS DISTINCT FROM false THEN RAISE EXCEPTION 'Current confirmed native laboratory owner does not match';END IF;
 IF (SELECT count(*) FROM auth.identities)<>1 OR NOT EXISTS(SELECT 1 FROM auth.identities WHERE user_id=expected_owner AND provider='email') THEN RAISE EXCEPTION 'Exactly one native email identity required';END IF;
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename<>'busy_mini_app_module_catalog' LOOP
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I)',t.tablename) INTO r;
  IF r::boolean THEN RAISE EXCEPTION 'Fresh fictional business setup only; unexpected existing record in %',t.tablename;END IF;
 END LOOP;
 IF (SELECT count(*) FROM public.busy_mini_app_module_catalog)<>9 THEN RAISE EXCEPTION 'Original static module registry changed';END IF;
 INSERT INTO public.busy_businesses(name,created_by) VALUES('${AI_LAB_SETUP_NAME}',expected_owner) RETURNING id INTO created_business;
 INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES(created_business,expected_owner,'owner');
 IF (SELECT count(*) FROM public.busy_businesses)<>1 OR (SELECT count(*) FROM public.busy_business_memberships)<>1 OR NOT EXISTS(SELECT 1 FROM public.busy_businesses b JOIN public.busy_business_memberships m ON m.business_id=b.id WHERE b.id=created_business AND b.name='${AI_LAB_SETUP_NAME}' AND b.created_by=expected_owner AND m.user_id=expected_owner AND m.role='owner') THEN RAISE EXCEPTION 'Exact canonical setup readback mismatch';END IF;
END $setup$;
-- This is transaction acknowledgement only. Independently read back afterward.
SELECT jsonb_build_object('kind','busy.ai-lab-fictional-business-setup.v1','projectRef','${AI_LAB_SETUP_PROJECT}','ownerId',created_by,'businessId',id,'businessName',name,'privateOnly',true,'providerDispatched',false) AS setup_result FROM public.busy_businesses WHERE created_by='${AI_LAB_SETUP_OWNER_TOKEN}'::uuid AND name='${AI_LAB_SETUP_NAME}';
`;}
export function aiLabFictionalSetupTemplate(root){
 const p=original(root),sql=source(p);
 assertRunnerOwnedSql(sql);
 return {version:'busy.ai-lab-fictional-business-setup.v1',targetProject:AI_LAB_SETUP_PROJECT,targetOrganization:AI_LAB_SETUP_ORGANIZATION,expectedRegion:'eu-west-1',expectedPlan:'free',expectedPostgresMajor:17,ownerEmail:AI_LAB_SETUP_EMAIL,ownerId:null,businessName:AI_LAB_SETUP_NAME,foundationVersion:INSTALLED_VERSION,foundationName:INSTALLED_NAME,foundationExecutionSha256:INSTALLED_SHA,migrationName:AI_LAB_SETUP_MIGRATION,runner:'Supabase managed apply_migration; one runner-owned data plus native-history transaction; no embedded BEGIN/COMMIT',status:'awaiting-separately-approved-native-Auth-UUID',templateSha256:sha(sql),executionDerivativeSha256:null,sql,hostedExecutionReady:false,approvalRequired:true,outerFusePresent:true,createsAuthUser:false,createsBusinessCount:1,createsOwnerMembershipCount:1,createsProfileOrWebsite:false,createsSchemaOrFunction:false,changesPermissions:false,spendingEnabled:false,providerCalls:0,rollbackAuthorized:false,noAutomaticRetry:true,requiresWholeTransaction:true,credentialsAccepted:false};
}
export function bindAiLabFictionalSetup(root,observation){
 if(!exact(observation,['projectRef','organizationId','region','plan','foundation','user','authUserCount','identityCount','observedAt']))throw Error('Exact independent native owner readback required');
 if(observation.projectRef!==AI_LAB_SETUP_PROJECT||observation.organizationId!==AI_LAB_SETUP_ORGANIZATION||observation.region!=='eu-west-1'||observation.plan!=='free')throw Error('Wrong laboratory target');
 const f=observation.foundation;
 if(!exact(f,['version','name','statementCount','executionSha256'])||f.version!==INSTALLED_VERSION||f.name!==INSTALLED_NAME||f.statementCount!==1||f.executionSha256!==INSTALLED_SHA)throw Error('Original native migration receipt required');
 const u=observation.user;
 if(!exact(u,['id','email','emailConfirmedAt','isAnonymous','role','aud','deletedAt','bannedUntil','identityProvider']))throw Error('Bound native owner attributes required');
 if(!uuid.test(u.id)||/^(?:16161616|20000000|30000000|40000000|11111111|00000000)-/.test(u.id))throw Error('Real native UUID required; known fixture identity denied');
 if(u.email!==AI_LAB_SETUP_EMAIL||u.isAnonymous!==false||u.role!=='authenticated'||u.aud!=='authenticated'||u.deletedAt!==null||u.bannedUntil!==null||u.identityProvider!=='email'||observation.authUserCount!==1||observation.identityCount!==1||typeof u.emailConfirmedAt!=='string'||!Number.isFinite(Date.parse(u.emailConfirmedAt))||typeof observation.observedAt!=='string'||!Number.isFinite(Date.parse(observation.observedAt)))throw Error('Current confirmed native laboratory owner required');
 const p=aiLabFictionalSetupTemplate(root),sql=p.sql.replaceAll(AI_LAB_SETUP_OWNER_TOKEN,u.id);
 const derivative=fictionalSetupExecutionDerivative(sql,root);
 return {...p,ownerId:u.id,status:'bound-proposal-requires-fresh-B2-approval',templateSha256:p.templateSha256,sha256:sha(sql),executionDerivativeSha256:sha(derivative),nativeReadbackSha256:sha(JSON.stringify(observation)),nativeReadbackObservedAt:observation.observedAt,hostedExecutionReady:false,sql};
}
export function fictionalSetupExecutionDerivative(sql,root=process.cwd()){
 const owner=typeof sql==='string'&&/expected_owner constant uuid := '([0-9a-f-]+)'::uuid;/.exec(sql)?.[1];
 if(!owner||!uuid.test(owner)||sql.includes(AI_LAB_SETUP_OWNER_TOKEN)||sql.split(AI_LAB_SETUP_FUSE).length!==2||sql!==source(original(root)).replaceAll(AI_LAB_SETUP_OWNER_TOKEN,owner))throw Error('Exact fully bound setup proposal and outer fuse required');
 const result=sql.replace(AI_LAB_SETUP_FUSE+'\n','');assertRunnerOwnedSql(result);return result;
}
export function readOnlyFictionalSetupVerification(){return `-- READ ONLY; metadata and the separately approved fictional identity only.
-- No Auth credentials, token material or customer records are returned.
BEGIN READ ONLY;
SELECT jsonb_build_object('observedAt',now(),'readOnly',current_setting('transaction_read_only'),
 'authUserCount',(SELECT count(*) FROM auth.users),'identityCount',(SELECT count(*) FROM auth.identities),
 'owners',(SELECT coalesce(jsonb_agg(jsonb_build_object('ownerId',u.id,'email',u.email,'emailConfirmedAt',u.email_confirmed_at,'isAnonymous',u.is_anonymous,'role',u.role,'aud',u.aud,'deletedAt',u.deleted_at,'bannedUntil',u.banned_until,'identityProvider',i.provider) ORDER BY u.id),'[]') FROM auth.users u LEFT JOIN auth.identities i ON i.user_id=u.id WHERE u.email='${AI_LAB_SETUP_EMAIL}'),
 'businessCount',(SELECT count(*) FROM public.busy_businesses),'membershipCount',(SELECT count(*) FROM public.busy_business_memberships),
 'businesses',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'createdBy',created_by) ORDER BY id),'[]') FROM public.busy_businesses WHERE name='${AI_LAB_SETUP_NAME}' AND created_by IN(SELECT id FROM auth.users WHERE email='${AI_LAB_SETUP_EMAIL}')),
 'memberships',(SELECT coalesce(jsonb_agg(jsonb_build_object('businessId',business_id,'userId',user_id,'role',role) ORDER BY business_id,user_id),'[]') FROM public.busy_business_memberships WHERE user_id IN(SELECT id FROM auth.users WHERE email='${AI_LAB_SETUP_EMAIL}')),
 'policy',(SELECT jsonb_build_object('enabled',enabled,'monthlyHardLimit',monthly_hard_limit) FROM busy_ai_private.policy),
 'aiAccounts',(SELECT count(*) FROM busy_ai_private.accounts),'aiPeriods',(SELECT count(*) FROM busy_ai_private.periods),'aiTariffs',(SELECT count(*) FROM busy_ai_private.tariffs),'aiOperations',(SELECT count(*) FROM busy_ai_private.operations),'aiEvents',(SELECT count(*) FROM busy_ai_private.events),
 'profiles',(SELECT count(*) FROM public.busy_public_business_profiles),'snapshots',(SELECT count(*) FROM public.busy_business_snapshots),
 'nativeReceipts',(SELECT jsonb_agg(jsonb_build_object('version',version,'name',name,'statementCount',cardinality(statements),'executionSha256',encode(sha256(convert_to(array_to_string(statements,E'\\n'),'UTF8')),'hex')) ORDER BY version) FROM supabase_migrations.schema_migrations)) AS verification;
COMMIT;
`;}
