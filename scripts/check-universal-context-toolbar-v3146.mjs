import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ACTION_CHANNEL,contextualToolbarPolicy,resolveContextualToolbarAction} from "../src/core/contextualEditingCore.mjs";
import {CHANNEL,makeTapToEditHtml,resolveTapToolbarAction} from "../src/core/websiteTapToEdit.mjs";
import {interpretSelectedWebsiteRequest} from "../src/core/websiteContextualEdit.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
for(const [field,kind,primary] of [["section","section","Adjust"],["photo","picture","Replace"],["title","heading","Edit"],["body","text","Edit"],["cta","button","Edit"],["email","text","Edit"]]){
 const p=contextualToolbarPolicy(field);
 assert.equal(p.kind,kind);
 assert.equal(p.primary,primary);
 assert.deepEqual(p.actions,["edit","voice","more"]);
}
assert.equal(contextualToolbarPolicy("rawHtml"),null);
const photo={id:"img1",approved:true,storagePath:"private/photo1.jpg"};
const draft={id:"tenant-a-private",generation:14,publicStatus:"Not published",
 pages:[{id:"home",enabled:true,sectionIds:["hero","services","gallery"]}],
 sections:[{id:"hero",type:"hero",enabled:true,title:"Example",asset:photo},
 {id:"services",type:"services",enabled:true,items:[{id:"design",title:"Garden design",body:"We design gardens"}]},
 {id:"gallery",type:"gallery",enabled:true,items:[photo]}]};
const raw=(field,action="edit",sectionId="hero",itemId="",photoIndex="")=>({
 channel:CHANNEL,actionChannel:ACTION_CHANNEL,action,field,sectionId,itemId,photoIndex
});
const original=JSON.stringify(draft);
for(const action of ["edit","voice","more"]){
 const resolved=resolveTapToolbarAction(draft,"home",raw("title",action));
 assert.equal(resolved.action,action);
 assert.equal(resolved.policy.kind,"heading");
 assert.deepEqual(resolved.selection,{sectionId:"hero",field:"title",itemId:null});
}
assert.equal(resolveTapToolbarAction(draft,"home",raw("photo","voice")).policy.kind,"picture");
assert.equal(resolveTapToolbarAction(draft,"home",raw("section","voice")).selection.field,"section");
const gallery=resolveTapToolbarAction(draft,"home",raw("photo","edit","gallery","","0"));
assert.equal(gallery.selection.photoIndex,0);
assert.equal(resolveTapToolbarAction(draft,"home",raw("title","more","services","design")).selection.itemId,"design");
for(const msg of [
 {...raw("title"),action:"select"}, {...raw("title"),action:"publish"},
 {...raw("title"),actionChannel:"something-else"}, {...raw("title"),channel:"invalid"},
 raw("photo","voice","gallery","","100"),raw("photo","voice","hero","","0"),
 raw("title","edit","services","nonexistent"),raw("script","more"),
 raw("title","edit","unknown"),raw("title","more","hero","hidden"),
 {...raw("title"),extra:"x".repeat(1000)}
])assert.equal(resolveTapToolbarAction(draft,"home",msg),null,"Forged/unsupported toolbar message");
assert.equal(resolveTapToolbarAction(draft,"other-page",raw("title")),null);
assert.equal(resolveContextualToolbarAction({actionChannel:ACTION_CHANNEL,action:"edit"},()=>null),null);
assert.equal(JSON.stringify(draft),original,"Selection cannot mutate draft");
const marked='<!doctype html><html><head></head><body><main>'+
 '<h1 data-busy-edit-section="hero" data-busy-edit-field="title" data-busy-edit-item="" data-busy-edit-photo-index="">Garden design</h1>'+
 '</main></body></html>';
const privateHtml=makeTapToEditHtml(marked);
for(const snippet of ['className="busy-selection-toolbar"','data-action','busy-selected-for-edit','window.ReactNativeWebView.postMessage'])
 assert.ok(privateHtml.includes(snippet),"Private contextual toolbar "+snippet);
assert.ok(!marked.includes("busy-selection-toolbar")&&!marked.includes("ReactNativeWebView"));
const screen=read("src/screens/websiteBuilder.js");
assert.ok(screen.includes("resolveTapToolbarAction(draft,activePage?.id"));
assert.ok(screen.includes("initialMode:resolved.action"));
assert.ok(screen.includes('onTranscribe={s.transcribeSelectedWebsiteAudio}'));
assert.ok(screen.includes("javaScriptEnabled={tapEditMode||visualCheckOn||candidateCheckOn}"));
const modal=read("src/screens/websiteTapEditor.js");
assert.ok(modal.includes('setShowContextHelp(initialMode==="voice")'));
assert.ok(modal.includes('setShowSectionDesign(initialMode==="more"||selection?.field==="section")'));
assert.ok(modal.includes('setShowPhotoChoices(initialMode==="edit"&&selection?.field==="photo")'));
assert.ok(modal.includes('startImmediately={initialMode==="voice"}'));
const mic=read("src/screens/websiteSelectedVoice.js");
assert.ok(mic.includes('if(startImmediately&&!autoStarted.current)'));
assert.ok(mic.includes("void start()"));
assert.ok(mic.includes('stage!=="review"'),"Recording still requires deliberate send");
assert.ok(!privateHtml.includes("fetch("),"Toolbar never sends audio or business data");
const instruction=interpretSelectedWebsiteRequest(draft,"home",
 {sectionId:"hero",field:"title",pageId:"home",generation:draft.generation,
 itemId:null,photoIndex:-1},"Make this heading bigger");
assert.ok(instruction.ok&&instruction.change.sectionId==="hero");
console.log("V3.146 CORE PASS: reusable policy, tenant/page/section validation, no mutation, focused voice and photo controls.");
