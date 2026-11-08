// A narrow binding of the ORIGINAL private caller to native owner review.
// No provider, SQL, service-key, source-write or deployment authority exists.
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {resolve,relative,sep} from 'node:path';
import {stableJson} from '../../src/core/stableJson.mjs';
import {solCountHandoffInventory,SOL_COUNT_REQUEST} from './ai-lab-sol-input-count-handoff.mjs';
import {createPrivateSolCallPort} from './sol-private-call.mjs';
import {verifySolResultRecipient} from './sol-private-result.mjs';

export const SOL_DESIGN_HANDOFF_VERSION='busy.ai-lab-sol-design-handoff.v1';
export const SOL_DESIGN_MARKER='.github/ai-lab-sol-design-request.json';
export const SOL_DESIGN_WORKFLOW='.github/workflows/ai-lab-sol-design-request.yml';
export const SOL_DESIGN_GRANT_SECRET='BUSY_AI_LAB_SOL_DESIGN_GRANT_JSON';
const repository='7774cg5t75-cloud/busy-does-it-app',owner='7774cg5t75-cloud',branch='codex/builder-mission15-design-advancement',environmentName='busy-ai-lab-b3-source',environmentId=26548866516;
const target={projectId:'sbvkrvksnruiclcvclbd',organisationId:'wrjfgasxtlznzfzmfrif',region:'eu-west-1',functionName:'busy-creative-document-pilot'};
const sha=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v),commit=v=>typeof v==='string'&&/^[0-9a-f]{40}$/.test(v),uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v);
const plain=v=>v&&Object.getPrototypeOf(v)===Object.prototype&&Object.getOwnPropertySymbols(v).length===0&&Object.values(Object.getOwnPropertyDescriptors(v)).every(d=>Object.hasOwn(d,'value'));
const same=(a,b)=>stableJson(a)===stableJson(b),need=v=>{if(!v)throw Error('sol_design_handoff_refused');},keys=(v,k)=>plain(v)&&same(Object.keys(v).sort(),[...k].sort());
export const solDesignDigest=v=>createHash('sha256').update(typeof v==='string'||v instanceof Uint8Array?v:stableJson(v)).digest('hex');
const filesAdded=[SOL_DESIGN_WORKFLOW,'scripts/run-ai-lab-sol-design-request.mjs','scripts/lib/ai-lab-sol-design-handoff.mjs','scripts/check-ai-lab-sol-design-handoff.mjs','scripts/run-ai-lab-sol-input-count.mjs','scripts/lib/sol-private-call.mjs','scripts/lib/sol-private-result.mjs'];
export function solDesignHandoffInventory(root){
 const base=realpathSync(root),files={...solCountHandoffInventory(base).files};
 for(const name of filesAdded){const p=resolve(base,name),rel=relative(base,p);need(rel&&!rel.startsWith('..'+sep)&&rel!=='..'&&realpathSync(p)===p&&!lstatSync(p).isSymbolicLink()&&lstatSync(p).isFile()&&lstatSync(p).size<180000);files[name]=solDesignDigest(readFileSync(p));}
 const sorted=Object.fromEntries(Object.entries(files).sort(([a],[b])=>a.localeCompare(b)));return {files:sorted,filesDigest:solDesignDigest(sorted)};
}
export function verifySolDesignSource({root,marker,environment:e,gitState:g}){
 need(keys(marker,['version','executionId','target','request','deployment','source','maximumGBP','maximumSignIns','maximumFunctionRequests','automaticRetry','maySave','mayPublish'])&&marker.version===SOL_DESIGN_HANDOFF_VERSION&&uuid(marker.executionId)&&same(marker.target,target)&&marker.maximumGBP===1&&marker.maximumSignIns===1&&marker.maximumFunctionRequests===1&&marker.automaticRetry===false&&marker.maySave===false&&marker.mayPublish===false);
 need(keys(marker.request,['model','wireDigest','manifestDigest','recipientSha256'])&&marker.request.model===SOL_COUNT_REQUEST.model&&marker.request.wireDigest===SOL_COUNT_REQUEST.wireDigest&&['wireDigest','manifestDigest','recipientSha256'].every(k=>sha(marker.request[k])));
 need(keys(marker.deployment,['functionId','functionVersion','nativeEszipSha256','runtimeFilesDigest','readbackEvidenceSha256'])&&uuid(marker.deployment.functionId)&&Number.isSafeInteger(marker.deployment.functionVersion)&&marker.deployment.functionVersion>=2&&['nativeEszipSha256','runtimeFilesDigest','readbackEvidenceSha256'].every(k=>sha(marker.deployment[k])));
 need(keys(marker.source,['parentCommit','files','filesDigest'])&&commit(marker.source.parentCommit));
 need(e?.GITHUB_ACTIONS==='true'&&e.GITHUB_REPOSITORY===repository&&e.GITHUB_REF==='refs/heads/'+branch&&e.GITHUB_EVENT_NAME==='push'&&e.GITHUB_ACTOR===owner&&e.GITHUB_TRIGGERING_ACTOR===owner&&e.GITHUB_RUN_ATTEMPT==='1'&&/^[1-9][0-9]{0,19}$/.test(e.GITHUB_RUN_ID||'')&&commit(e.GITHUB_SHA)&&e.GITHUB_WORKFLOW_REF===repository+'/'+SOL_DESIGN_WORKFLOW+'@refs/heads/'+branch&&e.RUNNER_ENVIRONMENT==='github-hosted'&&e.RUNNER_OS==='Linux'&&e.RUNNER_ARCH==='X64');
 need(g?.head===e.GITHUB_SHA&&same(g.parents,[marker.source.parentCommit])&&same(g.changedFiles,[SOL_DESIGN_MARKER])&&g.clean===true&&Array.isArray(g.priorExecutionIds)&&g.priorExecutionIds.length<=100&&g.priorExecutionIds.every(uuid)&&!g.priorExecutionIds.includes(marker.executionId));
 const inventory=solDesignHandoffInventory(root);need(same(marker.source.files,inventory.files)&&marker.source.filesDigest===inventory.filesDigest);
 return {executionId:marker.executionId,runId:e.GITHUB_RUN_ID,eventSha:e.GITHUB_SHA,filesDigest:inventory.filesDigest};
}
export function solDesignApprovalComment({runId,eventSha,grantDigest,expiresAt}){
 need(/^[1-9][0-9]{0,19}$/.test(runId||'')&&commit(eventSha)&&sha(grantDigest)&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(expiresAt||'')&&Number.isFinite(Date.parse(expiresAt)));
 return `BUSY_AI_LAB_SOL_DESIGN_V1 run=${runId} attempt=1 sha=${eventSha} grant=${grantDigest} expires=${expiresAt}`;
}
export function verifyNativeSolDesignReview({run,reviews,duplicates,gate,now=Date.now()}){
 need(plain(run)&&run.id===Number(gate.runId)&&run.head_sha===gate.eventSha&&run.run_attempt===1&&run.event==='push'&&run.head_branch===branch&&run.path===SOL_DESIGN_WORKFLOW&&run.status==='in_progress'&&run.conclusion===null&&run.actor?.login===owner&&run.triggering_actor?.login===owner&&run.repository?.full_name===repository&&run.repository.private===false);
 need(plain(duplicates)&&duplicates.total_count===1&&Array.isArray(duplicates.workflow_runs)&&duplicates.workflow_runs.length===1&&duplicates.workflow_runs[0].id===run.id&&duplicates.workflow_runs[0].head_sha===gate.eventSha&&duplicates.workflow_runs[0].run_attempt===1);
 need(Array.isArray(reviews)&&reviews.length<=20);const rows=reviews.filter(r=>r?.environments?.some(e=>e.id===environmentId||e.name===environmentName));need(rows.length===1);const row=rows[0];
 need(row.state==='approved'&&row.user?.login===owner&&row.environments.length===1&&row.environments[0].id===environmentId&&row.environments[0].name===environmentName&&row.environments[0].can_admins_bypass===false&&typeof row.comment==='string'&&row.comment.length<=320);
 const m=row.comment.match(/^BUSY_AI_LAB_SOL_DESIGN_V1 run=([1-9][0-9]{0,19}) attempt=1 sha=([0-9a-f]{40}) grant=([0-9a-f]{64}) expires=(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)$/);
 need(m&&m[1]===gate.runId&&m[2]===gate.eventSha&&Number.isSafeInteger(now)&&Date.parse(m[4])>now&&Date.parse(m[4])<=now+3600000);return {runId:gate.runId,eventSha:gate.eventSha,grantDigest:m[3],expiresAt:Date.parse(m[4])};
}
export function readSolDesignGrant(raw,marker,gate,approval,now=Date.now()){
 need(typeof raw==='string'&&Buffer.byteLength(raw)<=32768);const envelope=JSON.parse(raw);need(keys(envelope,['version','grant','c2Readback'])&&envelope.version==='busy.sol-design-private-envelope.v1');const g=envelope.grant,r=envelope.c2Readback;
 need(keys(g,['version','ownerId','operationId','requestNonce','requestDigest','manifestDigest','runId','attempt','actor','eventSha','functionId','functionVersion','expiresAt','maximumGBP','maximumSignIns','maximumFunctionRequests','automaticRetry','maySave','mayPublish','recipientPublicKey','recipientSha256'])&&Object.values(g).every(v=>['string','number','boolean'].includes(typeof v))&&g.version==='busy.sol-private-call-grant.v1');
 need([g.ownerId,g.operationId,g.requestNonce].every(uuid)&&g.operationId!==g.requestNonce&&g.runId===gate.runId&&g.eventSha===gate.eventSha&&g.actor===owner&&g.attempt===1&&g.expiresAt===approval.expiresAt&&g.expiresAt>now&&g.expiresAt<=now+3600000&&g.maximumGBP===1&&g.maximumSignIns===1&&g.maximumFunctionRequests===1&&g.automaticRetry===false&&g.maySave===false&&g.mayPublish===false&&g.requestDigest===marker.request.wireDigest&&g.manifestDigest===marker.request.manifestDigest&&g.recipientSha256===marker.request.recipientSha256&&g.functionId===marker.deployment.functionId&&g.functionVersion===marker.deployment.functionVersion&&solDesignDigest(g)===approval.grantDigest);
 need(keys(r,['version','status','projectId','functionId','functionVersion','verifyJwt','nativeEszipSha256','runtimeFilesDigest','manifestDigest','requestDigest','completeRuntimeSourceReadback','externalRuntimeImports','provenanceOwnerAccepted','checkedAt'])&&r.version==='busy.sol-c2-independent-readback.v1'&&r.status==='independently-verified'&&r.projectId===target.projectId&&r.functionId===g.functionId&&r.functionVersion===g.functionVersion&&r.verifyJwt===true&&r.nativeEszipSha256===marker.deployment.nativeEszipSha256&&r.runtimeFilesDigest===marker.deployment.runtimeFilesDigest&&r.manifestDigest===g.manifestDigest&&r.requestDigest===g.requestDigest&&r.completeRuntimeSourceReadback===true&&r.externalRuntimeImports===0&&r.provenanceOwnerAccepted===true&&Number.isSafeInteger(r.checkedAt)&&r.checkedAt<=now&&now-r.checkedAt<=900000&&solDesignDigest(r)===marker.deployment.readbackEvidenceSha256);
 const binding={version:'busy.sol-private-result-binding.v1',projectId:target.projectId,runId:g.runId,attempt:1,eventSha:g.eventSha,operationDigest:solDesignDigest({operationId:g.operationId,requestNonce:g.requestNonce}),requestDigest:g.requestDigest,manifestDigest:g.manifestDigest,functionId:g.functionId,functionVersion:g.functionVersion};need(verifySolResultRecipient(g.recipientPublicKey,binding).recipientSha256===g.recipientSha256);
 return {grant:Object.freeze({...g}),c2Readback:Object.freeze({...r}),grantDigest:approval.grantDigest};
}
export async function runProtectedSolDesign({root,marker,environment,gitState,readGitHubJson,readPrivateGrant,readNativeCredentials,claimOneUseIntent,writeEncryptedOutcome,writeSafeReceipt,transport,now=Date.now,verifyOnly=false}={}){
 let reads=0,intentAttempted=false,intentConfirmed=false,receiptWritten=false;let receipt={version:SOL_DESIGN_HANDOFF_VERSION,status:'denied',mayReplay:false,nativeSignIns:0,nativeUserReads:0,functionRequestsAttempted:0,directProviderCalls:0,actualProviderCalls:null,actualPaidCostGBP:null,websiteWrites:0,publication:false};
 try{
  const gate=verifySolDesignSource({root,marker,environment,gitState});need(typeof readGitHubJson==='function'&&typeof readPrivateGrant==='function'&&(verifyOnly||[readNativeCredentials,claimOneUseIntent,writeEncryptedOutcome,writeSafeReceipt,transport].every(f=>typeof f==='function')));
  const base='https://api.github.com/repos/'+repository+'/actions/',runUrl=base+'runs/'+gate.runId,duplicatesUrl=base+'runs?head_sha='+gate.eventSha+'&event=push&per_page=100';
  const get=async url=>{need(++reads<=24);return readGitHubJson(url);};
  const review=async()=>verifyNativeSolDesignReview({run:await get(runUrl),duplicates:await get(duplicatesUrl),reviews:await get(runUrl+'/approvals'),gate,now:now()});
  // Full native approval precedes even reading the private, noncredential grant.
  const approved=await review(),raw=await readPrivateGrant(),privateRecord=readSolDesignGrant(raw,marker,gate,approved,now());
  const check=async()=>{need(same(verifySolDesignSource({root,marker,environment,gitState}),gate)&&same(await review(),approved));readSolDesignGrant(raw,marker,gate,approved,now());};
  Object.assign(receipt,{runId:gate.runId,eventSha:gate.eventSha,executionId:gate.executionId,filesDigest:gate.filesDigest,grantDigest:approved.grantDigest,wireDigest:marker.request.wireDigest,manifestDigest:marker.request.manifestDigest,recipientSha256:marker.request.recipientSha256,readbackEvidenceSha256:marker.deployment.readbackEvidenceSha256});
  if(verifyOnly)return {...receipt,status:'native-exact-design-review-verified',nativeMetadataReads:reads,requestExecuted:false};
  const port=createPrivateSolCallPort({clock:now,claimApprovedCall:async identity=>{await check();need(identity.grantDigest===approved.grantDigest);intentAttempted=true;const claim=await claimOneUseIntent({...receipt,version:SOL_DESIGN_HANDOFF_VERSION,maximumGBP:1,maximumSignIns:1,maximumFunctionRequests:1});need(claim?.consumed===true&&claim.executionId===gate.executionId);intentConfirmed=true;return true;},readNativeCredentials:async()=>{await check();return readNativeCredentials();},transport:async(url,options)=>{await check();return transport(url,options);},writeEncryptedOutcome});
  const outcome=await port(privateRecord.grant);Object.assign(receipt,outcome.receipt);if(intentAttempted&&!intentConfirmed)receipt.status='intent-unconfirmed';
  receipt.nativeMetadataReads=reads;receiptWritten=true;await writeSafeReceipt(receipt);return receipt;
 }catch{
  receipt.status=intentAttempted?(intentConfirmed?'stopped-inspect-only':'intent-unconfirmed'):'denied';receipt.nativeMetadataReads=reads;if(receiptWritten)receipt.receiptUnconfirmed=true;
  else if(typeof writeSafeReceipt==='function')try{receiptWritten=true;await writeSafeReceipt(receipt);}catch{receipt.receiptUnconfirmed=true;}return receipt;
 }
}
export function createSolDesignGitHubReader(fetchImpl){
 return async url=>{
  need(typeof fetchImpl==='function'&&/^https:\/\/api\.github\.com\/repos\/7774cg5t75-cloud\/busy-does-it-app\/actions\/runs(?:\/[1-9][0-9]{0,19}(?:\/approvals)?|\?head_sha=[a-f0-9]{40}&event=push&per_page=100)$/.test(url));let timer,reader;const abort=new AbortController();
  const task=async()=>{const r=await fetchImpl(url,{method:'GET',headers:{accept:'application/vnd.github+json','x-github-api-version':'2026-03-10','user-agent':'Busy-AI-Lab-design-read-only'},redirect:'error',credentials:'omit',signal:abort.signal});need(r instanceof Response&&r.status===200&&!r.redirected&&(!r.url||r.url===url));const len=r.headers.get('content-length');need(len===null||/^\d+$/.test(len)&&Number(len)<=65536);reader=r.body?.getReader();need(reader);const chunks=[];let size=0;for(;;){const p=await reader.read();if(p.done)break;need(p.value instanceof Uint8Array&&(size+=p.value.length)<=65536);chunks.push(p.value);}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));};
  try{return await Promise.race([task(),new Promise((_,reject)=>{timer=setTimeout(()=>{abort.abort();reject(Error('native_metadata_deadline'));},10000);})]);}finally{clearTimeout(timer);abort.abort();try{void reader?.cancel()?.catch(()=>{});}catch{}}
 };
}
