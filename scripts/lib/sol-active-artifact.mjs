// Private, local two-phase compiler for ONE original Sol plan. Preparation
// seals disabled bytes only; active compilation still needs separate real D.
// No credential, environment, Auth, provider, SQL runner or deployment port.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {stableJson} from '../../src/core/stableJson.mjs';
import {creativeDocumentDeploymentFiles,CREATIVE_DOCUMENT_DEPLOYMENT_TARGET} from './creative-document-deployment-packet.mjs';
import {prepareHostedCreativeComparison} from './hosted-creative-pilot.mjs';
import {privateHostedCreativePreparationPaths} from '../prepare-hosted-creative-pilot.mjs';
import {disabledCreativeDocumentExecution} from '../../supabase/functions/busy-builder-proposals/creativeDocumentExecutionBootstrap.mjs';
import {validateCreativeComparisonAdmission,SOL_TIMING_POLICY_VERSION,SOL_TIMING_POLICY_CANDIDATE,SOL_TIMING_POLICY_DIGEST,reviewSolTimingPolicyApproval} from '../../supabase/functions/busy-builder-proposals/creativeComparisonAdmission.mjs';
import {CREATIVE_DOCUMENT_REVISED_PROFILE} from '../../supabase/functions/busy-builder-proposals/creativeDocumentPilotProfiles.mjs';
import {WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION} from '../../supabase/functions/busy-builder-proposals/websiteIntelligenceProviderProjection.mjs';
import {projectCreativeInputCountRequest} from '../../supabase/functions/busy-builder-proposals/creativeInputCountPort.mjs';
import {reviewSolUsageValuation} from '../../supabase/functions/busy-builder-proposals/creativeDocumentCostEvidence.mjs';
import {solDesignHandoffInventory} from './ai-lab-sol-design-handoff.mjs';

export const SOL_ACTIVE_ARTIFACT_VERSION='busy.sol-active-artifact-review.v1';
export const SOL_ACTIVE_ARTIFACT_EVIDENCE_VERSION='busy.sol-active-artifact-evidence.v1';
export const SOL_PREPARATION_EVIDENCE_VERSION='busy.sol-preparation-evidence.v2';
export const SOL_PREPARATION_APPROVAL_VERSION='busy.sol-preparation-approval.v1';
export const SOL_PREPARATION_SEAL_VERSION='busy.sol-preparation-seal.v1';
export const SOL_PREPARATION_MAX_AGE=86400000;
export const SOL_EXECUTION_MAX_AGE=3600000;
export const SOL_CONDITIONAL_D_CANDIDATE_MAX_AGE=SOL_TIMING_POLICY_CANDIDATE.conditionalDMaxAgeMs;
const hash=value=>createHash('sha256').update(typeof value==='string'||value instanceof Uint8Array?value:stableJson(value)).digest('hex');
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x),uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(x);
const plain=x=>x&&Object.getPrototypeOf(x)===Object.prototype;
const need=x=>{if(!x)throw Error('active_artifact_refused');};
const fresh=(time,now,age)=>Number.isSafeInteger(time)&&time<=now&&now-time<=age;
const same=(a,b)=>stableJson(a)===stableJson(b);
const keys=(object,names)=>plain(object)&&Object.keys(object).sort().join(',')===[...names].sort().join(',');
const phaseKeys=(object,names)=>keys(object,names)||keys(object,[...names,'timingPolicyApproval']);
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
const blocked=()=>({version:SOL_ACTIVE_ARTIFACT_VERSION,status:'blocked-review-only',reason:'Fresh exact source, count, tariff, original financial readback and matching phase-specific owner authority are required.',files:null,manifest:null,deploymentApproved:false,inferenceDispatched:false,providerCalls:0,hostedWrites:0,websiteWrites:0,mayPublish:false});

const executionKeys=['ownerId','businessId','operationId','requestNonce','binding','goal','approvedIntent','expectedPageIds','provider','model','budgetProfile','comparison','inputDigest','sourceInputDigest','schemaDigest','wireDigest','approvalReceipt','approval','tariff','tokenEvidence'];
const planKeys=executionKeys.filter(k=>!['approvalReceipt','approval'].includes(k));
const comparisonPlanKeys=['version','comparisonId','ownerId','businessId','sourceStampDigest','sourceInputDigest','schemaDigest','rendererDigest','source','period','maximumGBP','sol','astra'];
const sealCoreKeys=['version','status','target','planDigest','bindings','preparationApprovalDigest','issuedAt','expiresAt','validUntil','fileHashes','filesDigest','runtimeFiles','runtimeFilesDigest','rendererDigest','manifestDigest'];
const sealCore=seal=>Object.fromEntries(sealCoreKeys.map(k=>[k,seal[k]]));

