import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {checkReviewedCustomerVersion} from '../supabase/functions/busy-mini-apps/customerReviewedVersion.mjs';
const require=createRequire(import.meta.url),babel=require('@babel/core');
const source=readFileSync('supabase/functions/busy-mini-apps/index.ts','utf8'),ast=babel.parseSync(source,{sourceType:'module',configFile:false,babelrc:false,parserOpts:{plugins:['typescript']}});
const fn=ast.program.body.filter(n=>n.type==='FunctionDeclaration'&&n.id.name==='submitRequest');assert.equal(fn.length,1);
const code=babel.transformSync(source.slice(fn[0].start,fn[0].end),{filename:'request.ts',configFile:false,babelrc:false,plugins:[require('@babel/plugin-transform-typescript')]}).code;
const detail={app:{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',business_id:'business'},version:{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',config:{modules:[{key:'enquiry',enabled:true},{key:'booking_request',enabled:true}]}}};
const body={slug:'fictional',requestType:'booking_request',expectedAppId:detail.app.id,expectedVersionId:detail.version.id,payload:{name:'Fictional Visitor',email:'visitor@example.test',service:'Custom owner-reviewed request'}};
assert.equal(checkReviewedCustomerVersion({},detail).legacy,true);
for(const edit of [{expectedVersionId:'stale'},{expectedAppId:'foreign'},{expectedVersionId:null}])assert.equal(checkReviewedCustomerVersion({...body,...edit},detail).ok,false);
// Execute the original trusted handler through its real version gate. A
// deliberate sentinel stops BEFORE any new request insert/provider action.
let replay=null,reads=0;
const db={from(table){reads++;if(table==='busy_mini_app_requests'&&replay)return {select(){return this;},eq(){return this;},maybeSingle:async()=>({data:replay})};throw Error('NEW_REQUEST_BOUNDARY');}};
const submit=Function('supabase','appDetail','clean','safeArray','checkCustomerRequestReplay','verifiedRequestEvidence','checkReviewedCustomerVersion',code+';return submitRequest;')(db,async()=>detail,(x,max)=>typeof x==='string'?x.trim().slice(0,max):'',x=>Array.isArray(x)?x:[],()=>({ok:true}),()=>({verified:true}),checkReviewedCustomerVersion);
const stale=await submit('customer',{...body,expectedVersionId:'stale'},'');assert.equal(stale.reviewRequired,true);assert.equal(stale.newRequestSaved,false);assert.equal(reads,0,'stale version stops before request read/write boundary');
await assert.rejects(submit('customer',body,''),/NEW_REQUEST_BOUNDARY/);
replay={id:'saved',version_id:'old-version'};const result=await submit('customer',{...body,expectedVersionId:'stale'},'same-key');assert.equal(result.reused,true);assert.equal(result.request.version_id,'old-version','saved receipt survives publication changes');
console.log('PASS original signed-in handler rejects new stale/foreign review, preserves free-text/legacy contracts and reconciles saved idempotent requests before version gating. Inert DB only.');
// Execute the original client initializer with inert transport and SecureStore.
const client=readFileSync('src/app/AppController.js','utf8'),clientAst=babel.parseSync(client,{sourceType:'module',configFile:false,babelrc:false,parserOpts:{plugins:['jsx']}});let arrow;
function walk(n){if(!n||typeof n!=='object')return;if(n.type==='VariableDeclarator'&&n.id?.name==='submitBusyAppRequest'){assert.equal(arrow,undefined);arrow=client.slice(n.init.start,n.init.end);}for(const [k,v] of Object.entries(n))if(!['loc','start','end'].includes(k)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}
walk(clientAst);assert.ok(arrow);
const review={schema:'published-version.v1',appId:detail.app.id,versionId:detail.version.id};
const selected={...detail,app:{...detail.app,slug:'fictional'},requestReview:review},epoch={},pending={current:null};
let call=null,completed=0,prepared=0,error='',outcome='stale';
const deps={selectedBusyAppDetail:selected,ownerSession:{userId:'customer'},customerRequestRenderEpoch:epoch,customerRequestEpochRef:{current:epoch},customerRequestInFlightRef:{current:false},validateNativeGuestRequest:()=>({ok:true}),setMiniAppsError:x=>error=x,
 createCustomerRequestAttempt:()=>({prepare:async()=>{prepared++;return {key:'one-key'};},complete:async()=>{completed++;return true;}}),SecureStore:{},busyRequestId:()=>'',activeCustomerRequestScopeRef:{current:['customer',detail.app.id,'fictional'].join(':')},customerRequestPendingRef:pending,setMiniAppsAction:()=>{},setMiniAppsNotice:()=>{},
 miniAppsRequest:async(action,payload)=>{call={action,payload};if(outcome==='lost')throw Error('inert connection lost');return {reviewRequired:true,newRequestSaved:false,reviewedAppId:payload.expectedAppId,reviewedVersionId:payload.expectedVersionId};},evaluateCustomerRequestOutcome:()=>({ok:false}),setLatestCustomerRequestOutcome:()=>{},loadMyBusyApps:async()=>{}};
const send=Function(...Object.keys(deps),'return ('+arrow+');')(...Object.values(deps));
assert.equal(await send('booking_request',body.payload),false);assert.equal(call.payload.expectedAppId,detail.app.id);assert.equal(call.payload.expectedVersionId,detail.version.id);assert.equal(completed,1);assert.equal(pending.current,null);assert.match(error,/Nothing new was sent/);
outcome='lost';call=null;assert.equal(await send('booking_request',body.payload),false);assert.equal(completed,1,'uncertain transport keeps original retry key');assert.equal(pending.current.requestKey,'one-key');
selected.requestReview=null;const before=prepared;assert.equal(await send('booking_request',body.payload),false);assert.equal(prepared,before,'old backend cannot silently ignore version contract');
console.log('PASS original client binds exact reviewed IDs, releases definitive no-write reference, retains uncertain retry key and rejects unsupported old backend before sending. Inert transport/store only.');
