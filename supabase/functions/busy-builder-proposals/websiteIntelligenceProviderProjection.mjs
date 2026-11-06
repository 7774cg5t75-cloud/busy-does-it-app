import {prepareWebsiteDesignIntelligence,isCurrentWebsiteDesignIntelligence,parseWebsiteDesignIntelligenceResponse} from '../../../src/core/websiteDesignIntelligence.mjs';
import {stableJson} from '../../../src/core/stableJson.mjs';
import {creativeProviderSchema} from './liveCreativeAdapter.mjs';

// A versioned wire/response projection, not another provider adapter or ledger.
// This module has no credential, network, activation or budget mutation port.
// Home-v3 and the original disabled execution bootstrap are deliberately unchanged.
export const WEBSITE_INTELLIGENCE_PROVIDER_VERSION='busy.website-design-intelligence-provider.v1';
const digest=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const bytes=value=>new TextEncoder().encode(value).byteLength;
const deny=(reason,extra={})=>({ok:false,reason,dispatchAllowed:false,providerCalls:0,maySave:false,mayPublish:false,...extra});
const same=(a,b)=>stableJson(a)===stableJson(b);

export async function projectWebsiteIntelligenceProviderRequest(prepared,current,{model,digestBytes}={}){
 if(typeof digestBytes!=='function'||!/^[-a-zA-Z0-9_.]{1,100}$/.test(model||'')||!isCurrentWebsiteDesignIntelligence(prepared,current))return deny('Current sealed source, proposed model and integrity authority are required.');
 try{
  const fresh=await prepareWebsiteDesignIntelligence(current,{goal:prepared.input?.goal,digestBytes});
  if(!fresh.ok||!same(fresh.input,prepared.input)||!same(fresh.schema,prepared.schema)||fresh.sourceStamp!==prepared.sourceStamp||fresh.inputDigest!==prepared.inputDigest||!digest(prepared.inputDigest))return deny('The creative input or its original source changed.');
  const schema=creativeProviderSchema(fresh.schema);
  const envelope={version:WEBSITE_INTELLIGENCE_PROVIDER_VERSION,input:fresh.input,schema,maxInputTokens:4000,maxOutputTokens:1000,maximumGBP:.10,requests:1,retries:0,tools:[],automaticSave:false,publication:false};
  const wire={model,store:false,max_output_tokens:1000,service_tier:'default',reasoning:{effort:'low'},tools:[],tool_choice:'none',input:stableJson(envelope.input),text:{format:{type:'json_schema',name:'busy_website_design_intelligence',strict:true,schema}}};
  const hash=value=>digestBytes(new TextEncoder().encode(stableJson(value)));
  const inputDigest=fresh.inputDigest,schemaDigest=await hash(schema),envelopeDigest=await hash(envelope),requestDigest=await hash(wire);
  if(![schemaDigest,envelopeDigest,requestDigest].every(digest))return deny('Integrity authority returned an invalid digest.');
  return {ok:true,version:WEBSITE_INTELLIGENCE_PROVIDER_VERSION,provider:'openai-responses',model,inputDigest,schemaDigest,envelopeDigest,requestDigest,sourceStamp:fresh.sourceStamp,wire,requestBytes:bytes(stableJson(wire)),limits:{inputTokens:4000,outputTokens:1000,maximumGBP:.10,requests:1,retries:0},dispatchAllowed:false,providerCalls:0,maySave:false,mayPublish:false,originalBudgetAdmissionRequired:true,originalStudioReviewRequired:true,tokenCount:null,estimatedGBP:null};
 }catch{return deny('The reviewed provider projection could not be prepared.');}
}

// Parse an already obtained response only. A response ID is not a paid-request
// receipt: original service-only usage settlement/readback must verify it later.
// Invalid/overrun output retains parsed usage for that existing reconciliation.
export async function parseWebsiteIntelligenceProviderResponse(raw,projection,prepared,current,{digestBytes}={}){
 const unsettled={receiptStatus:'unverified; original service-only settlement/readback required',origin:'unverified-provider-response',mayReview:false};
 try{
  if(typeof raw!=='string'||bytes(raw)>32768||!projection?.ok||projection.version!==WEBSITE_INTELLIGENCE_PROVIDER_VERSION)return deny('A bounded response for the exact reviewed request is required.',unsettled);
  const fresh=await projectWebsiteIntelligenceProviderRequest(prepared,current,{model:projection.model,digestBytes});
  if(!fresh.ok||!same(fresh,projection))return deny('The source, schema or request projection changed.',unsettled);
  const response=JSON.parse(raw),usage=response?.usage;
  if(!/^resp_[A-Za-z0-9_-]{1,145}$/.test(response?.id||'')||response.model!==projection.model||!Number.isSafeInteger(usage?.input_tokens)||!Number.isSafeInteger(usage?.output_tokens)||usage.input_tokens<1||usage.output_tokens<0||usage.input_tokens>1000000||usage.output_tokens>1000000)return deny('Provider identity or usage is invalid.',unsettled);
  const accounting={providerReceipt:response.id,model:response.model,inputTokens:usage.input_tokens,outputTokens:usage.output_tokens,inputDigest:projection.inputDigest,envelopeDigest:projection.envelopeDigest,requestDigest:projection.requestDigest};
  if(usage.input_tokens>4000||usage.output_tokens>1000)return deny('Usage exceeded the proposed pilot limits; retain actual liability.',{...unsettled,accounting});
  const output=response.output,messages=Array.isArray(output)?output.filter(item=>item?.type==='message'):[];
  if(response.status!=='completed'||!Array.isArray(output)||output.length>2||output.some(item=>!['message','reasoning'].includes(item?.type))||messages.length!==1||messages[0].role!=='assistant'||!Array.isArray(messages[0].content)||messages[0].content.length!==1||messages[0].content[0]?.type!=='output_text')return deny('A complete, tool-free structured proposal was not returned.',{...unsettled,accounting});
  const parsed=await parseWebsiteDesignIntelligenceResponse(messages[0].content[0].text,prepared,current);
  if(!parsed.ok)return deny(parsed.reason||'The original source-bound proposal validator rejected this response.',{...unsettled,accounting});
  return {ok:true,...unsettled,proposal:parsed.proposal,accounting,dispatchAllowed:false,providerCalls:0,maySave:false,mayPublish:false,originalBudgetAdmissionRequired:true,originalStudioReviewRequired:true};
 }catch{return deny('The response is malformed or its provenance is uncertain.',unsettled);}
}
