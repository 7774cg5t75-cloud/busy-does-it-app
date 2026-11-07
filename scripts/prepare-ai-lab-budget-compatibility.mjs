import {readFileSync,writeFileSync,mkdirSync,lstatSync,realpathSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {aiLabBudgetCompatibilityPackage,aiLabBudgetCompatibilityReadOnlyQuery,budgetCompatibilityHash,AI_LAB_BUDGET_COMPATIBILITY_PATH} from './lib/ai-lab-budget-compatibility-package.mjs';
import {prepareAiLabBudgetConfiguration} from './lib/ai-lab-budget-configuration-package.mjs';
import {assertPrivateWebsiteEvidenceOutsideRepository} from './lib/private-website-evidence-paths.mjs';
export function prepareAiLabBudgetArtifacts(root,args=[]){
 if(!args.length){const p=aiLabBudgetCompatibilityPackage(root),out=resolve(root,AI_LAB_BUDGET_COMPATIBILITY_PATH);mkdirSync(out,{recursive:true});const {install,rollback,...manifest}=p,preflight=aiLabBudgetCompatibilityReadOnlyQuery(root),verification=aiLabBudgetCompatibilityReadOnlyQuery(root,{installed:true});writeFileSync(out+'/install.sql',install);writeFileSync(out+'/rollback-retain.sql',rollback);writeFileSync(out+'/read-only-preflight.sql',preflight);writeFileSync(out+'/read-only-verify.sql',verification);writeFileSync(out+'/manifest.json',JSON.stringify({...manifest,preflightSha256:budgetCompatibilityHash(preflight),verificationSha256:budgetCompatibilityHash(verification)},null,2)+'\n');writeFileSync(out+'/configuration-requirements.json',JSON.stringify(prepareAiLabBudgetConfiguration(),null,2)+'\n');return {status:'fused-review-proposals-only',sha256:p.sha256,executionDerivativeSha256:p.executionDerivativeSha256,rollbackSha256:p.rollbackSha256,configurationBlocked:true,hostedWrites:0,providerCalls:0};}
 if(args.length!==4||args[0]!=='--evidence'||args[2]!=='--new-private-output')throw Error('Only no-argument public compatibility preparation or --evidence <private-json> --new-private-output <new-private-directory> is supported');
 const input=resolve(args[1]),out=resolve(args[3]);assertPrivateWebsiteEvidenceOutsideRepository(realpathSync(root),input,out);
 for(const path of [input,dirname(out)])if(realpathSync(path)!==path||(lstatSync(path).mode&0o077)!==0)throw Error('Existing owner-private nonsymlinked paths required');
 if(!lstatSync(input).isFile()||lstatSync(input).size>1000000||!lstatSync(dirname(out)).isDirectory()||existsSync(out))throw Error('Bounded private input and exclusive new output required');
 const p=prepareAiLabBudgetConfiguration(JSON.parse(readFileSync(input,'utf8')));if(!p.sql)throw Error('Required account/count/source/tariff evidence not ready; no bound SQL generated');
 mkdirSync(out,{mode:0o700});const {sql,rollback,...manifest}=p;for(const [name,bytes] of [['configure-review.sql',sql],['rollback-retain.sql',rollback],['manifest.json',JSON.stringify(manifest,null,2)+'\n']])writeFileSync(out+'/'+name,bytes,{flag:'wx',mode:0o600});
 return {status:p.status,sha256:p.sha256,executionDerivativeSha256:p.executionDerivativeSha256,rollbackSha256:p.rollbackSha256,hostedExecutionReady:false,hostedWrites:0,providerCalls:0};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{console.log(JSON.stringify(prepareAiLabBudgetArtifacts(process.cwd(),process.argv.slice(2))));}catch{console.error('Budget artifact preparation refused; no private values logged or hosted/provider actions performed.');process.exitCode=1;}}
