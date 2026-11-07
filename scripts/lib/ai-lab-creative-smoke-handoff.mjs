// Protected no-call handoff only. No database, native sign-in, provider or
// account-save port. Native GitHub review is required before any Lab key read.
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {resolve,relative,sep} from 'node:path';
import {stableJson} from '../../src/core/stableJson.mjs';
import {createDisabledCreativeDocumentSmoke,DISABLED_CREATIVE_SMOKE_VERSION} from './disabled-creative-document-smoke.mjs';
import {creativeDocumentDeploymentFiles} from './creative-document-deployment-packet.mjs';

export const SMOKE_HANDOFF_VERSION='busy.ai-lab-creative-smoke-handoff.v1';
export const SMOKE_HANDOFF_MARKER='.github/ai-lab-creative-smoke-request.json';
export const SMOKE_HANDOFF_WORKFLOW='.github/workflows/ai-lab-creative-smoke.yml';
export const SMOKE_HANDOFF_ENVIRONMENT='busy-ai-lab-b3-source';
const repository='7774cg5t75-cloud/busy-does-it-app',owner='7774cg5t75-cloud',branch='codex/builder-mission15-design-advancement';
const nativeEnvironmentId=26548866516,uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,sha=/^[0-9a-f]{64}$/,commit=/^[0-9a-f]{40}$/;
const plain=v=>v&&Object.getPrototypeOf(v)===Object.prototype&&Object.values(Object.getOwnPropertyDescriptors(v)).every(d=>Object.hasOwn(d,'value'));
const need=(v,message='smoke_handoff_refused')=>{if(!v)throw Error(message);};
const same=(a,b)=>stableJson(a)===stableJson(b);
const keys=(v,expected)=>plain(v)&&same(Object.keys(v).sort(),[...expected].sort());
export const smokeHandoffDigest=v=>createHash('sha256').update(typeof v==='string'||v instanceof Uint8Array?v:stableJson(v)).digest('hex');
export const SMOKE_HANDOFF_FILES=Object.freeze([SMOKE_HANDOFF_WORKFLOW,'scripts/run-ai-lab-creative-smoke.mjs','scripts/lib/ai-lab-creative-smoke-handoff.mjs','scripts/lib/disabled-creative-document-smoke.mjs','scripts/lib/creative-document-deployment-packet.mjs','src/core/stableJson.mjs']);

export function smokeHandoffInventory(root){
 const base=realpathSync(root),files={};
 for(const name of [...SMOKE_HANDOFF_FILES].sort()){
  const path=resolve(base,name),rel=relative(base,path);
  need(rel&&rel!=='..'&&!rel.startsWith('..'+sep)&&!lstatSync(path).isSymbolicLink()&&realpathSync(path)===path&&lstatSync(path).isFile()&&lstatSync(path).size<180000);
  files[name]=smokeHandoffDigest(readFileSync(path));
 }
 return {files,filesDigest:smokeHandoffDigest(files)};
}

// A preparation record is evidence, never an execution approval or marker.
export function buildSmokeHandoffReview(root){
 const inventory=smokeHandoffInventory(root),deployment=creativeDocumentDeploymentFiles(root);
 return {version:SMOKE_HANDOFF_VERSION,status:'review-only-not-authorized',marker:SMOKE_HANDOFF_MARKER,markerMustBeAbsent:true,inventory,deploymentFilesDigest:deployment.filesDigest,
  target:{projectId:'sbvkrvksnruiclcvclbd',organisationId:'wrjfgasxtlznzfzmfrif',region:'eu-west-1',functionName:'busy-creative-document-pilot',verifyJwt:true},
  protection:{environment:SMOKE_HANDOFF_ENVIRONMENT,requiredReviewer:owner,nativeEnvironmentId,attempt:1,automaticRetry:false},
  approvalComment:'BUSY_AI_LAB_CREATIVE_SMOKE_V1 run=RUN_ID attempt=1 sha=EVENT_SHA expires=YYYY-MM-DDTHH:MM:SSZ',
  noNewSecretRequired:true,onlyExistingLabPublishableBinding:true,maximumSmokeRequests:3,providerCalls:0,nativeSignIns:0,applicationWrites:0,spendingGBP:0,
  deployment:false,smokeExecution:false,warning:'Native review-history access, current protections and independently verified deployed bytes still require real acceptance after separate approval. No actual marker, approval comment or job is created.'};
}

