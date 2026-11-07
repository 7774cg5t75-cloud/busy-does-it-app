import {prepareCreativeComparison} from '../../../src/core/websiteCreativeComparison.mjs';
import {stableJson} from '../../../src/core/stableJson.mjs';
import {creativeProviderRequest} from './liveCreativeAdapter.mjs';
// Review packet only. It cannot reserve, dispatch, create approvals or save.
export async function prepareCreativeApprovalPacket({context,goal,operationId,requestNonce,evidence={},integrity,verifyEvidence}={}){
 const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
 const p=prepareCreativeComparison(context,goal);
 if(!p.ok||p.input.approved.businessName!=='Quiet Light Studio'||p.input.approved.photographyPresent||!uuid(operationId)||!uuid(requestNonce)||operationId===requestNonce||typeof integrity?.sha256!=='function')return {ok:false,dispatchAllowed:false,reason:'Exact image-free fictional source, distinct proposed operation/nonce and integrity authority required.'};
 const envelope={version:'busy.live-creative-pilot.v1',input:p.input,schema:p.schema,maxInputTokens:4000,maxOutputTokens:1000,maxCostGBP:.10,requests:1,retries:0,tools:[],automaticSave:false,publication:false};
 const provider='openai-responses',model='gpt-6.1-sol',wire=creativeProviderRequest(envelope,model);
 const inputDigest=await integrity.sha256(stableJson(p.input)),envelopeDigest=await integrity.sha256(stableJson(envelope)),wireDigest=await integrity.sha256(stableJson(wire));
 // An evidence label is not server verification. Missing authority is shown, never inferred.
 const blockers=[],verified={};
 for(const [key,reason] of [['accountAvailability','Intended server-account model access unverified'],['credentialIsolation','Server-only credential binding unavailable'],['exactTokenCount','Compatible exact full-request token count unverified'],['gbpTariff','Current all-in GBP tariff/fees unverified'],['authenticatedActivation','Original authenticated live activation remains disconnected'],['centralReservation','Exact original reservation and independent readback unavailable']]){
  const e=evidence[key];verified[key]=typeof verifyEvidence==='function'&&await verifyEvidence(key,e,{operationId,envelopeDigest,scope:p.source.scope})===true;if(!verified[key]||e?.verified!==true||e.authority!=='server-owned'||!e.receipt||e.inputDigest!==envelopeDigest||e.operationId!==operationId)blockers.push(reason);
 }
 const tokens=verified.exactTokenCount?evidence.exactTokenCount?.tokens:null,maximum=verified.gbpTariff?evidence.gbpTariff?.maximumGBP:null;
 if(!Number.isSafeInteger(tokens)||tokens<1||tokens>4000)blockers.push('Input token limit not independently established');
 if(!Number.isFinite(maximum)||maximum<=0||maximum>.10)blockers.push('GBP maximum cannot be admitted');
 return {ok:true,version:'busy.creative-owner-packet.v1',provider,model,source:p.input.approved,sourceScope:p.source.scope,input:p.input,permittedSchema:p.schema,providerSchema:wire.text.format.schema,inputDigest,envelopeDigest,wireDigest,operation:{id:operationId,requestNonce,status:'proposed-only; not a reservation receipt'},limits:{inputTokens:4000,outputTokens:1000,maximumExposureGBP:.10,requests:1,retries:0,tools:[],automaticSave:false,publication:false},blockers:[...new Set(blockers)],availability:'Public catalogue listing is not intended-account access',estimatedGBP:maximum??null,executionApprovalReceived:false,readyToRequestExecutionApproval:blockers.length===0,dispatchAllowed:false,providerCalls:0,authorisation:'One exact synthetic request only after a separate verified owner execution/spending receipt pins this input, model and operation. This packet is not that receipt.',failurePolicy:'Fail closed before dispatch; retain uncertain dispatched liability, inspect original receipts and never replay.',receiptRequirement:'Provider request ID, exact model, actual input/output usage, central settlement and independent readback; original finite proposal validation and Studio approval still required.'};
}
