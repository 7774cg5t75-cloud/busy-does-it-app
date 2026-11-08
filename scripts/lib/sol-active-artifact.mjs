// Private, local compiler for ONE already approved original Sol operation.
// No credential, environment, Auth, provider, SQL runner or deployment port.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {stableJson} from '../../src/core/stableJson.mjs';
import {creativeDocumentDeploymentFiles,CREATIVE_DOCUMENT_DEPLOYMENT_TARGET} from './creative-document-deployment-packet.mjs';
import {prepareHostedCreativeComparison} from './hosted-creative-pilot.mjs';
import {privateHostedCreativePreparationPaths} from '../prepare-hosted-creative-pilot.mjs';
import {disabledCreativeDocumentExecution} from '../../supabase/functions/busy-builder-proposals/creativeDocumentExecutionBootstrap.mjs';
import {validateCreativeComparisonAdmission} from '../../supabase/functions/busy-builder-proposals/creativeComparisonAdmission.mjs';
import {CREATIVE_DOCUMENT_REVISED_PROFILE} from '../../supabase/functions/busy-builder-proposals/creativeDocumentPilotProfiles.mjs';
import {WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION} from '../../supabase/functions/busy-builder-proposals/websiteIntelligenceProviderProjection.mjs';
import {projectCreativeInputCountRequest} from '../../supabase/functions/busy-builder-proposals/creativeInputCountPort.mjs';

export const SOL_ACTIVE_ARTIFACT_VERSION='busy.sol-active-artifact-review.v1';
export const SOL_ACTIVE_ARTIFACT_EVIDENCE_VERSION='busy.sol-active-artifact-evidence.v1';
const hash=value=>createHash('sha256').update(typeof value==='string'||value instanceof Uint8Array?value:stableJson(value)).digest('hex');
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x),uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(x);
const plain=x=>x&&Object.getPrototypeOf(x)===Object.prototype;
const need=x=>{if(!x)throw Error('active_artifact_refused');};
const fresh=(time,now,age)=>Number.isSafeInteger(time)&&time<=now&&now-time<=age;
const same=(a,b)=>stableJson(a)===stableJson(b);
const keys=(object,names)=>plain(object)&&Object.keys(object).sort().join(',')===[...names].sort().join(',');
const anchor='const readManifest=async()=>disabledCreativeDocumentExecution;';
function dataOnly(value){
 let count=0;const seen=new Set();
 const walk=(v,depth=0)=>{
  need(++count<=30000&&depth<=40);
  if(v===null||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v))return;
  if(typeof v==='string'){need(v.length<=2000000&&!/^(?:sk-|sb_secret_|sb_publishable_|eyJ[A-Za-z0-9_-]*\.)/.test(v));return;}
  need((plain(v)||Array.isArray(v))&&!seen.has(v)&&Object.getOwnPropertySymbols(v).length===0);seen.add(v);
  for(const [key,d]of Object.entries(Object.getOwnPropertyDescriptors(v))){need(!['__proto__','prototype','constructor','password','apiKey','serviceKey','accessToken','refreshToken','credential','bearer','jwt'].includes(key)&&Object.hasOwn(d,'value'));walk(d.value,depth+1);}
  seen.delete(v);
 };walk(value);
}
const blocked=()=>({version:SOL_ACTIVE_ARTIFACT_VERSION,status:'blocked-review-only',reason:'Fresh exact source, count, tariff, original financial readback, accepted provenance and one-use owner inference approval are required.',files:null,manifest:null,deploymentApproved:false,inferenceDispatched:false,providerCalls:0,hostedWrites:0,websiteWrites:0,mayPublish:false});

/** Pure local preparation. Evidence is trusted-server/private review input,
 * never a public request or a substitute for independent evidence collection.
 * Original runtime repeats native owner/source, financial and one-use checks.
 */