export function verifySmokeHandoffSource({root,marker,environment,gitState}){
 need(keys(marker,['version','executionId','target','functionName','deploymentFilesDigest','deploymentEvidence','source','maximumRequests','automaticRetry']));
 need(marker.version===SMOKE_HANDOFF_VERSION&&uuid.test(marker.executionId)&&same(marker.target,{projectId:'sbvkrvksnruiclcvclbd',organisationId:'wrjfgasxtlznzfzmfrif',region:'eu-west-1'})&&marker.functionName==='busy-creative-document-pilot'&&marker.maximumRequests===3&&marker.automaticRetry===false);
 need(keys(marker.deploymentEvidence,['version','verificationSha256','verifyJwt','hardDisabled'])&&Number.isSafeInteger(marker.deploymentEvidence.version)&&marker.deploymentEvidence.version>0&&sha.test(marker.deploymentEvidence.verificationSha256)&&marker.deploymentEvidence.verifyJwt===true&&marker.deploymentEvidence.hardDisabled===true);
 need(keys(marker.source,['parentCommit','files','filesDigest'])&&commit.test(marker.source.parentCommit)&&sha.test(marker.deploymentFilesDigest));
 need(environment?.GITHUB_ACTIONS==='true'&&environment.GITHUB_REPOSITORY===repository&&environment.GITHUB_REF==='refs/heads/'+branch&&environment.GITHUB_EVENT_NAME==='push'&&environment.GITHUB_ACTOR===owner&&environment.GITHUB_TRIGGERING_ACTOR===owner&&environment.GITHUB_RUN_ATTEMPT==='1'&&/^[1-9][0-9]{0,19}$/.test(environment.GITHUB_RUN_ID||'')&&commit.test(environment.GITHUB_SHA||''));
 need(environment.GITHUB_WORKFLOW_REF===repository+'/'+SMOKE_HANDOFF_WORKFLOW+'@refs/heads/'+branch&&environment.RUNNER_ENVIRONMENT==='github-hosted'&&environment.RUNNER_OS==='Linux'&&environment.RUNNER_ARCH==='X64');
 need(gitState?.head===environment.GITHUB_SHA&&gitState.parents?.length===1&&gitState.parents[0]===marker.source.parentCommit&&same(gitState.changedFiles,[SMOKE_HANDOFF_MARKER])&&gitState.clean===true&&Array.isArray(gitState.priorExecutionIds)&&gitState.priorExecutionIds.length<=100&&gitState.priorExecutionIds.every(v=>uuid.test(v))&&!gitState.priorExecutionIds.includes(marker.executionId));
 const inventory=smokeHandoffInventory(root);need(same(marker.source.files,inventory.files)&&marker.source.filesDigest===inventory.filesDigest);
 need(creativeDocumentDeploymentFiles(root).filesDigest===marker.deploymentFilesDigest);
 return {executionId:marker.executionId,runId:environment.GITHUB_RUN_ID,eventSha:environment.GITHUB_SHA,inventoryDigest:inventory.filesDigest,deploymentFilesDigest:marker.deploymentFilesDigest,deploymentVersion:marker.deploymentEvidence.version};
}

export function smokeApprovalComment({runId,eventSha,expiresAt}){
 need(/^[1-9][0-9]{0,19}$/.test(runId||'')&&commit.test(eventSha||'')&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(expiresAt||'')&&Number.isFinite(Date.parse(expiresAt)));
 return `BUSY_AI_LAB_CREATIVE_SMOKE_V1 run=${runId} attempt=1 sha=${eventSha} expires=${expiresAt}`;
}

export function verifyNativeSmokeReview({run,reviews,duplicates,gate,now=Date.now()}){
 need(plain(run)&&run.id===Number(gate.runId)&&run.head_sha===gate.eventSha&&run.run_attempt===1&&run.event==='push'&&run.head_branch===branch&&run.path===SMOKE_HANDOFF_WORKFLOW&&run.status==='in_progress'&&run.conclusion===null&&run.actor?.login===owner&&run.triggering_actor?.login===owner&&run.repository?.full_name===repository&&run.repository.private===false);
 need(plain(duplicates)&&duplicates.total_count===1&&Array.isArray(duplicates.workflow_runs)&&duplicates.workflow_runs.length===1&&duplicates.workflow_runs[0].id===run.id&&duplicates.workflow_runs[0].head_sha===gate.eventSha&&duplicates.workflow_runs[0].run_attempt===1);
 need(Array.isArray(reviews)&&reviews.length<=20);
 const relevant=reviews.filter(r=>Array.isArray(r?.environments)&&r.environments.some(e=>e.name===SMOKE_HANDOFF_ENVIRONMENT||e.id===nativeEnvironmentId));
 need(relevant.length===1);
 const row=relevant[0];need(row.state==='approved'&&row.user?.login===owner&&row.environments.length===1&&row.environments[0].name===SMOKE_HANDOFF_ENVIRONMENT&&row.environments[0].id===nativeEnvironmentId&&typeof row.comment==='string'&&row.comment.length<=240);
 const m=row.comment.match(/^BUSY_AI_LAB_CREATIVE_SMOKE_V1 run=([1-9][0-9]{0,19}) attempt=1 sha=([0-9a-f]{40}) expires=(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)$/);
 need(m&&m[1]===gate.runId&&m[2]===gate.eventSha&&Number.isSafeInteger(now)&&Date.parse(m[3])>now&&Date.parse(m[3])<=now+3600000);
 return {version:DISABLED_CREATIVE_SMOKE_VERSION,status:'owner-approved',executionId:gate.executionId,projectId:'sbvkrvksnruiclcvclbd',functionName:'busy-creative-document-pilot',deploymentFilesDigest:gate.deploymentFilesDigest,expiresAt:m[3],maximumRequests:3,protectedRuntimeVerified:true};
}

