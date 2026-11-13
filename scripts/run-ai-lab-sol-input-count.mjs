import {readFileSync,writeFileSync,mkdirSync,openSync,closeSync,fsyncSync,constants,lstatSync,realpathSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {SOL_COUNT_MARKER,runProtectedSolInputCount,createSolCountGitHubReader} from './lib/ai-lab-sol-input-count-handoff.mjs';

export function readSolCountGitState(root){
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',timeout:5000,maxBuffer:150000}).trim();
 const head=git('rev-parse','HEAD'),parents=git('show','--format=%P','--no-patch',head).split(' '),changedFiles=git('diff-tree','--no-commit-id','--name-only','-r',head).split('\n');
 const previous=git('log','--format=%H',head+'^','--',SOL_COUNT_MARKER).split('\n').filter(Boolean);if(previous.length>100)throw Error('count_marker_history_bound');
 const priorExecutionIds=previous.map(sha=>{const raw=git('show',sha+':'+SOL_COUNT_MARKER);if(Buffer.byteLength(raw)>65536)throw Error('count_marker_size');return JSON.parse(raw).executionId;});
 return {head,parents,changedFiles,clean:git('status','--porcelain')==='',priorExecutionIds};
}
// The existing fsynced exclusive-file intent pattern; no new database/ledger.
export function createDurableSolCountIntent(directory){
 const base=realpathSync(directory);if(lstatSync(base).mode&0o077)throw Error('private_intent_directory');
 return async intent=>{const fd=openSync(resolve(base,'intent.json'),constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);try{writeFileSync(fd,JSON.stringify(intent)+'\n');fsyncSync(fd);}finally{closeSync(fd);}const dir=openSync(base,constants.O_RDONLY|constants.O_DIRECTORY);try{fsyncSync(dir);}finally{closeSync(dir);}return {consumed:true,executionId:intent.executionId};};
}
export async function solCountMain({root=process.cwd(),environment=process.env,fetchImpl=globalThis.fetch,args=process.argv.slice(2)}={}){
 if(args.length>1||args.length===1&&args[0]!=='--verify-only')throw Error('no_custom_count_arguments');
 const verifyOnly=args.length===1,p=resolve(root,SOL_COUNT_MARKER);if(lstatSync(p).isSymbolicLink()||realpathSync(p)!==p||lstatSync(p).size>65536)throw Error('reviewed_count_marker_required');
 const marker=JSON.parse(readFileSync(p,'utf8')),gitState=readSolCountGitState(root),readGitHubJson=createSolCountGitHubReader(fetchImpl);let claimOneUseIntent,writeSafeReceipt;
 if(!verifyOnly){
  if(typeof environment.RUNNER_TEMP!=='string'||!environment.RUNNER_TEMP.startsWith('/')||realpathSync(environment.RUNNER_TEMP)!==environment.RUNNER_TEMP)throw Error('trusted_runner_temp_required');
  const out=resolve(environment.RUNNER_TEMP,'busy-ai-lab-sol-input-count');mkdirSync(out,{recursive:true,mode:0o700});if(lstatSync(out).isSymbolicLink()||lstatSync(out).mode&0o077)throw Error('private_intent_directory');
  claimOneUseIntent=createDurableSolCountIntent(out);
  writeSafeReceipt=async receipt=>{const fd=openSync(resolve(out,'outcome.json'),constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);try{writeFileSync(fd,JSON.stringify(receipt,null,2)+'\n');fsyncSync(fd);}finally{closeSync(fd);}};
 }
 return runProtectedSolInputCount({root,marker,environment,gitState,readGitHubJson,readPrivateWire:()=>environment.BUSY_AI_LAB_SOL_COUNT_WIRE_JSON,readCredential:()=>environment.BUSY_AI_LAB_OPENAI_CREATIVE_V2_KEY,claimOneUseIntent,writeSafeReceipt,countFetchImpl:fetchImpl,verifyOnly});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const result=await solCountMain();console.log(JSON.stringify(result));if(!['native-exact-count-review-verified','counted','counted-input-limit-exceeded'].includes(result.status))process.exitCode=1;}
 catch{console.error('Sol count refused; inspect the exact reviewed run. No private values logged and no automatic replay.');process.exitCode=1;}
}
