import {websiteBuilderTestHarnessV3222} from "./lib/website-builder-test-harness-v3222.mjs";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {editWebsiteDraftField} from "../src/core/websiteStructuredEditing.mjs";
import {canonicalWebsiteHandoffUrl} from "../src/core/websiteAppHandoffV3214.mjs";
import {planWebsiteDesign} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const {buildWebsiteDraft,applyStructuredWebsiteEdit}=websiteBuilderTestHarnessV3222(["buildWebsiteDraft","applyStructuredWebsiteEdit"]);

const owner=buildWebsiteDraft({brandBrain:{websiteReady:true,websiteBrief:{
 businessName:"Rosemary Gardens",businessType:"Garden design",phone:"01234 567890",
 email:"team@rosemary.example",serviceArea:"Torbay",
 services:[{id:"lawn",name:"Lawn care",description:"Mowing for local gardens"},
           {id:"hedges",name:"Hedges",description:"Seasonal hedge maintenance"}],
 about:"We provide gardening services based in Torbay.",
 faqs:[{id:"visits",question:"How do visits work?",answer:"Contact us to agree a date."}],
 testimonials:[{id:"person",attribution:"Customer",text:"Helpful, careful work."}],
}}});
let total=0;
const yes=(v,why)=>{assert.ok(v,why);total++};
const eq=(v,w,why)=>{assert.deepEqual(v,w,why);total++};
const edit=(patch,draft=owner)=>applyStructuredWebsiteEdit(draft,patch);
const original=JSON.stringify(owner);

const ownerAddedFaq=applyStructuredWebsiteEdit(owner,{
 action:"add-item",sectionId:"faq",
 title:"Can you help at weekends?",body:"Please ask us about weekend availability."
});
yes(ownerAddedFaq.applied,"FAQ can be added without an AI provider");
yes(ownerAddedFaq.draft.html.includes("Can you help at weekends?"),
 "New FAQ appears in the regenerated private HTML");
const rebuildWithoutOriginalFaqs=buildWebsiteDraft({
 brandBrain:{websiteReady:true,websiteBrief:{businessName:"Rosemary Gardens",faqs:[],services:[]}},
 previousDraft:ownerAddedFaq.draft
});
yes(rebuildWithoutOriginalFaqs.sections.find(s=>s.id==="faq")?.items.some(
 i=>i.title==="Can you help at weekends?"),"Owner-edited FAQ survives a later Brand Brain refresh");
const removeId=ownerAddedFaq.draft.sections.find(s=>s.id==="faq").items.find(
 i=>i.title==="Can you help at weekends?").id;
const ownerRemovedFaq=applyStructuredWebsiteEdit(ownerAddedFaq.draft,{
 action:"remove-item",sectionId:"faq",itemId:removeId,expectedTitle:"Can you help at weekends?"
});
yes(ownerRemovedFaq.applied,"Owner can remove an added FAQ privately");
const rebuildRemovedFaqs=buildWebsiteDraft({
 brandBrain:{websiteReady:true,websiteBrief:{businessName:"Rosemary Gardens",faqs:[],services:[]}},
 previousDraft:ownerRemovedFaq.draft
});
yes(!rebuildRemovedFaqs.sections.find(s=>s.id==="faq")?.items.some(
 i=>i.title==="Can you help at weekends?"),"Removed FAQ is not resurrected by a brief refresh");


const hero=edit({sectionId:"hero",field:"title",value:"Trusted coastal garden care"});
yes(hero.applied,"Hero heading edited by stable section ID");
yes(hero.draft.html.includes("Trusted coastal garden care"),"Updated hero heading in actual HTML");
eq(hero.draft.generation,owner.generation+1,"Every change creates new draft generation");
eq(hero.draft.publicStatus,"Not published","No automatic publication");
yes(hero.draft.designReview?.checks?.length>0,"Visual review regenerated");
eq(JSON.stringify(owner),original,"Original draft not mutated");

