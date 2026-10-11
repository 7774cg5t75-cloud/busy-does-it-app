/**
 * V3.167 — per-business, explainable DESIGN PATTERNS, not AI model training.
 * Each input history record was validated by the authenticated private
 * design-memory endpoint. Output contains supported finite style identifiers
 * and counts only — no prose from users, screenshots or customer data.
 *
 * Latest explicit owner preference wins for a particular choice. Repeated
 * judgments must span DIFFERENT draft revisions. Never infer conversion,
 * accessibility, aesthetics or causality from feedback or geometry warnings.
 */
import {OPTIONS,DEFAULTS} from "./appAppearanceEditing.mjs";
import {prepareAppVisualBatch} from "./appVisualComparison.mjs";

const own=(x,k)=>x!=null&&Object.prototype.hasOwnProperty.call(x,k);
const SOURCES=["measured","ai","responsive"];
const VERDICTS=["better","worse","not_quite_right"];
const CONTEXTS=["preview","saved_revision"];
const sourceWeight={measured:40,ai:27,responsive:17};
const bound=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const keyOf=(field,value)=>field+":"+value;
const safeChoice=(field,value)=>typeof field==="string"&&
 own(OPTIONS,field)&&typeof value==="string"&&OPTIONS[field].includes(value);

function buildOwnerDesignPatterns(history=[]){
 if(!Array.isArray(history)||history.length>80)
  return {ok:false,reason:"Use at most 80 owner feedback records from one private app."};
 const valid=[];
 for(const row of history){
  if(!safeChoice(row?.field,row?.value)||!VERDICTS.includes(row?.verdict)||
    !CONTEXTS.includes(row?.context)||!bound(row?.draftRevision,1,1000000000))
   continue;
  valid.push({field:row.field,value:row.value,verdict:row.verdict,
   context:row.context,revision:row.draftRevision});
 }
 // A history is sent from the trusted service newest first. Limit one
 // vote per identical field / value / context / revision. A repeated tap at
 // the same revision is not independent evidence of a pattern.
 const seen=new Set(),byChoice=new Map(),byField=new Map();
 for(const row of valid){
  const pair=keyOf(row.field,row.value),vote=pair+":"+row.context+":"+row.revision;
  if(seen.has(vote))continue;
  seen.add(vote);
  if(!byChoice.has(pair))byChoice.set(pair,[]);
  byChoice.get(pair).push(row);
  if(!byField.has(row.field))byField.set(row.field,[]);
  byField.get(row.field).push(row);
 }
 const choices=[];
 for(const [pair,records] of byChoice){
  const first=records[0];
  const negative=records.filter(r=>r.verdict!=="better");
  const positive=records.filter(r=>r.verdict==="better");
  const rejected=first.verdict!=="better";
  const negativeRevisions=new Set(negative.map(r=>r.revision));
  const positiveRevisions=new Set(positive.map(r=>r.revision));
  choices.push({field:first.field,value:first.value,
   recentVerdict:first.verdict,recentContext:first.context,
   feedbackCount:records.length,
   negativeRevisionCount:negativeRevisions.size,
   positiveRevisionCount:positiveRevisions.size,
   repeatedlyDisliked:negativeRevisions.size>=2&&rejected,
   rejectedCurrently:rejected,
   independentlyProven:false,
   ownerPreferenceOnly:true,
   conflicted:positive.length>0&&negative.length>0});
 }
 const fields=[];
 for(const [field,records] of byField){
  const last=records[0],byValue=choices.filter(c=>c.field===field);
  const liked=byValue.filter(c=>c.recentVerdict==="better");
  const repeatedlyRejected=byValue.filter(c=>c.repeatedlyDisliked);
  fields.push({field,recentValue:last.value,
   recentVerdict:last.verdict,choicesReviewed:byValue.length,
   likedValues:liked.map(x=>x.value),
   repeatedlyRejectedValues:repeatedlyRejected.map(x=>x.value),
   mixedOwnerFeedback:byValue.some(x=>x.conflicted)||
     liked.length>1});
 }
 return {ok:true,kind:"bounded_owner_app_design_patterns_v3167",
  choices,fields,recordCount:valid.length,
  distinctChoiceCount:choices.length,
  repeatedDislikeCount:choices.filter(x=>x.repeatedlyDisliked).length,
  mixedPreferenceCount:fields.filter(x=>x.mixedOwnerFeedback).length,
  recordsMayBeSameRevision:true,independentCustomerTesting:false,
  modelTrainingPerformed:false,scope:"one_business_only",
  privateOwnerOnly:true,noCrossBusinessLearning:true,
  screenshotsIncluded:false,ownerApprovalStillNeeded:true};
}