// An unmarked historic record retains its original60-minute rules. The new
// derivative accepts4h only through a source-bound owner policy receipt. This
// read-only inspection neither approves a record nor renews supporting facts.
function timingEvidence(root,evidence,plan,now){
 if(!Object.hasOwn(evidence,'timingPolicyApproval')){
  need(!plan?.approval||!Object.hasOwn(plan.approval,'timingPolicy'));
  return {maximumDLeaseMs:SOL_EXECUTION_MAX_AGE,reviewFreshnessMs:300000,policy:null};
 }
 const inventory=creativeDocumentDeploymentFiles(root),policy=evidence.timingPolicyApproval;
 const accepted=reviewSolTimingPolicyApproval(policy,{now,bindings:{targetProject:'sbvkrvksnruiclcvclbd',model:'gpt-6.1-sol',wireDigest:plan.wireDigest,sourceInventoryDigest:inventory.filesDigest,runtimeInventoryDigest:inventory.runtimeFilesDigest,rendererDigest:inventory.rendererFilesDigest,compilerSha256:hash(readFileSync(resolve(root,'scripts/lib/sol-active-artifact.mjs')))}});
 need(accepted.ok);
 const countDeadline=evidence.count?.checkedAt+SOL_PREPARATION_MAX_AGE,tariff=plan.tariff;
 const rateDeadline=Math.min(tariff?.checkedAt,tariff?.officialTariffEvidence?.checkedAt??tariff?.checkedAt)+SOL_PREPARATION_MAX_AGE;
 const financialDeadline=evidence.financial?.financialValidUntil;
 need([countDeadline,rateDeadline,financialDeadline].every(Number.isSafeInteger)&&financialDeadline>now&&policy.supportingEvidenceUntil<=Math.min(countDeadline,rateDeadline,financialDeadline));
 if(evidence.currentState){
  need(financialDeadline===evidence.currentState.financialValidUntil&&policy.supportingEvidenceUntil<=evidence.ownerPreparationApproval?.expiresAt);
 }
 if(plan.approval)need(same(plan.approval.timingPolicy,policy));
 return {maximumDLeaseMs:accepted.conditionalDMaxAgeMs,reviewFreshnessMs:SOL_TIMING_POLICY_CANDIDATE.generalFreshnessMs,policy};
}

// Derivation is explicit and non-authorising. No draft is promoted, and no
// issuedAt/expiry/approved flag is invented from a preparation permit.
export function solPreparationPlanFromExecution(execution){
 dataOnly(execution);need(keys(execution,executionKeys));
 const {approval,approvalReceipt,comparison,...plan}=structuredClone(execution);
 const {expiresAt,...comparisonPlan}=comparison;
 need(keys(comparisonPlan,comparisonPlanKeys));return {...plan,comparison:comparisonPlan};
}

/** Semantic state fingerprints are independently collected private evidence,
 * not attestations invented by this compiler. Observation timestamps refresh;
 * identity/security/financial contents and original validity may not change.
 */
export function solPreparationBindings(root,preparation,evidence){
 dataOnly(evidence);need(keys(evidence.plan,planKeys));
 const inventory=creativeDocumentDeploymentFiles(root),caller=solDesignHandoffInventory(root),s=evidence.currentState;
 const sourceDigest=hash({context:preparation.context,prepared:preparation.prepared,source:preparation.source,proposedIntent:preparation.proposedIntent});
 need(keys(s,['version','status','checkedAt','sourceDigest','identityDigest','securityDigest','financialDigest','financialValidUntil'])&&s.version==='busy.sol-preparation-native-state.v1'&&s.status==='independently-verified'&&['sourceDigest','identityDigest','securityDigest','financialDigest'].every(k=>sha(s[k]))&&s.sourceDigest===sourceDigest&&Number.isSafeInteger(s.financialValidUntil));
 return {target:CREATIVE_DOCUMENT_DEPLOYMENT_TARGET,planDigest:hash(evidence.plan),sourceDigest,countReceiptSha256:evidence.count?.receiptSha256,provenanceAcceptanceSha256:evidence.review?.acceptanceEvidenceSha256,submittedFilesDigest:inventory.filesDigest,runtimeFilesDigest:inventory.runtimeFilesDigest,rendererDigest:inventory.rendererFilesDigest,callerFilesDigest:caller.filesDigest,compilerSha256:hash(readFileSync(resolve(root,'scripts/lib/sol-active-artifact.mjs'))),projectConfigSha256:inventory.fullProjectConfigSha256,generalGatewaySha256:inventory.generalGatewaySha256,identityDigest:s.identityDigest,securityDigest:s.securityDigest,financialDigest:s.financialDigest,financialValidUntil:s.financialValidUntil};
}

/** 24h preparation permits seal ONLY the unchanged, hard-disabled source.
 * Plan/permit metadata stays outside runtime authority. No D, credential,
 * environment switch, reservation, deployment or dispatch port is supplied.
 */
