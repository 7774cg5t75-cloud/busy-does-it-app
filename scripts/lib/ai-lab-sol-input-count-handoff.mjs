// The existing protected native-owner-review pattern, scoped to ONE FREE count.
// No Lab, sign-in, database, inference, financial configuration or save port.
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {resolve,relative,sep} from 'node:path';
import {stableJson} from '../../src/core/stableJson.mjs';
import {creativeDocumentDeploymentFiles} from './creative-document-deployment-packet.mjs';
import {createCreativeInputCountPort,projectCreativeInputCountRequest,CREATIVE_INPUT_COUNT_ENDPOINT} from '../../supabase/functions/busy-builder-proposals/creativeInputCountPort.mjs';
import {WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION} from '../../supabase/functions/busy-builder-proposals/websiteIntelligenceProviderProjection.mjs';
import {CREATIVE_DOCUMENT_REVISED_PROFILE} from '../../supabase/functions/busy-website-worker/websiteCreativePilotProfiles.mjs';

export const SOL_COUNT_HANDOFF_VERSION='busy.ai-lab-sol-input-count-handoff.v1';
export const SOL_COUNT_MARKER='.github/ai-lab-sol-input-count-request.json';
export const SOL_COUNT_WORKFLOW='.github/workflows/ai-lab-sol-input-count.yml';
export const SOL_COUNT_ENVIRONMENT='busy-ai-lab-b3-source';
export const SOL_COUNT_REQUEST=Object.freeze({model:'gpt-6.1-sol',wireDigest:'34d7a83cb0a6056f256af60f7d639acfd09f895fbf286e86898654b42b0aeb33',sourceInputDigest:'972b5fe173ed4d5f3955d23d460302b6efb91207f551e40d767f5d0c5158100f',schemaDigest:'c5958b3b5448a012123016f8e18e9425e368a14f4a75461fddb0e48e85e04545',countBodyDigest:'54a65c93cc1412a9d72e4e5557ed701ee4e04303124c78a4592bd602bf7581f9'});
const repository='7774cg5t75-cloud/busy-does-it-app',owner='7774cg5t75-cloud',branch='codex/builder-mission15-design-advancement',environmentId=26548866516;
const target=Object.freeze({projectId:'sbvkrvksnruiclcvclbd',organisationId:'wrjfgasxtlznzfzmfrif',region:'eu-west-1'});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,commit=/^[0-9a-f]{40}$/;
const plain=v=>v&&Object.getPrototypeOf(v)===Object.prototype&&Object.values(Object.getOwnPropertyDescriptors(v)).every(d=>Object.hasOwn(d,'value'));
const same=(a,b)=>stableJson(a)===stableJson(b),need=v=>{if(!v)throw Error('sol_count_handoff_refused');};
const keys=(v,expected)=>plain(v)&&same(Object.keys(v).sort(),[...expected].sort());
export const solCountDigest=v=>createHash('sha256').update(typeof v==='string'||v instanceof Uint8Array?v:stableJson(v)).digest('hex');
const handoffFiles=[SOL_COUNT_WORKFLOW,'scripts/run-ai-lab-sol-input-count.mjs','scripts/lib/ai-lab-sol-input-count-handoff.mjs','scripts/lib/creative-document-deployment-packet.mjs','supabase/functions/busy-builder-proposals/creativeInputCountPort.mjs'];

