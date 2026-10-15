import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {beginWebsiteMeasurementAttempt as begin,currentWebsiteMeasurementAttempt as current,MEASUREMENT_TIMEOUT_MS} from '../src/core/websiteMeasurementAttempt.mjs';
import {applyWebsiteLayoutOperation as apply} from '../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs';
import {recommendMeasuredWebsiteChange as recommend} from '../src/core/websiteMeasuredDesignCoach.mjs';
const scope={sourceKey:'owner:business:draft:4:home',mode:'phone',variant:'original',key:'review:fixture:original:1'};
const attempt=begin({...scope,now:100});assert.ok(current(attempt,scope,100));assert.ok(current(attempt,scope,100+MEASUREMENT_TIMEOUT_MS-1));
assert.equal(current(attempt,scope,100+MEASUREMENT_TIMEOUT_MS),false);assert.equal(current(attempt,scope,99),false);assert.equal(current(null,scope,100),false);
for(const changed of [{sourceKey:'other-owner'},{mode:'desktop'},{variant:'candidate'},{key:'review:fixture:original:2'}])assert.equal(current(attempt,{...scope,...changed},101),false);
assert.equal(begin({...scope,key:'<script>',now:100}),null);
const source=readFileSync('src/screens/websiteBuilder.js','utf8');parse(source,{sourceType:'module',plugins:['jsx']});
// Execute actual component cancellation handler with injected state setters.
const a=source.indexOf('  const stopCapture=message=>{'),b=source.indexOf('  React.useEffect(',a);
const ref={current:attempt},values={};
const stop=Function('activeCaptureRef','setActiveCapture','setVisualCheckOn','setCandidateCheckOn','setRequestedReview','setDesignCandidateNotice',source.slice(a,b).replace('  const stopCapture=','return '))(ref,...['active','original','candidate','requested','notice'].map(key=>v=>{values[key]=v;}));
stop('Retry safely');assert.equal(ref.current,null);assert.deepEqual(values,{active:null,original:false,candidate:false,requested:null,notice:'Retry safely'});
const draft={id:'site',sections:[{id:'hero',type:'hero',enabled:true},{id:'services',type:'services',enabled:true}],pages:[{id:'home',sectionIds:['hero','services']}],theme:{}};
const report={counts:{},issues:[{id:'headings'},{id:'overflow'}]};
assert.equal(recommend({draft,pageId:'home',report}).operation.sectionId,'hero');
const locked={...draft,theme:{lockedSections:['hero']}};
assert.equal(recommend({draft:locked,pageId:'home',report}),null);
for(const operation of [{action:'section-style',sectionId:'hero',field:'headingScale',value:'compact'},{action:'reset-section-style',sectionId:'hero'},{action:'style',field:'cardLayout',value:'rows'}]){
 const result=apply(locked,operation);assert.equal(result.applied,false);assert.equal(result.draft,locked);
}
assert.equal(apply(draft,{action:'section-style',sectionId:'hero',field:'headingScale',value:'compact'}).applied,true);
assert.equal(apply({...locked,theme:{lockedSections:'invalid'}},{action:'style',field:'cardLayout',value:'rows'}).applied,false);
assert.equal(JSON.stringify(draft.theme),'{}');
console.log('PASS: measurement expiry/scope/token rejection, actual cancellation handler, website JSX parse and shared recommendation/application appearance locks. Browser timing remains unverified.');