export async function prepareSolPreparationArtifact(root,preparation,evidence,{now=Date.now()}={}){
 try{
  dataOnly(evidence);evidence=structuredClone(evidence);need(Number.isSafeInteger(now)&&now>0&&phaseKeys(evidence,['version','plan','review','financial','count','currentState','ownerPreparationApproval'])&&evidence.version===SOL_PREPARATION_EVIDENCE_VERSION);
  const e=evidence.plan,a=evidence.ownerPreparationApproval,s=evidence.currentState,{review,financial,count}=evidence;
  const {context,prepared}=preparation,p=preparation.proposals?.find(x=>x.model==='gpt-6.1-sol')?.projection??preparation.projection;
  need(keys(e,planKeys)&&context&&prepared?.ok===true&&p?.ok===true&&p.model==='gpt-6.1-sol'&&p.budgetProfile===CREATIVE_DOCUMENT_REVISED_PROFILE);
  need(same(p.limits,{inputTokens:8000,outputTokens:12000,maximumGBP:1,requests:1,retries:0})&&p.requestDigest===hash(stableJson(p.wire))&&prepared.inputDigest===p.inputDigest&&prepared.sourceStamp===p.sourceStamp);
  need(context.profile?.businessName==='Quiet Light Studio'&&context.sourcePhotos?.length===0&&same(context.website?.pages?.filter(x=>x.enabled!==false).map(x=>x.id),['home','services','contact']));
  need(e.ownerId===context.ownerId&&e.businessId===context.businessId&&[e.ownerId,e.businessId,e.operationId,e.requestNonce].every(uuid)&&e.operationId!==e.requestNonce&&e.provider==='openai-responses'&&e.model===p.model&&e.budgetProfile===p.budgetProfile&&e.goal===context.goal&&same(e.approvedIntent,preparation.proposedIntent)&&same(e.expectedPageIds,['home','services','contact']));
  need(e.inputDigest===p.envelopeDigest&&e.sourceInputDigest===p.inputDigest&&e.schemaDigest===p.schemaDigest&&e.wireDigest===p.requestDigest&&same(e.binding,{surface:'website',pageId:'home',projectId:context.website.id,sourceRevision:context.website.generation,profileRevision:context.profileRevision,snapshotRevision:preparation.source.snapshotRevision}));
  const timing=timingEvidence(root,evidence,e,now);
  need(review?.provenanceBasis==='first-party-runtime-source-equivalence'&&review.ownerAccepted===true&&sha(review.acceptanceEvidenceSha256)&&fresh(review.checkedAt,now,timing.reviewFreshnessMs));
  const bindings=solPreparationBindings(root,preparation,evidence);
  need(fresh(s.checkedAt,now,300000)&&s.financialValidUntil>now);
  need(keys(a,['version','status','purpose','issuedAt','expiresAt','receipt','evidenceSha256','bindings','maximumRequests','maximumGBP','mayDeploy','mayReadCredentials','mayReserve','mayDispatch','maySave','mayPublish','automaticRetry'])&&a.version===SOL_PREPARATION_APPROVAL_VERSION&&a.status==='owner-approved'&&a.purpose==='read-only-and-private-disabled-sealing'&&Number.isSafeInteger(a.issuedAt)&&Number.isSafeInteger(a.expiresAt)&&a.issuedAt<=now&&a.expiresAt>now&&a.expiresAt>a.issuedAt&&a.expiresAt-a.issuedAt<=SOL_PREPARATION_MAX_AGE&&typeof a.receipt==='string'&&a.receipt.length>=8&&a.receipt.length<=2000&&sha(a.evidenceSha256)&&same(a.bindings,bindings));
  need(a.maximumRequests===0&&a.maximumGBP===0&&['mayDeploy','mayReadCredentials','mayReserve','mayDispatch','maySave','mayPublish','automaticRetry'].every(k=>a[k]===false));
  need(financial?.status==='independently-verified-sol-only'&&sha(financial.receiptSha256)&&fresh(financial.checkedAt,now,300000)&&financial.policyMicroGBP===1000000&&financial.accountMicroGBP===1000000&&financial.astraAllocationMicroGBP===0&&financial.concurrentLimit===1&&financial.operationId===e.operationId&&financial.requestNonce===e.requestNonce&&financial.wireDigest===e.wireDigest&&String(financial.tariffRevision)===String(e.tariff?.revision));
  const cp=await projectCreativeInputCountRequest(p,async x=>hash(x)),te=e.tokenEvidence;
  need(count?.independentlyVerified===true&&sha(count.receiptSha256)&&count.wireDigest===p.requestDigest&&count.countBodyDigest===cp.countBodyDigest&&count.model===e.model&&count.schemaDigest===p.schemaDigest&&fresh(count.checkedAt,now,SOL_PREPARATION_MAX_AGE));
  need(te?.method==='responses-input-tokens'&&te.completeRequest===true&&te.independentlyVerified===true&&typeof te.reference==='string'&&te.reference.length>0&&te.wireDigest===e.wireDigest&&te.model===e.model&&te.checkedAt===count.checkedAt&&te.tokens===count.tokens&&Number.isSafeInteger(te.tokens)&&te.tokens>=1&&te.tokens<=8000);
  const t=e.tariff,valuation=t?.evidenceBasis===undefined?null:reviewSolUsageValuation(t,{model:e.model,wireDigest:e.wireDigest,budgetProfile:e.budgetProfile,inputTokenLimit:8000,totalOutputTokenLimit:12000,now});
  const legacy=t?.evidenceBasis===undefined&&t?.allFeesIncluded===true&&t.rateBasis==='highest-applicable-all-in'&&t.rateEvidence?.independentlyVerified===true&&t.rateEvidence.coversCacheWrite===true&&t.rateEvidence.coversFXTaxAndFees===true&&typeof t.rateEvidence.reference==='string'&&t.rateEvidence.reference.length>0;
  need(t?.provider===e.provider&&t.model===e.model&&t.currency==='GBP'&&t.independentlyVerified===true&&(legacy||valuation?.ok===true)&&t.modelAvailable===true&&t.availabilityVerified===true&&t.serviceTier==='default'&&t.regionalProcessing===false&&t.caching===false&&t.fixedRequestGBP===0&&typeof t.reference==='string'&&t.reference.length>0&&fresh(t.checkedAt,now,SOL_PREPARATION_MAX_AGE)&&/^\d+$/.test(String(t.revision))&&Number(t.revision)>0);
  need([t.inputGBPPerMillion,t.outputGBPPerMillion].every(x=>Number.isFinite(x)&&x>=0));const maximumGBP=(8000*t.inputGBPPerMillion+12000*t.outputGBPPerMillion)/1000000;need(maximumGBP>0&&maximumGBP<=1);
  // Preparation has no comparison execution expiry. That expiry is supplied
  // only by a later real D record and checked by the original active compiler.
  const c=e.comparison;
  need(keys(c,comparisonPlanKeys)&&c.version==='busy.creative-comparison-approval.v1'&&c.maximumGBP===3&&c.ownerId===e.ownerId&&c.businessId===e.businessId&&keys(c.sol,['model','operationId','requestNonce'])&&keys(c.astra,['model','operationId','requestNonce'])&&c.sol.model===e.model&&c.sol.operationId===e.operationId&&c.sol.requestNonce===e.requestNonce&&c.astra.model==='gpt-6-astra');
  need([c.comparisonId,c.sol.operationId,c.sol.requestNonce,c.astra.operationId,c.astra.requestNonce].every(uuid)&&new Set([c.comparisonId,c.sol.operationId,c.sol.requestNonce,c.astra.operationId,c.astra.requestNonce]).size===5&&c.sourceStampDigest===hash(prepared.sourceStamp)&&c.sourceInputDigest===p.inputDigest&&c.schemaDigest===p.schemaDigest&&c.rendererDigest===bindings.rendererDigest&&same(c.source,{websiteId:context.website.id,generation:context.website.generation,profileRevision:context.profileRevision,snapshotRevision:preparation.source.snapshotRevision})&&c.period===new Date(now).toISOString().slice(0,7)+'-01');
  const inventory=creativeDocumentDeploymentFiles(root);need(inventory.externalImports.length===0&&inventory.filesDigest===bindings.submittedFilesDigest&&inventory.runtimeFilesDigest===bindings.runtimeFilesDigest&&inventory.rendererFilesDigest===bindings.rendererDigest&&inventory.fullProjectConfigSha256===bindings.projectConfigSha256&&inventory.generalGatewaySha256===bindings.generalGatewaySha256);
  const files=Object.fromEntries(Object.keys(inventory.files).map(name=>[name,readFileSync(resolve(root,name),'utf8')]));
  need(Object.entries(files).every(([name,source])=>hash(source)===inventory.files[name]));
  const date=new Date(now),periodEnd=Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,1),rateDeadline=valuation?.ok?Math.min(t.checkedAt,t.officialTariffEvidence.checkedAt)+SOL_PREPARATION_MAX_AGE:t.checkedAt+SOL_PREPARATION_MAX_AGE,validUntil=Math.min(a.expiresAt,s.financialValidUntil,count.checkedAt+SOL_PREPARATION_MAX_AGE,rateDeadline,periodEnd,timing.policy?.supportingEvidenceUntil??Number.MAX_SAFE_INTEGER);
  need(validUntil>now);
  const sealed={version:SOL_PREPARATION_SEAL_VERSION,status:'private-disabled-preparation-review-only',target:CREATIVE_DOCUMENT_DEPLOYMENT_TARGET,planDigest:hash(e),bindings,preparationApprovalDigest:hash(a),issuedAt:a.issuedAt,expiresAt:a.expiresAt,validUntil,fileHashes:inventory.files,filesDigest:inventory.filesDigest,runtimeFiles:inventory.runtimeFiles,runtimeFilesDigest:inventory.runtimeFilesDigest,rendererDigest:inventory.rendererFilesDigest,manifestDigest:hash(disabledCreativeDocumentExecution)};
  need(same(solPreparationBindings(root,preparation,evidence),bindings));
  return {...sealed,preparationSealDigest:hash(sealed),files,manifest:structuredClone(disabledCreativeDocumentExecution),freshEvidenceDigest:hash(evidence),maximumGBP:0,maximumRequests:0,plannedRequestMaximumGBP:maximumGBP,executionAuthorised:false,requiresSeparateShortLivedD:true,deploymentApproved:false,providerCalls:0,hostedWrites:0,websiteWrites:0,mayPublish:false};
 }catch{return blocked();}
}

