import {createOwnerEditNavigation} from '../src/core/ownerEditNavigation.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkPrivateWebsiteDraftCommit as check} from '../src/core/privateWebsiteDraftCommit.mjs';
const current={businessId:'business-a',id:'site',generation:4,publicStatus:'Published separately',sections:[{id:'hero',type:'hero',title:'Owner title',enabled:true}],theme:{}};
const candidate={...current,generation:5,sections:[{...current.sections[0],title:'Reviewed title'}]};
const args={current,candidate,live:current,scopeCurrent:true,businessId:'business-a'};
assert.equal(check(args).applied,true);
for(const changed of [{scopeCurrent:false},{live:{...current}},{candidate:{...candidate,id:'foreign'}},{candidate:{...candidate,generation:4}},{candidate:{...candidate,businessId:'foreign'}},{candidate:{...candidate,business_id:'foreign'}},{candidate:{...candidate,publicStatus:'New live status'}}])assert.equal(check({...args,...changed}).applied,false);
const locked={...current,theme:{lockedSections:['hero']}};assert.equal(check({...args,current:locked,live:locked,candidate:{...candidate,theme:locked.theme}}).applied,false);
// Run the actual shared controller commit boundary and require immediate ref
// update before a second event from the same render can try to apply again.
const source=readFileSync('src/app/AppController.js','utf8');const a=source.indexOf('  const commitReviewedBuilderDraft='),b=source.indexOf('  // V3.192',a);const ref={current},state={undo:[],redo:[{}]},notices=[];
const fn=Function('checkPrivateWebsiteDraftCommit','websiteDraftRef','websiteHistoryIsCurrent','websiteHistoryScope','setWebsiteBuilderNotice','setWebsiteUndo','setWebsiteRedo','setWebsiteDraft','ownerEditNavigation',source.slice(a,b)+';return commitReviewedBuilderDraft;')(check,ref,()=>true,{businessId:'business-a'},x=>notices.push(x),v=>{state.undo=v(state.undo);},v=>{state.redo=v;},v=>{state.draft=v;},{current:createOwnerEditNavigation({getScope:()=>"fixture",confirm:()=>{throw Error('No dirty editor in this baseline');}})});
assert.equal(fn(current,candidate,'Kept private'),true);assert.equal(ref.current,candidate);assert.equal(state.undo.length,1);assert.equal(state.redo.length,0);assert.equal(fn(current,candidate,'Repeat'),false);assert.equal(state.undo.length,1);
console.log('PASS: shared website commit exact-source, tenant aliases, generation, status/lock protection and actual synchronous controller duplicate rejection. Simulated local state only.');
