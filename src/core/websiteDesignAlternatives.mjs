/**
 * V3.113 practical private-draft design exploration.
 *
 * Alternatives are grounded in recorded business type, existing design family
 * and approved image evidence. They are owner-triggered and never auto-edit
 * business facts, contact details, approved media or public deployments.
 */
import {deriveSector,photographicCount} from "../../supabase/functions/busy-website-worker/designPlanner.mjs";
const text=x=>String(x||"").trim().toLowerCase();
const families={
  trades:["conversion","minimal","editorial","organic"],
  nature:["organic","minimal","editorial","artisan"],
  hospitality:["artisan","editorial","organic","boutique"],
  wellness:["boutique","minimal","editorial","organic"],
  professional:["editorial","minimal","boutique","conversion"],
  creative:["portfolio","editorial","showcase","minimal"],
  retail:["showcase","artisan","minimal","editorial"],
  learning:["editorial","conversion","minimal","boutique"],
  events:["conversion","editorial","showcase","boutique"],
  other:["minimal","editorial","organic","conversion","artisan"]
};
const styles={
  conversion:{title:"Clear and confident",detail:"Strong calls to action and straightforward service sections."},
  minimal:{title:"Simple and spacious",detail:"Open spacing, clear type and a focused business story."},
  editorial:{title:"Refined and informative",detail:"Thoughtful typography with a more editorial feel."},
  organic:{title:"Warm and natural",detail:"Gentle shapes and natural, welcoming section rhythm."},
  artisan:{title:"Handcrafted character",detail:"A distinctive style suited to food, craft and personal service."},
  boutique:{title:"Elegant and personal",detail:"A calm premium approach without invented imagery."},
  showcase:{title:"Photo showcase",detail:"Puts approved business photos at the forefront."},
  portfolio:{title:"Visual portfolio",detail:"A gallery-led layout using real approved work."}
};
const sector=draft=>{
 const raw=text(draft?.businessType||draft?.designPlan?.sector||
   draft?.designPlan?.signals?.businessType);
 const result=Object.keys(families).includes(raw)?raw:deriveSector(raw);
 return result==="neutral"?"other":result;
};
function websiteDesignAlternative(draft,{likedFamilies=[],rejectedFamilies=[]}={}){
 if(!draft?.id||!Array.isArray(draft.sections))
   return {available:false,reason:"Create your website draft first.",options:[]};
 const current=text(draft.theme?.designFamily||draft.designPlan?.family);
 // Share the rendered site's hero/gallery approval rule: no unapproved assets
 // can unlock showcase or portfolio alternatives.
 const approvedPhotos=photographicCount(draft.sections);
 const choices=[...families[sector(draft)]];
 if(approvedPhotos>0)choices.push("showcase","portfolio");
 const known=new Set([...families[sector(draft)],"showcase","portfolio"]);
 const liked=new Set(Array.isArray(likedFamilies)?likedFamilies.filter(x=>known.has(x)):[]);
 const rejected=new Set(Array.isArray(rejectedFamilies)?rejectedFamilies.filter(x=>known.has(x)):[]);
 const options=[...new Set(choices)].filter(name=>name!==current&&
   (approvedPhotos>0||!["showcase","portfolio"].includes(name)))
   .map(name=>({family:name,title:styles[name].title,detail:styles[name].detail,
     instruction:"try "+name+" design",ownerApprovalRequired:true,privateDraftOnly:true,
     previouslyRejected:rejected.has(name),recommended:!rejected.has(name)}))
   .sort((a,b)=>{
     const preference=name=>(liked.has(name)&&!rejected.has(name)?2:0)-
       (rejected.has(name)?1:0);
     return preference(b.family)-preference(a.family);
   });
 return {
   available:options.length>0,current:current||"custom",approvedPhotos,
   options,
   // Never automatically recommend a style this exact business rejected.
   // It remains in options so an owner can deliberately try it if they wish.
   suggested:options.find(option=>option.recommended)||null,
   reason:options.some(option=>option.recommended)?
     "Try a different visual direction without rewriting your services, contacts or other business facts.":
     options.length?"Only styles you've previously rejected remain. You can still choose one manually.":
     "No safe alternative is currently available."
 };
}
export {websiteDesignAlternative};
