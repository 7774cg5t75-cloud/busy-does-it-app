import {stableJson} from '../../../src/core/stableJson.mjs';
import {isCurrentWebsiteCreativeDocument,reviewSettledWebsiteCreativeDocumentProposal} from '../../../src/core/websiteCreativeDocumentReview.mjs';
import {createGovernedCreativeExecution} from './creativeExecutionEngine.mjs';
import {projectWebsiteCreativeDocumentProviderRequest,parseWebsiteCreativeDocumentProviderResponse,WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION} from './websiteIntelligenceProviderProjection.mjs';

export const CREATIVE_DOCUMENT_LAB_URL='https://sbvkrvksnruiclcvclbd.supabase.co';
export const CREATIVE_DOCUMENT_LAB_KEY='BUSY_AI_LAB_OPENAI_CREATIVE_V2_KEY';
export const CREATIVE_DOCUMENT_PILOT_PAGES=Object.freeze(['home','services','contact']);
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
const pages=website=>(website.pages||[]).filter(page=>page.enabled!==false).map(page=>page.id).sort();
const pilotSource=prepared=>prepared?.input?.approved?.businessName==='Quiet Light Studio'&&Array.isArray(prepared.input.approved.photos)&&prepared.input.approved.photos.length===0&&stableJson(prepared.input.approved.pages.map(page=>page.id).sort())===stableJson([...CREATIVE_DOCUMENT_PILOT_PAGES].sort());
const ledgerScope=current=>({ownerId:current.ownerId,businessId:current.businessId,projectId:current.website.id,sourceRevision:current.website.generation,profileRevision:current.profileRevision,surface:'website',pageId:'home'});
const denied=()=>({ok:false});

