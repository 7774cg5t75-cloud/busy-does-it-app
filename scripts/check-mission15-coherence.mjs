import {recordPrivateWebsiteCandidateWidthV3239 as record,reviewPrivateWebsiteCandidateWidthsV3239 as review} from '../src/core/privateWebsiteCandidateWidthV3239.mjs';
import assert from 'node:assert/strict';
import {buildBusinessBrandDnaSnapshot} from '../src/core/businessBrandDnaV3195.mjs';
import {planSelectedWebsiteChanges,prepareSelectedWebsiteTransaction} from '../src/core/websiteContextPlan.mjs';
import {reviewWebsiteVisualCheck,CHANNEL} from '../src/core/websiteVisualCheck.mjs';
import {compareWebsiteVisualReports} from '../src/core/websiteMeasuredDesignCoach.mjs';
import {websiteBuilderTestHarnessV3222} from './lib/website-builder-test-harness-v3222.mjs';
const {applyWebsiteLayoutChange,applyStructuredWebsiteEdit}=websiteBuilderTestHarnessV3222(['applyWebsiteLayoutChange','applyStructuredWebsiteEdit']);
const businessId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',website={id:'site',businessId,generation:1,businessName:'Example',theme:{},pages:[{id:'home',enabled:true,sectionIds:['hero','services','about','contact']}],sections:[{id:'hero',type:'hero',title:'Example'},{id:'services',type:'services',title:'Services',items:[{id:'survey',title:'Survey',body:'Keep website wording.'}]},{id:'about',type:'about',title:'About',body:'Our own words.'},{id:'contact',type:'contact',title:'Contact',email:'hello@example.test'}]};
const app={id:'app',business_id:businessId,draft_revision:1,draft_config:{modules:[{key:'services',enabled:true}],publicProfile:{businessName:'Example',services:[{name:'Survey',description:'Keep app wording.'},{name:'Repair',description:'Only app.'}]}}};
const before=JSON.stringify({website,app}),dna=buildBusinessBrandDnaSnapshot({website,app,businessId});assert.equal(dna.ok,true);assert.ok(dna.conflicts.some(x=>x.includes('1 shared service')));assert.ok(dna.conflicts.some(x=>x.includes('1 app-only')));assert.equal(JSON.stringify({website,app}),before);assert.equal(buildBusinessBrandDnaSnapshot({website,app:{...app,business_id:'other'},businessId}).ok,false);
const selection={draftId:'site',pageId:'home',generation:1,sectionId:'about',field:'section',photoIndex:-1};
for(const instruction of ['make this section look more premium','move this section above services']){
 const p=planSelectedWebsiteChanges(website,'home',selection,instruction);assert.equal(p.ok,true,p.reason);
 const out=prepareSelectedWebsiteTransaction(website,p,{fieldEdit:applyStructuredWebsiteEdit,layoutEdit:applyWebsiteLayoutChange});assert.equal(out.applied,true,out.reason);assert.notEqual(out.draft.generation,website.generation);assert.equal(JSON.stringify({website,app}),before);
}
assert.equal(planSelectedWebsiteChanges(website,'home',selection,'make this section more premium; give this section more space').ok,false);
const counts={viewport:390,width:390,overflow:0,images:0,missingAlt:0,unloadedImages:0,smallTargets:0,badAnchors:0,clippedHeadings:0,headings:2,sections:2,lowContrast:0,contrastUnknown:0,contrastChecked:4,smallBodyText:0};
const message={channel:CHANNEL,key:'coverage',...counts,textBlocks:3};
// Inspection packets use the original channel and bounded inspection key.
const report=reviewWebsiteVisualCheck(message,'coverage');assert.ok(report);assert.equal(report.counts.textBlocks,3);
assert.equal(reviewWebsiteVisualCheck({...message,textBlocks:-1},'coverage'),null);
const fewer={...report,counts:{...report.counts,textBlocks:2}};assert.equal(compareWebsiteVisualReports(report,fewer).noNewMeasuredProblems,false);
const legacy={...report,counts:{...counts}};assert.equal(compareWebsiteVisualReports(report,legacy).valid,false);assert.equal(compareWebsiteVisualReports(legacy,legacy).valid,true,'Old paired packets remain compatible');
console.log('PASS selected-element premium/relative transaction, shared-service conflict review and measured text-coverage regression gates; synthetic counters, no screenshot claim.');

const scope={businessId,website,pageId:'home',candidateId:'test-candidate',baseGeneration:1,mode:'phone'};
const first=record(null,{...scope,variant:'original',report});assert.equal(first.ok,true);assert.equal(first.state.records.phone.original.counts.textBlocks,3);
const second=record(first.state,{...scope,variant:'candidate',report:fewer});assert.equal(second.ok,true);assert.equal(review(second.state,scope).hasRegressions,true,'Retained multiwidth notebook must not discard text coverage');
