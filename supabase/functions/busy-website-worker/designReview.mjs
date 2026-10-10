/**
 * V3.101 preliminary, zero-AI-cost design reviewer.
 * Inspects real website facts and the selected design plan; does not pretend
 * to see pixels or replace a future multimodal screenshot-based AI review.
 * Never invents testimonials, offers, credentials, customer contacts or images.
 */
const text=v=>String(v||"").trim();
const items=v=>Array.isArray(v)?v:[];
const section=(sections,id)=>items(sections).find(s=>s?.id===id&&s?.enabled!==false);
function reviewWebsiteDesign({draft=null,comparisonFingerprints=[]}={}){
 const plan=draft?.designPlan;
 if(!plan) return {status:"not-reviewed",score:null,checks:[],suggestions:[],
   visualInspectionPending:true,summary:"Create a website draft to review its design."};
 const sections=items(draft.sections);
 const home=items(draft.pages).find(p=>p.id==="home");
 const hasServices=items(section(sections,"services")?.items).some(s=>text(s?.title));
 const contact=section(sections,"contact");
 const hasRealContact=!!(text(contact?.phone)||text(contact?.email));
 const hasArea=!!text(draft?.serviceArea);
 const hero=section(sections,"hero");
 const checks=[];
 const add=(id,passed,weight,message,detail="")=>
   checks.push({id,passed:!!passed,weight,message,detail});
 add("identity",!!text(draft?.businessName),20,"Business name shown","Confirm the business name before publishing.");
 add("main-heading",!!text(hero?.title),14,"Clear main heading","Tell BUSY what customers should see first.");
 add("service-proof",hasServices,16,"Real services shown","Add at least one genuine service or product.");
 add("no-empty-pages",plan.architecture==="focused-landing"?
    items(draft?.pages).length===1
    : !!home&&items(draft?.pages).length>=2,15,
    "Appropriate page structure","Avoid empty standalone pages.");
 add("individual-design",!!plan.visualIdentity?.fingerprint,12,
    "Individual visual identity","Choose an individual layout before going live.");
 add("actual-contact",hasRealContact||hasArea,8,
    "Visitors know how or where to find you","Add a real contact method or service area.");
 // A no-photo design is intentional and valid. The checker must not penalise
 // it or claim stock imagery was approved.
 add("photo-fallback",plan.heroTreatment==="typographic"||
    !!plan.signals?.approvedPhotos,8,"Hero works without unapproved images");
 const expected=plan.visualIdentity?.fingerprint||"";
 const comparison=new Set(items(comparisonFingerprints).filter(f=>typeof f==="string"));
 add("local-diversity",!expected||!comparison.has(expected),7,
    "Design differs from comparison examples",
    "Try a different layout, type treatment or palette.");
 const score=checks.reduce((acc,c)=>acc+(c.passed?c.weight:0),0);
 const suggestions=checks.filter(c=>!c.passed&&c.detail)
   .map(c=>({id:c.id,message:c.message,detail:c.detail}));
 return {
   status:score>=85?"ready-for-visual-review":"needs-attention",
   score,checks,suggestions,
   fingerprint:expected,
   visualInspectionPending:true,
   summary:score>=85
     ?"The structure and factual content passed BUSY's first design checks. A real visual review is still needed."
     :"BUSY found details that could improve the website before a visual review.",
 };
}
export {reviewWebsiteDesign};
