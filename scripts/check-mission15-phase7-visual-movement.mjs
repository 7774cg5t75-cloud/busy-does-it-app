import assert from 'node:assert/strict';
import {websiteBuilderTestHarnessV3222} from './lib/website-builder-test-harness-v3222.mjs';
import {websiteMovementOptions,resolveWebsiteMovement,installWebsiteMovement} from '../src/core/websiteVisualMovement.mjs';
import {makeTapToEditHtml} from '../src/core/websiteTapToEdit.mjs';
const {buildWebsiteDraft,applyWebsiteLayoutChange,renderWebsiteHtml}=websiteBuilderTestHarnessV3222(['buildWebsiteDraft','applyWebsiteLayoutChange','renderWebsiteHtml']);
const draft=buildWebsiteDraft({businessId:'fictional',brandBrain:{websiteReady:true,websiteBrief:{businessName:'Fictional Workshop',about:'Fictional local fixture.',description:'Fictional services.',email:'owner@example.test',services:[{name:'Design',description:'Discuss a design.'}],faqs:[{question:'Where?',answer:'Ask us.'}]}}});
const source='fixture:owner:business:'+draft.id+':'+draft.generation;
const editableHtml=renderWebsiteHtml(draft,'home',{editablePreview:true});
const options=websiteMovementOptions(draft,'home',source,editableHtml);
assert.ok(options.moves.length>0);
assert.ok(!options.order.includes('gallery'),'Empty gallery is not a visible drop destination');
assert.equal(websiteMovementOptions(draft,'home',source),null,'Missing actual rendered source fails closed');
assert.ok(options.moves.every(m=>m.sectionId!=='hero'&&!(m.targetSectionId==='hero'&&m.position==='before')));
assert.equal(websiteMovementOptions(draft,'contact',source,editableHtml),null);
const move=options.moves[0],message={channel:options.channel,sourceKey:source,...move};
const resolved=resolveWebsiteMovement(draft,'home',source,message,editableHtml);assert.ok(resolved);
assert.equal(resolveWebsiteMovement(draft,'home',source+'new',message,editableHtml),null);
assert.equal(resolveWebsiteMovement(draft,'home',source,{...message,evil:'css'},editableHtml),null);
assert.equal(resolveWebsiteMovement(draft,'home',source,{...message,sectionId:'hero'},editableHtml),null);
const locked={...draft,theme:{...draft.theme,lockedSections:['all']}};
assert.equal(websiteMovementOptions(locked,'home',source,editableHtml).moves.length,0);
assert.equal(resolveWebsiteMovement(locked,'home',source,message,editableHtml),null);
const result=applyWebsiteLayoutChange(draft,{action:'move-relative',pageId:'home',...move});
assert.ok(result.applied);assert.equal(result.draft.generation,draft.generation+1);
const html=renderWebsiteHtml(result.draft,'home');
assert.ok(move.position==='before'?html.indexOf('id="'+move.sectionId+'"')<html.indexOf('id="'+move.targetSectionId+'"'):html.indexOf('id="'+move.sectionId+'"')>html.indexOf('id="'+move.targetSectionId+'"'));
assert.ok(!html.includes('busy-section-move'),'normal public HTML has no editor controls');
const edited=makeTapToEditHtml(renderWebsiteHtml(draft,'home',{editablePreview:true}),options);
assert.ok(edited.includes('pointercancel'));assert.ok(!edited.includes('undefined.toString'));
// Execute the actual installed gesture function with inert DOM/event boundaries.
// These are behavioural event fixtures, not browser or touch-device acceptance.
const events={},windowEvents={},sent=[],nodes={};
function node(id){return {id,attrs:{},listeners:{},children:[],textContent:'',firstChild:null,
 setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},
 addEventListener(k,fn){this.listeners[k]=fn;},insertBefore(n){this.children.push(n);},
 appendChild(n){this.children.push(n);},getBoundingClientRect(){return {top:100,height:100};},
 closest(){return this;},setPointerCapture(){}};}
for(const id of options.order)nodes[id]=node(id);
let hit=nodes[move.targetSectionId];
globalThis.document={body:node('body'),createElement:()=>node(''),getElementById:id=>nodes[id],elementFromPoint:()=>hit,addEventListener:(k,fn)=>events[k]=fn};
globalThis.window={ReactNativeWebView:{postMessage:x=>sent.push(JSON.parse(x))},addEventListener:(k,fn)=>windowEvents[k]=fn};
const e=(more={})=>({isPrimary:true,button:0,pointerId:4,clientX:5,clientY:110,preventDefault(){},stopPropagation(){},...more});
installWebsiteMovement(options);
const handle=nodes[move.sectionId].children[0];assert.ok(handle);
assert.equal(nodes.hero.children.length,0,'hero has no drag handle');
handle.listeners.pointerdown(e());events.pointermove(e({clientY:move.position==='before'?120:190}));
assert.equal(nodes[move.targetSectionId].attrs['data-busy-drop'],move.position);
events.pointercancel(e());events.pointerup(e());assert.equal(sent.length,0,'cancel cannot save');
handle.listeners.pointerdown(e());events.pointermove(e({clientY:move.position==='before'?120:190}));windowEvents.blur();events.pointerup(e());assert.equal(sent.length,0,'blur cancels');
handle.listeners.pointerdown(e());events.pointermove(e({clientY:move.position==='before'?120:190}));events.pointerup(e());
assert.deepEqual(sent,[message]);events.pointerup(e());assert.equal(sent.length,1,'release is idempotent');
installWebsiteMovement(options);const keyboard=nodes[move.sectionId].children.at(-1);
keyboard.listeners.keydown(e({key:move.position==='before'?'ArrowUp':'ArrowDown'}));assert.equal(sent.length,2);
assert.ok(resolveWebsiteMovement(draft,'home',source,sent[1],editableHtml));
delete globalThis.window;delete globalThis.document;
console.log('PASS: canonical rendered ordering, source/locks/page guards, pointer drop/cancel/blur, keyboard alternative and one-shot save; inert DOM only.');
