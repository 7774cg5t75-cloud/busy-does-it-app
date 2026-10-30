import {wholeAppFunctionSignatures} from './whole-app-function-signatures.mjs';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sqlStatements,ownerStatusSchema} from './owner-status-schema.mjs';
const clean=s=>s.replace(/--[^\n]*/g,'').trim(),hash=s=>createHash('sha256').update(s).digest('hex');
const paths=['staging/ISOLATED_ONLY_business_core_v3180.sql','docs/sql-proposals/connected-builders/staging-foundation.sql','docs/sql-proposals/connected-builders/owner-status.sql','docs/sql-proposals/phase58-snapshot/writer.sql','docs/sql-proposals/phase58-snapshot/fence.sql','docs/sql-proposals/phase60-snapshot/privacy-fence.sql','docs/sql-proposals/phase60-snapshot/readers.sql','docs/sql-proposals/connected-builders/contracts.sql','supabase/migrations/20261013081000_v3199_atomic_first_private_app.sql','docs/sql-proposals/phase64-snapshot/first-enquiry.sql','docs/sql-proposals/phase65-snapshot/operations.sql','docs/sql-proposals/connected-builders/app-enquiry.sql','docs/sql-proposals/connected-builders/durable-journey.sql','docs/sql-proposals/canonical-work/engagements.sql','docs/sql-proposals/connected-builders/private-work-permissions.sql','docs/sql-proposals/connected-builders/app-transaction.sql','docs/sql-proposals/growth/opportunities.sql','docs/sql-proposals/creator/private-drafts.sql','docs/sql-proposals/connected-builders/business-context.sql'];
export const wholeAppAuthenticatedFunctions=['busy_connected_initialize_v1','busy_connected_profile_write_v1','busy_connected_workspaces_v1','busy_connected_builder_read_v1','busy_connected_app_enquiry_state_v1','busy_connected_app_enquiry_review_v1','busy_connected_app_enquiry_import_v2','busy_connected_app_enquiry_file_v2','busy_connected_journeys_v1','busy_owner_pending_review_v1','busy_owner_first_reply_review_v1','busy_work_source_review_v1','busy_work_create_quote_v1','busy_work_list_v1','busy_work_discover_v1','busy_work_compare_v1','busy_work_edit_context_v1','busy_work_history_v1','busy_work_read_v1','busy_work_edit_quote_v1','busy_work_private_read_v1','busy_work_private_write_v1',...['read','list','write','operation'].map(n=>'busy_creator_draft_'+n+'_v1'),...['read','list','write','operation'].map(n=>'busy_growth_opportunity_'+n+'_v1')];
const serviceFunctions=['busy_connected_website_commit_v1','busy_connected_first_app_v1','busy_connected_private_app_commit_v1','busy_mini_app_entry_summary'];
// Fresh staging only. Original selected sources + explicit compatibility baseline.
// No connection, shell, credentials, seed rows or mutation is performed here.
export function wholeAppStagingPackage(root){
 const parts=paths.map(path=>{const text=readFileSync(root+'/'+path,'utf8');let fuses=0;const body=sqlStatements(text).filter(s=>{const c=clean(s);if(/^(BEGIN|COMMIT);$/i.test(c))return false;if(/^DO \$\$ BEGIN RAISE EXCEPTION '[A-Z0-9 ]+REVIEW FUSE: [^']+'; END \$\$;$/i.test(c)){fuses++;return false;}return true;}).join('\n');if(path.includes('sql-proposals')&&!path.endsWith('writer.sql')&&!path.endsWith('readers.sql')&&fuses!==1)throw Error('Unexpected source fuse '+path);return {path,sha256:hash(text),body};});
 const tables=ownerStatusSchema(root).tables;
 const originalFiles=readdirSync(root+'/supabase/migrations').filter(x=>x.endsWith('.sql')).sort();const supplement=[];
 for(const file of originalFiles)for(const statement of sqlStatements(readFileSync(root+'/supabase/migrations/'+file,'utf8'))){
  const c=clean(statement),index=/^create (?:unique )?index[^;]+?\bon public\.([a-z_]+)/i.exec(c);
  if(index&&tables.includes(index[1]))supplement.push({path:'supabase/migrations/'+file,sql:statement});
  if(/^create (?:or replace )?function public\.busy_guard_(?:website_deployment|mini_app_version)_immutable\(/i.test(c)||/^create trigger busy_(?:website_deployment_immutable|mini_app_versions_immutable)\b/i.test(c))supplement.push({path:'supabase/migrations/'+file,sql:statement});
  if(/^alter table public\.busy_websites\s+add constraint busy_websites_current_(?:preview|live)_deployment_fkey/i.test(c)||/^do \$\$[\s\S]*conname = 'busy_mini_apps_preview_version_fkey'[\s\S]*end\s*\$\$;/i.test(c))supplement.push({path:'supabase/migrations/'+file,sql:statement});
 }
 const signatures=names=>names.map(n=>"'"+n+'('+wholeAppFunctionSignatures[n]+')'+"'").join(','),auth=signatures(wholeAppAuthenticatedFunctions),service=signatures(serviceFunctions);
 const acl=`DO $$ DECLARE f record; t record; col record; BEGIN
 FOR t IN SELECT c.oid,n.nspname,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname<>'busy_staging_rls_canary' LOOP
  EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',t.nspname,t.relname);
  EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM PUBLIC,anon,authenticated,service_role',t.nspname,t.relname);
  FOR col IN SELECT attname FROM pg_attribute WHERE attrelid=t.oid AND attnum>0 AND NOT attisdropped LOOP EXECUTE format('REVOKE SELECT (%I),INSERT (%I),UPDATE (%I),REFERENCES (%I) ON TABLE %I.%I FROM PUBLIC,anon,authenticated,service_role',col.attname,col.attname,col.attname,col.attname,t.nspname,t.relname);END LOOP;
  IF t.relname=ANY(ARRAY[${[...tables,'busy_businesses','busy_business_memberships'].map(x=>"'"+x+"'").join(',')}]) THEN EXECUTE format('GRANT SELECT ON TABLE %I.%I TO service_role',t.nspname,t.relname);END IF;
 END LOOP;
 FOR f IN SELECT p.oid::regprocedure signature,p.proname,n.nspname,p.proname||'('||oidvectortypes(p.proargtypes)||')' AS exact FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE (n.nspname='public' AND p.proname LIKE 'busy_%') OR n.nspname IN ('busy_snapshot_private','busy_work_private','busy_growth_private','busy_creator_private') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
  IF f.nspname='public' AND f.exact IN (${auth}) THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);END IF;
  IF f.nspname='public' AND f.exact IN (${service}) THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);END IF;
 END LOOP;
END $$;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC,anon,authenticated,service_role;`;
 const sql=`-- GENERATED REVIEW ONLY: pnjdlogwegnqbsfpcofw fresh compatibility foundation; NOT production DDL capture.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'WHOLE APP STAGING REVIEW FUSE: separate exact installation approval required'; END $$;
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='120s';
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename<>'busy_staging_rls_canary') THEN RAISE EXCEPTION 'Fresh reviewed staging only: preserve existing operational records';END IF;IF to_regclass('auth.users') IS NULL OR to_regprocedure('auth.uid()') IS NULL THEN RAISE EXCEPTION 'Genuine Auth foundation required';END IF;END $$;
${parts.map(p=>'-- Source '+p.path+' SHA256 '+p.sha256+'\n'+p.body).join('\n')}
${supplement.map(s=>'-- Original '+s.path+' SHA256 '+hash(s.sql)+'\n'+s.sql).join('\n')}
${acl}
COMMIT;
`;
 const retainedReaders=wholeAppAuthenticatedFunctions.filter(n=>!/(?:initialize|profile_write|creator_draft_write|growth_opportunity_write|app_enquiry_import|app_enquiry_file|work_create_quote|work_edit_quote|work_private_write)/.test(n));
 const rollback=`-- RETAINING ROLLBACK REVIEW ONLY: leaves all rows and exact read/reconciliation authorities.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'WHOLE APP ROLLBACK REVIEW FUSE: separate exact rollback approval required'; END $$;
SET LOCAL lock_timeout='5s';
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure signature,p.proname,n.nspname,p.proname||'('||oidvectortypes(p.proargtypes)||')' AS exact FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE (n.nspname='public' AND p.proname LIKE 'busy_%') OR n.nspname IN ('busy_snapshot_private','busy_work_private','busy_growth_private','busy_creator_private') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
 IF f.nspname='public' AND f.exact IN (${signatures(retainedReaders)}) THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);END IF;
 END LOOP;
END $$;
COMMIT;
`;
 return {targetProject:'pnjdlogwegnqbsfpcofw',compatibilityFoundation:true,productionSchemaCapture:false,autoExecute:false,serverSwitchEnabled:false,authUsersCreated:false,activationReady:false,sourceCandidates:parts.map(({body,...p})=>p),supplements:supplement.map(s=>({path:s.path,sha256:hash(s.sql)})),sql,sha256:hash(sql),rollback,rollbackSha256:hash(rollback),retainedReaders,functionSignatures:wholeAppFunctionSignatures,authFunctions:wholeAppAuthenticatedFunctions,serviceFunctions};
}