/**
 * Rank supported appearance alternatives across independent evidence types.
 * Suppress the latest owner-rejected setting. Prefer leaving a previously
 * liked, currently active setting alone unless directly measured evidence
 * identifies a reason to inspect an alternative. Never force an alternative.
 */
function prepareOwnerAwareDesignExperiments(config,{
 history=[],measured=[],ai=[],responsive=[]
}={}){
 if(!Array.isArray(config?.modules)||[measured,ai,responsive].some(
  x=>!Array.isArray(x)||x.length>12))
  return {ok:false,reason:"Open a complete private app with bounded design findings."};
 const profile=buildOwnerDesignPatterns(history);
 if(!profile.ok)return profile;
 const lookup=new Map(profile.choices.map(x=>[keyOf(x.field,x.value),x]));
 const recentByField=new Map(profile.fields.map(x=>[x.field,x]));
 const current={...DEFAULTS,...config.presentation};
 const candidates=new Map(),suppressed=[];
 for(const source of SOURCES){
  for(const raw of ({measured,ai,responsive})[source]){
   if(!safeChoice(raw?.field,raw?.value)||
      raw.value===current[raw.field])continue;
   const pair=keyOf(raw.field,raw.value);
   if(!candidates.has(pair))candidates.set(pair,{
    field:raw.field,value:raw.value,sources:[],reason:""});
   const c=candidates.get(pair);
   if(!c.sources.includes(source))c.sources.push(source);
  }
 }
 const scored=[];
 for(const c of candidates.values()){
  const opinion=lookup.get(keyOf(c.field,c.value));
  if(opinion?.rejectedCurrently){
   suppressed.push({field:c.field,value:c.value,
    reason:opinion.repeatedlyDisliked?
      "The owner disliked this choice across separate draft revisions.":
      "The owner's most recent feedback disliked this choice.",
    repeated:opinion.repeatedlyDisliked});
   continue;
  }
  const rememberedCurrent=lookup.get(keyOf(c.field,current[c.field]));
  const protectsCurrent=rememberedCurrent?.recentVerdict==="better"&&
   !c.sources.includes("measured");
  if(protectsCurrent){
   suppressed.push({field:c.field,value:c.value,
    reason:"Owner prefers the current setting; no direct measured issue justifies replacing it.",
    repeated:false});
   continue;
  }
  const backing=Math.max(...c.sources.map(s=>sourceWeight[s]));
  const corroboration=Math.min(14,Math.max(0,c.sources.length-1)*7);
  const preferred=opinion?.recentVerdict==="better"?
   opinion.recentContext==="saved_revision"?14:9:0;
  scored.push({...c,score:backing+corroboration+preferred,
   ownerPreference:opinion?.recentVerdict==="better"?
    "Previously preferred by this owner":"Not previously preferred",
   evidenceExplanation:c.sources.length>1?
    "Multiple independent suggestion sources agree.":
    "Based on "+c.sources[0]+" suggestions only.",
   confidence:"heuristic_not_verified",fallback:false,
   requiresPrivatePreview:true});
 }
 // If every supplied suggestion for a field was rejected, an alternative
 // may be explored at LOW confidence. Only from the same finite OPTIONS list.
 // Never manufacture an edit for a field without any initial evidence.
 const fieldsWithAnyEvidence=new Set([...candidates.values()].map(c=>c.field));
 for(const field of fieldsWithAnyEvidence){
  if(scored.some(c=>c.field===field))continue;
  const related=profile.choices.filter(x=>x.field===field);
  const liked=related.filter(x=>x.recentVerdict==="better"&&
    x.value!==current[field]);
  const alternatives=OPTIONS[field].filter(v=>v!==current[field]&&
    !lookup.get(keyOf(field,v))?.rejectedCurrently);
  const selected=liked[0]?.value||alternatives[0];
  if(!selected)continue; // prefer doing nothing to repeating a bad design
  scored.push({field,value:selected,sources:["owner_alternative"],
   score:liked.length?13:5,
   ownerPreference:liked.length?"Previously preferred by this owner":
    "Untested alternative to a disliked suggestion",
   evidenceExplanation:"An alternative to a suggestion the owner rejected; no visual benefit has been established.",
   confidence:"untested_alternative",fallback:true,
   requiresPrivatePreview:true});
 }
 scored.sort((a,b)=>b.score-a.score||
  a.field.localeCompare(b.field)||a.value.localeCompare(b.value));
 // Each design field can occur at most once. A default cannot be overridden
 // without explicit owner approval after seeing the coordinated private draft.
 const selected=[],used=new Set();
 for(const c of scored){
  if(used.has(c.field))continue;
  selected.push(c);used.add(c.field);
  if(selected.length>=3)break;
 }
 let preview=null;
 if(selected.length){
  const candidate=prepareAppVisualBatch(config,selected.map(x=>({
   kind:"appearance",field:x.field,value:x.value
  })));
  if(candidate.ok)preview=candidate;
 }
 return {ok:true,kind:"owner_pattern_design_experiments_v3167",
  profile,ranked:scored,proposed:selected,
  preview,keptOriginal:!preview,
  suppressed,reasoning:selected.map(x=>({
   field:x.field,value:x.value,why:x.evidenceExplanation,
   ownerPreference:x.ownerPreference,
   tradeoff:x.fallback?
    "This is an untested fallback; compare carefully and reject it if you prefer.":
    "Check appearance on actual devices; fewer flags do not prove a better app.",
   confidence:x.confidence})),
  comparisonProof:false,scoresAreHeuristics:true,
  noAIExpense:true,noAutomaticApproval:true,noAutoPublish:true,
  noCustomerRecordsUsed:true,noCrossBusinessLearning:true};
}

