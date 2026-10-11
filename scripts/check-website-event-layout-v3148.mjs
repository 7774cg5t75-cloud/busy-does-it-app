import assert from "node:assert/strict";
import {planWebsiteDesign,photographicCount} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
const photo=(name,approved=true)=>({storagePath:"private/"+name+".jpg",approved});
const about="We prepare fresh food for our customers and plan each service carefully with the information they have shared. ".repeat(3);
const sections=[
 {id:"hero",type:"hero",title:"Welcome",body:"Your independent business",asset:photo("hero"),enabled:true},
 {id:"services",type:"services",items:[{title:"Service one",body:"A real supplied product"},
  {title:"Service two",body:"Another real service"}],enabled:true},
 {id:"gallery",type:"gallery",items:[photo("dish-a"),photo("dish-b")],enabled:true},
 {id:"about",type:"about",body:about,enabled:true},
 {id:"contact",type:"contact",email:"owner@example.test",enabled:true}
];
const make=(businessType,parts=sections,theme={})=>planWebsiteDesign({
 businessName:"Independent business",businessType,sections:parts,theme
});
const catering=make("Festival catering");
const cafe=make("Neighbourhood cafe");
assert.equal(catering.signals.eventCateringWithPhotos,true);
assert.equal(cafe.signals.eventCateringWithPhotos,false);
assert.ok(catering.sectionOrder.indexOf("services")<catering.sectionOrder.indexOf("about"));
assert.ok(catering.sectionOrder.indexOf("gallery")<catering.sectionOrder.indexOf("about"));
assert.ok(cafe.sectionOrder.indexOf("about")<cafe.sectionOrder.indexOf("services"));
assert.ok(catering.homeSectionIds.includes("gallery"),"Confirmed menu/gallery appears on event-catering home");
assert.ok(!cafe.homeSectionIds.includes("gallery"),"Cafe is allowed a more editorial story-led home");
assert.ok(catering.explanation.includes("Approved event-food photos"));
const unchanged=JSON.stringify(sections);
assert.deepEqual(make("Festival catering"),catering,"Design is deterministic, not randomly swapped per visit");
assert.equal(JSON.stringify(sections),unchanged,"Planning cannot change the owner draft");
const withoutPhotos=sections.map(s=>s.id==="hero"?{...s,asset:null}:
 s.id==="gallery"?{...s,items:[]}:s);
const sparse=make("Festival catering",withoutPhotos);
assert.equal(sparse.signals.eventCateringWithPhotos,false);
assert.ok(!sparse.explanation.includes("Approved event-food photos"));
const unapproved=sections.map(s=>s.id==="hero"?{...s,asset:null}:
 s.id==="gallery"?{...s,items:[photo("reject-a",false),photo("reject-b",false)]}:s);
assert.equal(photographicCount(unapproved),0,"Never promote unapproved photos");
assert.equal(make("Festival catering",unapproved).signals.eventCateringWithPhotos,false);
const custom=make("Festival catering",sections,{
 sectionOrder:["hero","about","services","gallery","contact"]});
assert.ok(custom.sectionOrder.indexOf("about")<custom.sectionOrder.indexOf("services"),
 "Explicit owner section arrangement still wins");
const trades=make("Electrician");
assert.equal(trades.sector,"trades");
assert.equal(trades.signals.eventCateringWithPhotos,false);
console.log("V3.148 BUSINESS PASS: content-grounded catering visual priority, cafe distinction, owner overrides, no unapproved imagery or fabricated claims.");