export async function prepareSolActiveArtifact(root,preparation,evidence,{now=Date.now()}={}){
 if(!preparation||!evidence)return blocked();
 try{
  dataOnly(evidence);need(Number.isSafeInteger(now)&&now>0&&keys(evidence,['version','execution','review','financial','count','ownerInferenceApproval'])&&evidence.version===SOL_ACTIVE_ARTIFACT_EVIDENCE_VERSION);
  const {context,prepared}=preparation,p=preparation.proposals?.find(x=>x.model==='gpt-6.1-sol')?.projection??preparation.projection;
  need(context&&prepared?.ok===true&&p?.ok===true&&p.model==='gpt-6.1-sol'&&p.budgetProfile===CREATIVE_DOCUMENT_REVISED_PROFILE);
  need(same(p.limits,{inputTokens:8000,outputTokens:12000,maximumGBP:.25,requests:1,retries:0})&&p.requestDigest===hash(stableJson(p.wire))&&prepared.inputDigest===p.inputDigest&&prepared.sourceStamp===p.sourceStamp);
  need(context.profile?.businessName==='Quiet Light Studio'&&context.sourcePhotos?.length===0&&same(context.website?.pages?.filter(x=>x.enabled!==false).map(x=>x.id),['home','services','contact']));
  const {execution:e,review,financial,count,ownerInferenceApproval}=evidence;
  need(keys(e,['ownerId','businessId','operationId','requestNonce','binding','goal','approvedIntent','expectedPageIds','provider','model','budgetProfile','comparison','inputDigest','sourceInputDigest','schemaDigest','wireDigest','approvalReceipt','approval','tariff','tokenEvidence']));
  need(review?.provenanceBasis==='first-party-runtime-source-equivalence'&&review.ownerAccepted===true&&sha(review.acceptanceEvidenceSha256)&&fresh(review.checkedAt,now,300000)&&review.externalInputOwnerReviewed===true);
  need(e?.provider==='openai-responses'&&e.model==='gpt-6.1-sol'&&e.budgetProfile===CREATIVE_DOCUMENT_REVISED_PROFILE&&e.ownerId===context.ownerId&&e.businessId===context.businessId);
  need([e.ownerId,e.businessId,e.operationId,e.requestNonce].every(uuid)&&e.operationId!==e.requestNonce&&e.goal===context.goal&&same(e.approvedIntent,preparation.proposedIntent)&&same(e.expectedPageIds,['home','services','contact']));
  need(e.inputDigest===p.envelopeDigest&&e.sourceInputDigest===p.inputDigest&&e.schemaDigest===p.schemaDigest&&e.wireDigest===p.requestDigest&&same(e.binding,{surface:'website',pageId:'home',projectId:context.website.id,sourceRevision:context.website.generation,profileRevision:context.profileRevision,snapshotRevision:preparation.source.snapshotRevision}));
  const approval=e.approval;
  need(approval?.authenticated===true&&approval.founder===true&&approval.syntheticOnly===true&&approval.protocol===WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION&&approval.budgetProfile===CREATIVE_DOCUMENT_REVISED_PROFILE);
  need(approval.ownerId===e.ownerId&&approval.businessId===e.businessId&&approval.operationId===e.operationId&&approval.requestNonce===e.requestNonce&&approval.provider===e.provider&&approval.model===e.model&&approval.inputDigest===e.inputDigest&&approval.sourceInputDigest===e.sourceInputDigest&&approval.schemaDigest===e.schemaDigest&&approval.wireDigest===e.wireDigest);
  need(approval.inputTokenLimit===8000&&approval.totalOutputTokenLimit===12000&&approval.spendingCeilingGBP===.25&&Number.isSafeInteger(approval.expiresAt)&&approval.expiresAt>now&&approval.expiresAt<=now+3600000&&typeof approval.receipt==='string'&&approval.receipt.length>=8&&approval.receipt.length<=2000&&approval.receipt===e.approvalReceipt&&same(approval.comparison,e.comparison));
  need(ownerInferenceApproval?.status==='owner-approved'&&ownerInferenceApproval.receipt===e.approvalReceipt&&ownerInferenceApproval.operationId===e.operationId&&ownerInferenceApproval.requestNonce===e.requestNonce&&ownerInferenceApproval.wireDigest===e.wireDigest&&ownerInferenceApproval.maximumGBP===.25&&ownerInferenceApproval.maximumRequests===1&&ownerInferenceApproval.expiresAt===approval.expiresAt&&ownerInferenceApproval.automaticRetry===false&&ownerInferenceApproval.maySave===false&&ownerInferenceApproval.mayPublish===false&&sha(ownerInferenceApproval.evidenceSha256));
  const cp=await projectCreativeInputCountRequest(p,async x=>hash(x)),te=e.tokenEvidence;
  need(count?.independentlyVerified===true&&sha(count.receiptSha256)&&count.wireDigest===p.requestDigest&&count.countBodyDigest===cp.countBodyDigest&&count.model===e.model&&count.schemaDigest===p.schemaDigest&&fresh(count.checkedAt,now,86400000));
  need(te?.method==='responses-input-tokens'&&te.completeRequest===true&&te.independentlyVerified===true&&typeof te.reference==='string'&&te.reference.length>0&&te.wireDigest===p.requestDigest&&te.model===e.model&&fresh(te.checkedAt,now,86400000)&&te.checkedAt===count.checkedAt&&te.tokens===count.tokens&&Number.isSafeInteger(te.tokens)&&te.tokens>=1&&te.tokens<=8000);
  const t=e.tariff;
  need(t?.provider===e.provider&&t.model===e.model&&t.currency==='GBP'&&t.independentlyVerified===true&&t.allFeesIncluded===true&&t.modelAvailable===true&&t.availabilityVerified===true&&t.serviceTier==='default'&&t.regionalProcessing===false&&t.caching===false&&t.fixedRequestGBP===0&&t.rateBasis==='highest-applicable-all-in'&&t.rateEvidence?.independentlyVerified===true&&t.rateEvidence.coversCacheWrite===true&&t.rateEvidence.coversFXTaxAndFees===true&&typeof t.rateEvidence.reference==='string'&&t.rateEvidence.reference.length>0&&typeof t.reference==='string'&&t.reference.length>0&&fresh(t.checkedAt,now,86400000));
  need([t.inputGBPPerMillion,t.outputGBPPerMillion].every(x=>Number.isFinite(x)&&x>=0)&&/^\d+$/.test(String(t.revision))&&Number(t.revision)>0);
  const maximumGBP=(8000*t.inputGBPPerMillion+12000*t.outputGBPPerMillion)/1000000;need(maximumGBP>0&&maximumGBP<=.25);
  need(financial?.status==='independently-verified-sol-only'&&sha(financial.receiptSha256)&&fresh(financial.checkedAt,now,300000)&&financial.policyMicroGBP===250000&&financial.accountMicroGBP===250000&&financial.astraAllocationMicroGBP===0&&financial.concurrentLimit===1&&financial.operationId===e.operationId&&financial.requestNonce===e.requestNonce&&financial.wireDigest===e.wireDigest&&String(financial.tariffRevision)===String(t.revision));
  const inventory=creativeDocumentDeploymentFiles(root);need(inventory.externalImports.length===0);
  const comparison=await validateCreativeComparisonAdmission({comparison:e.comparison,current:context,prepared,projection:p,solProjection:p,operationId:e.operationId,requestNonce:e.requestNonce,binding:e.binding,expectedRendererDigest:inventory.rendererFilesDigest,now,estimatedGBP:maximumGBP,digestBytes:async x=>hash(x)});need(comparison.ok===true&&comparison.arm==='sol');
  const manifest={...disabledCreativeDocumentExecution,enabled:true,executionEnabled:true,execution:JSON.parse(stableJson(e))};
  const original=readFileSync(resolve(root,CREATIVE_DOCUMENT_DEPLOYMENT_TARGET.entrypoint),'utf8');need(original.split(anchor).length===2);
  const replacement='const approvedExecutionManifest=Object.freeze('+stableJson(manifest)+');\nconst readManifest=async()=>structuredClone(approvedExecutionManifest);';
  const entrypoint=original.replace(anchor,replacement),files={};
  for(const path of Object.keys(inventory.files))files[path]=path===CREATIVE_DOCUMENT_DEPLOYMENT_TARGET.entrypoint?entrypoint:readFileSync(resolve(root,path),'utf8');
  const fileHashes=Object.fromEntries(Object.keys(files).sort().map(path=>[path,hash(files[path])])),runtimeFiles=Object.fromEntries(Object.entries(fileHashes).filter(([path])=>Object.hasOwn(inventory.runtimeFiles,path)));
  need(Object.keys(files).length===Object.keys(inventory.files).length&&entrypoint.includes("Deno.env.get('SUPABASE_URL')!==CREATIVE_DOCUMENT_LAB_URL"));
  return {version:SOL_ACTIVE_ARTIFACT_VERSION,status:'private-active-artifact-review-only',target:CREATIVE_DOCUMENT_DEPLOYMENT_TARGET,manifest,manifestDigest:hash(manifest),files,fileHashes,filesDigest:hash(fileHashes),runtimeFiles,runtimeFilesDigest:hash(runtimeFiles),rendererDigest:inventory.rendererFilesDigest,originalDisabledInventoryDigest:inventory.filesDigest,originalDisabledEntrySha256:inventory.entrySha256,entrypointSha256:hash(entrypoint),evidenceSha256:hash(evidence),maximumGBP,expiresAt:approval.expiresAt,maximumRequests:1,centralReservationStillRequired:true,independentRuntimeReadbackStillRequired:true,ownerAuthenticationStillRequired:true,deploymentApproved:false,providerCalls:0,hostedWrites:0,websiteWrites:0,mayPublish:false};
 }catch{return blocked();}
}

