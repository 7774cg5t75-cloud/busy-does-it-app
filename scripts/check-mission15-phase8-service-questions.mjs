import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareServiceQuestion,SERVICE_QUESTION_TOPICS,validateNativeGuestRequest} from '../standalone/template/nativeCustomerActions.mjs';
import {customerEnquiryReview,prepareCustomerEnquiry,emptyEnquiryRequirements} from '../src/core/customerEnquiryRequirements.mjs';
const services=[{name:'Survey',description:'Owner-approved description.'}];
for(const topic of SERVICE_QUESTION_TOPICS){
 const q=prepareServiceQuestion(services,'Survey',topic.key);assert.ok(q.ok);assert.equal(q.transactionConfirmed,false);
 const requirements={...emptyEnquiryRequirements(),location:'Fictional workshop'};
 const prepared=prepareCustomerEnquiry({message:q.message,requirements});assert.ok(prepared.ok);
 const checked=validateNativeGuestRequest('enquiry',{name:'Fictional visitor',email:'visitor@example.test',service:q.service,message:prepared.message});assert.ok(checked.ok);
 const review=customerEnquiryReview(checked.payload,'business/app/published-version/customer','original-form');assert.equal(review.payload.service,'Survey');assert.match(review.payload.message,/Fictional workshop/);assert.ok(review.payload.message.includes(q.message));
 assert.notEqual(review.key,customerEnquiryReview(checked.payload,'business/app/new-version/customer','original-form').key);
}
for(const [rows,name,topic]of [[services,'Missing','price'],[[...services,...services],'Survey','details'],[services,'Survey','arbitrary'],[services,'<script>','price']])assert.equal(prepareServiceQuestion(rows,name,topic).ok,false);
// Execute the actual original form callback, without evaluating JSX or transport.
const source=readFileSync(new URL('../src/screens/miniApps.js',import.meta.url),'utf8');
const start='  const chooseService=(label,kind,topic)=>{',end='  const enabled = new Set(';
assert.equal(source.split(start).length,2);const body=source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
function fixture(){
 const events=[],alerts=[],detail={},s={ownerSession:{userId:'customer-a'},selectedBusyAppDetail:detail},formLive={current:'draft-a'},formAlive={current:true};
 const config={modules:[{key:'enquiry',enabled:true}],publicProfile:{services}};
 const input={config,s,detail,formLive,formAlive,prepareServiceQuestion,message:'Existing wording',contentInterest:{id:'event-a'},Alert:{alert:(...args)=>alerts.push(args)}};
 for(const key of ['setContentNotice','setService','setRequestKind','setContentInterest','setMessage','goToRequest'])input[key]=value=>events.push([key,value]);
 const choose=Function(...Object.keys(input),body+'\nreturn chooseService;')(...Object.values(input));
 return {choose,events,alerts,s,detail,formLive,formAlive};
}
let f=fixture();f.choose('Survey','enquiry','price');assert.equal(f.events.length,0);assert.equal(f.alerts.length,1);f.alerts[0][2][1].onPress();assert.ok(f.events.some(([k,v])=>k==='setMessage'&&v===prepareServiceQuestion(services,'Survey','price').message));assert.ok(f.events.some(([k,v])=>k==='setContentInterest'&&v===null));assert.ok(f.events.some(([k])=>k==='goToRequest'));
for(const invalidate of [f=>f.formLive.current='newer draft',f=>f.formAlive.current=false,f=>f.s.ownerSession={userId:'customer-b'},f=>f.s.selectedBusyAppDetail={}]){
 f=fixture();f.choose('Survey','enquiry','details');invalidate(f);f.alerts[0][2][1].onPress();assert.deepEqual(f.events.map(x=>x[0]),['setContentNotice']);
}
f=fixture();f.choose('Survey','booking_request','price');assert.equal(f.alerts.length,0);assert.equal(f.events.length,0);
// Actual standalone callback: same original setters and permission boundaries.
const native=readFileSync(new URL('../standalone/template/App.js',import.meta.url),'utf8');
const marker='onRequestService={(serviceName,intent,prepared,topic)=>{';assert.equal(native.split(marker).length,2);
const chunk=native.slice(native.indexOf(marker)+marker.length,native.indexOf('}}/>}',native.indexOf(marker)));
assert.ok(chunk.trim().endsWith('setCurrent(intent);'));
const calls=[],live={supportsEnquiry:true,moduleKeys:['enquiry'],services};
const args={live,prepareServiceQuestion,viewContext:{current:'app-a/version-a'},publicViewContext:'app-a/version-a',chosen:{key:'services'},setRequestOrigin:value=>calls.push(['setRequestOrigin',value])};for(const key of ['setContactNotice','setRequestSelection','setRequestedMessage','setRequestedService','setRequestedIntent','setRequestedKind','setCurrent'])args[key]=value=>calls.push([key,value]);
const callback=Function(...Object.keys(args),'return (serviceName,intent,prepared,topic)=>{'+chunk+'};')(...Object.values(args));
callback('Survey','enquiry',null,'timing');assert.ok(calls.some(([key,v])=>key==='setRequestedKind'&&v==='service-question-timing'));assert.ok(calls.some(([key,v])=>key==='setRequestedMessage'&&v===prepareServiceQuestion(services,'Survey','timing').message));
calls.length=0;args.viewContext.current='changed-version';callback('Survey','enquiry',null,'timing');assert.equal(calls.length,0,'Stale runtime cannot change origin or prepare a question');args.viewContext.current=args.publicViewContext;live.supportsEnquiry=false;callback('Survey','enquiry',null,'price');assert.equal(calls.length,0);
console.log('PASS bounded public-service questions, original preparation/validation/exact review, actual marketplace replacement/stale/account callbacks and standalone permission/scoped-draft callbacks. Inert state and transport boundaries; not native/device or hosted acceptance.');
