import {websiteLayoutLockReason} from '../../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs';
/**
 * V3.144: small, owner-controlled suggestions derived ONLY from measured
 * DOM-layout findings, never an invented screenshot AI judgement.
 * Candidate is private until independently remeasured, approved and applied.
 */
const array=x=>Array.isArray(x)?x:[];
const clean=x=>typeof x==="string"?x.trim():"";
const safeFields=["overflow","unloadedImages","missingAlt","smallTargets",
 "badAnchors","clippedHeadings","lowContrast","smallBodyText","contrastUnknown"];
const issueMetric={overflow:"overflow",photos:"unloadedImages",
 descriptions:"missingAlt",targets:"smallTargets",links:"badAnchors",
 headings:"clippedHeadings",contrast:"lowContrast",readability:"smallBodyText",
 "contrast-unchecked":"contrastUnknown"};
function recommendMeasuredWebsiteChange({draft,pageId,report}={}){
 const allowedPage=array(draft?.pages).some(p=>p.id===pageId&&p.enabled!==false);
 if(!draft?.id||!allowedPage||!report||!report.counts||
    !array(report.issues).length)return null;
 const ids=new Set(array(report.issues).map(x=>x?.id));
 const active=id=>array(draft.sections).find(s=>s.id===id&&s.enabled!==false&&
    array(draft.pages.find(p=>p.id===pageId)?.sectionIds).includes(id));
 const candidates=[];
 if(ids.has("headings")&&ownerDesignPreference(draft,"compact-hero-title",pageId)!=="disliked"&&active("hero")&&
    active("hero").appearance?.headingScale!=="compact"){
  candidates.push({id:"compact-hero-title",label:"Try a smaller main heading",
   explanation:"A heading may be clipped. Test a more compact main heading without changing your wording.",
   operation:{action:"section-style",sectionId:"hero",field:"headingScale",value:"compact"},
   source:"measured-layout-hint",notGuaranteed:true});
 }
 if(ids.has("overflow")&&ownerDesignPreference(draft,"simpler-service-layout",pageId)!=="disliked"&&active("services")&&
    draft.theme?.cardLayout!=="rows"){
  candidates.push({id:"simpler-service-layout",label:"Try simpler service rows",
   explanation:"The page may be too wide. Test a one-column service arrangement.",
   operation:{action:"style",field:"cardLayout",value:"rows"},
   source:"measured-layout-hint",notGuaranteed:true});
 }
 // A previously liked change may be suggested FIRST, but only if an
 // independently measured problem actually justifies trying it again.
 candidates.sort((a,b)=>Number(ownerDesignPreference(draft,b.id,pageId)==="liked")-
   Number(ownerDesignPreference(draft,a.id,pageId)==="liked"));
 return candidates.find(candidate=>!websiteLayoutLockReason(draft,candidate.operation))||null;
}
function compareWebsiteVisualReports(original,candidate){
 if(!original?.counts||!candidate?.counts)return {valid:false,reason:"Two measured preview results required"};
 if(original.counts.viewport!==candidate.counts.viewport)
  return {valid:false,reason:"Original and candidate must use the same viewport"};
 if(!Array.isArray(original.issues)||!Array.isArray(candidate.issues))
  return {valid:false,reason:"Missing original or candidate layout warnings"};
 const regressions=[];
 const newer=["lowContrast","smallBodyText","contrastUnknown","contrastChecked"];
 const enhanced=newer.some(k=>Object.prototype.hasOwnProperty.call(original.counts,k)||
   Object.prototype.hasOwnProperty.call(candidate.counts,k));
 if(enhanced&&!newer.every(k=>
    Number.isSafeInteger(original.counts[k])&&original.counts[k]>=0&&
    Number.isSafeInteger(candidate.counts[k])&&candidate.counts[k]>=0))
  return {valid:false,reason:"Contrast and readability measurements must cover both versions."};
 for(const [id,field] of Object.entries(issueMetric)){
  if(!enhanced&&newer.includes(field))continue;
  const before=original.counts[field],after=candidate.counts[field];
  if(!Number.isSafeInteger(before)||!Number.isSafeInteger(after)||before<0||after<0)
   return {valid:false,reason:"Incomplete measured layout counters"};
  if(after>before)regressions.push(id+" increased");
 }
 if(candidate.counts.width>original.counts.width+2)
  regressions.push("Page width increased");
 if(enhanced&&candidate.counts.contrastChecked<original.counts.contrastChecked)
  regressions.push("Fewer text elements could be checked for contrast");
 const originalIds=new Set(original.issues.map(x=>x.id));
 const newWarnings=candidate.issues.map(x=>x.id).filter(id=>!originalIds.has(id));
 for(const id of newWarnings)if(!regressions.some(s=>s.startsWith(id)))regressions.push(id+" newly reported");
 const beforeProblems=original.issues.length,afterProblems=candidate.issues.length;
 const fixed=original.issues.map(x=>x?.id).filter(id=>
  !candidate.issues.some(y=>y?.id===id));
 return {valid:true,noNewMeasuredProblems:regressions.length===0,
  improved:regressions.length===0&&afterProblems<beforeProblems,
  originalProblemCount:beforeProblems,candidateProblemCount:afterProblems,regressions,
  resolvedWarnings:fixed,remainingWarnings:candidate.issues.map(x=>x.id),
  evidence:"same-width-rendered-dom",
  summary:regressions.length
   ?"The candidate introduced a measured warning. Keep the original design.":
   afterProblems<beforeProblems
    ?"The candidate reduced measured warnings at this width. Check other devices before keeping it.":
    "No new measured warnings at this width, but improvement is not proven. Decide which look you prefer."};
}
/** Explicit on-device customer feedback, not model training or global sharing. */
function recordWebsiteOwnerDesignFeedback(draft,{draftId,pageId,choice,changeId,at}={}){
 if(!draft?.id||draft.id!==draftId||
    !array(draft.pages).some(p=>p.id===pageId)||
    !["liked","disliked"].includes(choice)||
    !/^[a-z0-9-]{1,64}$/.test(clean(changeId))||
    typeof at!=="string"||!/^\d{4}-\d\d-\d\dT/.test(at))
  return {applied:false,draft,reason:"Choose a current private design before recording feedback."};
 const existing=array(draft.ownerDesignFeedback)
   .filter(e=>e?.draftId===draftId&&["liked","disliked"].includes(e.choice))
   .slice(-19);
 const next={draftId,pageId,choice,changeId,at:at.slice(0,30),
  source:"owner-explicit-feedback",scope:"this-website-draft-only"};
 return {applied:true,draft:{...draft,ownerDesignFeedback:[...existing,next]},
  reason:"Saved for this website draft only. Nothing was sent to other businesses or used to train a model."};
}
function ownerDesignPreference(draft,changeId,pageId=""){
 const rows=array(draft?.ownerDesignFeedback)
  .filter(e=>e?.draftId===draft?.id&&e.changeId===changeId&&
    (!pageId||e.pageId===pageId));
 return rows.length?rows[rows.length-1].choice:null;
}
/** Human-readable and bounded, not an ungrounded aesthetic score. */
function describeWebsiteDesignComparison(comparison){
 if(!comparison?.valid)return {headline:"Comparison unavailable",
  description:"The original and alternative need valid measurements at the same width.",
  facts:[],mayKeep:false};
 const improved=comparison.improved===true;
 const safe=comparison.noNewMeasuredProblems===true;
 const before=Number(comparison.originalProblemCount)||0;
 const after=Number(comparison.candidateProblemCount)||0;
 return {headline:!safe?"Keep your original design":improved
   ?"This alternative fixed some measured problems":"Compare both looks",
  description:!safe
   ?"The alternative made at least one measured problem worse. It cannot be kept from this comparison."
   :improved?"Some measured problems improved at this width. Please also check another screen size."
   :"No new measured problems were found, but this isn't proof the new design is more attractive.",
  facts:["Original: "+before+" layout warning"+(before===1?"":"s"),
    "Alternative: "+after+" layout warning"+(after===1?"":"s")],
  mayKeep:safe,
  improved,
  evidence:"rendered layout, not AI screenshot scoring"};
}
/** Owner feedback is a workspace preference, not public website content. */
function withoutPrivateWebsiteDesignFeedback(draft){
 if(!draft||typeof draft!=="object")return draft;
 const {ownerDesignFeedback,...safe}=draft;
 return safe;
}
export {recommendMeasuredWebsiteChange,compareWebsiteVisualReports,
 recordWebsiteOwnerDesignFeedback,ownerDesignPreference,withoutPrivateWebsiteDesignFeedback,
 describeWebsiteDesignComparison};
