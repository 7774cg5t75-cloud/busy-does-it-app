import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sqlStatements} from './owner-status-schema.mjs';
const canonical='docs/sql-proposals/canonical-work/engagements.sql';
const closure='docs/sql-proposals/connected-builders/private-work-permissions.sql';
const entries=[[canonical,'CANONICAL WORK REVIEW FUSE: separate hosted approval required'],[closure,'PRIVATE WORK PERMISSIONS REVIEW FUSE: separate staging approval required']];
const clean=s=>s.replace(/--[^\n]*/g,'').trim();
// Compiles a review artefact only; deliberately has no DB, network or deploy API.
// Canonical functions and final private ACL closure become visible together.
export function canonicalPrivateActivation(root){
 const parts=entries.map(([path,fuse])=>{
  const text=readFileSync(root+'/'+path,'utf8'),statements=sqlStatements(text);let begin=0,end=0,removed=0;
  const body=statements.filter(statement=>{
   const command=clean(statement);
   if(/^BEGIN;$/i.test(command)){begin++;return false;}
   if(/^COMMIT;$/i.test(command)){end++;return false;}
   if(command===`DO $$ BEGIN RAISE EXCEPTION '${fuse}'; END $$;`){removed++;return false;}
   if(/^(?:BEGIN|COMMIT|ROLLBACK|START TRANSACTION)\b/i.test(command))throw Error('Unexpected transaction boundary: '+path);
   return true;
  });
  if(begin!==1||end!==1||removed!==1)throw Error('Original transaction/fuse changed: '+path);
  return {path,sha256:createHash('sha256').update(text).digest('hex'),body:body.join('\n')};
 });
 const checks=`DO $$ DECLARE f record; BEGIN
  FOR f IN SELECT oid,proname FROM pg_proc WHERE pronamespace='public'::regnamespace AND left(proname,10)='busy_work_' LOOP
   IF has_function_privilege('anon',f.oid,'EXECUTE') OR has_function_privilege('service_role',f.oid,'EXECUTE') THEN RAISE EXCEPTION 'Private Work ACL closure failed: %',f.proname; END IF;
   IF f.proname NOT IN ('busy_work_source_review_v1','busy_work_create_quote_v1','busy_work_list_v1','busy_work_discover_v1','busy_work_compare_v1','busy_work_edit_context_v1','busy_work_history_v1','busy_work_read_v1','busy_work_edit_quote_v1','busy_work_private_read_v1','busy_work_private_write_v1') AND has_function_privilege('authenticated',f.oid,'EXECUTE') THEN RAISE EXCEPTION 'Later lifecycle unexpectedly exposed: %',f.proname; END IF;
  END LOOP;
 END $$;`;
 const sql=`-- REVIEW ONLY. Target pnjdlogwegnqbsfpcofw, never production. Requires original scoped snapshot foundations.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'ATOMIC PRIVATE WORK REVIEW FUSE: separate exact staging approval required'; END $$;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
DO $$ BEGIN IF to_regclass('public.busy_business_snapshots') IS NULL OR to_regprocedure('busy_snapshot_private.lock_writer(uuid)') IS NULL THEN RAISE EXCEPTION 'Authentic reviewed foundation missing'; END IF; END $$;
${parts.map(p=>'-- '+p.path+' SHA256 '+p.sha256+'\n'+p.body).join('\n')}
${checks}
COMMIT;
`;
 return {targetProject:'pnjdlogwegnqbsfpcofw',autoExecute:false,requiresSeparateApproval:true,foundationProvisioned:false,parts:parts.map(({body,...p})=>p),sha256:createHash('sha256').update(sql).digest('hex'),sql};
}
