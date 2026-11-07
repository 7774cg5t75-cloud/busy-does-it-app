import {stableJson} from '../../../src/core/stableJson.mjs';
import {prepareWebsiteCreativeDocument} from '../../../src/core/websiteCreativeDocumentReview.mjs';
import {WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION,projectWebsiteCreativeDocumentProviderRequest} from './websiteIntelligenceProviderProjection.mjs';
import {createOriginalCreativeDocumentLedger} from './creativeLedger.mjs';
import {createDenoLiveCreativeDocumentAdapter,CREATIVE_DOCUMENT_LAB_URL,CREATIVE_DOCUMENT_PILOT_PAGES} from './creativeDocumentExecution.mjs';
import {creativeExecutionUuid as uuid,creativeExecutionDigest as digest,creativeExecutionReply as reply,readCreativeExecutionOperation,authenticateCreativeExecution,readOriginalCreativeExecutionContext} from './creativeExecutionBootstrapCommon.mjs';

export const disabledCreativeDocumentExecution=Object.freeze({version:2,protocol:WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION,projectUrl:CREATIVE_DOCUMENT_LAB_URL,organisationId:'wrjfgasxtlznzfzmfrif',region:'eu-west-1',enabled:false,executionEnabled:false,execution:null});

// No request supplies goal, source, approved intent, token count, tariff, key,
// approval, nonce or activation. The only accepted body is {version:2,operationId}.
export function createLabCreativeDocumentExecutionHandler(deps){
 return async request=>{
  let owner;
  try{
   const manifest=structuredClone(await deps.readManifest());
   if(manifest?.version!==2||manifest.protocol!==WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION||manifest.projectUrl!==CREATIVE_DOCUMENT_LAB_URL||deps.projectUrl!==CREATIVE_DOCUMENT_LAB_URL||manifest.organisationId!==disabledCreativeDocumentExecution.organisationId||manifest.region!=='eu-west-1'||manifest.enabled!==true||manifest.executionEnabled!==true)return reply(503,'disabled');
   if(request.method!=='POST')return reply(405,'method');
   try{owner=await authenticateCreativeExecution(request,deps.authenticate);}catch{return reply(401,'sign_in');}
   const execution=manifest.execution;
   if(!execution||owner.id!==execution.ownerId||![execution.ownerId,execution.businessId,execution.operationId,execution.requestNonce].every(uuid)||execution.operationId===execution.requestNonce||!['inputDigest','sourceInputDigest','schemaDigest','wireDigest'].every(key=>digest(execution[key]))||execution.provider!=='openai-responses'||typeof execution.model!=='string'||!execution.approvalReceipt||execution.approval?.receipt!==execution.approvalReceipt||execution.approval?.wireDigest!==execution.wireDigest||execution.approval?.protocol!==WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION||stableJson(execution.expectedPageIds)!==stableJson(CREATIVE_DOCUMENT_PILOT_PAGES))return reply(403,'execution_not_approved');
   if(await readCreativeExecutionOperation(request,2)!==execution.operationId)return reply(403,'wrong_operation');
   if(request.signal.aborted)return reply(409,'cancelled');
   const manifestDigest=await deps.integrity.sha256(stableJson(manifest));
   const unchanged=async()=>!request.signal.aborted&&await deps.integrity.sha256(stableJson(await deps.readManifest()))===manifestDigest;
   const binding=execution.binding;
   if(!binding||Object.keys(binding).sort().join(',')!=='pageId,profileRevision,projectId,snapshotRevision,sourceRevision,surface'||binding.surface!=='website'||binding.pageId!=='home'||!['sourceRevision','profileRevision','snapshotRevision'].every(key=>Number.isSafeInteger(binding[key])&&binding[key]>0)||typeof execution.goal!=='string')return reply(403,'invalid_binding');
   const readCurrent=()=>readOriginalCreativeExecutionContext({rpc:deps.rpc,ownerId:owner.id,businessId:execution.businessId,binding});
   const current=await readCurrent();
   const prepared=await prepareWebsiteCreativeDocument(current,{goal:execution.goal,approvedIntent:execution.approvedIntent,digestBytes:deps.integrity.sha256});
   if(!prepared.ok)return reply(409,'source_changed');
   const projection=await projectWebsiteCreativeDocumentProviderRequest(prepared,current,{model:execution.model,digestBytes:deps.integrity.sha256,...(execution.budgetProfile?{budgetProfile:execution.budgetProfile}: {})});
   if(!projection.ok||projection.inputDigest!==execution.sourceInputDigest||projection.envelopeDigest!==execution.inputDigest||projection.schemaDigest!==execution.schemaDigest||projection.requestDigest!==execution.wireDigest)return reply(409,'source_changed');
   const ledger=createOriginalCreativeDocumentLedger({rpc:deps.rpc,actor:owner.id,business:execution.businessId,binding,operationId:execution.operationId,requestNonce:execution.requestNonce,integrity:deps.integrity,clock:deps.clock,...(execution.budgetProfile?{budgetProfile:execution.budgetProfile,model:execution.model}: {})});
   const adapter=(deps.adapterFactory||createDenoLiveCreativeDocumentAdapter)({
    ...ledger,integrity:deps.integrity,clock:deps.clock,planner:deps.planner,readCurrent,rendererDigest:deps.rendererDigest,
    readComparisonReceipt:async({operationId,requestNonce})=>{
     if(!await unchanged()||operationId!==execution.comparison?.sol?.operationId||requestNonce!==execution.comparison?.sol?.requestNonce)throw Error('comparison');
     return deps.rpc('busy_ai_operation_read_v1',{p_actor:owner.id,p_business:execution.businessId,p_operation:operationId,p_request_nonce:requestNonce});
    },
    readServerPolicy:async()=>await unchanged()?{protocol:WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION,projectUrl:CREATIVE_DOCUMENT_LAB_URL,liveCreativeEnabled:true,pilotExecutionEnabled:true,provider:execution.provider,model:execution.model,manifestDigest,...(execution.budgetProfile?{budgetProfile:execution.budgetProfile,requestNonce:execution.requestNonce,binding,comparison:execution.comparison}: {})}:null,
    verifyApproval:async inputDigest=>await unchanged()&&inputDigest===execution.inputDigest&&execution.approval.inputDigest===inputDigest&&execution.approval.sourceInputDigest===execution.sourceInputDigest&&execution.approval.schemaDigest===execution.schemaDigest&&execution.approval.operationId===execution.operationId?structuredClone(execution.approval):null,
    readTariff:async(provider,model)=>await unchanged()&&provider===execution.provider&&model===execution.model?structuredClone(execution.tariff):null,
    countRequestTokens:async(wire,model)=>{
     const count=execution.tokenEvidence,now=deps.clock?.()??Date.now();
     if(!await unchanged()||model!==execution.model||count?.model!==model||count?.completeRequest!==true||count.independentlyVerified!==true||!count.reference||!['responses-input-tokens','verified-conservative-provider-limit'].includes(count.method)||count.wireDigest!==execution.wireDigest||!Number.isSafeInteger(count.checkedAt)||count.checkedAt>now||now-count.checkedAt>86400000||await deps.integrity.sha256(stableJson(wire))!==execution.wireDigest)throw Error('count');
     return count.tokens;
    },transport:deps.transport
   });
   const result=await adapter(prepared);
   if(!result.ok)return reply(result.status==='unknown-outcome'?409:422,result.status,{providerCalls:result.providerCalls,inspectOriginalReceipt:['unknown-outcome','pre-dispatch-denied','admission-denied'].includes(result.status)});
   return reply(200,'review_required',{protocol:WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION,origin:'real-model',proposal:result.proposal,review:result.review,receipt:result.receipt,sourceInputDigest:projection.inputDigest,requestDigest:result.requestDigest,originalStudioApprovalRequired:true});
  }catch{return reply(owner?409:503,'preparation_unavailable');}
 };
}
