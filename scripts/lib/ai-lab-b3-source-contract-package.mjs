import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {assertRunnerOwnedSql} from './ai-lab-runner-foundation-package.mjs';

export const B3_SOURCE_CONTRACT_PATH='docs/sql-proposals/ai-lab-b3-empty-source';
export const B3_SOURCE_CONTRACT_RPC='busy_connected_builder_source_state_v1';
export const B3_SOURCE_CONTRACT_VERSION='busy.connected-builder-source-state.v1';
const hash=value=>createHash('sha256').update(value).digest('hex');
const installFuse="DO $$ BEGIN RAISE EXCEPTION 'AI LAB B3 SOURCE CONTRACT REVIEW FUSE: separate exact migration approval required'; END $$;";
const rollbackFuse="DO $$ BEGIN RAISE EXCEPTION 'AI LAB B3 SOURCE CONTRACT ROLLBACK REVIEW FUSE: separate exact retaining rollback approval required'; END $$;";

// Pure artifact preparation. No environment lookup, credentials, database or network.
export function sourceContractExecutionDerivative(sql,kind='INSTALL'){
 if(!['INSTALL','ROLLBACK'].includes(kind))throw Error('Unknown source-contract artifact');
 const fuse=kind==='INSTALL'?installFuse:rollbackFuse;
 if(typeof sql!=='string'||sql.split(fuse+'\n').length!==2)throw Error('Exact source-contract review fuse required');
 const derivative=sql.replace(fuse+'\n','');
 assertRunnerOwnedSql(derivative);
 return derivative;
}

export function aiLabB3SourceContractPackage(root){
 const base=root+'/'+B3_SOURCE_CONTRACT_PATH;
 const manifest=JSON.parse(readFileSync(base+'/manifest.json','utf8'));
 const sql=readFileSync(base+'/install.sql','utf8'),rollback=readFileSync(base+'/rollback-retain.sql','utf8'),preflight=readFileSync(base+'/read-only-preflight.sql','utf8'),verification=readFileSync(base+'/read-only-verify.sql','utf8');
 if(manifest.version!==1||manifest.targetProject!=='sbvkrvksnruiclcvclbd'||manifest.targetOrganization!=='wrjfgasxtlznzfzmfrif'||manifest.expectedRegion!=='eu-west-1'||manifest.expectedPlan!=='free'||manifest.expectedPostgresMajor!==17||manifest.wireVersion!==B3_SOURCE_CONTRACT_VERSION||manifest.newFunction!=='public.'+B3_SOURCE_CONTRACT_RPC+'(uuid)'||manifest.reviewFuse!==installFuse||manifest.rollbackReviewFuse!==rollbackFuse||manifest.approvalRequired!==true||manifest.hostedExecutionAuthorised!==false||manifest.rollbackRetainsNonretryCorrections!==true)throw Error('Reviewed Lab source-contract metadata changed');
 for(const [value,expected] of [[sql,manifest.sha256],[rollback,manifest.rollbackSha256],[preflight,manifest.preflightSha256],[verification,manifest.verificationSha256],[sourceContractExecutionDerivative(sql),manifest.executionDerivativeSha256],[sourceContractExecutionDerivative(rollback,'ROLLBACK'),manifest.rollbackExecutionDerivativeSha256]])if(hash(value)!==expected)throw Error('Reviewed source-contract SQL hash changed');
 if(manifest.originalFunctionChanges.length!==5||manifest.originalFunctionChanges.reduce((n,x)=>n+x.branchCount,0)!==9||manifest.originalFunctionChanges[0].code!=='P0002'||manifest.originalFunctionChanges.slice(1).some(x=>x.code!=='PT409'))throw Error('Finite original-authority correction set changed');
 assertRunnerOwnedSql(sql);assertRunnerOwnedSql(rollback);
 return {...manifest,sql,rollback,preflight,verification};
}