export async function runProtectedCreativeSmoke({root,marker,environment,gitState,readGitHubJson,claimOneUseIntent,writeSafeReceipt,readLabPublishableKey,smokeFetchImpl,now=Date.now,verifyOnly=false}={}){
 const receipt={version:SMOKE_HANDOFF_VERSION,status:'denied',mayReplay:false,requestsAttempted:0,publishableKeyReads:0,nativeSignIns:0,applicationWrites:0,providerCalls:0,spendingGBP:0};let metadataReads=0,intentAttempted=false;
 try{
  const gate=verifySmokeHandoffSource({root,marker,environment,gitState});
  need(typeof readGitHubJson==='function'&&(verifyOnly||[claimOneUseIntent,writeSafeReceipt,readLabPublishableKey,smokeFetchImpl].every(fn=>typeof fn==='function')));
  const base='https://api.github.com/repos/'+repository+'/actions/',runUrl=base+'runs/'+gate.runId,reviewsUrl=runUrl+'/approvals',duplicatesUrl=base+'workflows/ai-lab-creative-smoke.yml/runs?head_sha='+gate.eventSha+'&event=push&per_page=100';
  const get=async url=>{need(++metadataReads<=12);return readGitHubJson(url);};
  const run=await get(runUrl),duplicates=await get(duplicatesUrl);
  const readApproval=async()=>verifyNativeSmokeReview({run,duplicates,reviews:await get(reviewsUrl),gate,now:now()});
  const approved=await readApproval();
  Object.assign(receipt,{runId:gate.runId,eventSha:gate.eventSha,executionId:gate.executionId,handoffFilesDigest:gate.inventoryDigest,deploymentFilesDigest:gate.deploymentFilesDigest,deploymentVersion:gate.deploymentVersion});
  if(verifyOnly)return {...receipt,status:'native-exact-run-review-verified',nativeMetadataReads:metadataReads,smokeExecuted:false};
  const smoke=createDisabledCreativeDocumentSmoke({expectedFilesDigest:gate.deploymentFilesDigest,clock:now,readServerApproval:async()=>{const current=await readApproval();need(same(approved,current));return current;},claimOneUseIntent:async intent=>{intentAttempted=true;const claimed=await claimOneUseIntent({...intent,runId:gate.runId,eventSha:gate.eventSha,runAttempt:1,handoffFilesDigest:gate.inventoryDigest,deploymentVersion:gate.deploymentVersion});return claimed;},readLabPublishableKey,fetchImpl:smokeFetchImpl});
  const result=await smoke();Object.assign(receipt,result,{version:SMOKE_HANDOFF_VERSION,nativeMetadataReads:metadataReads});
  await writeSafeReceipt(receipt);return receipt;
 }catch{
  receipt.status=intentAttempted?'stopped-inspect-only':'denied';receipt.nativeMetadataReads=metadataReads;
  if(typeof writeSafeReceipt==='function')try{await writeSafeReceipt(receipt);}catch{receipt.receiptUnconfirmed=true;}
  return receipt;
 }
}

// Fixed native-metadata HTTP port. It never supplies a GitHub token, cookie,
// Lab key or automatic redirect. Public-read denial is terminal, no fallback.
export function createSmokeGitHubReader(fetchImpl){
 return async url=>{
  need(typeof fetchImpl==='function'&&typeof url==='string'&&/^https:\/\/api\.github\.com\/repos\/7774cg5t75-cloud\/busy-does-it-app\/actions\/(?:runs\/[1-9][0-9]{0,19}(?:\/approvals)?|workflows\/ai-lab-creative-smoke\.yml\/runs\?head_sha=[0-9a-f]{40}&event=push&per_page=100)$/.test(url));
  const controller=new AbortController();let timer;
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('native_metadata_deadline'));},10000);});
  const read=async()=>{
   const r=await fetchImpl(url,{method:'GET',headers:{accept:'application/vnd.github+json','x-github-api-version':'2026-03-10','user-agent':'Busy-AI-Lab-disabled-smoke-read-only'},redirect:'error',signal:controller.signal});
   need(r instanceof Response&&r.status===200&&(!r.url||r.url===url)&&Number(r.headers.get('content-length')||0)<=65536);
   const reader=r.body?.getReader(),chunks=[];let length=0;
   try{if(reader)for(;;){const p=await reader.read();if(p.done)break;length+=p.value.byteLength;need(length<=65536);chunks.push(p.value);}}finally{if(reader)try{await reader.cancel();}catch{}}
   const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
   return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  };
  try{return await Promise.race([read(),deadline]);}finally{clearTimeout(timer);controller.abort();}
 };
}
