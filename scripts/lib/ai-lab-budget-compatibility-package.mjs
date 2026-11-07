// Review-only adaptation of the ORIGINAL tariff constraint. No connection,
// provider, credential, account activation or migration runner is exposed.
import {createHash} from 'node:crypto';
import {aiLabRunnerFoundationPackage,assertRunnerOwnedSql} from './ai-lab-runner-foundation-package.mjs';
import {aiLabB3SourceContractPackage} from './ai-lab-b3-source-contract-package.mjs';
import {sqlStatements} from './owner-status-schema.mjs';
export const AI_LAB_BUDGET_COMPATIBILITY_PATH='docs/sql-proposals/ai-lab-budget-output-compatibility';
export const AI_LAB_BUDGET_COMPATIBILITY_MIGRATION='ai_lab_creative_output_12000_v1';
export const budgetCompatibilityHash=value=>createHash('sha256').update(value).digest('hex');
const q=value=>"'"+String(value).replaceAll("'","''")+"'";
const clean=s=>s.replace(/^(?:\s|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/,'').trim();
const fuse=kind=>`DO $$ BEGIN RAISE EXCEPTION 'AI LAB BUDGET OUTPUT ${kind} REVIEW FUSE: separate exact approval required'; END $$;`;
export function budgetCompatibilityExecutionDerivative(sql,kind='INSTALL'){
 if(!['INSTALL','ROLLBACK'].includes(kind)||typeof sql!=='string'||sql.split(fuse(kind)+'\n').length!==2)throw Error('Exact budget compatibility review fuse required');
 const result=sql.replace(fuse(kind)+'\n','');assertRunnerOwnedSql(result);return result;
}
function expectedFunctions(root){
 const original=aiLabRunnerFoundationPackage(root),changes=aiLabB3SourceContractPackage(root),functions=new Map();
 for(const raw of sqlStatements(original.sql)){
  const statement=clean(raw),name=statement.match(/^CREATE(?: OR REPLACE)? FUNCTION\s+([a-zA-Z0-9_.]+)\s*\(/i)?.[1],body=statement.match(/\bAS\s+(\$[A-Za-z0-9_]*\$)([\s\S]*?)\1\s*;?$/i)?.[2];
  if(name&&body!==undefined)functions.set(name,budgetCompatibilityHash(body));
  const move=statement.match(/^ALTER FUNCTION\s+([a-zA-Z0-9_.]+)\([^;]+\) SET SCHEMA ([a-zA-Z0-9_]+)\s*;?$/i),rename=statement.match(/^ALTER FUNCTION\s+([a-zA-Z0-9_.]+)\([^;]+\) RENAME TO ([a-zA-Z0-9_]+)\s*;?$/i);
  if(move){if(!functions.has(move[1]))throw Error('Unknown original function move');functions.set(move[2]+'.'+move[1].split('.').at(-1),functions.get(move[1]));functions.delete(move[1]);}
  if(rename){if(!functions.has(rename[1]))throw Error('Unknown original function rename');functions.set(rename[1].split('.')[0]+'.'+rename[2],functions.get(rename[1]));functions.delete(rename[1]);}
 }
 for(const item of changes.originalFunctionChanges){const name=item.signature.split('(')[0];if(functions.get(name)!==item.originalBodySha256)throw Error('Original function source does not match the reviewed nonretry correction');functions.set(name,item.revisedBodySha256);}
 functions.set('public.busy_connected_builder_source_state_v1',changes.newFunctionBodySha256);
 if(functions.size!==108)throw Error('Original function dependency closure changed');
 return {original,changes,functions:[...functions].sort(([a],[b])=>a.localeCompare(b))};
}
const catalogue=`jsonb_build_object(
 'relations',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'name',c.relname,'kind',c.relkind,'owner',pg_get_userbyid(c.relowner),'acl',c.relacl::text,'rls',c.relrowsecurity,'force',c.relforcerowsecurity) ORDER BY n.nspname,c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN('public','busy_ai_private','busy_snapshot_private') AND c.relkind IN('r','p','S','v','m')),
 'functions',(SELECT jsonb_agg(jsonb_build_object('signature',p.oid::regprocedure::text,'owner',pg_get_userbyid(p.proowner),'acl',p.proacl::text,'config',p.proconfig,'definer',p.prosecdef,'body',encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')) ORDER BY p.oid::regprocedure::text) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN('public','busy_ai_private','busy_snapshot_private')),
 'constraints',(SELECT jsonb_agg(jsonb_build_object('table',c.conrelid::regclass::text,'name',c.conname,'definition',pg_get_constraintdef(c.oid),'validated',c.convalidated) ORDER BY c.conrelid::regclass::text,c.conname) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname IN('public','busy_ai_private','busy_snapshot_private') AND NOT(c.conrelid='busy_ai_private.tariffs'::regclass AND c.conname='tariffs_max_output_check')),
 'indexes',(SELECT jsonb_agg(jsonb_build_object('table',schemaname||'.'||tablename,'name',indexname,'definition',indexdef) ORDER BY schemaname,indexname) FROM pg_indexes WHERE schemaname IN('public','busy_ai_private','busy_snapshot_private')),
 'triggers',(SELECT jsonb_agg(jsonb_build_object('table',tgrelid::regclass::text,'name',tgname,'definition',pg_get_triggerdef(oid),'enabled',tgenabled) ORDER BY tgrelid::regclass::text,tgname) FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN(SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN('public','busy_ai_private','busy_snapshot_private'))),
 'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY schemaname,tablename,policyname) FROM pg_policies p WHERE schemaname IN('public','busy_ai_private','busy_snapshot_private')),
 'defaults',(SELECT jsonb_agg(to_jsonb(d)-'oid' ORDER BY defaclrole,defaclnamespace,defaclobjtype) FROM pg_default_acl d),
 'events',(SELECT jsonb_agg(to_jsonb(e) ORDER BY evtname) FROM pg_event_trigger e),
 'sequences',(SELECT jsonb_agg(to_jsonb(s) ORDER BY schemaname,sequencename) FROM pg_sequences s WHERE schemaname IN('public','busy_ai_private','busy_snapshot_private')))`;
const snapshot=(name)=>`FOR item IN SELECT schemaname,tablename FROM pg_tables WHERE schemaname IN('public','busy_ai_private') ORDER BY schemaname,tablename LOOP
 EXECUTE format('SELECT encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),''[]''::jsonb)::text,''UTF8'')),''hex'') FROM %I.%I t',item.schemaname,item.tablename) INTO row_hash;
 ${name}:=${name}||jsonb_build_object(item.schemaname||'.'||item.tablename,row_hash);
END LOOP;`;
function migration(root,rollback=false){
 const {original,changes,functions}=expectedFunctions(root),old=rollback?12000:4000,next=rollback?4000:12000,kind=rollback?'ROLLBACK':'INSTALL';
 const values=functions.map(([name,sha])=>'('+q(name)+','+q(sha)+')').join(',\n ');
 const sql=`-- REVIEW ONLY: AI Lab sbvkrvksnruiclcvclbd / wrjfgasxtlznzfzmfrif / Ireland eu-west-1 / Free / PostgreSQL17.
-- Managed runner owns the complete application + native-history transaction. Do not split or embed transaction controls.
-- Verify control-plane project identity separately; current_database() cannot identify a Supabase project.
-- Changes only the original tariff max_output CHECK. No grants, functions, data, entitlement, tariff or policy activation.
${fuse(kind)}
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
DO $budget_compatibility$
DECLARE item record; row_hash text; before_rows jsonb:='{}'; after_rows jsonb:='{}'; before_catalogue jsonb; after_catalogue jsonb; function_count integer;
BEGIN
 IF current_user<>'postgres' OR current_setting('server_version_num')::integer NOT BETWEEN 170000 AND 179999 THEN RAISE EXCEPTION 'Reviewed postgres installer and PostgreSQL17 required'; END IF;
 IF to_regclass('supabase_migrations.schema_migrations') IS NULL
 OR NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261106221950' AND name='mission18_ai_lab_foundation')
 OR NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261107000304' AND name='ai_lab_quiet_light_owner_setup_v1')
 OR NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE name='ai_lab_b3_nonretry_source_contract_v1' AND cardinality(statements)=1 AND encode(sha256(convert_to(statements[1],'UTF8')),'hex')=${q(changes.executionDerivativeSha256)}) THEN RAISE EXCEPTION 'Original installed native receipts required'; END IF;
 IF (SELECT array_agg(tablename::text ORDER BY tablename) FROM pg_tables WHERE schemaname='public') IS DISTINCT FROM ARRAY[${original.canonicalPublicTables.map(q).join(',')}]::text[] OR (SELECT array_agg(tablename::text ORDER BY tablename) FROM pg_tables WHERE schemaname='busy_ai_private') IS DISTINCT FROM ARRAY['accounts','events','operations','periods','policy','tariffs']::text[] THEN RAISE EXCEPTION 'Original canonical closure changed'; END IF;
 IF (SELECT count(*) FROM busy_ai_private.policy)<>1 OR EXISTS(SELECT 1 FROM busy_ai_private.policy WHERE enabled OR monthly_hard_limit<>0) THEN RAISE EXCEPTION 'Policy must remain disabled/zero'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN('public','busy_ai_private') AND c.relkind IN('r','p') AND (NOT c.relrowsecurity OR n.nspname='busy_ai_private' AND NOT c.relforcerowsecurity)) THEN RAISE EXCEPTION 'Original RLS/FORCE RLS changed'; END IF;
 IF has_schema_privilege('anon','busy_ai_private','USAGE,CREATE') OR has_schema_privilege('authenticated','busy_ai_private','USAGE,CREATE') OR has_schema_privilege('service_role','busy_ai_private','USAGE,CREATE') THEN RAISE EXCEPTION 'Original private schema boundary changed'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN (VALUES('anon'),('authenticated'),('service_role')) r(role) WHERE n.nspname='busy_ai_private' AND c.relkind IN('r','p') AND has_table_privilege(r.role,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')) THEN RAISE EXCEPTION 'Original private table ACL changed'; END IF;
 IF encode(sha256(convert_to(pg_get_functiondef(to_regprocedure('public.rls_auto_enable()')),'UTF8')),'hex') IS DISTINCT FROM ${q(original.nativeHookDefinitionSha256)} OR NOT EXISTS(SELECT 1 FROM pg_event_trigger WHERE evtname='ensure_rls' AND evtenabled IN('O','A') AND evtfoid=to_regprocedure('public.rls_auto_enable()')) OR EXISTS(SELECT 1 FROM aclexplode(coalesce((SELECT proacl FROM pg_proc WHERE oid=to_regprocedure('public.rls_auto_enable()')),acldefault('f','postgres'::regrole))) WHERE grantee IN(0,'anon'::regrole,'authenticated'::regrole,'service_role'::regrole) AND privilege_type='EXECUTE') THEN RAISE EXCEPTION 'Original native automatic RLS hook changed'; END IF;
 IF EXISTS(SELECT 1 FROM pg_default_acl d CROSS JOIN LATERAL aclexplode(d.defaclacl) a WHERE d.defaclrole='postgres'::regrole AND d.defaclobjtype='r' AND d.defaclnamespace IN(0,'public'::regnamespace) AND a.grantee IN(0,'anon'::regrole,'authenticated'::regrole,'service_role'::regrole) AND a.privilege_type IN('SELECT','INSERT','UPDATE','DELETE')) THEN RAISE EXCEPTION 'Automatic API table exposure changed'; END IF;
 FOR item IN SELECT * FROM (VALUES
 ${values}
 ) expected(name,sha) LOOP
  SELECT count(*) INTO function_count FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname||'.'||p.proname=item.name AND p.proowner='postgres'::regrole AND encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')=item.sha;
  IF function_count<>1 THEN RAISE EXCEPTION 'Original function fingerprint changed: %',item.name; END IF;
 END LOOP;
 FOR item IN SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN('busy_ai_context_v1','busy_ai_reserve_v1','busy_ai_dispatch_v1','busy_ai_finish_v1','busy_ai_operation_read_v1') LOOP
  IF NOT has_function_privilege('service_role',item.oid,'EXECUTE') OR has_function_privilege('anon',item.oid,'EXECUTE') OR has_function_privilege('authenticated',item.oid,'EXECUTE') OR EXISTS(SELECT 1 FROM aclexplode(coalesce((SELECT proacl FROM pg_proc WHERE oid=item.oid),acldefault('f','postgres'::regrole))) WHERE grantee=0 AND privilege_type='EXECUTE') THEN RAISE EXCEPTION 'Original service-only AI authority changed'; END IF;
 END LOOP;
 LOCK TABLE busy_ai_private.tariffs IN ACCESS EXCLUSIVE MODE;
 IF (SELECT count(*) FROM pg_constraint WHERE conrelid='busy_ai_private.tariffs'::regclass AND conname='tariffs_max_output_check' AND contype='c' AND convalidated AND pg_get_constraintdef(oid)=${q(`CHECK (((max_output >= 1) AND (max_output <= ${old})))`)})<>1 THEN RAISE EXCEPTION 'Expected original output constraint changed or migration already applied'; END IF;
 IF ${rollback?'EXISTS(SELECT 1 FROM busy_ai_private.tariffs WHERE max_output>4000)':'false'} THEN RAISE EXCEPTION 'Retain higher-output tariffs and liability history; rollback cannot lower the constraint'; END IF;
 before_catalogue:=${catalogue};
 ${snapshot('before_rows')}
 ALTER TABLE busy_ai_private.tariffs DROP CONSTRAINT tariffs_max_output_check;
 ALTER TABLE busy_ai_private.tariffs ADD CONSTRAINT tariffs_max_output_check CHECK(max_output BETWEEN 1 AND ${next});
 after_catalogue:=${catalogue};
 ${snapshot('after_rows')}
 IF before_catalogue IS DISTINCT FROM after_catalogue OR before_rows IS DISTINCT FROM after_rows THEN RAISE EXCEPTION 'Preservation verification failed; complete runner transaction must roll back'; END IF;
 IF (SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='busy_ai_private.tariffs'::regclass AND conname='tariffs_max_output_check') IS DISTINCT FROM ${q(`CHECK (((max_output >= 1) AND (max_output <= ${next})))`)} THEN RAISE EXCEPTION 'Independent output constraint readback failed'; END IF;
END $budget_compatibility$;
`;
 assertRunnerOwnedSql(sql);return sql;
}
export function aiLabBudgetCompatibilityPackage(root){
 const install=migration(root),rollback=migration(root,true),meta=expectedFunctions(root);
 return {version:'busy.ai-lab-budget-output-compatibility.v1',targetProject:'sbvkrvksnruiclcvclbd',targetOrganization:'wrjfgasxtlznzfzmfrif',region:'eu-west-1',plan:'free',postgresMajor:17,migrationName:AI_LAB_BUDGET_COMPATIBILITY_MIGRATION,oldOutputLimit:4000,newOutputLimit:12000,inputLimit:8000,originalFunctions:meta.functions.map(([name,bodySha256])=>({name,bodySha256})),originalSourceContractExecutionSha256:meta.changes.executionDerivativeSha256,sha256:budgetCompatibilityHash(install),executionDerivativeSha256:budgetCompatibilityHash(budgetCompatibilityExecutionDerivative(install)),rollbackSha256:budgetCompatibilityHash(rollback),rollbackExecutionDerivativeSha256:budgetCompatibilityHash(budgetCompatibilityExecutionDerivative(rollback,'ROLLBACK')),approvalRequired:true,runnerOwnsTransactionAndHistory:true,noAutomaticRetry:true,hostedExecutionAuthorised:false,changesPolicy:false,createsEntitlements:false,createsTariffs:false,retainsAllDataReceiptsAndLiabilities:true,rollbackRefusesIncompatibleRetainedTariffs:true,controlPlaneIdentityReadbackRequired:true,install,rollback};
}
// Technical readback only: never emits business/profile bodies, native IDs,
// credentials, stored migration SQL or provider/usage receipt contents.
export function aiLabBudgetCompatibilityReadOnlyQuery(root,{installed=false}={}){
 const p=aiLabBudgetCompatibilityPackage(root),values=p.originalFunctions.map(x=>'('+q(x.name)+','+q(x.bodySha256)+')').join(',\n '),limit=installed?12000:4000;
 return `-- READ ONLY: AI Lab sbvkrvksnruiclcvclbd only, after independent control-plane identity verification.
BEGIN READ ONLY;
SET LOCAL lock_timeout='1s';
SET LOCAL statement_timeout='5s';
WITH expected(name,sha) AS (VALUES
 ${values}
)
SELECT jsonb_build_object(
 'observedAt',clock_timestamp(),'readOnly',current_setting('transaction_read_only'),'postgresVersion',current_setting('server_version'),
 'publicTableCount',(SELECT count(*) FROM pg_tables WHERE schemaname='public'),'privateAiTableCount',(SELECT count(*) FROM pg_tables WHERE schemaname='busy_ai_private'),
 'originalFunctionCount',(SELECT count(*) FROM expected),'allOriginalFunctionBodiesMatch',NOT EXISTS(SELECT 1 FROM expected e WHERE (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname||'.'||p.proname=e.name AND p.proowner='postgres'::regrole AND encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')=e.sha)<>1),
 'outputConstraint',(SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='busy_ai_private.tariffs'::regclass AND conname='tariffs_max_output_check'),
 'expectedOutputConstraintMatches',EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='busy_ai_private.tariffs'::regclass AND conname='tariffs_max_output_check' AND convalidated AND pg_get_constraintdef(oid)=${q(`CHECK (((max_output >= 1) AND (max_output <= ${limit})))`)}),
 'policy',(SELECT jsonb_build_object('enabled',enabled,'monthlyHardLimit',monthly_hard_limit) FROM busy_ai_private.policy),
 'aiCounts',jsonb_build_object('accounts',(SELECT count(*) FROM busy_ai_private.accounts),'tariffs',(SELECT count(*) FROM busy_ai_private.tariffs),'periods',(SELECT count(*) FROM busy_ai_private.periods),'operations',(SELECT count(*) FROM busy_ai_private.operations),'events',(SELECT count(*) FROM busy_ai_private.events)),
 'liability',jsonb_build_object('reserved',(SELECT coalesce(sum(reserved),0) FROM busy_ai_private.periods),'spent',(SELECT coalesce(sum(spent),0) FROM busy_ai_private.periods)),
 'rlsPreserved',NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN('public','busy_ai_private') AND c.relkind IN('r','p') AND (NOT c.relrowsecurity OR n.nspname='busy_ai_private' AND NOT c.relforcerowsecurity)),
 'nativeRlsHookMatches',encode(sha256(convert_to(pg_get_functiondef(to_regprocedure('public.rls_auto_enable()')),'UTF8')),'hex')=${q(p.originalFunctions.find(x=>x.name==='public.rls_auto_enable')?.bodySha256||'b21d88816c445d14cef5032c3cd4abaebc1db2001fcb3435022ab6b496182ca4')},
 'nativeRlsEventEnabled',EXISTS(SELECT 1 FROM pg_event_trigger WHERE evtname='ensure_rls' AND evtenabled IN('O','A') AND evtfoid=to_regprocedure('public.rls_auto_enable()')),
 'serviceOnlyAiFunctions',(SELECT coalesce(bool_and(has_function_privilege('service_role',p.oid,'EXECUTE') AND NOT has_function_privilege('anon',p.oid,'EXECUTE') AND NOT has_function_privilege('authenticated',p.oid,'EXECUTE')),false) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN('busy_ai_context_v1','busy_ai_reserve_v1','busy_ai_dispatch_v1','busy_ai_finish_v1','busy_ai_operation_read_v1')),
 'migrationReceiptCount',(SELECT count(*) FROM supabase_migrations.schema_migrations WHERE name=${q(p.migrationName)}),
 'exactStoredStatementReceiptCount',(SELECT count(*) FROM supabase_migrations.schema_migrations WHERE name=${q(p.migrationName)} AND cardinality(statements)=1 AND encode(sha256(convert_to(statements[1],'UTF8')),'hex')=${q(p.executionDerivativeSha256)})
) AS verification;
COMMIT;
`;
}