/** Revalidate the immutable disabled seal using NEW fresh observations, then
 * invoke the ORIGINAL active compiler with actual short-lived D authority.
 * Existing records are neither rewritten nor used as a placeholder approval.
 */
export async function finalizeSolPreparedArtifact(root,preparation,sealed,freshPreparationEvidence,executionEvidence,{now=Date.now()}={}){
 try{
  dataOnly(sealed);dataOnly(executionEvidence);dataOnly(freshPreparationEvidence);
  sealed=structuredClone(sealed);executionEvidence=structuredClone(executionEvidence);freshPreparationEvidence=structuredClone(freshPreparationEvidence);
  const current=await prepareSolPreparationArtifact(root,preparation,freshPreparationEvidence,{now});
  need(current.status==='private-disabled-preparation-review-only'&&sealed.version===SOL_PREPARATION_SEAL_VERSION&&sealed.status===current.status&&hash(sealCore(sealed))===sealed.preparationSealDigest&&sealed.preparationSealDigest===current.preparationSealDigest&&sealed.validUntil>now);
  if(Object.hasOwn(sealed,'files'))need(keys(sealed.files,Object.keys(sealed.fileHashes))&&Object.entries(sealed.files).every(([name,source])=>typeof source==='string'&&hash(source)===sealed.fileHashes[name]));
  if(Object.hasOwn(sealed,'manifest'))need(hash(sealed.manifest)===sealed.manifestDigest&&same(sealed.manifest,disabledCreativeDocumentExecution));
  // Every expiry-free plan byte, including tariff/count evidence and inert
  // Astra identifiers, stays fixed. Only real execution approval times/receipt
  // and the comparison's short execution expiry are attached at this phase.
  need(same(solPreparationPlanFromExecution(executionEvidence.execution),freshPreparationEvidence.plan));
  need(same(executionEvidence.review,freshPreparationEvidence.review)&&same(executionEvidence.financial,freshPreparationEvidence.financial)&&same(executionEvidence.count,freshPreparationEvidence.count));
  const a=executionEvidence.ownerInferenceApproval,b=executionEvidence.execution.approval;
  need(same(executionEvidence.timingPolicyApproval??null,freshPreparationEvidence.timingPolicyApproval??null));
  const timing=timingEvidence(root,executionEvidence,executionEvidence.execution,now);
  need(Number.isSafeInteger(a?.issuedAt)&&a.issuedAt>=current.issuedAt&&a.issuedAt<=now&&a.expiresAt>a.issuedAt&&a.expiresAt-a.issuedAt<=timing.maximumDLeaseMs&&b?.issuedAt===a.issuedAt&&b.expiresAt===a.expiresAt&&a.expiresAt<=current.validUntil);
  if(timing.policy)need(a.issuedAt>=timing.policy.recordedAt&&a.expiresAt<=timing.policy.supportingEvidenceUntil);
  const active=await prepareSolActiveArtifact(root,preparation,executionEvidence,{now});need(active.status==='private-active-artifact-review-only'&&active.originalDisabledInventoryDigest===current.filesDigest&&active.rendererDigest===current.rendererDigest&&keys(active.files,Object.keys(current.fileHashes)));
  const entry=CREATIVE_DOCUMENT_DEPLOYMENT_TARGET.entrypoint,expectedEntry=current.files[entry].replace(anchor,'const approvedExecutionManifest=Object.freeze('+stableJson(active.manifest)+');\nconst readManifest=async()=>structuredClone(approvedExecutionManifest);');
  need(active.files[entry]===expectedEntry&&Object.keys(current.fileHashes).every(name=>name===entry||active.fileHashes[name]===current.fileHashes[name])&&same(solPreparationBindings(root,preparation,freshPreparationEvidence),current.bindings));
  return {...active,preparationSealDigest:current.preparationSealDigest,preparationApprovalDigest:current.preparationApprovalDigest,preparationValidUntil:current.validUntil,executionApprovedAt:a.issuedAt,activeEntryAndManifestRequireSeparateReview:true};
 }catch{return blocked();}
}