// Actual-file route: genuine original source export + fresh private evidence.
// Blocked evidence creates no directory or executable artifact. No CLI exists.
export async function prepareSolActiveArtifactFiles(options={}){
 try{
  dataOnly(options);need(plain(options)&&Object.keys(options).every(key=>['root','inputEnvelope','evidenceFile','newPrivateOutput','now'].includes(key)));
  const {root,inputEnvelope,evidenceFile,newPrivateOutput,now=Date.now()}=options;
  const paths=privateHostedCreativePreparationPaths(inputEnvelope,newPrivateOutput,root);
  privateHostedCreativePreparationPaths(evidenceFile,newPrivateOutput,root);
  const raw=readFileSync(paths.input),evidenceRaw=readFileSync(evidenceFile),before=hash(raw),preparation=await prepareHostedCreativeComparison(JSON.parse(raw));
  const result=await prepareSolActiveArtifact(paths.root,preparation,JSON.parse(evidenceRaw),{now});
  if(result.status!=='private-active-artifact-review-only')return result;
  need(before===hash(readFileSync(paths.input))&&hash(evidenceRaw)===hash(readFileSync(evidenceFile)));
  mkdirSync(paths.output,{mode:0o700});
  for(const [name,value]of [['artifact-files.private.json',result.files],['execution-manifest.private.json',result.manifest],['artifact-review.private.json',{...result,files:undefined,manifest:undefined,inputEnvelopeSha256:before,evidenceFileSha256:hash(evidenceRaw)}]])writeFileSync(resolve(paths.output,name),stableJson(value)+'\n',{flag:'wx',mode:0o600});
  return {version:SOL_ACTIVE_ARTIFACT_VERSION,status:'private-active-artifact-review-only',output:paths.output,filesDigest:result.filesDigest,runtimeFilesDigest:result.runtimeFilesDigest,entrypointSha256:result.entrypointSha256,expiresAt:result.expiresAt,maximumGBP:result.maximumGBP,deploymentApproved:false,providerCalls:0,hostedWrites:0};
 }catch{return blocked();}
}
