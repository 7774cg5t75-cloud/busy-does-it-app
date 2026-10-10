/**
 * V3.115: business-scoped explicit customer design preference.
 * Save only choice metadata, NEVER screenshots, names, freeform customer text,
 * contact details or photos. No cross-business reuse or model training.
 */
const FAMILIES=new Set(["conversion","minimal","editorial","organic","artisan","boutique","showcase","portfolio"]);
const CHOICES=new Set(["liked","rejected"]);
const REQUEST=/^design-[a-zA-Z0-9_-]{13,110}$/;
const VERSION=/^[a-zA-Z0-9_|.:-]{1,128}$/;
function validateDesignFeedback(body){
 if(!body||typeof body!=="object"||Array.isArray(body))
   return {ok:false,error:"Invalid design feedback."};
 const keys=Object.keys(body);
 const accepted=new Set(["action","businessId","family","choice","draftVersion","requestKey"]);
 if(keys.some(k=>!accepted.has(k)))return {ok:false,error:"Unexpected feedback fields."};
 const family=body.family,choice=body.choice,revision=body.draftVersion,
   request=body.requestKey;
 if(!FAMILIES.has(family)||!CHOICES.has(choice)||
   typeof revision!=="string"||!VERSION.test(revision)||
   typeof request!=="string"||!REQUEST.test(request))
   return {ok:false,error:"Choose a valid private design and preference first."};
 return {ok:true,record:{design_family:family,preference:choice,
   draft_version:revision,request_key:request,aggregate_consent:false}};
}
function designPreferenceSummary(rows){
 const items=Array.isArray(rows)?rows:[];
 const filtered=items.filter(row=>FAMILIES.has(row?.design_family)&&
   CHOICES.has(row?.preference)).slice(0,40);
 const likes=[...new Set(filtered.filter(x=>x.preference==="liked").map(x=>x.design_family))];
 const dislikes=[...new Set(filtered.filter(x=>x.preference==="rejected").map(x=>x.design_family))];
 return {source:"owner_explicit_feedback",scope:"current_business_only",
  eventCount:filtered.length,likedFamilies:likes,rejectedFamilies:dislikes,
  mostRecent:filtered.length?{family:filtered[0].design_family,
    choice:filtered[0].preference}:null,
  globalLearningEnabled:false,modelRetrained:false,
  note:"Private feedback is for this business only. No photos, website content or customer information is shared."};
}
export {validateDesignFeedback,designPreferenceSummary};
