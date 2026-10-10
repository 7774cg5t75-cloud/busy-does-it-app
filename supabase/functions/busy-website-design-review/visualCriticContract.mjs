/**
 * V3.102 visual-AI review contract — provider-neutral and disabled by default.
 * This code does not call an AI service, incur model charges, or publish.
 * Real visual review may only be claimed when authenticated screenshot analysis
 * is later connected, metered, and returns an actual verified result.
 */
const allowed={
 "theme.heroLayout":["image-right","image-left","image-frame","image-feature","type-left","type-center","type-right","type-poster"],
 "theme.cardLayout":["cards","outlines","rows"],
 "theme.navStyle":["quiet","underline","pill"],
 "theme.ornament":["ripple","arch","glow","stripes"],
 "theme.typography":["confident","refined","compact"],
 "theme.paletteVariant":["a","b","c"],
 "theme.heroSize":["medium","large","extra-large"],
 "theme.spacing":["comfortable","generous"],
};
const split=path=>String(path||"").split(".");
function normalizeVisualCritique(raw,{approvedPhotos=0}={}){
 if(!raw||typeof raw!=="object"||raw.reviewedScreenshots!==true)
  return {valid:false,reason:"No independently verified screenshot-based review",proposals:[]};
 const rawProposals=Array.isArray(raw.proposals)?raw.proposals:[];
 if(rawProposals.length>12)
  return {valid:false,reason:"Visual feedback exceeds review limits",proposals:[]};
 const proposals=[];
 for(const proposal of rawProposals){
   if(!proposal||typeof proposal!=="object")continue;
   const path=String(proposal.path||"");
   if(!allowed[path]?.includes(proposal.value))continue;
   if(path==="theme.heroLayout"){
     const picture=String(proposal.value).startsWith("image-");
     if(picture&&approvedPhotos<1)continue;
     if(!picture&&approvedPhotos>0)continue;
   }
   if(proposals.some(p=>p.path===path))continue;
   proposals.push({path,value:proposal.value,reason:String(proposal.reason||"").slice(0,180)});
   if(proposals.length>=3)break;
 }
 return {
   valid:true,
   providerConfirmed:true,
   source:"actual-screenshot-review",
   modelSummary:String(raw.summary||"").slice(0,500),
   proposals,
   requiresOwnerReview:true,
 };
}
/**
 * Safe visual refinements are suggestions, not editable business facts.
 * Never touch sections, phone, SEO claims, images, user records, publishing,
 * subscription entitlements or tenant/database identifiers.
 */
function applyApprovedVisualProposals(draft,report,{ownerApproved=false}={}){
 if(!ownerApproved||!report?.valid||report.source!=="actual-screenshot-review")
   return {applied:false,draft,reason:"Owner approval and real visual-review evidence are required"};
 let theme={...(draft?.theme||{})};
 let count=0;
 for(const p of (Array.isArray(report.proposals)?report.proposals:[]).slice(0,3)){
   const valid=allowed[p.path]?.includes(p.value);
   if(!valid)continue;
   const [,field]=split(p.path);
   theme[field]=p.value;
   count++;
 }
 return count?{applied:true,draft:{...draft,theme},reason:"Applied approved design-only adjustments. Rebuild and inspect the private draft before publishing."}
 :{applied:false,draft,reason:"No safe design-only suggestions were approved"};
}
export {normalizeVisualCritique,applyApprovedVisualProposals};
