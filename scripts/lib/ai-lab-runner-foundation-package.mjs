import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {aiLabFoundationPackage,AI_LAB_REF} from './ai-lab-foundation-package.mjs';
import {sqlStatements} from './owner-status-schema.mjs';

const hash=s=>createHash('sha256').update(s).digest('hex');
const ORIGINAL_INSTALL='3ebf79cdcc5614d7be3573e0ecad68ae93ec8e5c3bf751fa2c0c6cbac5a9030b';
const ORIGINAL_ROLLBACK='b5a43ecac26215bde42e5d537423d98e605cadca2dc784661b8bcc2414f7a079';
export const RUNNER_MIGRATION_NAME='mission18_ai_lab_foundation';
const clean=s=>s.replace(/^(?:\s|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/,'').trim();
export function assertRunnerOwnedSql(sql){
 const statements=sqlStatements(sql).map(clean);
 if(!statements.length)throw Error('Empty runner-owned migration');
 for(const statement of statements){
  if(/^(?:BEGIN|START\s+TRANSACTION|COMMIT|END|ROLLBACK|ABORT|PREPARE\s+TRANSACTION|SAVEPOINT|RELEASE\s+SAVEPOINT|VACUUM|ALTER\s+SYSTEM|CLUSTER)\b/i.test(statement)||/^(?:CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+INDEX|REINDEX)\b[\s\S]*\bCONCURRENTLY\b/i.test(statement))throw Error('Runner transaction boundary or incompatible top-level command refused');
 }
 if(/--\s*pg-delta:\s*transaction\s*=\s*false/i.test(sql))throw Error('Nontransactional runner directive refused');
 return statements;
}
const oldFuse=kind=>`DO $$ BEGIN RAISE EXCEPTION 'AI LAB ${kind} REVIEW FUSE: separate exact ${kind==='FOUNDATION'?'lab installation':'retaining rollback'} approval required'; END $$;`;
const newFuse=kind=>`DO $$ BEGIN RAISE EXCEPTION 'AI LAB RUNNER ${kind} REVIEW FUSE: new exact runner-owned ${kind==='FOUNDATION'?'installation':'retaining rollback'} approval required'; END $$;`;
function adapt(source,kind){
 const begin='\nBEGIN;\n',end='\nCOMMIT;\n',fuse=oldFuse(kind);
 if(source.split(begin).length!==2||!source.endsWith(end)||source.split(fuse).length!==2)throw Error('Pinned outer boundary changed');
 const body=source.replace(begin,'\n').slice(0,-end.length)+'\n';
 const result=body.replace(fuse,()=>newFuse(kind));
 assertRunnerOwnedSql(result);
 // Reverse the exact three permitted edits. Canonical SQL bytes cannot drift.
 const reversed=result.replace(newFuse(kind),()=>fuse).replace('\n'+fuse,()=> '\nBEGIN;\n'+fuse).slice(0,-1)+end;
 if(reversed!==source)throw Error('Unexpected change beyond outer transaction/fuse adaptation');
 return result;
}
export function runnerExecutionDerivative(sql,kind='FOUNDATION'){
 const fuse=newFuse(kind);
 if(sql.split(fuse).length!==2)throw Error('Exact runner review fuse required');
 const result=sql.replace(fuse+'\n','');assertRunnerOwnedSql(result);return result;
}
// Pure artifact composition only. No database runner, target connection, credentials or network.
export function aiLabRunnerFoundationPackage(root){
 const original=aiLabFoundationPackage(root);
 if(original.sha256!==ORIGINAL_INSTALL||original.rollbackSha256!==ORIGINAL_ROLLBACK)throw Error('Original approved source hash changed');
 for(const [path,digest] of [['install.sql',ORIGINAL_INSTALL],['rollback-retain.sql',ORIGINAL_ROLLBACK]])if(hash(readFileSync(root+'/docs/sql-proposals/ai-lab-foundation/'+path))!==digest)throw Error('Original approved artifact bytes changed');
 const sql=adapt(original.sql,'FOUNDATION'),rollback=adapt(original.rollback,'ROLLBACK');
 return {version:1,targetProject:AI_LAB_REF,targetOrganization:'wrjfgasxtlznzfzmfrif',expectedRegion:'eu-west-1',expectedPlan:'free',expectedPostgresMajor:17,migrationName:RUNNER_MIGRATION_NAME,originalInstallSha256:ORIGINAL_INSTALL,originalRollbackSha256:ORIGINAL_ROLLBACK,sha256:hash(sql),rollbackSha256:hash(rollback),executionDerivativeSha256:hash(runnerExecutionDerivative(sql)),rollbackExecutionDerivativeSha256:hash(runnerExecutionDerivative(rollback,'ROLLBACK')),canonicalPublicTables:original.canonicalPublicTables,foundationPublicFunctions:original.foundationPublicFunctions,privateAiTables:['accounts','events','operations','periods','policy','tariffs'],serviceOnlyAiFunctions:['busy_ai_context_v1','busy_ai_dispatch_v1','busy_ai_finish_v1','busy_ai_operation_read_v1','busy_ai_reserve_v1'],nativeHookDefinitionSha256:original.nativeHookDefinitionSha256,changes:['Remove exactly one outer BEGIN and final COMMIT; runner owns the complete migration and history transaction','Replace only the outer review fuse with a new approval-specific fuse; retain all inner SQL bytes'],runner:{selected:'Supabase managed apply_migration via POST /v1/projects/{ref}/database/migrations',requiresSingleTransactionWithHistory:true,noEmbeddedTransactionControls:true,noAutomaticRetry:true,backendImplementationPublic:false,hostedExecutionAuthorized:false,managedAtomicityAuthority:'Official Supabase documentation; not a hosted execution or private-backend inspection',historyBootstrapBoundary:'Runner-owned native migration-history setup may precede the application transaction; inspect it separately. No application object may persist when the migration/history transaction fails.'},sources:[{url:'https://supabase.com/kb/troubleshooting/partial-migrations-and-schema-inconsistencies-from-embedded-transactions-13ae82',reviewed:'2026-11-06',supports:'Remove authored BEGIN/COMMIT so built-in migration transaction remains authoritative'},{url:'https://supabase.com/docs/guides/integrations/supabase-for-platforms#make-database-changes',reviewed:'2026-11-06',supports:'Managed migrations create native migration history; failure rolls back changes'},{url:'https://github.com/supabase/mcp/blob/7e5037bd31d765c67f657d536e28c41f32953072/packages/mcp-server-supabase/src/platform/api-platform.ts#L259',supports:'MCP forwards the whole query/name to the project-specific managed migration endpoint; acknowledgement is not independent readback'},{url:'https://github.com/supabase/cli/blob/4cc97fa9fdb66a1ab91984e81333c047ae889549/apps/cli/src/command-internal/migration-apply.ts#L494',supports:'Public CLI corroboration: compatible statements and native history insert share one batch; not evidence of the private managed backend'},{url:'https://github.com/supabase/cli/blob/4cc97fa9fdb66a1ab91984e81333c047ae889549/apps/cli/src/command-internal/db-connection.sql-pg.layer.ts#L256',supports:'Public CLI batch sends one extended-query Sync after all statements; local rehearsal tests transaction/history semantics independently'}],autoExecute:false,providerEnabled:false,policyEnabled:false,approvalRequired:true,originalApprovalReusable:false,retainsLiabilities:true,receiptReaderRetained:true,sql,rollback};
}
