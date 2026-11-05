import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {websiteBuilderTestHarnessV3222} from './lib/website-builder-test-harness-v3222.mjs';
import {websiteIndividualityInstructions} from '../src/core/websiteCreativeBrief.mjs';
import {prepareWebsiteRequest} from '../src/core/websiteRequestPlan.mjs';
import {privateWebsiteDraftAction} from '../supabase/functions/busy-website-publish/privateDraftService.mjs';
process.env.BUSY_STORY_IMPORTED='1';const {storyDeps}=await import('./check-website-authentic-story.mjs');delete process.env.BUSY_STORY_IMPORTED;
const api=websiteBuilderTestHarnessV3222(['rebuildPrivateWebsiteDraft','renderWebsiteHtml','applyWebsiteLayoutChange']);
const root='.test-artifacts/website-creative',manifest=JSON.parse(readFileSync(root+'/scenarios.json'));
for(const row of manifest.scenarios.filter(x=>Number(x.id)<6)){
 // Fresh isolated fixture built from the previous reviewed candidate; never an inferred account save.
 const d=api.rebuildPrivateWebsiteDraft(JSON.parse(readFileSync(root+'/'+row.id+'-approved.json'))),context={website:d,ownerId:row.reviewedPlanBinding.ownerId,businessId:d.businessId,profileRevision:row.reviewedPlanBinding.profileRevision};
 const proposal=websiteIndividualityInstructions(context,'Keep my wording but redesign the page');assert.equal(proposal.ok,true,proposal.reason);
 const p=prepareWebsiteRequest(d,{draftId:d.id,pageId:'home',generation:d.generation,instruction:proposal.instruction},storyDeps);assert.equal(p.ok,true,p.reason);const next=JSON.parse(p.boundaries.at(-1));
 assert.deepEqual(next.sections,d.sections);const {pageDirection,...theme}=next.theme;assert.deepEqual(theme,d.theme);assert.equal(pageDirection,proposal.direction);assert.equal(next.publish.enabled,false);
 writeFileSync(root+'/'+row.id+'-before.json',JSON.stringify(d));writeFileSync(root+'/'+row.id+'-approved.json',p.boundaries.at(-1));writeFileSync(root+'/'+row.id+'-before.html',p.originalHtml);writeFileSync(root+'/'+row.id+'-after.html',p.candidateHtml);
 row.reviewedPlanBinding={...row.reviewedPlanBinding,projectId:p.draftId,sourceRevision:p.generation,candidateRevision:p.generation+p.groups.length};row.comparison='Same approved source, source-bound whole-page direction only. No provider result or account-save receipt.';
 if(Number(row.id)%2===1){const n=String(11+Math.floor(Number(row.id)/2));writeFileSync(root+'/'+n+'-before.json',JSON.stringify(d));writeFileSync(root+'/'+n+'-approved.json',p.boundaries.at(-1));writeFileSync(root+'/'+n+'-before.html',p.originalHtml);writeFileSync(root+'/'+n+'-after.html',p.candidateHtml);const control=manifest.scenarios.find(x=>x.id===n);control.comparison='Identical approved source facts/assets; original standard direction versus reviewed whole-page direction. Configuration change, not a CSS-only comparison.';}
 // Actual original private service: source CAS, saved candidate and independent readback.
 let stored=d,writes=0;
 const saved=await privateWebsiteDraftAction({action:'website_edit_instruction',body:{businessId:d.businessId,expectedRevision:2,expectedDraft:d,ownerApproved:true,patch:{pageId:'home',generation:d.generation,instruction:proposal.instruction}},userId:context.ownerId,read:()=>({actorId:context.ownerId,businessId:d.businessId,revision:2,profileRevision:1,websiteDraft:stored}),commit:async args=>{writes++;stored=args.p_candidate;}});
 assert.equal(writes,1);assert.equal(stored.theme.pageDirection,pageDirection);assert.equal(api.renderWebsiteHtml(stored),p.candidateHtml);assert.equal(websiteIndividualityInstructions({...context,website:{...d,businessId:'foreign'}},'Keep my wording but redesign the page').ok,false);
 const locked={...d,theme:{...d.theme,lockedSections:['hero']}};assert.equal(api.applyWebsiteLayoutChange(locked,{action:'style',field:'pageDirection',value:proposal.direction}).applied,false);
 assert.equal(api.applyWebsiteLayoutChange(d,{action:'style',field:'pageDirection',value:'evil-css'}).applied,false);assert.equal(websiteIndividualityInstructions(context,'Send a campaign and accept bookings').ok,false);
}
// Same-industry comparisons use supported context and held wording. No random or industry-only assignment.
for(const row of manifest.scenarios.filter(x=>Number(x.id)>=6&&Number(x.id)<=10)){
 const d=api.rebuildPrivateWebsiteDraft(JSON.parse(readFileSync(root+'/'+row.id+'-approved.json'))),context={website:d,ownerId:'fixture-owner',businessId:d.businessId,profileRevision:1},q=websiteIndividualityInstructions(context,'Show me a more creative approach');assert.equal(q.ok,true);
 const p=prepareWebsiteRequest(d,{draftId:d.id,pageId:'home',generation:d.generation,instruction:q.instruction},storyDeps);assert.equal(p.ok,true,p.reason);writeFileSync(root+'/'+row.id+'-before.json',JSON.stringify(d));writeFileSync(root+'/'+row.id+'-approved.json',p.boundaries.at(-1));writeFileSync(root+'/'+row.id+'-before.html',p.originalHtml);writeFileSync(root+'/'+row.id+'-after.html',p.candidateHtml);row.comparison='Same facts/assets, reviewed whole-page direction. Existing sparse scaffolding is retained honestly.';
}
writeFileSync(root+'/scenarios.json',JSON.stringify(manifest,null,2));console.log('PASS six source-held whole-page journeys, five same-industry studies, original private save/readback, unchanged source sections/brand/words/images, locked/foreign/unknown denial and no new hero/provider/publication.');