const about=edit({sectionId:"about",field:"body",value:"We work across Torbay and Brixham."});
yes(about.applied,"Direct about copy");
yes(about.draft.html.includes("We work across Torbay and Brixham."),"Direct about copy rendered");
const service=edit({sectionId:"services",itemId:"lawn",field:"body",value:"Lawn care on a schedule you choose."});
yes(service.applied,"Exact service edited");
yes(service.draft.html.includes("Lawn care on a schedule you choose."),"Service wording rendered");
const rename=edit({sectionId:"services",itemId:"lawn",field:"title",value:"Lawn and turf maintenance"});
yes(rename.applied,"Service title edited without changing stable item ID");
eq(rename.draft.sections.find(s=>s.id==="services").items[0].id,"lawn","Item identity stable");
const faq=edit({sectionId:"faq",itemId:"visits",field:"body",value:"Book the date that suits you."});
yes(faq.applied,"FAQ answer updated");
yes(faq.draft.html.includes("Book the date that suits you."),"FAQ answer rendered");
const question=edit({sectionId:"faq",itemId:"visits",field:"title",value:"How can I book?"});
yes(question.applied,"FAQ question changed");
const testimonial=edit({sectionId:"testimonials",itemId:"person",field:"body",value:"Very happy with their work."});
yes(testimonial.applied,"Owner can correct an existing testimonial without inventing one");
yes(testimonial.draft.html.includes("Very happy with their work."),"Existing testimonial re-rendered");
const contact=edit({sectionId:"contact",field:"email",value:"hello@rosemary.example"});
yes(contact.applied,"Owner changes contact email");
yes(contact.draft.html.includes("mailto:hello@rosemary.example"),"Updated contact visible and clickable");
const phone=edit({sectionId:"contact",field:"phone",value:"+44 1234 567890"});
yes(phone.applied,"Owner changes phone number");
yes(phone.draft.html.includes('href="tel:+441234567890"'),"Safe direct dial output");
const hours=edit({sectionId:"contact",field:"openingHours",value:"Monday to Friday, 9–5"});
yes(hours.applied,"Owner changes opening hours");
yes(hours.draft.html.includes("Monday to Friday, 9–5"),"Opening hours shown on page");
const cta=edit({sectionId:"hero",field:"cta",value:"Contact our team"});
yes(cta.applied,"Owner can edit the hero CTA label");
yes(cta.draft.html.includes("Contact our team"),"CTA label rendered");
const ctaTarget=edit({sectionId:"hero",field:"ctaHref",value:"#services"});
yes(ctaTarget.applied,"Owner can select safe existing internal CTA destination");
const blankBody=edit({sectionId:"about",field:"body",value:""});
yes(blankBody.applied,"Owner can remove obsolete copy from private draft");
const xss=edit({sectionId:"about",field:"body",value:'<script>alert("x")</script>'});
yes(xss.applied,"User-owned text is accepted as literal content");
yes(!xss.draft.html.includes("<script>"),"Script tag escaped in HTML");
yes(xss.draft.html.includes("&lt;script&gt;"),"Owner-owned markup displayed as escaped text");

for(const [patch,description] of [
 [{sectionId:"hero",field:"title",value:" "},"Empty heading rejected"],
 [{sectionId:"nonexistent",field:"body",value:"Anything"},"Unknown section rejected"],
 [{sectionId:"services",itemId:"nonexistent",field:"body",value:"Anything"},"Unknown item rejected"],
 [{sectionId:"services",itemId:"lawn",field:"uri",value:"https://bad.example/photo"},"Unapproved image field rejected"],
 [{sectionId:"hero",field:"asset",value:"https://bad.example/photo"},"Image replacement rejected"],
 [{sectionId:"hero",field:"ctaHref",value:"javascript:alert(1)"},"Unsafe CTA target rejected"],
 [{sectionId:"hero",field:"ctaHref",value:"https://bad.example"},"Unverified outside destination rejected"],
 [{sectionId:"hero",field:"ctaHref",value:"#missing"},"Missing target rejected"],
 [{sectionId:"contact",field:"email",value:"not-an-email"},"Invalid email rejected"],
 [{sectionId:"contact",field:"phone",value:"0123;rm -rf"},"Invalid phone rejected"],
 [{sectionId:"gallery",itemId:"pic",field:"body",value:"Own photo"},"Gallery metadata inaccessible"],
 [{sectionId:"hero",field:"title",value:"x".repeat(200)},"Unbounded heading rejected"],
 [{sectionId:"services",itemId:"lawn",field:"title",value:""},"Empty service rejected"],
]){
 const x=edit(patch);
 yes(!x.applied,description);
 eq(x.draft,owner,description+" leaves original draft");
}
const controller=read("src/app/AppController.js");
const screen=read("src/screens/websiteBuilder.js");
const directScreen=read("src/screens/websiteContentEditor.js");
for(const marker of ["const applyWebsiteFieldChange =","applyStructuredWebsiteEdit(websiteDraft, patch)","setWebsiteUndo(items=>","setWebsiteRedo([]);","applyWebsiteFieldChange,"]){
 yes(controller.includes(marker),"Direct editor history wiring: "+marker);
}
yes(screen.includes("<WebsiteContentEditor draft={draft} onApply={s.applyWebsiteFieldChange}/>"),"Simple website screen opens controlled direct editor");
yes(directScreen.includes("Save to private draft"),"No publication in screen");
yes(directScreen.includes("onApply({...selection,value})"),"Stable field IDs passed without parsing commands");
yes(!directScreen.includes("fetch(")&&!directScreen.includes("publishWebsite"),"Direct content editor cannot charge or publish");
console.log("V3.133 WEBSITE DIRECT EDIT PASS:",total,"literal field, item, render, identity, isolation-from-publish and source wiring assertions.");
