/**
 * V3.113 practical private-draft design exploration.
 *
 * Alternatives are grounded in recorded business type, existing design family
 * and approved image evidence. They are owner-triggered and never auto-edit
 * business facts, contact details, approved media or public deployments.
 */
const text=x=>String(x||"").trim().toLowerCase();
const families={
  trades:["conversion","minimal","editorial","organic"],
  nature:["organic","minimal","editorial","artisan"],
  hospitality:["artisan","editorial","organic","boutique"],
  wellness:["boutique","minimal","editorial","organic"],
  professional:["editorial","minimal","boutique","conversion"],
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
 const raw=text(draft?.businessType||draft?.designPlan?.sector||draft?.designPlan?.signals?.businessType);
 if(/garden|landscap|farm|floris|horticult/.test(raw))return "nature";
 if(/cater|food|restaurant|bakery|chef|festival|coffee|hotel/.test(raw))return "hospitality";
 if(/beauty|hair|salon|spa|therapy|wellness|massage|fitness/.test(raw))return "wellness";
 if(/account|consult|bookkeep|law|finance|architect|agency|tutor/.test(raw))return "professional";
 if(/clean|plumb|electric|builder|roof|pressure|repair|trade|handyman/.test(raw))return "trades";
 return "other";
};
function websiteDesignAlternative(draft){
 if(!draft?.id||!Array.isArray(draft.sections))
   return {available:false,reason:"Create your website draft first.",options:[]};
 const current=text(draft.theme?.designFamily||draft.designPlan?.family);
 const approvedPhotos=Array.isArray(draft.sections.find(s=>s.id==="gallery")?.items)?
   draft.sections.find(s=>s.id==="gallery").items.filter(
      image=>image?.approved!==false&&typeof image?.storagePath==="string"&&!!image.storagePath).length:0;
 const choices=[...families[sector(draft)]];
 if(approvedPhotos>0)choices.push("showcase","portfolio");
 const options=[...new Set(choices)].filter(name=>name!==current&&
   (approvedPhotos>0||!["showcase","portfolio"].includes(name)))
   .map(name=>({family:name,title:styles[name].title,detail:styles[name].detail,
     instruction:"try "+name+" design",ownerApprovalRequired:true,privateDraftOnly:true}));
 return {
   available:options.length>0,current:current||"custom",approvedPhotos,
   options,
   suggested:options[0]||null,
   reason:options.length?"Try a different visual direction without rewriting your services, contacts or other business facts.":
     "No safe alternative is currently available."
 };
}
export {websiteDesignAlternative};
