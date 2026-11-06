import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildWebsiteDraft,applyWebsitePageChange,renderWebsiteHtml,rebuildPrivateWebsiteDraft} from '../src/domain/websiteBuilder.js';
import {prepareWholeWebsite,prepareWholeWebsiteRefinement,isCurrentWholeWebsite,keepWholeWebsite} from '../src/core/wholeWebsitePlan.mjs';
import {wholeSiteOperationCount} from '../supabase/functions/busy-website-worker/websiteWholeSite.mjs';
import {websiteRequestContent} from '../src/core/websiteRequestPlan.mjs';
import {mission16Fixture} from './lib/mission16-site-fixtures.mjs';
const deps={pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml},copy=x=>JSON.parse(JSON.stringify(x));
let count=0;
async function test(name,fn){await fn();count++;console.log('PASS '+name);}
const words=d=>d.sections.filter(s=>!s.pageOnly).map(s=>[s.id,s.title,s.body,s.items,s.asset,s.appearance]);
const brand=d=>Object.fromEntries(Object.entries(d.theme).filter(([key])=>key!=='sectionOrder'));
function operation(c,extra){return {expectedWebsiteId:c.website.id,expectedGeneration:c.website.generation,expectedBusinessId:c.businessId,expectedProfileRevision:c.profileRevision,...extra};}
await test('three rich and three sparse original sources keep exact facts, styles and zero provider use',()=>{
 for(const i of [0,1,2])for(const sparse of [false,true]){
  const c=mission16Fixture(i,{sparse}),before=JSON.stringify(c),r=prepareWholeWebsite(c,deps);assert.equal(r.ok,true,r.reason);assert.equal(JSON.stringify(c),before);assert.equal(r.candidate.sitePresentation,'purposeful-v1');assert.deepEqual(words(r.candidate),words(c.website));assert.deepEqual(brand(r.candidate),brand(c.website));assert.equal(r.candidate.generation,c.website.generation+1);assert.equal(r.providerCalls,0);assert.equal(r.stats.measuredProviderCost,null);assert.ok(r.pages.length<=10);
  for(const p of r.candidate.customPages){assert.equal(p.sectionIds.length,1);const body=r.candidate.sections.find(s=>s.id===p.sectionIds[0]).body;assert.equal(body,p.sourceServiceSnapshot.body);assert.ok(r.previews[p.id].includes(p.sourceServiceSnapshot.body.split('\n\n')[0]));}
 }
});
await test('one original create per detail and one original relative menu move stay inside the ten-operation bound',()=>{
 const c=mission16Fixture(1),ids=c.website.sections.find(s=>s.id==='services').items.map(s=>s.id);assert.equal(wholeSiteOperationCount(c.website,ids),4);
 const before=c.website.pages.find(p=>p.id==='home').sectionIds,r=prepareWholeWebsite(c,deps),after=r.candidate.pages.find(p=>p.id==='home').sectionIds;
 assert.ok(before.indexOf('products')>before.indexOf('hero')+1);assert.equal(after.indexOf('products'),after.indexOf('hero')+1);assert.deepEqual(after.filter(id=>id!=='products'),before.filter(id=>id!=='products'));assert.equal(r.candidate.generation,c.website.generation+1);assert.deepEqual(r.candidate.sections.find(s=>s.id==='products'),c.website.sections.find(s=>s.id==='products'));
});
await test('explicit owner section order is preserved until the owner asks to bring the menu forward',()=>{
 const c=mission16Fixture(1);c.website.theme.sectionOrder=c.website.sections.map(s=>s.id);c.website=rebuildPrivateWebsiteDraft(c.website);const r=prepareWholeWebsite(c,deps);assert.equal(r.ok,true,r.reason);assert.deepEqual(r.candidate.pages.find(p=>p.id==='home').sectionIds,c.website.pages.find(p=>p.id==='home').sectionIds);
 const current={...c,website:r.candidate},menu=prepareWholeWebsiteRefinement(current,'Bring our menu forward',deps);assert.equal(menu.ok,true,menu.reason);const ids=menu.candidate.pages.find(p=>p.id==='home').sectionIds;assert.equal(ids.indexOf('products'),ids.indexOf('hero')+1);assert.deepEqual(words(menu.candidate),words(current.website));assert.equal(prepareWholeWebsiteRefinement({...current,website:menu.candidate},'Put the menu first',deps).ok,false);
});
await test('an existing locked presentation is not silently adopted or reverted',()=>{
 const c=mission16Fixture(0);c.website.theme.lockedSections=['hero'];const r=prepareWholeWebsite(c,deps);assert.equal(r.ok,true,r.reason);assert.equal(Object.hasOwn(r.candidate,'sitePresentation'),false);assert.deepEqual(r.candidate.sections.find(s=>s.id==='hero'),c.website.sections.find(s=>s.id==='hero'));assert.equal(prepareWholeWebsiteRefinement({...c,website:r.candidate},'Make my website feel more individual',deps).ok,false);
 const original=mission16Fixture(2),newSite=prepareWholeWebsite(original,deps).candidate;newSite.theme.lockedSections=['hero'];const html=renderWebsiteHtml(newSite,newSite.customPages[0].id,{standalone:true,privatePagePreview:true});assert.match(html,/purpose-service-opening/);assert.equal(newSite.sitePresentation,'purposeful-v1');
});
await test('legacy model can receive reviewed page purposes once, without source rewrites or no-op acceptance',()=>{
 const c=mission16Fixture(2),r=prepareWholeWebsite(c,deps);delete r.candidate.sitePresentation;const current={...c,website:r.candidate},before=words(current.website),next=prepareWholeWebsite(current,deps);assert.equal(next.ok,true,next.reason);assert.equal(next.operation.action,'refine-site-pages');assert.equal(next.operation.direction,'purposeful');assert.deepEqual(words(next.candidate),before);assert.equal(prepareWholeWebsite({...current,website:next.candidate},deps).ok,false);assert.equal(prepareWholeWebsiteRefinement({...current,website:next.candidate},'Improve the whole website',deps).ok,false);
});
await test('future presentation metadata is never downgraded or writable by arbitrary patch fields',()=>{
 const c=mission16Fixture(2);c.website.sitePresentation='future-owner-presentation';assert.equal(prepareWholeWebsite(c,deps).ok,false);assert.equal(prepareWholeWebsiteRefinement(c,'Make my website feel more individual',deps).ok,false);
 const plain=mission16Fixture(2);for(const extra of [{sitePresentation:'purposeful-v1'},{providerEnabled:true},{publish:true},{direction:'arbitrary-css'}])assert.equal(applyWebsitePageChange(plain.website,operation(plain,{action:'refine-site-pages',direction:'purposeful',...extra})).applied,false);
});
await test('source paragraph bytes, owner titles, crops and per-item typography survive page composition',()=>{
 const c=mission16Fixture(0),services=c.website.sections.find(s=>s.id==='services');services.items[0].body=services.items[0].body.replace('\n\n','\n\n\n');services.items[0].appearance={headingWeight:'regular'};c.website.sections.find(s=>s.id==='about').title='Our deliberate owner title';c.website.sections.find(s=>s.id==='about').ownerEditedFields=['title'];const r=prepareWholeWebsite(c,deps);assert.equal(r.ok,true,r.reason);const page=r.candidate.customPages.find(p=>p.sourceServiceId===services.items[0].id);assert.equal(r.candidate.sections.find(s=>s.id===page.sectionIds[0]).body,services.items[0].body);assert.deepEqual(words(r.candidate),words(c.website));assert.match(r.previews.about,/Our deliberate owner title/);assert.equal(r.candidate.theme.heroComposition,c.website.theme.heroComposition);
});
await test('new presentation remains source-bound, exact, one-use and non-replay after uncertain readback',async()=>{
 for(const change of [c=>{c.profileRevision++;},c=>{c.businessId='foreign';},c=>{c.website.sections.find(s=>s.id==='services').items[0].body+=' New source.';},c=>{c.website.sections.find(s=>s.id==='hero').title='New unsaved words';}]){
  let current=mission16Fixture(2);const review=prepareWholeWebsite(current,deps);current=copy(current);change(current);let calls=0;assert.equal(isCurrentWholeWebsite(review,current),false);assert.equal((await keepWholeWebsite(review,{getContext:()=>current,apply:()=>{calls++;}})).ok,false);assert.equal(calls,0);
 }
 let current=mission16Fixture(2);const review=prepareWholeWebsite(current,deps);let calls=0;const result=await keepWholeWebsite(review,{getContext:()=>current,apply:()=>{calls++;const edited=applyWebsitePageChange(current.website,review.operation);current={...current,website:edited.draft};return {applied:true,verifiedPrivateReadback:{ownerId:current.ownerId,businessId:current.businessId,recordHash:'a'.repeat(64),websiteDraft:copy(edited.draft)}};}});assert.equal(result.ok,true);assert.equal(result.accountSaved,true);assert.equal(websiteRequestContent(current.website),websiteRequestContent(review.candidate));assert.equal((await keepWholeWebsite(review,{getContext:()=>current,apply:()=>{calls++;}})).ok,false);assert.equal(calls,1);
 const c=mission16Fixture(2),unknown=prepareWholeWebsite(c,deps);const failure=await keepWholeWebsite(unknown,{getContext:()=>c,apply:()=>{throw Error('Synthetic lost acknowledgement');}});assert.equal(failure.unknown,true);assert.equal(failure.mayReplay,false);assert.equal((await keepWholeWebsite(unknown,{getContext:()=>c,apply:()=>{throw Error('Must never retry');}})).ok,false);
});
await test('reviewed AI Lab SQL and original fixture bytes remain unchanged',()=>{
 const sql=readFileSync('docs/sql-proposals/ai-lab-foundation/install.sql');assert.equal(createHash('sha256').update(sql).digest('hex'),'3ebf79cdcc5614d7be3573e0ecad68ae93ec8e5c3bf751fa2c0c6cbac5a9030b');
 const model=buildWebsiteDraft({brandBrain:{websiteBrief:{businessName:'Fictional example',description:'An exact supplied description.'}}});assert.equal(Object.hasOwn(model,'sitePresentation'),false);
});
await test('purposeful section capacity counts exact creates while retaining the original thirty-section boundary',()=>{
 for(const capacity of [29,30]){
  const c=mission16Fixture(0),first=c.website.sections.find(s=>s.id==='services').items[0];assert.match(first.body,/\n\s*\n/);
  while(c.website.sections.length<capacity)c.website.sections.push({id:'custom-retained-'+c.website.sections.length,type:'text',enabled:false,pageOnly:true,title:'Retained owner note',body:'Exact retained fixture wording.'});
  const before=JSON.stringify(c.website),result=applyWebsitePageChange(c.website,operation(c,{action:'compose-service-pages',serviceIds:[first.id]}));
  assert.equal(result.applied,capacity===29,result.reason);assert.equal(JSON.stringify(c.website),before);
  if(capacity===29){assert.equal(result.draft.sections.length,30);assert.equal(result.draft.customPages.at(-1).sectionIds.length,1);assert.equal(result.draft.sections.at(-1).body,first.body);}
  else assert.equal(result.draft,c.website);
 }
});
console.log(`PASS ${count} Mission17 whole-site authority cases; zero failures. Original planning, finite edits and independent synthetic readback; no hosted changes, provider call or publication.`);