export function solCountHandoffInventory(root){
 const base=realpathSync(root),original=creativeDocumentDeploymentFiles(base),files={...original.files};
 for(const name of handoffFiles){const p=resolve(base,name),rel=relative(base,p);need(rel&&rel!=='..'&&!rel.startsWith('..'+sep)&&realpathSync(p)===p&&!lstatSync(p).isSymbolicLink()&&lstatSync(p).isFile()&&lstatSync(p).size<180000);files[name]=solCountDigest(readFileSync(p));}
 const sorted=Object.fromEntries(Object.entries(files).sort(([a],[b])=>a.localeCompare(b)));
 return {files:sorted,filesDigest:solCountDigest(sorted),rendererDigest:original.rendererFilesDigest};
}
export function buildSolCountHandoffReview(root){
 return {version:SOL_COUNT_HANDOFF_VERSION,status:'review-only-not-authorized',marker:SOL_COUNT_MARKER,target,request:SOL_COUNT_REQUEST,inventory:solCountHandoffInventory(root),environment:SOL_COUNT_ENVIRONMENT,nativeEnvironmentId:environmentId,requiredReviewer:owner,attempt:1,endpoint:CREATIVE_INPUT_COUNT_ENDPOINT,maximumRequests:1,maximumPaidGBP:0,privateWireSecret:'BUSY_AI_LAB_SOL_COUNT_WIRE_JSON',newLabKeySecret:'BUSY_AI_LAB_OPENAI_CREATIVE_V2_KEY',credentialsConfigured:false,queueApproved:false,executionApproved:false};
}
export function verifySolCountSource({root,marker,environment,gitState}){
 need(keys(marker,['version','executionId','target','request','source','maximumRequests','maximumPaidGBP','automaticRetry'])&&marker.version===SOL_COUNT_HANDOFF_VERSION&&uuid.test(marker.executionId)&&same(marker.target,target)&&same(marker.request,SOL_COUNT_REQUEST)&&marker.maximumRequests===1&&marker.maximumPaidGBP===0&&marker.automaticRetry===false);
 need(keys(marker.source,['parentCommit','files','filesDigest'])&&commit.test(marker.source.parentCommit));
 need(environment?.GITHUB_ACTIONS==='true'&&environment.GITHUB_REPOSITORY===repository&&environment.GITHUB_REF==='refs/heads/'+branch&&environment.GITHUB_EVENT_NAME==='push'&&environment.GITHUB_ACTOR===owner&&environment.GITHUB_TRIGGERING_ACTOR===owner&&environment.GITHUB_RUN_ATTEMPT==='1'&&/^[1-9][0-9]{0,19}$/.test(environment.GITHUB_RUN_ID||'')&&commit.test(environment.GITHUB_SHA||''));
 need(environment.GITHUB_WORKFLOW_REF===repository+'/'+SOL_COUNT_WORKFLOW+'@refs/heads/'+branch&&environment.RUNNER_ENVIRONMENT==='github-hosted'&&environment.RUNNER_OS==='Linux'&&environment.RUNNER_ARCH==='X64');
 need(gitState?.head===environment.GITHUB_SHA&&gitState.parents?.length===1&&gitState.parents[0]===marker.source.parentCommit&&same(gitState.changedFiles,[SOL_COUNT_MARKER])&&gitState.clean===true&&Array.isArray(gitState.priorExecutionIds)&&gitState.priorExecutionIds.length<=100&&gitState.priorExecutionIds.every(x=>uuid.test(x))&&!gitState.priorExecutionIds.includes(marker.executionId));
 const inventory=solCountHandoffInventory(root);need(same(marker.source.files,inventory.files)&&marker.source.filesDigest===inventory.filesDigest);
 return {executionId:marker.executionId,runId:environment.GITHUB_RUN_ID,eventSha:environment.GITHUB_SHA,filesDigest:inventory.filesDigest,request:marker.request};
}
export function solCountApprovalComment({runId,eventSha,expiresAt}){
 need(/^[1-9][0-9]{0,19}$/.test(runId||'')&&commit.test(eventSha||'')&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(expiresAt||'')&&Number.isFinite(Date.parse(expiresAt)));
 return `BUSY_AI_LAB_SOL_COUNT_V1 run=${runId} attempt=1 sha=${eventSha} expires=${expiresAt}`;
}
export function verifyNativeSolCountReview({run,reviews,duplicates,gate,now=Date.now()}){
 need(plain(run)&&run.id===Number(gate.runId)&&run.head_sha===gate.eventSha&&run.run_attempt===1&&run.event==='push'&&run.head_branch===branch&&run.path===SOL_COUNT_WORKFLOW&&run.status==='in_progress'&&run.conclusion===null&&run.actor?.login===owner&&run.triggering_actor?.login===owner&&run.repository?.full_name===repository&&run.repository.private===false);
 need(plain(duplicates)&&duplicates.total_count===1&&Array.isArray(duplicates.workflow_runs)&&duplicates.workflow_runs.length===1&&duplicates.workflow_runs[0].id===run.id&&duplicates.workflow_runs[0].head_sha===gate.eventSha&&duplicates.workflow_runs[0].run_attempt===1);
 need(Array.isArray(reviews)&&reviews.length<=20);const rows=reviews.filter(r=>Array.isArray(r?.environments)&&r.environments.some(e=>e.id===environmentId||e.name===SOL_COUNT_ENVIRONMENT));need(rows.length===1);
 const row=rows[0];need(row.state==='approved'&&row.user?.login===owner&&row.environments.length===1&&row.environments[0].id===environmentId&&row.environments[0].name===SOL_COUNT_ENVIRONMENT&&typeof row.comment==='string'&&row.comment.length<=240);
 const m=row.comment.match(/^BUSY_AI_LAB_SOL_COUNT_V1 run=([1-9][0-9]{0,19}) attempt=1 sha=([0-9a-f]{40}) expires=(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)$/);
 need(m&&m[1]===gate.runId&&m[2]===gate.eventSha&&Number.isSafeInteger(now)&&Date.parse(m[3])>now&&Date.parse(m[3])<=now+3600000);
 return {expiresAt:m[3],runId:gate.runId,eventSha:gate.eventSha,executionId:gate.executionId};
}
export async function readSolCountProjection(raw){
 need(typeof raw==='string'&&Buffer.byteLength(raw)<=32768);const wire=JSON.parse(raw);
 const projection={ok:true,version:WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION,budgetProfile:CREATIVE_DOCUMENT_REVISED_PROFILE,model:SOL_COUNT_REQUEST.model,inputDigest:SOL_COUNT_REQUEST.sourceInputDigest,schemaDigest:SOL_COUNT_REQUEST.schemaDigest,requestDigest:SOL_COUNT_REQUEST.wireDigest,wire};
 const count=await projectCreativeInputCountRequest(projection,async x=>solCountDigest(x));need(count.countBodyDigest===SOL_COUNT_REQUEST.countBodyDigest);return projection;
}
export async function runProtectedSolInputCount({root,marker,environment,gitState,readGitHubJson,readPrivateWire,readCredential,claimOneUseIntent,writeSafeReceipt,countFetchImpl,now=Date.now,verifyOnly=false}={}){
 const receipt={version:SOL_COUNT_HANDOFF_VERSION,status:'denied',mayReplay:false,httpRequestsAttempted:0,credentialReads:0,privateWireReads:0,inferenceCalls:0,nativeSignIns:0,applicationWrites:0,spendingGBP:0,independentlyVerified:false};let reads=0,intentAttempted=false,intentConfirmed=false,receiptWriteAttempted=false;
 try{
  const gate=verifySolCountSource({root,marker,environment,gitState});need(typeof readGitHubJson==='function'&&typeof readPrivateWire==='function'&&(verifyOnly||[readCredential,claimOneUseIntent,writeSafeReceipt,countFetchImpl].every(f=>typeof f==='function')));
  const base='https://api.github.com/repos/'+repository+'/actions/',runUrl=base+'runs/'+gate.runId,duplicatesUrl=base+'workflows/ai-lab-sol-input-count.yml/runs?head_sha='+gate.eventSha+'&event=push&per_page=100';
  const get=async url=>{need(++reads<=12);return readGitHubJson(url);},run=await get(runUrl),duplicates=await get(duplicatesUrl);
  const approval=async()=>verifyNativeSolCountReview({run,reviews:await get(runUrl+'/approvals'),duplicates,gate,now:now()});
  const approved=await approval();receipt.privateWireReads++;const projection=await readSolCountProjection(await readPrivateWire());
  Object.assign(receipt,{runId:gate.runId,eventSha:gate.eventSha,executionId:gate.executionId,filesDigest:gate.filesDigest,...SOL_COUNT_REQUEST});
  if(verifyOnly)return {...receipt,status:'native-exact-count-review-verified',nativeMetadataReads:reads,countExecuted:false};
  const counter=createCreativeInputCountPort({sha256:async x=>solCountDigest(x),clock:now,
   claimApprovedCount:async identity=>{need(same(await approval(),approved)&&same(identity,SOL_COUNT_REQUEST)&&now()<Date.parse(approved.expiresAt));intentAttempted=true;const claim=await claimOneUseIntent({version:SOL_COUNT_HANDOFF_VERSION,executionId:gate.executionId,runId:gate.runId,eventSha:gate.eventSha,runAttempt:1,filesDigest:gate.filesDigest,...identity,maximumRequests:1,maximumPaidGBP:0});need(claim?.consumed===true&&claim.executionId===gate.executionId);intentConfirmed=true;return true;},
   readCredential:async()=>{need(same(await approval(),approved)&&now()<Date.parse(approved.expiresAt));receipt.credentialReads++;return readCredential();},
   transport:async(url,options)=>{need(url===CREATIVE_INPUT_COUNT_ENDPOINT&&now()<Date.parse(approved.expiresAt));const deadline=AbortSignal.timeout(Math.max(1,Date.parse(approved.expiresAt)-now()));return countFetchImpl(url,{...options,signal:AbortSignal.any([options.signal,deadline])});}
  });
  const result=await counter(projection);
  // Retain no raw provider header, even if an upstream echoed a credential.
  delete result.providerRequestId;
  Object.assign(receipt,result,{version:SOL_COUNT_HANDOFF_VERSION,nativeMetadataReads:reads});if(intentAttempted&&!intentConfirmed)receipt.status='intent-unconfirmed';
  receiptWriteAttempted=true;await writeSafeReceipt(receipt);return receipt;
 }catch{
  receipt.status=intentAttempted?(intentConfirmed?'stopped-inspect-only':'intent-unconfirmed'):'denied';receipt.nativeMetadataReads=reads;
  if(receiptWriteAttempted)receipt.receiptUnconfirmed=true;
  else if(typeof writeSafeReceipt==='function')try{receiptWriteAttempted=true;await writeSafeReceipt(receipt);}catch{receipt.receiptUnconfirmed=true;}
  return receipt;
 }
}
// Same bounded unauthenticated native metadata reader as the original smoke,
// narrowed to this workflow. No GitHub token, cookie or OpenAI/Lab key is sent.
export function createSolCountGitHubReader(fetchImpl){
 return async url=>{
  need(typeof fetchImpl==='function'&&typeof url==='string'&&/^https:\/\/api\.github\.com\/repos\/7774cg5t75-cloud\/busy-does-it-app\/actions\/(?:runs\/[1-9][0-9]{0,19}(?:\/approvals)?|workflows\/ai-lab-sol-input-count\.yml\/runs\?head_sha=[0-9a-f]{40}&event=push&per_page=100)$/.test(url));
  const controller=new AbortController();let timer,reader;
  const task=async()=>{const r=await fetchImpl(url,{method:'GET',headers:{accept:'application/vnd.github+json','x-github-api-version':'2026-03-10','user-agent':'Busy-AI-Lab-free-count-read-only'},redirect:'error',credentials:'omit',signal:controller.signal});need(r instanceof Response&&r.status===200&&!r.redirected&&(!r.url||r.url===url));const length=r.headers.get('content-length');need(length===null||/^\d+$/.test(length)&&Number(length)<=65536);reader=r.body?.getReader();need(reader);const chunks=[];let n=0;for(;;){const p=await reader.read();if(p.done)break;n+=p.value.byteLength;need(n<=65536);chunks.push(p.value);}const bytes=new Uint8Array(n);let at=0;for(const x of chunks){bytes.set(x,at);at+=x.byteLength;}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));};
  try{return await Promise.race([task(),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('native_metadata_deadline'));},10000);})]);}
  finally{clearTimeout(timer);controller.abort();try{void reader?.cancel()?.catch(()=>{});}catch{}}
 };
}
