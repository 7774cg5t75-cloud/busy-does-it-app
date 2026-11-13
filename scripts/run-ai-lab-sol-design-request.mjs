import {readFileSync,writeFileSync,mkdirSync,openSync,closeSync,fsyncSync,constants,lstatSync,realpathSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createDurableSolCountIntent} from './run-ai-lab-sol-input-count.mjs';
import {SOL_DESIGN_MARKER,SOL_DESIGN_GRANT_SECRET,runProtectedSolDesign,createSolDesignGitHubReader} from './lib/ai-lab-sol-design-handoff.mjs';

export function readSolDesignGitState(root){
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',timeout:5000,maxBuffer:150000}).trim(),head=git('rev-parse','HEAD');
 const previous=git('log','--format=%H',head+'^','--',SOL_DESIGN_MARKER).split('\n').filter(Boolean);if(previous.length>100)throw Error('design_history_bound');
 const priorExecutionIds=previous.map(sha=>{const raw=git('show',sha+':'+SOL_DESIGN_MARKER);if(Buffer.byteLength(raw)>65536)throw Error('design_marker_size');return JSON.parse(raw).executionId;});
 return {head,parents:git('show','--format=%P','--no-patch',head).split(' '),changedFiles:git('diff-tree','--no-commit-id','--name-only','-r',head).split('\n'),clean:git('status','--porcelain')==='',priorExecutionIds};
}
export function writeSolDesignPrivateArtifact(directory,name,value){
 if(!['receipt.json','outcome.encrypted.json'].includes(name))throw Error('private_artifact_name');
 const fd=openSync(resolve(directory,name),constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);try{writeFileSync(fd,JSON.stringify(value)+'\n');fsyncSync(fd);}finally{closeSync(fd);}const d=openSync(directory,constants.O_RDONLY|constants.O_DIRECTORY);try{fsyncSync(d);}finally{closeSync(d);}
}
export async function solDesignMain({root=process.cwd(),environment=process.env,fetchImpl=globalThis.fetch,args=process.argv.slice(2)}={}){
 if(args.length>1||args.length===1&&args[0]!=='--verify-only')throw Error('no_custom_design_arguments');
 const verifyOnly=args.length===1,p=resolve(root,SOL_DESIGN_MARKER);if(lstatSync(p).isSymbolicLink()||realpathSync(p)!==p||lstatSync(p).size>65536)throw Error('reviewed_design_marker_required');
 const marker=JSON.parse(readFileSync(p,'utf8')),gitState=readSolDesignGitState(root);let claimOneUseIntent,writeEncryptedOutcome,writeSafeReceipt;
 if(!verifyOnly){if(typeof environment.RUNNER_TEMP!=='string'||!environment.RUNNER_TEMP.startsWith('/')||realpathSync(environment.RUNNER_TEMP)!==environment.RUNNER_TEMP)throw Error('trusted_runner_temp_required');const out=resolve(environment.RUNNER_TEMP,'busy-ai-lab-sol-design');mkdirSync(out,{recursive:true,mode:0o700});if(lstatSync(out).isSymbolicLink()||lstatSync(out).mode&0o077)throw Error('private_intent_directory');claimOneUseIntent=createDurableSolCountIntent(out);writeEncryptedOutcome=async v=>writeSolDesignPrivateArtifact(out,'outcome.encrypted.json',v);writeSafeReceipt=async v=>writeSolDesignPrivateArtifact(out,'receipt.json',v);}
 return runProtectedSolDesign({root,marker,environment,gitState,readGitHubJson:createSolDesignGitHubReader(fetchImpl),readPrivateGrant:()=>environment[SOL_DESIGN_GRANT_SECRET],readNativeCredentials:()=>({publishableKey:environment.BUSY_AI_LAB_B3_PUBLISHABLE_KEY,ownerPassword:environment.BUSY_AI_LAB_B3_OWNER_PASSWORD}),claimOneUseIntent,writeEncryptedOutcome,writeSafeReceipt,transport:fetchImpl,verifyOnly});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))try{const result=await solDesignMain();console.log(JSON.stringify(result));if(!['native-exact-design-review-verified','private-response-retained'].includes(result.status))process.exitCode=1;}catch{console.error('Sol design request refused; inspect the exact run. No private values logged; no automatic replay.');process.exitCode=1;}
