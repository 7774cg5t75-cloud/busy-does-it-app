import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {wholeAppStagingPackage} from './whole-app-staging-package.mjs';
import {sqlStatements} from './owner-status-schema.mjs';
import {stagingPreservation} from './staging-preservation.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex'),clean=s=>s.replace(/--[^\n]*/g,'').trim();
// Reviewed source composition only. No connection, invocation, seed or activation.
export function preservationFoundationPackage(root){
 const base=wholeAppStagingPackage(root,{preserveOnboarding:true}),preservation=stagingPreservation(root);
 const extract=(text,label)=>{let fuses=0;const body=sqlStatements(text).filter(s=>{const c=clean(s);if(/^(BEGIN|COMMIT);$/i.test(c))return false;if(/^DO \$\$ BEGIN RAISE EXCEPTION '[A-Z0-9 ]+REVIEW FUSE: [^']+'; END \$\$;$/i.test(c)){fuses++;return false;}return true;}).join('\n');if(fuses!==1)throw Error('Original review fuse changed: '+label);return body;};
 const aiPath='docs/sql-proposals/ai-budget/install.sql',receiptPath='docs/sql-proposals/ai-creative-receipt/install.sql',ai=readFileSync(root+'/'+aiPath,'utf8'),receipt=readFileSync(root+'/'+receiptPath,'utf8');
 const sql=`-- REVIEW ONLY. Target pnjdlogwegnqbsfpcofw. No hosted execution authority.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'PRESERVATION FOUNDATION REVIEW FUSE: separate exact Approval A required'; END $$;
${extract(base.sql,'foundation')}
-- Original central AI source ${aiPath} SHA256 ${hash(ai)}
${extract(ai,aiPath)}
-- Original service-only independent receipt reader ${receiptPath} SHA256 ${hash(receipt)}
${extract(receipt,receiptPath)}
${preservation.after}
COMMIT;
`;
 const budgetRollbackPath='docs/sql-proposals/ai-budget/rollback-retain.sql',budgetRollback=readFileSync(root+'/'+budgetRollbackPath,'utf8');
 const rollback=`-- REVIEW ONLY. Retain pre-existing objects, new data, cost history and liabilities.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'PRESERVATION ROLLBACK REVIEW FUSE: separate exact rollback approval required'; END $$;
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='120s';
${extract(base.rollback,'original foundation rollback')}
-- Original budget retaining rollback SHA256 ${hash(budgetRollback)}
${extract(budgetRollback,budgetRollbackPath)}
-- Do NOT revoke the independent receipt reader or settlement authority.
${preservation.after}
COMMIT;
`;
 const withoutFuse=s=>s.replace(/^DO \$\$ BEGIN RAISE EXCEPTION 'PRESERVATION (?:FOUNDATION|ROLLBACK) REVIEW FUSE:[^\n]+\n/m,'');
 return {version:1,targetProject:base.targetProject,preservation:base.preservation,sourceCandidates:base.sourceCandidates,supplements:base.supplements,additionalSources:[{path:aiPath,sha256:hash(ai)},{path:receiptPath,sha256:hash(receipt)},{path:budgetRollbackPath,sha256:hash(budgetRollback)}],sql,rollback,sha256:hash(sql),rollbackSha256:hash(rollback),reviewedExecutionDerivativeSha256:hash(withoutFuse(sql)),reviewedRollbackDerivativeSha256:hash(withoutFuse(rollback)),autoExecute:false,hostedMutation:false,providerEnabled:false,policyEnabled:false,authUsersCreated:false,entitlementsCreated:false,tariffsCreated:false,retainsLiabilities:true,receiptReaderRetained:true};
}
