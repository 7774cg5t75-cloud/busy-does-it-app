import {prepareWebsiteDesignIntelligence,isCurrentWebsiteDesignIntelligence,parseWebsiteDesignIntelligenceResponse} from '../../../src/core/websiteDesignIntelligence.mjs';
import {stableJson} from '../../../src/core/stableJson.mjs';
import {creativeProviderSchema} from './liveCreativeAdapter.mjs';
import {creativeDocumentPilotProfile} from './creativeDocumentPilotProfiles.mjs';

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

// V2 is a NEW offline proposal boundary. It does not amend the disabled live
// Home-v3 adapter, its 1,000-output-token policy or an owner's former approval.
export const WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION='busy.website-design-intelligence-provider.v2';
export const WEBSITE_CREATIVE_DOCUMENT_PROPOSED_LIMITS=Object.freeze({inputTokens:4000,outputTokens:4000,maximumGBP:.10,requests:1,retries:0});

// Local references preserve a finite recursive grammar without unrolling it
// into an enormous schema. Actual document depth, node count, source bindings,
// copy authority and accessible geometry remain independently runtime-checked.
// Official Structured Outputs supports definitions/recursion and numeric bounds;
// this deliberately smaller reviewed subset rejects remote references and code.
export function creativeDocumentProviderSchema(schema){
 const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
 const name=value=>typeof value==='string'&&/^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(value)&&!['constructor','prototype'].includes(value);
 const scalar=value=>value===null||['string','boolean'].includes(typeof value)||typeof value==='number'&&Number.isFinite(value);
 const scalarType=value=>value===null?'null':Number.isInteger(value)?'integer':typeof value;
 if(!object(schema)||bytes(JSON.stringify(schema))>65536)throw Error('Unsupported document schema size');
 const definitions=schema.$defs||{},refs=[],seen=new WeakSet();let nodes=0;
 if(!object(definitions)||Object.keys(definitions).length>32||Object.keys(definitions).some(key=>!name(key)))throw Error('Unsupported local definitions');
 const walk=(source,depth=0)=>{
  if(!object(source)||depth>20||++nodes>800||seen.has(source))throw Error('Unsupported document schema structure');seen.add(source);
  const allowed=['type','properties','required','additionalProperties','items','enum','const','anyOf','minItems','maxItems','minLength','maxLength','uniqueItems','minimum','maximum','exclusiveMinimum','exclusiveMaximum','multipleOf','pattern','$defs','$ref'];
  if(Object.keys(source).some(key=>!allowed.includes(key)))throw Error('Unsupported document schema keyword');
  if(source.$ref!=null){if(Object.keys(source).length!==1||typeof source.$ref!=='string'||!/^#\/\$defs\/[A-Za-z][A-Za-z0-9_]{0,79}$/.test(source.$ref)||!Object.hasOwn(definitions,source.$ref.slice(8)))throw Error('Only exact local definition references are supported');refs.push(source.$ref);seen.delete(source);return {$ref:source.$ref};}
  if(Object.hasOwn(source,'uniqueItems')&&typeof source.uniqueItems!=='boolean')throw Error('Unsupported document uniqueness constraint');
  const result=Object.fromEntries(Object.entries(source).filter(([key])=>!['const','$defs','uniqueItems'].includes(key)));
  if(Object.hasOwn(source,'const')){if(!scalar(source.const))throw Error('Unsupported document constant');result.enum=[source.const];}
  if(result.enum){if(!Array.isArray(result.enum)||!result.enum.length||result.enum.length>500||result.enum.some(value=>!scalar(value)))throw Error('Unsupported document enum');if(!result.type){const types=[...new Set(result.enum.map(scalarType))];result.type=types.every(type=>['integer','number'].includes(type))?(types.includes('number')?'number':'integer'):types.length===1?types[0]:types;}}
  const types=Array.isArray(result.type)?result.type:[result.type];
  if(result.type!=null&&(types.length>3||new Set(types).size!==types.length||types.some(type=>!['object','array','string','number','integer','boolean','null'].includes(type))))throw Error('Unsupported document type');
  if(result.enum?.some(value=>{const type=scalarType(value);return !types.includes(type)&&!(type==='integer'&&types.includes('number'));}))throw Error('Document enum contradicts its type');
  if(Object.hasOwn(result,'additionalProperties')&&result.additionalProperties!==false)throw Error('Open document properties are not supported');
  if(result.properties){if(!object(result.properties)||result.type!=='object'||result.additionalProperties!==false||!Array.isArray(result.required)||new Set(result.required).size!==result.required.length||Object.keys(result.properties).some(key=>!name(key)||!result.required.includes(key))||result.required.some(key=>!Object.hasOwn(result.properties,key)))throw Error('Document objects must be closed and fully required');result.properties=Object.fromEntries(Object.entries(result.properties).map(([key,value])=>[key,walk(value,depth+1)]));}
  else if(result.type==='object')throw Error('Document objects need explicit properties');
  if(result.type==='array'&&!result.items)throw Error('Document arrays require bounded item schemas');
  if(result.items)result.items=walk(result.items,depth+1);
  if(result.anyOf){if(!Array.isArray(result.anyOf)||!result.anyOf.length||result.anyOf.length>16)throw Error('Unsupported document union');result.anyOf=result.anyOf.map(value=>walk(value,depth+1));}
  for(const key of ['minItems','maxItems','minLength','maxLength'])if(Object.hasOwn(result,key)&&(!Number.isSafeInteger(result[key])||result[key]<0||result[key]>32000))throw Error('Unsupported document bound');
  if(result.minItems>result.maxItems||result.minLength>result.maxLength||result.minimum>result.maximum)throw Error('Incompatible document bounds');
  for(const key of ['minimum','maximum','exclusiveMinimum','exclusiveMaximum','multipleOf'])if(Object.hasOwn(result,key)&&(!Number.isFinite(result[key])||!types.some(type=>['number','integer'].includes(type))||key==='multipleOf'&&result[key]<=0))throw Error('Unsupported numeric document bound');
  if(result.pattern!=null&&(typeof result.pattern!=='string'||result.pattern.length>240))throw Error('Unsupported string document constraint');
  if(Object.hasOwn(source,'$defs')){if(depth!==0)throw Error('Definitions must be hoisted to the response root');result.$defs=Object.fromEntries(Object.entries(definitions).map(([key,value])=>[key,walk(value,depth+1)]));}
  if(!result.type&&!result.anyOf)throw Error('Document schema needs a supported type');seen.delete(source);return result;
 };
 const result=walk(schema);if(result.type!=='object'||result.anyOf||!result.properties)throw Error('A closed document response root is required');
 // References are preserved, never fetched or recursively expanded here.
 if(refs.some(ref=>!Object.hasOwn(result.$defs||{},ref.slice(8))))throw Error('A local document reference is unresolved');return result;
}

export async function projectWebsiteCreativeDocumentProviderRequest(prepared,current,options={}){
 try{
  if(!options||typeof options!=='object'||Array.isArray(options)||Object.keys(options).some(key=>!['model','digestBytes','budgetProfile'].includes(key)))return deny('A model cannot choose provider limits, cost admission or tools.');
  const {model,digestBytes,budgetProfile}=options,profile=creativeDocumentPilotProfile(model,budgetProfile);
  if(!profile)return deny('A separately reviewed server-owned pilot profile is required.');
  const {prepareWebsiteCreativeDocument,isCurrentWebsiteCreativeDocument}=await import('../../../src/core/websiteCreativeDocumentReview.mjs');
  if(typeof digestBytes!=='function'||!/^[-a-zA-Z0-9_.]{1,100}$/.test(model||'')||!isCurrentWebsiteCreativeDocument(prepared,current))return deny('A current sealed v2 source, owner intent and integrity authority are required.');
  const fresh=await prepareWebsiteCreativeDocument(current,{goal:prepared.input?.goal,approvedIntent:prepared.approvedIntent,digestBytes});
  if(!fresh.ok||!same(fresh.input,prepared.input)||!same(fresh.schema,prepared.schema)||fresh.sourceStamp!==prepared.sourceStamp||fresh.inputDigest!==prepared.inputDigest||!digest(prepared.inputDigest))return deny('The approved creative document context changed.');
  const schema=creativeDocumentProviderSchema(fresh.schema),limits={inputTokens:profile.inputTokens,outputTokens:profile.outputTokens,maximumGBP:profile.maximumGBP,requests:1,retries:0};
  const envelope={version:WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION,input:fresh.input,schema,maxInputTokens:limits.inputTokens,maxOutputTokens:limits.outputTokens,maximumGBP:limits.maximumGBP,requests:1,retries:0,tools:[],automaticSave:false,publication:false,livePolicyChanged:false,...(profile.budgetProfile?{budgetProfile:profile.budgetProfile,reasoning:profile.reasoning}: {})};
  const wire={model,store:false,max_output_tokens:limits.outputTokens,service_tier:'default',reasoning:{effort:profile.reasoning},tools:[],tool_choice:'none',input:stableJson(envelope.input),text:{format:{type:'json_schema',name:'busy_website_creative_document',strict:true,schema}}};
  const hash=value=>digestBytes(new TextEncoder().encode(stableJson(value))),schemaDigest=await hash(schema),envelopeDigest=await hash(envelope),requestDigest=await hash(wire);
  if(![schemaDigest,envelopeDigest,requestDigest].every(digest)||!isCurrentWebsiteCreativeDocument(prepared,current)||!isCurrentWebsiteCreativeDocument(fresh,current))return deny('The expressive request could not be independently hashed against its unchanged source.');
  return {ok:true,version:WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION,provider:'openai-responses',model,...(profile.budgetProfile?{budgetProfile:profile.budgetProfile}: {}),inputDigest:fresh.inputDigest,schemaDigest,envelopeDigest,requestDigest,sourceStamp:fresh.sourceStamp,wire,requestBytes:bytes(stableJson(wire)),limits:{...limits},dispatchAllowed:false,providerCalls:0,maySave:false,mayPublish:false,originalBudgetAdmissionRequired:true,originalStudioReviewRequired:true,tokenCount:null,estimatedGBP:null,livePolicyChanged:false,separateRevisedOwnerApprovalRequired:true};
 }catch{return deny('The reviewed expressive provider projection could not be prepared.');}
}

export async function parseWebsiteCreativeDocumentProviderResponse(raw,projection,prepared,current,{digestBytes}={}){
 const unsettled={receiptStatus:'unverified; original service-only settlement/readback required',origin:'unverified-provider-response',mayReview:false};
 try{
  if(typeof raw!=='string'||bytes(raw)>98304||!projection?.ok||projection.version!==WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION)return deny('A bounded v2 response for the exact reviewed request is required.',unsettled);
  const fresh=await projectWebsiteCreativeDocumentProviderRequest(prepared,current,{model:projection.model,digestBytes,...(projection.budgetProfile?{budgetProfile:projection.budgetProfile}: {})});
  if(!fresh.ok||!same(fresh,projection))return deny('The expressive source, owner intent, schema or wire changed.',unsettled);
  const response=JSON.parse(raw),usage=response?.usage;
  if(!/^resp_[A-Za-z0-9_-]{1,145}$/.test(response?.id||'')||response.model!==projection.model||!Number.isSafeInteger(usage?.input_tokens)||!Number.isSafeInteger(usage?.output_tokens)||usage.input_tokens<1||usage.output_tokens<0||usage.input_tokens>1000000||usage.output_tokens>1000000)return deny('Expressive provider identity or usage is invalid.',unsettled);
  const accounting={providerReceipt:response.id,model:response.model,inputTokens:usage.input_tokens,outputTokens:usage.output_tokens,inputDigest:projection.inputDigest,envelopeDigest:projection.envelopeDigest,requestDigest:projection.requestDigest};
  if(usage.input_tokens>projection.limits.inputTokens||usage.output_tokens>projection.limits.outputTokens)return deny('Usage exceeded the new proposed limits; retain actual liability.',{...unsettled,accounting});
  const output=response.output,messages=Array.isArray(output)?output.filter(item=>item?.type==='message'):[];
  if(response.status!=='completed'||!Array.isArray(output)||output.length>2||output.some(item=>!['message','reasoning'].includes(item?.type))||messages.length!==1||messages[0].role!=='assistant'||!Array.isArray(messages[0].content)||messages[0].content.length!==1||messages[0].content[0]?.type!=='output_text')return deny('A complete, tool-free expressive document was not returned.',{...unsettled,accounting});
  const {parseWebsiteCreativeDocumentResponse}=await import('../../../src/core/websiteCreativeDocumentReview.mjs');
  const parsed=await parseWebsiteCreativeDocumentResponse(messages[0].content[0].text,prepared,current);
  if(!parsed.ok)return deny(parsed.reason||'The original expressive document validator rejected this response.',{...unsettled,accounting});
  return {ok:true,...unsettled,proposal:parsed.proposal,accounting,dispatchAllowed:false,providerCalls:0,maySave:false,mayPublish:false,originalBudgetAdmissionRequired:true,originalStudioReviewRequired:true,separateRevisedOwnerApprovalRequired:true};
 }catch{return deny('The expressive response is malformed or its provenance is uncertain.',unsettled);}
}
