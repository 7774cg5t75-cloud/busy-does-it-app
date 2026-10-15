import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {recordPrivateWebsiteCandidateWidthV3239 as record,reviewPrivateWebsiteCandidateWidthsV3239 as review} from '../src/core/privateWebsiteCandidateWidthV3239.mjs';
import {privateWebsiteReviewProgress as progress,currentWebsiteDesignCandidate as current} from '../src/core/privateWebsiteReviewProgress.mjs';
import {makeWebsiteVisualCheckHtml,reviewWebsiteVisualCheck,CHANNEL} from '../src/core/websiteVisualCheck.mjs';
const businessId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const website={businessId,id:'private-fixture',generation:3,pages:[{id:'home',enabled:true}],sections:[{id:'hero',enabled:true}]};
const candidate={id:'compact-hero-title',businessId,websiteId:website.id,baseGeneration:3,pageId:'home'};
const context={businessId,website,pageId:'home',candidate,mode:'phone'};
const widths={phone:390,tablet:768,desktop:1280};
const metric=(mode,bad=false)=>({counts:{viewport:widths[mode],width:widths[mode],overflow:bad?1:0,images:2,missingAlt:0,unloadedImages:0,smallTargets:0,badAnchors:0,clippedHeadings:0,headings:2,sections:2,lowContrast:0,contrastUnknown:0,contrastChecked:6,smallBodyText:0},issues:bad?[{id:'overflow'}]:[]});
let state=null;assert.deepEqual(progress(state,context).next,{mode:'phone',variant:'original'});
for(const mode of Object.keys(widths))for(const variant of ['original','candidate']){
 assert.deepEqual(progress(state,context).next,{mode,variant});
 const result=record(state,{businessId,website,pageId:'home',candidateId:candidate.id,baseGeneration:3,mode,variant,report:metric(mode,variant==='original')});assert.ok(result.ok);state=result.state;
}
let r=progress(state,context);assert.ok(r.complete);assert.equal(r.next,null);assert.equal(r.mayKeep,true);assert.equal(r.noScreenshots,true);
for(const altered of [{...context,businessId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'},{...context,pageId:'other'},{...context,website:{...website,generation:4}},{...context,candidate:{...candidate,websiteId:'foreign'}}])assert.equal(progress(state,altered).mayKeep,false);
assert.equal(progress(state,{...context,mode:'full'}).mayKeep,false);
for(const field of ['sections','headings','images']){
 const hidden=metric('tablet');hidden.counts[field]=1;
 const replaced=record(state,{businessId,website,pageId:'home',candidateId:candidate.id,baseGeneration:3,mode:'tablet',variant:'candidate',report:hidden});
 assert.ok(replaced.ok);r=progress(replaced.state,context);assert.equal(r.hasRegressions,true);assert.equal(r.mayKeep,false);
}
const corrupt=structuredClone(state);corrupt.records.tablet.original.counts.viewport=390;
assert.equal(review(corrupt,{businessId,website,pageId:'home',candidateId:candidate.id,baseGeneration:3}).ok,false);
const injected=makeWebsiteVisualCheckHtml('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>','review:fixture:original:2');assert.ok(injected.includes('review:fixture:original:2'));
assert.equal(reviewWebsiteVisualCheck({channel:CHANNEL,key:'review:fixture:original:1',...metric('phone')},'review:fixture:original:2'),null);
parse(readFileSync('src/screens/websiteBuilder.js','utf8'),{sourceType:'module',plugins:['jsx']});
assert.equal(current(null,context),false);
console.log('PASS: guided six-report review, same-source approval, retained-content regression gates, malformed portfolio rejection, stale measurement keys and UI syntax. Offline only.');
