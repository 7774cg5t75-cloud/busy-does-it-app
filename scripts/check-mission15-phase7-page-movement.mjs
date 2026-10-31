import assert from 'node:assert/strict';
import {websiteBuilderTestHarnessV3222} from './lib/website-builder-test-harness-v3222.mjs';
import {websiteMovementOptions,resolveWebsiteMovement} from '../src/core/websiteVisualMovement.mjs';
import {planSelectedWebsiteChanges,prepareSelectedWebsiteTransaction} from '../src/core/websiteContextPlan.mjs';
const {buildWebsiteDraft,applyWebsitePageChange,applyWebsiteLayoutChange,applyStructuredWebsiteEdit,renderWebsiteHtml}=websiteBuilderTestHarnessV3222(['buildWebsiteDraft','applyWebsitePageChange','applyWebsiteLayoutChange','applyStructuredWebsiteEdit','renderWebsiteHtml']);
let draft=buildWebsiteDraft({brandBrain:{websiteReady:true,websiteBrief:{businessName:'Fictional Studio',about:'Fictional copy.'}}});
draft=applyWebsitePageChange(draft,{action:'create-page',title:'Our workshop',body:'The first section.'}).draft;
const pageId=draft.customPages[0].id;
for(const title of ['Our team','Our approach'])draft=applyWebsitePageChange(draft,{action:'add-page-section',pageId,title,body:title+' fictional copy.'}).draft;
const page=draft.pages.find(p=>p.id===pageId),original=JSON.stringify(draft),home=renderWebsiteHtml(draft,'home'),html=renderWebsiteHtml(draft,pageId,{editablePreview:true}),options=websiteMovementOptions(draft,pageId,'current-source',html);
assert.ok(options.moves.length);const [first,second,last]=page.sectionIds;
const message={channel:options.channel,sourceKey:options.sourceKey,sectionId:last,targetSectionId:first,position:'before'};
const resolved=resolveWebsiteMovement(draft,pageId,'current-source',message,html);assert.ok(resolved);
const plan=planSelectedWebsiteChanges(draft,pageId,resolved.selection,resolved.instruction);assert.ok(plan.ok);
const result=prepareSelectedWebsiteTransaction(draft,plan,{fieldEdit:applyStructuredWebsiteEdit,layoutEdit:applyWebsiteLayoutChange});assert.ok(result.applied,result.reason);
assert.deepEqual(result.draft.pages.find(p=>p.id===pageId).sectionIds,[last,first,second]);
const moved=renderWebsiteHtml(result.draft,pageId);assert.ok(moved.indexOf('id="'+last+'"')<moved.indexOf('id="'+first+'"'));
assert.equal(renderWebsiteHtml(result.draft,'home'),home,'Destination-specific order does not rewrite home');assert.equal(JSON.stringify(draft),original,'Source remains exact Undo input');
assert.deepEqual(JSON.parse(JSON.stringify(result.draft)).customPages,result.draft.customPages,'Order survives reload');
const locked={...draft,theme:{...draft.theme,lockedSections:[second]}};
assert.equal(applyWebsiteLayoutChange(locked,{action:'move-relative',pageId,sectionId:last,targetSectionId:first,position:'before'}).applied,false,'Displaced locked placement prevents the whole batch');
assert.equal(applyWebsiteLayoutChange(draft,{action:'move-relative',pageId,sectionId:last,targetSectionId:'hero',position:'after'}).applied,false,'No cross-page drag');
console.log('PASS actual owner-page relative movement reuses original page operations, source-bound selected plan, real HTML order, reload, independent home, locks and atomic rejection. Offline only.');

for(const [direction,expected] of [['first',[last,first,second]],['last',[first,last,second]]]){
 const id=direction==='first'?last:second;
 const moved=applyWebsitePageChange(draft,{action:'move-page-section',pageId,sectionId:id,direction,expectedWebsiteId:draft.id,expectedGeneration:draft.generation});
 assert.equal(moved.applied,true,moved.reason);assert.deepEqual(moved.draft.customPages[0].sectionIds,expected);
 assert.equal(renderWebsiteHtml(moved.draft,'home'),home);assert.equal(JSON.stringify(draft),original);
 assert.equal(applyWebsitePageChange(locked,{action:'move-page-section',pageId,sectionId:id,direction}).applied,false);
}
assert.equal(applyWebsitePageChange(draft,{action:'move-page-section',pageId,sectionId:last,direction:'first',expectedWebsiteId:draft.id,expectedGeneration:-99}).applied,false);