// Fixed protocol, not a permissive replacement for the old Home/v3 1,000-token
// pilot. It uses the same original execution engine and six-table AI ledger.
const creativeDocumentProtocol=Object.freeze({
 maximumResponseBytes:98304,maximumOutputTokens:4000,
 accountingResponse:response=>response.service_tier==='default',
 async admit(prepared,current,policy,deps){
  if(policy.protocol!==WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION||policy.projectUrl!==CREATIVE_DOCUMENT_LAB_URL||!isCurrentWebsiteCreativeDocument(prepared,current)||!pilotSource(prepared)||!Number.isSafeInteger(deps.now))return denied();
  const projection=await projectWebsiteCreativeDocumentProviderRequest(prepared,current,{model:policy.model,digestBytes:deps.integrity.sha256});
  if(!projection.ok)return denied();
  const approval=await deps.verifyApproval(projection.envelopeDigest),now=deps.now;
  if(approval?.protocol!==WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION||approval.authenticated!==true||approval.founder!==true||approval.syntheticOnly!==true||!uuid(approval.operationId)||approval.ownerId!==current.ownerId||approval.businessId!==current.businessId||approval.provider!==policy.provider||approval.model!==policy.model||approval.inputDigest!==projection.envelopeDigest||approval.sourceInputDigest!==projection.inputDigest||approval.schemaDigest!==projection.schemaDigest||approval.wireDigest!==projection.requestDigest||approval.inputTokenLimit!==4000||approval.totalOutputTokenLimit!==4000||approval.spendingCeilingGBP!==.10||!Number.isSafeInteger(approval.expiresAt)||approval.expiresAt<=now||typeof approval.receipt!=='string'||!approval.receipt)return denied();
  const tariff=await deps.readTariff(policy.provider,policy.model);
  if(tariff?.provider!==policy.provider||tariff.model!==policy.model||tariff.currency!=='GBP'||tariff.independentlyVerified!==true||tariff.allFeesIncluded!==true||tariff.modelAvailable!==true||tariff.availabilityVerified!==true||tariff.serviceTier!=='default'||tariff.regionalProcessing!==false||tariff.caching!==false||tariff.fixedRequestGBP!==0||tariff.rateBasis!=='highest-applicable-all-in'||tariff.rateEvidence?.independentlyVerified!==true||tariff.rateEvidence.coversCacheWrite!==true||tariff.rateEvidence.coversFXTaxAndFees!==true||!tariff.rateEvidence.reference||!tariff.revision||!tariff.reference||!Number.isSafeInteger(tariff.checkedAt)||tariff.checkedAt>now||now-tariff.checkedAt>86400000||![tariff.inputGBPPerMillion,tariff.outputGBPPerMillion].every(value=>Number.isFinite(value)&&value>=0))return denied();
  const tokens=await deps.countRequestTokens(projection.wire,policy.model);
  if(!Number.isSafeInteger(tokens)||tokens<1||tokens>4000)return denied();
  // Cover the full admitted input and TOTAL output, including hidden reasoning.
  const estimatedGBP=(4000*tariff.inputGBPPerMillion+4000*tariff.outputGBPPerMillion)/1e6;
  if(!Number.isFinite(estimatedGBP)||estimatedGBP<=0||estimatedGBP>.10)return denied();
  const scope=ledgerScope(current),request={protocol:WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION,digest:projection.envelopeDigest,requestDigest:projection.requestDigest,operationId:approval.operationId,scope,provider:policy.provider,model:policy.model,inputTokens:tokens,maxOutputTokens:4000,estimatedGBP,tariffRevision:tariff.revision,tariffInputGBPPerMillion:tariff.inputGBPPerMillion,tariffOutputGBPPerMillion:tariff.outputGBPPerMillion,approvalReceipt:approval.receipt};
  const admitted=await deps.reserve(request),reservation=await deps.readReservation(admitted);
  if(reservation?.operationId!==approval.operationId||stableJson(reservation.scope)!==stableJson(scope)||reservation.inputDigest!==projection.envelopeDigest||reservation.requestDigest!==projection.requestDigest||reservation.authoritativeReadback!==true||reservation.realUsageSettlementSupported!==true||reservation.status!=='reserved-undispatched'||reservation.fresh!==true||reservation.provider!==policy.provider||reservation.model!==policy.model||String(reservation.tariffRevision)!==String(tariff.revision)||!Number.isSafeInteger(reservation.expiresAt)||reservation.expiresAt<=now||!Number.isFinite(reservation.admittedGBP)||reservation.admittedGBP<estimatedGBP||reservation.admittedGBP>.10)return denied();
  if(!isCurrentWebsiteCreativeDocument(prepared,current))return denied();
  return {ok:true,digest:projection.envelopeDigest,wireDigest:projection.requestDigest,wire:projection.wire,approval,operationId:approval.operationId,scope,projection};
 },
 current(prepared,current){return isCurrentWebsiteCreativeDocument(prepared,current)&&pilotSource(prepared)&&stableJson(pages(current.website))===stableJson([...CREATIVE_DOCUMENT_PILOT_PAGES].sort());},
 async review({prepared,current,response,readback,pilot,deps}){
  const parsed=await parseWebsiteCreativeDocumentProviderResponse(stableJson(response),pilot.projection,prepared,current,{digestBytes:deps.integrity.sha256});
  if(!parsed.ok)return {ok:false,status:'invalid-proposal'};
  const proposedPages=parsed.proposal.document.pages;
  if(!Array.isArray(proposedPages)||stableJson(proposedPages.map(page=>page.pageId).sort())!==stableJson([...CREATIVE_DOCUMENT_PILOT_PAGES].sort())||proposedPages.some(page=>page.purpose!==page.pageId))return {ok:false,status:'unsupported-page-scope'};
  const expected={operationId:pilot.operationId,scope:pilot.scope,sourceStamp:prepared.sourceStamp,inputDigest:pilot.digest,requestDigest:pilot.wireDigest,model:pilot.approval.model,providerReceipt:readback.providerReceipt,inputTokens:readback.inputTokens,outputTokens:readback.outputTokens};
  const reviewed=await reviewSettledWebsiteCreativeDocumentProposal(prepared,JSON.stringify(parsed.proposal),current,deps.planner,{expected,readReceipt:()=>deps.readReceipt({operationId:pilot.operationId})});
  if(!reviewed.ok)return {ok:false,status:'settled-review-denied'};
  // The historical receipt deliberately does not establish current source
  // freshness. Re-read the ORIGINAL context after that asynchronous inspection;
  // Studio CAS/readback remain necessary even after this point-in-time check.
  if(!isCurrentWebsiteCreativeDocument(prepared,await deps.readCurrent()))return {ok:false,status:'source-changed-after-provider'};
  return {ok:true,review:reviewed.review,proposal:reviewed.proposal};
 }
});
export function createLiveCreativeDocumentAdapter(serverDeps={}){return createGovernedCreativeExecution(serverDeps,creativeDocumentProtocol);}

// This distinct Lab binding is intentionally unconfigured. Never fall back to
// the existing staging secret or allow a body/client property to name a secret.
// Constructing the factory does not read an environment variable or enable it.
export function createDenoLiveCreativeDocumentAdapter(serverDeps={}){
 return createLiveCreativeDocumentAdapter({...serverDeps,readCredential:provider=>{
  if(provider!=='openai-responses')return null;
  try{return typeof Deno==='undefined'?null:Deno.env.get('BUSY_AI_LAB_OPENAI_CREATIVE_V2_KEY');}catch{return null;}
 }});
}
