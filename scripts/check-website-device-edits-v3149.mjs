import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {applyWebsiteLayoutOperation} from "../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs";
import {interpretSelectedWebsiteRequest} from "../src/core/websiteContextualEdit.mjs";
import {MAX_STEPS} from "../src/core/websiteContextPlan.mjs";
import {designCss,designForWebsite} from "../supabase/functions/busy-website-worker/designSystem.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const d={id:"tenant-a",generation:5,pages:[{id:"home",enabled:true,sectionIds:["hero","gallery"]}],
 sections:[{id:"hero",type:"hero",title:"Welcome",enabled:true},{id:"gallery",type:"gallery",
 enabled:true,items:[{id:"p1",approved:true,storagePath:"tenant-a/p1.jpg"}]}]};
let copy=d;
for(const [id,field,value] of [["hero","mobileHeadingScale","compact"],["hero","desktopHeadingScale","large"],
 ["gallery","mobileGallerySize","large"],["gallery","desktopGallerySize","compact"]]){
 const result=applyWebsiteLayoutOperation(copy,{action:"section-style",sectionId:id,field,value});
 assert.equal(result.applied,true,result.reason);copy=result.draft;
 assert.equal(copy.sections.find(x=>x.id===id).appearance[field],value);
}
assert.equal(d.sections[0].appearance,undefined);
assert.equal(applyWebsiteLayoutOperation(copy,{action:"section-style",sectionId:"hero",
 field:"mobileHeadingScale",value:"javascript:alert(1)"}).applied,false);
assert.equal(applyWebsiteLayoutOperation(copy,{action:"section-style",sectionId:"hero",
 field:"mobileGallerySize",value:"large"}).applied,false);
const s={pageId:"home",sectionId:"hero",field:"title",generation:5,itemId:null,photoIndex:-1};
const result=interpretSelectedWebsiteRequest(d,"home",s,"make this heading smaller on phones");
assert.equal(result.ok,true,result.reason);
assert.equal(result.change.field,"mobileHeadingScale");
const gallery=interpretSelectedWebsiteRequest(d,"home",{...s,sectionId:"gallery",
 field:"photo",photoIndex:0},"make this photo bigger on desktop");
assert.equal(gallery.ok,true,gallery.reason);
assert.equal(gallery.change.field,"desktopGallerySize");
assert.equal(MAX_STEPS,5);
const css=designCss(designForWebsite({businessType:"Catering"}));
for(const token of ["owner-mobile-heading-compact","owner-desktop-heading-large",
 "owner-mobile-gallery-large","owner-desktop-gallery-compact"])assert.ok(css.includes(token));
for(const path of ["src/domain/websiteBuilder.js","supabase/functions/busy-website-worker/index.ts"]){
 const source=read(path);
 assert.ok(source.includes('mobileHeadingScale:["compact","large"]'));
 assert.ok(source.includes('desktopGallerySize:"desktop-gallery"'));
}
console.log("V3.149 DEVICE PASS: phone and desktop heading/gallery choices, finite parser, native/hosted parity.");
