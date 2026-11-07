import {readFileSync,writeFileSync,mkdirSync,openSync,closeSync,constants,lstatSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createAiLabB3Runtime} from './lib/ai-lab-b3-runtime.mjs';
import {createAiLabB3SourceOrchestrator} from './lib/ai-lab-b3-source.mjs';
import {validateB3Execution,b3Digest,B3_MARKER} from './lib/ai-lab-b3-package.mjs';

const exact=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const parsePrivate=value=>{if(typeof value!=='string'||Buffer.byteLength(value)>47000)throw Error('private_packet_unavailable');try{return JSON.parse(value);}catch{throw Error('private_packet_invalid');}};
export async function runApprovedB3Job({root,manifest,approval,marker,environment,fetchImpl,credentialReader,ownerPasswordReader,claimIntent,writeSafeReceipt,now=Date.now}={}){
 let runtime,sourceConsumed=false,intentAttempted=false,sourceOutcome=null;
 const safe={version:'busy.ai-lab-b3-outcome.v1',status:'not-started',providerCalls:0,spendingGbp:0,publication:false,mayReplay:false};
 try{
  const gate=validateB3Execution({root,manifest,approval,marker,environment,now:now()});
  if([fetchImpl,credentialReader,ownerPasswordReader,claimIntent,writeSafeReceipt].some(fn=>typeof fn!=='function'))throw Error('trusted_job_ports_required');
  safe.manifestDigest=approval.manifestDigest;safe.executionId=manifest.binding.executionId;safe.runId=approval.runId;safe.eventSha=approval.eventSha;
  const expected={executionId:gate.executionId,requestNonce:gate.requestNonce,manifestDigest:gate.approval.manifestDigest,sourcePlanDigest:gate.sourcePlanDigest,ownerId:gate.ownerId,businessId:gate.businessId};
  runtime=createAiLabB3Runtime(gate,{fetchImpl,credentialReader,ownerPasswordReader,now,consumeDispatchPermit:async binding=>{
   if(!exact(binding,expected))throw Error('dispatch_binding_changed');
   intentAttempted=true;
   await claimIntent({version:'busy.ai-lab-b3-intent.v1',manifestDigest:approval.manifestDigest,executionId:gate.executionId,runId:approval.runId,eventSha:approval.eventSha,runAttempt:1,maximumSignIns:1,maximumSourceWrites:6,replay:false});
   safe.status='intent-recorded';await writeSafeReceipt({...safe});
   return {status:'consumed',executionId:gate.executionId,requestNonce:gate.requestNonce,manifestDigest:gate.approval.manifestDigest};
  }});
  const source=createAiLabB3SourceOrchestrator({manifest:manifest.binding,authenticatedRpc:runtime.ownerRpc,serviceRpc:runtime.serviceRpc,readAuthenticatedOwner:runtime.verifyOwner,verifySourceEmpty:runtime.probeEmptySource,consumeApproval:async binding=>{
   if(sourceConsumed||b3Digest(binding)!==b3Digest(manifest.binding)||!runtime.inspect().permitConsumed)throw Error('source_approval_unavailable');
   sourceConsumed=true;return {consumed:true,...binding};
  }});
  const result=await source.run();sourceOutcome=result.status;
  safe.status=result.status;safe.ok=result.ok;safe.phase=result.phase;safe.sourceWritesAttempted=result.writesAttempted;safe.completedSteps=result.completedSteps;safe.requiresIndependentInspection=result.ok!==true;safe.native=runtime.inspect();
  if(result.ok){
   const p=result.observed;
   safe.source={pageIds:p.websiteDraft.pages.map(page=>page.id),profileRevision:p.profileRevision,snapshotRevision:p.revision,websiteGeneration:p.websiteDraft.generation,profileHash:p.profileHash,websiteDraftHash:p.websiteDraftHash,websiteHistoryHash:p.websiteHistoryHash,sourcePlanDigest:manifest.binding.sourcePlanDigest};
  }
  await writeSafeReceipt({...safe});return Object.freeze({...safe});
 }catch{
  // No exception/provider/native response body, environment, UUID, password,
  // JWT or key is printed or written to the public execution receipt.
  Object.assign(safe,b3FailedReceipt({safe,intentAttempted,sourceOutcome,native:runtime?.inspect()}));
  if(typeof writeSafeReceipt==='function')try{await writeSafeReceipt({...safe});}catch{}
  return Object.freeze({...safe});
 }finally{runtime?.close();}
}

export function b3FailedReceipt({safe,intentAttempted,sourceOutcome,native}={}){
 const touched=intentAttempted===true||native?.permitAttempted===true||(native?.counts?.authSignIns||0)>0;
 return {...safe,status:sourceOutcome==='source-prepared'?'source-prepared-receipt-unconfirmed':sourceOutcome|| (touched?'unknown-outcome':'denied'),sourceOutcome:sourceOutcome||null,ok:false,requiresIndependentInspection:touched,receiptPersistenceUnconfirmed:touched,...(native?{native}:{})};
}

export async function b3JobMain({root=process.cwd(),env=process.env,fetchImpl=globalThis.fetch}={}){
 // There is no --execute, project, RPC, URL, password, key or token argument.
 // The supported execution context is the separately approved protected GitHub
 // job. Runner environment fields are trusted inputs, not cryptographic remote
 // attestation; possession of native credentials remains a consequential trust.
 if(process.argv.slice(2).length)throw Error('no_command_arguments');
 const manifest=parsePrivate(env.BUSY_AI_LAB_B3_MANIFEST_JSON),approval=parsePrivate(env.BUSY_AI_LAB_B3_APPROVAL_JSON);
 const markerPath=resolve(root,B3_MARKER);
 if(lstatSync(markerPath).isSymbolicLink()||lstatSync(markerPath).size>2048)throw Error('invalid_marker_file');
 const marker=JSON.parse(readFileSync(markerPath,'utf8'));
 // Validate BEFORE reading any Lab credential environment variable.
 validateB3Execution({root,manifest,approval,marker,environment:env});
 if(typeof env.RUNNER_TEMP!=='string'||!env.RUNNER_TEMP.startsWith('/'))throw Error('trusted_runner_temp_required');
 const out=resolve(env.RUNNER_TEMP,'busy-ai-lab-b3');mkdirSync(out,{mode:0o700});
 const receiptPath=out+'/outcome.json';
 return runApprovedB3Job({root,manifest,approval,marker,environment:env,fetchImpl,
  credentialReader:()=>({publishableKey:env.BUSY_AI_LAB_B3_PUBLISHABLE_KEY,serviceKey:env.BUSY_AI_LAB_B3_SERVER_SECRET_KEY}),
  ownerPasswordReader:()=>env.BUSY_AI_LAB_B3_OWNER_PASSWORD,
  claimIntent:intent=>{const fd=openSync(out+'/intent.json',constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);try{writeFileSync(fd,JSON.stringify(intent,null,2)+'\n');}finally{closeSync(fd);}},
  writeSafeReceipt:receipt=>writeFileSync(receiptPath,JSON.stringify(receipt,null,2)+'\n',{mode:0o600})
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const result=await b3JobMain();console.log(JSON.stringify(result));if(!result.ok)process.exitCode=1;}
 catch{console.error('B3 refused before execution; inspect the reviewed approval and private runtime prerequisites. No automatic retry.');process.exitCode=1;}
}