/** Pure local preparation. Evidence is trusted-server/private review input,
 * never a public request or a substitute for independent evidence collection.
 * Original runtime repeats native owner/source, financial and one-use checks.
 */
export async function prepareSolActiveArtifact(root,preparation,evidence,{now=Date.now()}={}){
 if(!preparation||!evidence)return blocked();
 try{
  dataOnly(evidence);need(Number.isSafeInteger(now)&&now>0&&phaseKeys(evidence,['version','execution','review','financial','count','ownerInferenceApproval'])&&evidence.version===SOL_ACTIVE_ARTIFACT_EVIDENCE_VERSION);
  const {context,prepared}=preparation,p=preparation.proposals?.find(x=>x.model==='gpt-6.1-sol')?.projection??preparation.projection;
  need(context&&prepared?.ok===true&&p?.ok===true&&p.model==='gpt-6.1-sol'&&p.budgetProfile===CREATIVE_DOCUMENT_REVISED_PROFILE);
  need(same(p.limits,{inputTokens:8000,outputTokens:12000,maximumGBP:1,requests:1,retries:0})&&p.requestDigest===hash(stableJson(p.wire))&&prepared.inputDigest===p.inputDigest&&prepared.sourceStamp===p.sourceStamp);
  need(context.profile?.businessName==='Quiet Light Studio'&&context.sourcePhotos?.length===0&&same(context.website?.pages?.filter(x=>x.enabled!==false).map(x=>x.id),['home','services','contact']));
  const {execution:e,review,financial,count,ownerInferenceApproval}=evidence;
  need(keys(e,['ownerId','businessId','operationId','requestNonce','binding','goal','approvedIntent','expectedPageIds','provider','model','budgetProfile','comparison','inputDigest','sourceInputDigest','schemaDigest','wireDigest','approvalReceipt','approval','tariff','tokenEvidence']));
  const timing=timingEvidence(root,evidence,e,now);
  need(review?.provenanceBasis==='first-party-runtime-source-equivalence'&&review.ownerAccepted===true&&sha(review.acceptanceEvidenceSha256)&&fresh(review.checkedAt,now,timing.reviewFreshnessMs)&&review.externalInputOwnerReviewed===true);
  need(e?.provider==='openai-responses'&&e.model==='gpt-6.1-sol'&&e.budgetProfile===CREATIVE_DOCUMENT_REVISED_PROFILE&&e.ownerId===context.ownerId&&e.businessId===context.businessId);
  need([e.ownerId,e.businessId,e.operationId,e.requestNonce].every(uuid)&&e.operationId!==e.requestNonce&&e.goal===context.goal&&same(e.approvedIntent,preparation.proposedIntent)&&same(e.expectedPageIds,['home','services','contact']));
  need(e.inputDigest===p.envelopeDigest&&e.sourceInputDigest===p.inputDigest&&e.schemaDigest===p.schemaDigest&&e.wireDigest===p.requestDigest&&same(e.binding,{surface:'website',pageId:'home',projectId:context.website.id,sourceRevision:context.website.generation,profileRevision:context.profileRevision,snapshotRevision:preparation.source.snapshotRevision}));
  const approval=e.approval;
  need(approval?.authenticated===true&&approval.founder===true&&approval.syntheticOnly===true&&approval.protocol===WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION&&approval.budgetProfile===CREATIVE_DOCUMENT_REVISED_PROFILE);
  need(approval.ownerId===e.ownerId&&approval.businessId===e.businessId&&approval.operationId===e.operationId&&approval.requestNonce===e.requestNonce&&approval.provider===e.provider&&approval.model===e.model&&approval.inputDigest===e.inputDigest&&approval.sourceInputDigest===e.sourceInputDigest&&approval.schemaDigest===e.schemaDigest&&approval.wireDigest===e.wireDigest);
  need(approval.inputTokenLimit===8000&&approval.totalOutputTokenLimit===12000&&approval.spendingCeilingGBP===1&&Number.isSafeInteger(approval.expiresAt)&&approval.expiresAt>now&&approval.expiresAt<=now+timing.maximumDLeaseMs&&typeof approval.receipt==='string'&&approval.receipt.length>=8&&approval.receipt.length<=2000&&approval.receipt===e.approvalReceipt&&same(approval.comparison,e.comparison));
  if(timing.policy)need(Number.isSafeInteger(approval.issuedAt)&&approval.issuedAt>=timing.policy.recordedAt&&approval.issuedAt<=now&&approval.expiresAt-approval.issuedAt>0&&approval.expiresAt-approval.issuedAt<=timing.maximumDLeaseMs&&approval.expiresAt<=timing.policy.supportingEvidenceUntil);
  need(ownerInferenceApproval?.status==='owner-approved'&&ownerInferenceApproval.receipt===e.approvalReceipt&&ownerInferenceApproval.operationId===e.operationId&&ownerInferenceApproval.requestNonce===e.requestNonce&&ownerInferenceApproval.wireDigest===e.wireDigest&&ownerInferenceApproval.maximumGBP===1&&ownerInferenceApproval.maximumRequests===1&&ownerInferenceApproval.expiresAt===approval.expiresAt&&ownerInferenceApproval.automaticRetry===false&&ownerInferenceApproval.maySave===false&&ownerInferenceApproval.mayPublish===false&&sha(ownerInferenceApproval.evidenceSha256));
  if(timing.policy)need(ownerInferenceApproval.issuedAt===approval.issuedAt);
  const cp=await projectCreativeInputCountRequest(p,async x=>hash(x)),te=e.tokenEvidence;
  need(count?.independentlyVerified===true&&sha(count.receiptSha256)&&count.wireDigest===p.requestDigest&&count.countBodyDigest===cp.countBodyDigest&&count.model===e.model&&count.schemaDigest===p.schemaDigest&&fresh(count.checkedAt,now,86400000));
  need(te?.method==='responses-input-tokens'&&te.completeRequest===true&&te.independentlyVerified===true&&typeof te.reference==='string'&&te.reference.length>0&&te.wireDigest===p.requestDigest&&te.model===e.model&&fresh(te.checkedAt,now,86400000)&&te.checkedAt===count.checkedAt&&te.tokens===count.tokens&&Number.isSafeInteger(te.tokens)&&te.tokens>=1&&te.tokens<=8000);
  const t=e.tariff;
  const valuation=t?.evidenceBasis===undefined?null:reviewSolUsageValuation(t,{model:e.model,wireDigest:e.wireDigest,budgetProfile:e.budgetProfile,inputTokenLimit:8000,totalOutputTokenLimit:12000,now});
  const legacyAllIn=t?.evidenceBasis===undefined&&t?.allFeesIncluded===true&&t.rateBasis==='highest-applicable-all-in'&&t.rateEvidence?.independentlyVerified===true&&t.rateEvidence.coversCacheWrite===true&&t.rateEvidence.coversFXTaxAndFees===true&&typeof t.rateEvidence.reference==='string'&&t.rateEvidence.reference.length>0;
  need(t?.provider===e.provider&&t.model===e.model&&t.currency==='GBP'&&t.independentlyVerified===true&&(legacyAllIn||valuation?.ok===true)&&t.modelAvailable===true&&t.availabilityVerified===true&&t.serviceTier==='default'&&t.regionalProcessing===false&&t.caching===false&&t.fixedRequestGBP===0&&typeof t.reference==='string'&&t.reference.length>0&&fresh(t.checkedAt,now,86400000));
  need([t.inputGBPPerMillion,t.outputGBPPerMillion].every(x=>Number.isFinite(x)&&x>=0)&&/^\d+$/.test(String(t.revision))&&Number(t.revision)>0);
  const maximumGBP=(8000*t.inputGBPPerMillion+12000*t.outputGBPPerMillion)/1000000;need(maximumGBP>0&&maximumGBP<=1);
  need(financial?.status==='independently-verified-sol-only'&&sha(financial.receiptSha256)&&fresh(financial.checkedAt,now,300000)&&financial.policyMicroGBP===1000000&&financial.accountMicroGBP===1000000&&financial.astraAllocationMicroGBP===0&&financial.concurrentLimit===1&&financial.operationId===e.operationId&&financial.requestNonce===e.requestNonce&&financial.wireDigest===e.wireDigest&&String(financial.tariffRevision)===String(t.revision));
  const inventory=creativeDocumentDeploymentFiles(root);need(inventory.externalImports.length===0);
  const comparison=await validateCreativeComparisonAdmission({comparison:e.comparison,current:context,prepared,projection:p,solProjection:p,operationId:e.operationId,requestNonce:e.requestNonce,binding:e.binding,expectedRendererDigest:inventory.rendererFilesDigest,now,estimatedGBP:maximumGBP,tariff:t,digestBytes:async x=>hash(x),conditionalApproval:e.approval});need(comparison.ok===true&&comparison.arm==='sol');
  const manifest={...disabledCreativeDocumentExecution,enabled:true,executionEnabled:true,execution:JSON.parse(stableJson(e))};
  const original=readFileSync(resolve(root,CREATIVE_DOCUMENT_DEPLOYMENT_TARGET.entrypoint),'utf8');need(original.split(anchor).length===2);
  const replacement='const approvedExecutionManifest=Object.freeze('+stableJson(manifest)+');\nconst readManifest=async()=>structuredClone(approvedExecutionManifest);';
  const entrypoint=original.replace(anchor,replacement),files={};
  for(const path of Object.keys(inventory.files))files[path]=path===CREATIVE_DOCUMENT_DEPLOYMENT_TARGET.entrypoint?entrypoint:readFileSync(resolve(root,path),'utf8');
  const fileHashes=Object.fromEntries(Object.keys(files).sort().map(path=>[path,hash(files[path])])),runtimeFiles=Object.fromEntries(Object.entries(fileHashes).filter(([path])=>Object.hasOwn(inventory.runtimeFiles,path)));
  need(Object.keys(files).length===Object.keys(inventory.files).length&&entrypoint.includes("Deno.env.get('SUPABASE_URL')!==CREATIVE_DOCUMENT_LAB_URL"));
  return {version:SOL_ACTIVE_ARTIFACT_VERSION,status:'private-active-artifact-review-only',target:CREATIVE_DOCUMENT_DEPLOYMENT_TARGET,manifest,manifestDigest:hash(manifest),files,fileHashes,filesDigest:hash(fileHashes),runtimeFiles,runtimeFilesDigest:hash(runtimeFiles),rendererDigest:inventory.rendererFilesDigest,originalDisabledInventoryDigest:inventory.filesDigest,originalDisabledEntrySha256:inventory.entrySha256,entrypointSha256:hash(entrypoint),evidenceSha256:hash(evidence),maximumGBP,...(valuation?.ok?{costEvidence:valuation}:{}),expiresAt:approval.expiresAt,maximumRequests:1,centralReservationStillRequired:true,independentRuntimeReadbackStillRequired:true,ownerAuthenticationStillRequired:true,deploymentApproved:false,providerCalls:0,hostedWrites:0,websiteWrites:0,mayPublish:false};
 }catch{return blocked();}
}

