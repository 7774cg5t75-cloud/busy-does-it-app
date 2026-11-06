import {prepareLiveCreativePilot} from '../../../src/core/websiteCreativePilot.mjs';
import {prepareCreativeComparison} from '../../../src/core/websiteCreativeComparison.mjs';
import {parseBuilderProposalResponse,prepareGovernedBuilderReview,createBuilderProposalContext} from '../../../src/core/governedBuilderProposal.mjs';
import {stableJson} from '../../../src/core/stableJson.mjs';
import {createGovernedCreativeExecution} from './creativeExecutionEngine.mjs';
// Provider wire subset only; original validator still enforces uniqueness and all bounds.
export function creativeProviderSchema(schema){
 let nodes=0;
 const walk=(s,depth=0)=>{if(!s||typeof s!=='object'||Array.isArray(s)||depth>10||++nodes>500)throw Error('Unsupported schema');
  const allowed=['type','properties','required','additionalProperties','items','enum','const','anyOf','minItems','maxItems','minLength','maxLength','uniqueItems'];
  if(Object.keys(s).some(k=>!allowed.includes(k)))throw Error('Unsupported schema keyword');
  const n=Object.fromEntries(Object.entries(s).filter(([k])=>!['const','uniqueItems'].includes(k)));
  if(Object.hasOwn(s,'const'))n.enum=[s.const];
  if(n.enum&&!n.type){const t=n.enum.map(v=>Number.isInteger(v)?'integer':typeof v);if(!t.length||t.some(v=>v!==t[0])||!['string','integer','boolean'].includes(t[0]))throw Error('Unsupported enum');n.type=t[0];}
  if(n.properties){if(n.additionalProperties!==false||!Array.isArray(n.required)||Object.keys(n.properties).some(k=>!n.required.includes(k))||n.required.some(k=>!Object.hasOwn(n.properties,k)))throw Error('Open schema');n.properties=Object.fromEntries(Object.entries(n.properties).map(([k,v])=>[k,walk(v,depth+1)]));}
  if(n.items)n.items=walk(n.items,depth+1);if(n.anyOf)n.anyOf=n.anyOf.map(v=>walk(v,depth+1));return n;
 };const result=walk(schema);if(result.type!=='object'||result.anyOf)throw Error('Root object required');return result;
}
export function creativeProviderRequest(envelope,model){return {model,store:false,max_output_tokens:1000,reasoning:{effort:"low"},tools:[],input:stableJson(envelope.input),text:{format:{type:'json_schema',name:'busy_art_direction',strict:true,schema:creativeProviderSchema(envelope.schema)}}};}
// Server-created dependencies only. There is NO import or activation path in index.ts.
// The offline zero-usage callback is never used here. Tests inject a synthetic HTTP transport.
// Future Edge bootstrap only: constructing this factory does not read a secret or enable policy.
// The fixed reader cannot be replaced by a request property or a supplied credential callback.
export function createDenoLiveCreativeAdapter(serverDeps={}){
 return createLiveCreativeAdapter({...serverDeps,readCredential:provider=>{
  if(provider!=='openai-responses')return null;
  try{return typeof Deno==='undefined'?null:Deno.env.get('BUSY_OPENAI_CREATIVE_PILOT_KEY');}
  catch{return null;} // Missing env permission/runtime is a generic denial; never expose errors.
 }});
}
const legacyHomeProtocol=Object.freeze({
 maximumResponseBytes:32768,maximumOutputTokens:1000,
 async admit(prepared,current,policy,deps){
  let wire,wireDigest,approval;
  const pilot=await prepareLiveCreativePilot(prepared,current,{now:deps.now,integrity:deps.integrity,
   verifyApproval:async digest=>{approval=await deps.verifyApproval(digest);return approval?.provider===policy.provider&&approval?.model===policy.model?approval:null;},
   readTariff:async(provider,model)=>{const tariff=await deps.readTariff(provider,model);return tariff?.modelAvailable===true&&tariff?.availabilityVerified===true&&tariff?.fixedRequestGBP===0?tariff:null;},
   countTokens:async envelope=>{wire=creativeProviderRequest(envelope,policy.model);wireDigest=await deps.integrity.sha256(stableJson(wire));return deps.countRequestTokens(wire,policy.model);},
   inspectCentralReservation:async request=>{const admitted=await deps.reserve({...request,requestDigest:wireDigest,approvalReceipt:approval.receipt});return deps.readReservation(admitted);}
  });
  return {...pilot,wire,wireDigest,approval};
 },
 current(prepared,current){const fresh=prepareCreativeComparison(current,prepared.input.goal);return fresh.ok&&fresh.anchor===prepared.anchor&&stableJson(fresh.input)===stableJson(prepared.input);},
 review({prepared,current,response,deps}){
  const output=response.output,message=Array.isArray(output)?output.filter(item=>item?.type==='message'):[];
  if(response.status!=='completed'||!Array.isArray(output)||output.length>2||output.some(item=>!['message','reasoning'].includes(item?.type))||message.length!==1||message[0].role!=='assistant'||!Array.isArray(message[0].content)||message[0].content.length!==1||message[0].content[0].type!=='output_text')return {ok:false,status:'invalid-proposal'};
  const parsed=parseBuilderProposalResponse(message[0].content[0].text,prepared.source);if(!parsed.ok)return {ok:false,status:'invalid-proposal'};
  const source=createBuilderProposalContext({...current,projectId:current.website.id,sourceRevision:current.website.generation,surface:'website',pageId:'home',project:current.website});
  const review=prepareGovernedBuilderReview(parsed.proposal,prepared.source,source,deps.planner);
  return review.ok?{ok:true,review}:{ok:false,status:'unsupported-or-unchanged-proposal'};
 }
});
export function createLiveCreativeAdapter(deps={}){return createGovernedCreativeExecution(deps,legacyHomeProtocol);}
