/**
 * V3.166: bounded owner design preferences and evidence ranking.
 * Data is always business-scoped by the authenticated Edge function.
 * This module never learns AI model weights, shares between tenants, saves
 * screenshots, publishes apps, edits customers, or turns opinions into proof.
 */
import {OPTIONS,DEFAULTS} from "./appAppearanceEditing.mjs";
import {prepareAppVisualBatch} from "./appVisualComparison.mjs";
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const VERDICTS=Object.freeze(["better","worse","not_quite_right"]);
const CONTEXTS=Object.freeze(["preview","saved_revision"]);
const SOURCES=Object.freeze(["measured","ai","responsive","manual"]);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const sourceValue=s=>SOURCES.includes(s)?s:"manual";
function validateDesignFeedback(body){
 const {appId,expectedRevision,field,value,verdict,context,source,
  baselineWarnings,proposedWarnings}=body||{};
 if(!UUID.test(appId||"")||!Number.isSafeInteger(expectedRevision)||
   expectedRevision<1||!own(OPTIONS,field)||!OPTIONS[field].includes(value)||
   !VERDICTS.includes(verdict)||!CONTEXTS.includes(context)||
   !SOURCES.includes(source)||body?.ownerApproved!==true)
  return {ok:false,reason:"Choose a current private design setting and explicit owner feedback."};
 const checkCount=v=>v===null||v===undefined||
  Number.isInteger(v)&&v>=0&&v<=64;
 if(!checkCount(baselineWarnings)||!checkCount(proposedWarnings))
  return {ok:false,reason:"Only small bounded numerical layout warnings may be recorded."};
 if(context==="saved_revision"&&expectedRevision<2)
  return {ok:false,reason:"Saved-design feedback needs a confirmed later private revision."};
 return {ok:true,appId,expectedRevision,field,value,verdict,context,
  source:sourceValue(source),
  baselineWarnings:baselineWarnings??null,proposedWarnings:proposedWarnings??null,
  ownerApprovalRequired:true,scope:"one_business_only",
  interpretation:context==="preview"?"owner_preference_not_applied":"owner_opinion_after_saved_revision",
  noCustomerData:true,noScreenshot:true,doesNotProveImprovement:true,
  canChangeAIWeights:false};
}
function normalizeDesignHistory(rows,appId){
 if(!UUID.test(appId||"")||!Array.isArray(rows))
  return {ok:false,reason:"Valid private app history is unavailable."};
 const result=[];
 for(const row of rows.slice(0,80)){
  const record=validateDesignFeedback({
   appId:row?.app_id,expectedRevision:Number(row?.draft_revision),
   field:row?.field,value:row?.value,verdict:row?.verdict,
   context:row?.feedback_context,source:row?.evidence_source,
   baselineWarnings:row?.baseline_warnings,
   proposedWarnings:row?.proposed_warnings,ownerApproved:true
  });
  if(!record.ok||record.appId!==appId)continue;
  result.push({field:record.field,value:record.value,verdict:record.verdict,
   context:record.context,source:record.source,
   draftRevision:record.expectedRevision,
   baselineWarnings:record.baselineWarnings,
   proposedWarnings:record.proposedWarnings});
 }
 return {ok:true,kind:"private_design_feedback_history_v3166",
  records:result,limitedTo:80,businessScopeEnforcedOnServer:true,
  privateNotesIncluded:false,otherBusinessDataIncluded:false,
  modelRetrainingPerformed:false};
}
const isSentiment=(x,v)=>x?.verdict===v;
function rankDesignSuggestions(config,{history=[],measured=[],ai=[],responsive=[]}={}){
 if(!Array.isArray(config?.modules)||!Array.isArray(history)||
   history.length>80||[measured,ai,responsive].some(x=>!Array.isArray(x)||x.length>12))
  return {ok:false,reason:"A finite app configuration and bounded private feedback are required."};
 const candidates=[],index=new Set();
 const seenRecords=history.filter(x=>own(OPTIONS,x.field)&&
   OPTIONS[x.field].includes(x.value)&&VERDICTS.includes(x.verdict));
 const suppression=new Set();
 const decisions=new Map();
 // For each exact field/value, the most recent owner feedback wins.
 for(const record of seenRecords){
  const key=record.field+":"+record.value;
  if(decisions.has(key))continue;
  decisions.set(key,record);
  if(isSentiment(record,"worse")||isSentiment(record,"not_quite_right"))
   suppression.add(key);
 }
 const bands={measured:35,ai:25,responsive:15};
 for(const [source,list] of [["measured",measured],["ai",ai],["responsive",responsive]]){
  for(const item of list){
   if(!item||typeof item.field!=="string"||!own(OPTIONS,item.field)||
      !OPTIONS[item.field].includes(item.value))continue;
   const key=item.field+":"+item.value;
   if(index.has(key))continue;
   index.add(key);
   if((config.presentation?.[item.field]||DEFAULTS[item.field])===item.value)
    continue;
   if(suppression.has(key)){
    candidates.push({field:item.field,value:item.value,source,
      suppressed:true,score:null,reason:"Owner previously disliked this exact design choice."});
    continue;
   }
   const prev=decisions.get(key);
   const bonus=isSentiment(prev,"better")?12:0;
   const score=bands[source]+bonus;
   candidates.push({field:item.field,value:item.value,source,score,
    suppressed:false,reason:source==="measured"?"Measured layout observation":
      source==="ai"?"Owner-approved AI screenshot review":"Responsive rule",
    ownerPreference:bonus?"Previously preferred by owner":"Not yet rated",
    approximateConfidence:source==="measured"?"local_component_measurement":
      source==="ai"?"model_suggestion_unverified":"static_rule",
    qualityImprovementProven:false,
    tradeoff:"Review the original and proposed design on real devices before approval."});
  }
 }
 const choices=candidates.filter(x=>!x.suppressed).sort((a,b)=>
   b.score-a.score||a.field.localeCompare(b.field)).slice(0,3);
 const batch=choices.length?prepareAppVisualBatch(config,choices.map(x=>({
  kind:"appearance",field:x.field,value:x.value
 }))):null;
 // Ranking cannot propose two contradictory values for the same field.
 const selected=[],fields=new Set();
 for(const item of choices){
  if(fields.has(item.field))continue;fields.add(item.field);selected.push(item);
 }
 const proposal=selected.length?prepareAppVisualBatch(config,selected.map(x=>({
  kind:"appearance",field:x.field,value:x.value
 }))):null;
 return {ok:true,kind:"owner_preference_aware_design_ranking_v3166",
  ranked: candidates.sort((a,b)=>(b.score??-999)-(a.score??-999)),
  recommended:selected,preview:proposal?.ok?proposal:null,
  suppressedCount:candidates.filter(x=>x.suppressed).length,
  suggestionsConsidered:candidates.length,recordsUsed:seenRecords.length,
  reasons: selected.map(x=>({field:x.field,value:x.value,source:x.source,
    score:x.score,ownerPreference:x.ownerPreference,tradeoff:x.tradeoff})),
  scoresAreHeuristics:true,predictedOutcomeNotConfirmed:true,
  onlyPrivateBusinessHistory:true,tenantIsolationMustBeEnforcedByServer:true,
  noCrossBusinessLearning:true,automaticAITraining:false,
  noAutoPublish:true,ownerApprovalRequired:true};
}
export {VERDICTS,CONTEXTS,SOURCES,validateDesignFeedback,normalizeDesignHistory,
 rankDesignSuggestions};
