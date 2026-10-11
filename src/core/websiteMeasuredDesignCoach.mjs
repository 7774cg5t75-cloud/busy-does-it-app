/**
 * V3.144: small, owner-controlled suggestions derived ONLY from measured
 * DOM-layout findings, never an invented screenshot AI judgement.
 * Candidate is private until independently remeasured, approved and applied.
 */
const array=x=>Array.isArray(x)?x:[];
const clean=x=>typeof x==="string"?x.trim():"";
const safeFields=["overflow","unloadedImages","missingAlt","smallTargets",
 "badAnchors","clippedHeadings"];
const issueMetric={overflow:"overflow",photos:"unloadedImages",
 descriptions:"missingAlt",targets:"smallTargets",links:"badAnchors",
 headings:"clippedHeadings"};
function recommendMeasuredWebsiteChange({draft,pageId,report}={}){
 const allowedPage=array(draft?.pages).some(p=>p.id===pageId&&p.enabled!==false);
 if(!draft?.id||!allowedPage||!report||!report.counts||
    !array(report.issues).length)return null;
 const ids=new Set(array(report.issues).map(x=>x?.id));
 const active=id=>array(draft.sections).find(s=>s.id===id&&s.enabled!==false&&
    array(draft.pages.find(p=>p.id===pageId)?.sectionIds).includes(id));
 if(ids.has("headings")&&ownerDesignPreference(draft,"compact-hero-title")!=="disliked"&&active("hero")&&
    active("hero").appearance?.headingScale!=="compact"){
  return {id:"compact-hero-title",label:"Try a smaller main heading",
   explanation:"A heading may be clipped. Test a more compact main heading without changing your wording.",
   operation:{action:"section-style",sectionId:"hero",field:"headingScale",value:"compact"},
   source:"measured-layout-hint",notGuaranteed:true};
 }
 if(ids.has("overflow")&&ownerDesignPreference(draft,"simpler-service-layout")!=="disliked"&&active("services")&&draft.theme?.cardLayout!=="rows"){
  return {id:"simpler-service-layout",label:"Try simpler service rows",
   explanation:"The page may be too wide. Test a one-column service arrangement.",
   operation:{action:"style",field:"cardLayout",value:"rows"},
   source:"measured-layout-hint",notGuaranteed:true};
 }
 return null;
}
function compareWebsiteVisualReports(original,candidate){
 if(!original?.counts||!candidate?.counts)return {valid:false,reason:"Two measured preview results required"};
 if(original.counts.viewport!==candidate.counts.viewport)
  return {valid:false,reason:"Original and candidate must use the same viewport"};
 if(!Array.isArray(original.issues)||!Array.isArray(candidate.issues))
  return {valid:false,reason:"Missing original or candidate layout warnings"};
 const regressions=[];
 for(const [id,field] of Object.entries(issueMetric)){
  const before=original.counts[field],after=candidate.counts[field];
  if(!Number.isSafeInteger(before)||!Number.isSafeInteger(after)||before<0||after<0)
   return {valid:false,reason:"Incomplete measured layout counters"};
  if(after>before)regressions.push(id+" increased");
 }
 if(candidate.counts.width>original.counts.width+2)
  regressions.push("Page width increased");
 const originalIds=new Set(original.issues.map(x=>x.id));
 const newWarnings=candidate.issues.map(x=>x.id).filter(id=>!originalIds.has(id));
 for(const id of newWarnings)if(!regressions.some(s=>s.startsWith(id)))regressions.push(id+" newly reported");
 const beforeProblems=original.issues.length,afterProblems=candidate.issues.length;
 return {valid:true,noNewMeasuredProblems:regressions.length===0,
  improved:regressions.length===0&&afterProblems<beforeProblems,
  originalProblemCount:beforeProblems,candidateProblemCount:afterProblems,regressions,
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
function ownerDesignPreference(draft,changeId){
 const rows=array(draft?.ownerDesignFeedback)
  .filter(e=>e?.draftId===draft?.id&&e.changeId===changeId);
 return rows.length?rows[rows.length-1].choice:null;
}
/** Owner feedback is a workspace preference, not public website content. */
function withoutPrivateWebsiteDesignFeedback(draft){
 if(!draft||typeof draft!=="object")return draft;
 const {ownerDesignFeedback,...safe}=draft;
 return safe;
}
export {recommendMeasuredWebsiteChange,compareWebsiteVisualReports,
 recordWebsiteOwnerDesignFeedback,ownerDesignPreference,withoutPrivateWebsiteDesignFeedback};
