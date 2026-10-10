/**
 * Private, explicit per-business preferences — not AI retraining or measured
 * sales analytics. Does not read individual tenant data on its own.
 */
function websiteBrainCoaching({summary=null,alternative=null,quality=null}={}){
 const trusted=summary?.scope==="current_business_only"&&
 summary?.source==="owner_explicit_feedback"&&
 summary?.globalLearningEnabled===false&&summary?.modelRetrained===false;
 const selected=alternative?.suggested||null;
 const liked=trusted&&Array.isArray(summary.likedFamilies)&&
  summary.likedFamilies.includes(selected?.family);
 const rejected=trusted&&Array.isArray(summary.rejectedFamilies)&&
  summary.rejectedFamilies.includes(selected?.family);
 const advice=Array.isArray(quality?.priority)?quality.priority[0]:null;
 return {scope:trusted?"current-business":"general-business-context",
  explanation:!selected?
   "Create a website first; BUSY will suggest styles from real business facts.":
   liked&&!rejected?
   "BUSY suggested this because you previously liked or kept this style for your business.":
   "BUSY suggested this based on your business type and the current design.",
  next:advice?{title:advice.title,detail:advice.detail}:
   {title:"Review your private design",detail:"You approve changes before they go public."},
  warning:rejected?"You previously rejected this look. Try another available style.":null,
  aiModelRetrained:false,sharedLearningEnabled:false,
  measuredSalesChange:null,measuredEnquiryChange:null};
}
export {websiteBrainCoaching};
