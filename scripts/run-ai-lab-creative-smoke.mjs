import {readFileSync,writeFileSync,mkdirSync,openSync,closeSync,fsyncSync,constants,lstatSync,realpathSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {SMOKE_HANDOFF_MARKER,runProtectedCreativeSmoke,createSmokeGitHubReader} from './lib/ai-lab-creative-smoke-handoff.mjs';

export function readSmokeGitState(root,marker){
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',timeout:5000,maxBuffer:150000}).trim();
 const head=git('rev-parse','HEAD'),parents=git('show','--format=%P','--no-patch',head).split(' '),changedFiles=git('diff-tree','--no-commit-id','--name-only','-r',head).split('\n');
 const previous=git('log','--format=%H',head+'^','--',SMOKE_HANDOFF_MARKER).split('\n').filter(Boolean);if(previous.length>100)throw Error('reviewed_marker_history_bound');
 const priorExecutionIds=previous.map(sha=>{const raw=git('show',sha+':'+SMOKE_HANDOFF_MARKER);if(Buffer.byteLength(raw)>16000)throw Error('marker_history_size');return JSON.parse(raw).executionId;});
 return {head,parents,changedFiles,clean:git('status','--porcelain')==='',priorExecutionIds};
}
export function createDurableSmokeIntent(directory){
 const base=realpathSync(directory);if(lstatSync(base).mode&0o077)throw Error('private_intent_directory');
 return async intent=>{
  const file=resolve(base,'intent.json'),fd=openSync(file,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);
  try{writeFileSync(fd,JSON.stringify(intent)+'\n');fsyncSync(fd);}finally{closeSync(fd);}
  const dirfd=openSync(base,constants.O_RDONLY|constants.O_DIRECTORY);try{fsyncSync(dirfd);}finally{closeSync(dirfd);}
  return {consumed:true,executionId:intent.executionId,deploymentFilesDigest:intent.deploymentFilesDigest};
 };
}
export async function creativeSmokeMain({root=process.cwd(),environment=process.env,fetchImpl=globalThis.fetch,args=process.argv.slice(2)}={}){
 if(args.length>1||args.length===1&&args[0]!=='--verify-only')throw Error('no_custom_execution_arguments');
 const verifyOnly=args.length===1,markerFile=resolve(root,SMOKE_HANDOFF_MARKER);
 if(lstatSync(markerFile).isSymbolicLink()||realpathSync(markerFile)!==markerFile||lstatSync(markerFile).size>16000)throw Error('reviewed_marker_required');
 const marker=JSON.parse(readFileSync(markerFile,'utf8')),gitState=readSmokeGitState(root,marker),readGitHubJson=createSmokeGitHubReader(fetchImpl);
 let claimOneUseIntent,writeSafeReceipt;
 if(!verifyOnly){
  if(typeof environment.RUNNER_TEMP!=='string'||!environment.RUNNER_TEMP.startsWith('/')||realpathSync(environment.RUNNER_TEMP)!==environment.RUNNER_TEMP)throw Error('trusted_runner_temp_required');
  const out=resolve(environment.RUNNER_TEMP,'busy-ai-lab-creative-smoke');mkdirSync(out,{recursive:true,mode:0o700});if(lstatSync(out).isSymbolicLink()||lstatSync(out).mode&0o077)throw Error('private_intent_directory');
  claimOneUseIntent=createDurableSmokeIntent(out);
  writeSafeReceipt=async receipt=>{const fd=openSync(resolve(out,'outcome.json'),constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);try{writeFileSync(fd,JSON.stringify(receipt,null,2)+'\n');fsyncSync(fd);}finally{closeSync(fd);}};
 }
 return runProtectedCreativeSmoke({root,marker,environment,gitState,readGitHubJson,claimOneUseIntent,writeSafeReceipt,
  readLabPublishableKey:()=>environment.BUSY_AI_LAB_SMOKE_PUBLISHABLE_KEY,smokeFetchImpl:fetchImpl,verifyOnly});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const result=await creativeSmokeMain();console.log(JSON.stringify(result));if(!['native-exact-run-review-verified','disabled-route-verified'].includes(result.status))process.exitCode=1;}
 catch{console.error('Disabled smoke refused; inspect the exact reviewed run and native owner approval. No automatic replay.');process.exitCode=1;}
}
