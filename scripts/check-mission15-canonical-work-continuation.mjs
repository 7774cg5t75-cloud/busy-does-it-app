import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createCanonicalWorkSession} from '../src/core/canonicalWorkSession.mjs';
import {createOwnerEditNavigation} from '../src/core/ownerEditNavigation.mjs';
const rt=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs').createRuntime();
const {CanonicalWorkEntry:Entry}=rt.load('src/components/CanonicalWorkEntry.js');
const {CanonicalWorkPanel:Panel}=rt.load('src/components/CanonicalWorkPanel.js');
const {CanonicalPrivateFollowUp:Private}=rt.load('src/components/CanonicalPrivateFollowUp.js');
const {HomeCoreAreas:Home}=rt.load('src/components/HomeCoreAreas.js');
const B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',O='cccccccc-cccc-4ccc-8ccc-cccccccccccc',ID='11111111-1111-4111-8111-111111111111',H='a'.repeat(64),scope={};
const context={scope,ready:true,ownerId:O,businessId:B,role:'owner',revision:100};
const row={businessId:B,customerId:'customer',ownerId:O,engagementId:ID,enquiryId:'source',schemaVersion:1,revision:1,type:'quote',status:'Prepared',sourceHash:H,recordHash:H,record:{type:'quote',done:true,details:{quoteAmount:'0',message:'Original quote words',plannedSentDate:'2026-11-01',quoteStatus:'Prepared'}},notOwnReceipt:true};
let privateText=null,privateRevision=0,writes=0,buttons,prompt;
rt.native.Alert.alert=(_t,_m,b)=>buttons=b;
const api=createCanonicalWorkSession().bind({enabled:true,getCurrent:()=>context,ownerAccessToken:async()=>'inert',request:async(route,{body})=>{
 if(route.includes('private_read'))return {businessId:B,customerId:'customer',engagementId:ID,ownerId:O,kind:'followup',revision:privateRevision,text:privateText,engagementRevision:1,needsReview:false,notOwnReceipt:true};
 if(route.includes('private_write')){writes++;privateText=body.p_text;privateRevision++;return {businessId:B,customerId:'customer',engagementId:ID,actorId:O,kind:'followup',operation:'engagement_private_wording',operationId:body.p_operation_id,previousRevision:privateRevision-1,revision:privateRevision,engagementRevision:1,schemaVersion:1,textHash:H};}
 return structuredClone(row);
}});
const customer={id:'customer',name:'Fictional Alex',service:'Cleaning'},guard=createOwnerEditNavigation({getScope:()=>scope,confirm:p=>prompt=p});
const s={canonicalWork:api,ownerWorkspaceScope:scope,ownerSession:{userId:O},cloudWorkspace:{businessId:B,role:'owner'},cloudRevision:100,screen:'home',customers:[customer],setOwnerEditDirty:b=>guard.report({...b,scope}),releaseOwnerEdit:guard.release,requestOwnerEditTransition:guard.request};
const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[];
const find=(t,label)=>walk(t).find(x=>x.props?.label===label||x.props?.accessibilityLabel===label);
let t=rt.render(Home,{s});find(t,'Get Paid').props.onPress();t=rt.render(Home,{s});assert.ok(walk(t).find(x=>x.type===Entry),'Original Get Paid shortcut owns canonical continuation');
t=rt.render(Entry,{s});find(t,'Engagements for Fictional Alex').props.onPress();t=rt.render(Entry,{s});assert.ok(walk(t).find(x=>x.type===Panel));
const observed=await api.read(customer.id,ID),render=()=>rt.render(Private,{s,customer,record:observed,api});
t=render();await find(t,'Inspect private follow-up').props.onPress();t=render();find(t,'Private engagement follow-up wording').props.onChangeText('Exact new words');t=render();
find(t,'Review private follow-up save').props.onPress();const stale=buttons.find(x=>x.text==='Save reviewed private wording').onPress;
find(t,'Private engagement follow-up wording').props.onChangeText('Newer typing');assert.equal(await stale(),false);assert.equal(writes,0);
t=render();find(t,'Review private follow-up save').props.onPress();const save=buttons.find(x=>x.text==='Save reviewed private wording').onPress;assert.equal(await save(),true);assert.equal(await save(),false);assert.equal(writes,1);t=render();assert.equal(find(t,'Private engagement follow-up wording').props.value,'Newer typing');
find(t,'Private engagement follow-up wording').props.onChangeText('Independent unfinished words');t=render();guard.request(()=>{throw Error('Dirty editor must not be discarded automatically');});assert.ok(prompt);prompt.keep();assert.equal(find(t,'Private engagement follow-up wording').props.value,'Independent unfinished words');
privateText='Remote corrected private words';privateRevision++;await find(t,'Inspect private follow-up').props.onPress();assert.ok(prompt);assert.equal(prompt.discard(),true);t=render();assert.equal(find(t,'Private engagement follow-up wording').props.value,'Remote corrected private words','Deliberate discard must open the observed saved wording');
const previous=buttons;find(t,'Review private follow-up save').props.onPress();const changedScope=buttons.find(x=>x.text==='Save reviewed private wording').onPress;context.role='admin';assert.equal((await changedScope()),false);assert.equal(writes,1);assert.ok(previous);
// A hidden old-workspace quote must not register dirty metadata under the new owner.
const pRuntime=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs').createRuntime(),{CanonicalWorkPanel:P}=pRuntime.load('src/components/CanonicalWorkPanel.js'),{PrivateQuoteFields:F}=pRuntime.load('src/components/PrivateQuoteFields.js');
const dirtyReports=[],ps={...s,screen:'customerDetail',inboxItems:[{id:'source',status:'Filed',filedCustomerId:customer.id}],canonicalWork:{enabled:true,status:()=>({status:'idle'}),source:async()=>({enquiryId:'source',snapshotRevision:100,enquiry:{rawText:'Fictional requirements'},customer})},setOwnerEditDirty:b=>dirtyReports.push(b)};
let panel=pRuntime.render(P,{s:ps,customer});await find(panel,'Inspect Filed source source').props.onPress();panel=pRuntime.render(P,{s:ps,customer});const node=walk(panel).find(x=>x.type===F);const input=pRuntime.render(F,node.props);find(input,'Quote amount').props.onChangeText('42');panel=pRuntime.render(P,{s:ps,customer});assert.equal(dirtyReports.at(-1).dirty,true);
const effectStart=pRuntime.effects.length;ps.ownerSession={userId:'different-owner'};ps.ownerWorkspaceScope={};ps.cloudWorkspace={businessId:B,role:'owner'};assert.equal(pRuntime.render(P,{s:ps,customer}),null);for(const effect of pRuntime.effects.slice(effectStart))effect();assert.equal(dirtyReports.at(-1).dirty,false,'Old hidden fields must not bind dirty state to the new workspace');
console.log('PASS original Get Paid -> canonical customer selection, original private follow-up UI exact save/readback, newer typing/stale/duplicate approvals, dirty navigation and revoked client role. Inert transport only; SQL security tested separately.');
