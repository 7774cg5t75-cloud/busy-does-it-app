import assert from 'node:assert/strict';
import vm from 'node:vm';
import {makeWebsiteVisualCheckHtml as html,reviewWebsiteVisualCheck as review} from '../src/core/websiteVisualCheck.mjs';
import {recommendMeasuredWebsiteChange as recommend,recordWebsiteOwnerDesignFeedback as feedback} from '../src/core/websiteMeasuredDesignCoach.mjs';
import {applyWebsiteLayoutOperation as apply} from '../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs';
const heading={scrollWidth:400,clientWidth:100,scrollHeight:20,clientHeight:20,getBoundingClientRect:()=>({left:0,right:100,width:100,height:20}),closest:()=>({id:'services'})};
let message;
const document={readyState:'complete',documentElement:{scrollWidth:390},querySelectorAll:selector=>selector==='main *'||selector==='main h1,main h2,main h3'?[heading]:selector==='main section'?[{},{}]:[]};
const style=()=>({position:'relative',visibility:'visible'});
const window={innerWidth:390,getComputedStyle:style,setTimeout:fn=>fn(),ReactNativeWebView:{postMessage:raw=>{message=JSON.parse(raw);}}};
const injected=html('<!doctype html><html><body><main></main></body></html>','fixture');
vm.runInNewContext(injected.match(/<script>([\s\S]*?)<\/script>/)[1],{window,document,getComputedStyle:style});
assert.deepEqual(message.clippedSectionIds,['services']);assert.deepEqual(message.overflowSectionIds,[]);
const report=review(message,'fixture');assert.ok(report);assert.deepEqual(report.targets.clippedSectionIds,['services']);
for(const ids of [['services','services'],['<script>'],Array(7).fill('services')])assert.equal(review({...message,clippedSectionIds:ids},'fixture'),null);
const draft={id:'site',theme:{},sections:[{id:'hero',type:'hero',title:'Owner hero',enabled:true},{id:'services',type:'services',title:'Owner services',enabled:true,items:[{id:'one',title:'Owner item',body:'Owner copy'}]}],pages:[{id:'home',enabled:true,sectionIds:['hero','services']}]};
for(const [viewport,field] of [[390,'mobileHeadingScale'],[768,'headingScale'],[1280,'desktopHeadingScale']]){
 const advice=recommend({draft,pageId:'home',report:{...report,counts:{...report.counts,viewport}}});assert.equal(advice.operation.sectionId,'services');assert.equal(advice.operation.field,field);
 const result=apply(draft,advice.operation);assert.equal(result.applied,true);assert.equal(result.draft.sections[0].appearance,undefined);assert.equal(result.draft.sections[1].title,'Owner services');assert.deepEqual(result.draft.sections[1].items,draft.sections[1].items);
}
assert.equal(recommend({draft:{...draft,theme:{lockedSections:['services']}},pageId:'home',report}),null);
assert.equal(recommend({draft,pageId:'home',report:{...report,targets:{clippedSectionIds:['foreign']}}}),null);
assert.equal(recommend({draft,pageId:'home',report:{...report,issues:[{id:'overflow'}],targets:{clippedSectionIds:[],overflowSectionIds:['hero']}}}),null);
const disliked=feedback(draft,{draftId:'site',pageId:'home',choice:'disliked',changeId:'compact-measured-title',at:'2026-10-15T12:00:00Z'});assert.equal(recommend({draft:disliked.draft,pageId:'home',report}),null);
console.log('PASS: actual injected collector with fixture DOM, bounded section targets, three-width original controls, unchanged copy/other sections, lock/page/feedback rejection and no unrelated overflow fix. Not a browser rendering test.');