/** Distinguish what an owner prefers from what a design actually proved. */
function explainOwnerDesignOutcome({verdict=null,beforeWarnings=null,
 afterWarnings=null,actuallySaved=false}={}){
 const validCount=x=>x===null||bound(x,0,64);
 if((verdict!==null&&!VERDICTS.includes(verdict))||
  !validCount(beforeWarnings)||!validCount(afterWarnings)||
  typeof actuallySaved!=="boolean")
  return {ok:false,reason:"Use an owner verdict and finite comparable warnings."};
 const known=beforeWarnings!==null&&afterWarnings!==null,
  newFlags=known&&afterWarnings>beforeWarnings,
  fewerFlags=known&&afterWarnings<beforeWarnings;
 let assessment="inconclusive";
 if(newFlags)assessment="new_warnings_to_review";
 else if(verdict==="worse"||verdict==="not_quite_right")
  assessment=fewerFlags?"owner_disagrees_with_measurements":"owner_disliked";
 else if(verdict==="better")
  assessment=fewerFlags?"promising_not_proven":"preferred_unverified";
 else if(fewerFlags)assessment="fewer_flags_owner_feedback_missing";
 return {ok:true,kind:"design_learning_evidence_boundary_v3167",
  assessment,ownerVerdict:verdict,appliedToPrivateDraft:actuallySaved,
  fewerWarnings:fewerFlags,newWarnings:newFlags,
  comparisonHasCounts:known,
  warningCountsAreNotPixelInspection:true,
  ownerOpinionNotCommercialOutcome:true,
  autoImprovementProven:false,realDeviceTestingRequired:true,
  accessibilityCertified:false,autoPublished:false};
}
export {buildOwnerDesignPatterns,prepareOwnerAwareDesignExperiments,
 explainOwnerDesignOutcome};