// Actual-file route: genuine original source export + fresh private evidence.
// Blocked evidence creates no directory or executable artifact. No CLI exists.
export async function prepareSolActiveArtifactFiles(options={}){
 try{
  dataOnly(options);need(plain(options)&&Object.keys(options).every(key=>['root','inputEnvelope','evidenceFile','newPrivateOutput','now','preparationSealFile','preparationEvidenceFile'].includes(key)));
  const {root,inputEnvelope,evidenceFile,newPrivateOutput,preparationSealFile,preparationEvidenceFile,now=Date.now()}=options;
  const paths=privateHostedCreativePreparationPaths(inputEnvelope,newPrivateOutput,root);
  privateHostedCreativePreparationPaths(evidenceFile,newPrivateOutput,root);
  need(Boolean(preparationSealFile)===Boolean(preparationEvidenceFile));
  const raw=readFileSync(paths.input),evidenceRaw=readFileSync(evidenceFile),before=hash(raw),preparation=await prepareHostedCreativeComparison(JSON.parse(raw)),evidence=JSON.parse(evidenceRaw),extra=[];
  if(preparationSealFile)for(const file of [preparationSealFile,preparationEvidenceFile]){privateHostedCreativePreparationPaths(file,newPrivateOutput,root);extra.push({file,raw:readFileSync(file)});}
  const result=preparationSealFile?await finalizeSolPreparedArtifact(paths.root,preparation,JSON.parse(extra[0].raw),JSON.parse(extra[1].raw),evidence,{now}):evidence.version===SOL_PREPARATION_EVIDENCE_VERSION?await prepareSolPreparationArtifact(paths.root,preparation,evidence,{now}):await prepareSolActiveArtifact(paths.root,preparation,evidence,{now});
  if(!['private-active-artifact-review-only','private-disabled-preparation-review-only'].includes(result.status))return result;
  need(before===hash(readFileSync(paths.input))&&hash(evidenceRaw)===hash(readFileSync(evidenceFile))&&extra.every(x=>hash(x.raw)===hash(readFileSync(x.file))));
  mkdirSync(paths.output,{mode:0o700});
  const manifestName=result.status==='private-disabled-preparation-review-only'?'preparation-manifest.private.json':'execution-manifest.private.json';
  for(const [name,value]of [['artifact-files.private.json',result.files],[manifestName,result.manifest],['artifact-review.private.json',{...result,files:undefined,manifest:undefined,inputEnvelopeSha256:before,evidenceFileSha256:hash(evidenceRaw),...(extra.length?{preparationSealFileSha256:hash(extra[0].raw),freshPreparationEvidenceFileSha256:hash(extra[1].raw)}:{})}]])writeFileSync(resolve(paths.output,name),stableJson(value)+'\n',{flag:'wx',mode:0o600});
  return {version:result.version,status:result.status,output:paths.output,filesDigest:result.filesDigest,runtimeFilesDigest:result.runtimeFilesDigest,...(result.entrypointSha256?{entrypointSha256:result.entrypointSha256}:{}),...(result.preparationSealDigest?{preparationSealDigest:result.preparationSealDigest}:{}),...(result.validUntil?{validUntil:result.validUntil}:{}),expiresAt:result.expiresAt,maximumGBP:result.maximumGBP,deploymentApproved:false,providerCalls:0,hostedWrites:0};
 }catch{return blocked();}
}
