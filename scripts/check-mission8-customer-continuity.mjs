import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {evaluateCustomerRequestOutcome,customerRequestNotice} from '../src/core/customerJourneyOutcomeV3204.mjs';
const src=fs.readFileSync(new URL('../src/app/AppController.js',import.meta.url),'utf8');
const start=src.indexOf('  const submitBusyAppRequest = async'),end=src.indexOf('  const updateMiniAppRequestStatus',start);
const make=vm.runInNewContext('(d)=>{const {'+['selectedBusyAppDetail','ownerSession','customerRequestInFlightRef','customerRequestEpochRef','customerRequestPendingRef','activeCustomerRequestScopeRef','busyRequestId','miniAppsRequest','evaluateCustomerRequestOutcome','customerRequestNotice','setMiniAppsAction','setMiniAppsError','setMiniAppsNotice','setLatestCustomerRequestOutcome','loadMyBusyApps'].join(',')+'}=d;'+src.slice(start,end)+';return submitBusyAppRequest;}');
const user='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',app='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject};};
const response={ok:true,savedRequestConfirmed:true,request:{id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',mini_app_id:app,consumer_user_id:user,request_type:'enquiry',status:'received'}};
function fixture(transport){const events=[],calls=[];let n=0;const epoch={key:'first'};const deps={selectedBusyAppDetail:{app:{id:app,slug:'fixture-app'}},ownerSession:{userId:user},customerRequestInFlightRef:{current:false},customerRequestEpochRef:{current:epoch},customerRequestPendingRef:{current:null},activeCustomerRequestScopeRef:{current:[user,app,'fixture-app'].join(':')},busyRequestId:()=>`fixture-request-${++n}`,miniAppsRequest:async(...args)=>{calls.push(args);return transport(...args)},evaluateCustomerRequestOutcome,customerRequestNotice,loadMyBusyApps:async()=>{},setMiniAppsAction:x=>events.push(['action',x]),setMiniAppsError:x=>events.push(['error',x]),setMiniAppsNotice:x=>events.push(['notice',x]),setLatestCustomerRequestOutcome:x=>events.push(['outcome',x])};return {deps,events,calls,submit:make(deps)};}
const wait=deferred(),f=fixture(()=>wait.promise);const running=f.submit('enquiry',{message:'Original'});assert.equal(await f.submit('enquiry',{message:'Original'}),false);assert.equal(f.calls.length,1);assert.equal(f.calls[0][2].isCurrent(),true);
f.deps.customerRequestEpochRef.current={key:'round-trip'};assert.equal(f.calls[0][2].isCurrent(),false);
const newer={epoch:f.deps.customerRequestEpochRef.current};f.deps.customerRequestInFlightRef.current=newer;const count=f.events.length;wait.resolve(response);assert.equal(await running,false);assert.equal(f.events.length,count,'stale completion cannot overwrite new notices or action state');assert.equal(f.deps.customerRequestInFlightRef.current,newer,'old cleanup cannot unlock a newer request');
let failed=true;const retry=fixture(action=>action==='request_receipt'?{ok:true,found:false}:failed?Promise.reject(Error('lost receipt')):response);
assert.equal(await retry.submit('enquiry',{message:'Same'}),false);const key=retry.deps.customerRequestPendingRef.current.requestKey;failed=false;assert.equal(await retry.submit('enquiry',{message:'Same'}),true);assert.equal(retry.calls.filter(c=>c[0]==='submit_request')[1][2].requestKey,key);assert.equal(retry.deps.customerRequestPendingRef.current,null);
// Execute the original transport's token-await guard: stale work sends no HTTP.
const transportStart=src.indexOf('  const miniAppsRequest = async'),transportEnd=src.indexOf('  // A read-only authenticated lookup.',transportStart);
const token=deferred();let sent=0,current=true;
const transport=vm.runInNewContext('(d)=>{const {ownerAccessToken,cloudWorkspace,fetchWithTimeout,BUSY_MINI_APPS_URL,BUSY_AI_TOKEN,busyRequestId}=d;'+src.slice(transportStart,transportEnd)+';return miniAppsRequest;}')({ownerAccessToken:()=>token.promise,cloudWorkspace:{},fetchWithTimeout:()=>{sent++;},BUSY_MINI_APPS_URL:'fixture',BUSY_AI_TOKEN:'fixture',busyRequestId:()=>''});
const pending=transport('submit_request',{}, {includeBusiness:false,isCurrent:()=>current});current=false;token.resolve('fixture');await assert.rejects(pending,/workspace changed/);assert.equal(sent,0);
// Execute real form bodies with inert native effects. Later typing survives save.
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');const runtime=createRuntime();const Detail=runtime.load('src/screens/miniApps.js').BusyAppDetail;
const save=deferred();const state={selectedBusyAppDetail:{app:{id:app},version:{id:'version-1',config:{modules:[{key:'enquiry',enabled:true}]}}},ownerSession:{userId:user},submitBusyAppRequest:()=>save.promise};
const wrapper=runtime.render(Detail,{s:state});assert.notEqual(wrapper.props.key,runtime.render(Detail,{s:{...state,ownerSession:{userId:'another'}}}).props.key);
const Form=wrapper.type;const walk=n=>Array.isArray(n)?n.flatMap(walk):n&&typeof n==='object'?[n,...walk(n.props?.children)]:[];
let tree=runtime.render(Form,{s:state});const field=label=>walk(tree).find(n=>n.props?.label===label);field('Message').props.onChangeText('First enquiry');tree=runtime.render(Form,{s:state});const submission=field('Send enquiry').props.onPress();field('Message').props.onChangeText('New unsent enquiry');tree=runtime.render(Form,{s:state});save.resolve(true);await submission;tree=runtime.render(Form,{s:state});assert.equal(field('Message').props.value,'New unsent enquiry');
console.log('PASS: actual customer submit/transport/form paths: duplicate suppression, epoch round trips, stale cleanup, unchanged retry key, pre-send token guard and preserved newer typing. Offline boundaries only.');
