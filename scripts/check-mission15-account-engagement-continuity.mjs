import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createCanonicalWorkSession} from '../src/core/canonicalWorkSession.mjs';
const runtime=()=>createRequire(import.meta.url)('./lib/offline-component-runtime.cjs').createRuntime();
const B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',O='cccccccc-cccc-4ccc-8ccc-cccccccccccc',ID='11111111-1111-4111-8111-111111111111',H='a'.repeat(64);
const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[],find=(t,label)=>walk(t).find(x=>x.props?.label===label);
let context={scope:{},ready:true,ownerId:O,businessId:B,role:'owner',revision:100},hold=false,release;
const row={businessId:B,customerId:'c',engagementId:ID,enquiryId:'e',ownerId:O,revision:1,schemaVersion:1,sourceHash:H,recordHash:H,type:'quote',status:'Prepared',notOwnReceipt:true,record:{type:'quote',done:true,details:{quoteStatus:'Prepared',quoteAmount:'0',message:'Recorded wording',plannedSentDate:'2026-11-01'}}};
const request=async(path)=>{
 if(hold&&path.includes('read_v1')&&!path.includes('private'))await new Promise(r=>release=r);
 if(path.includes('discover'))return {businessId:B,ownerId:O,items:[{engagementId:ID,customerId:'c',enquiryId:'e',revision:1,type:'quote',status:'Prepared'}],nextCursor:null,notOwnReceipt:true};
 if(path.includes('compare'))return {...row,historicalOnly:true,mutationAuthorised:false,comparisonOnly:true,sourceState:'current',originalContext:{customerName:'Fictional Alex',service:'Cleaning',enquiryText:'Original request'},currentContext:{customerName:'Fictional Alex',service:'Cleaning',enquiryText:'Original request'}};
 if(path.includes('private_read'))return {businessId:B,customerId:'c',engagementId:ID,ownerId:O,kind:'followup',revision:1,text:'Saved private words',engagementRevision:1,needsReview:false,notOwnReceipt:true};
 return structuredClone(row);
};
const api=createCanonicalWorkSession().bind({enabled:true,getCurrent:()=>context,ownerAccessToken:async()=>'inert',request});
const rt=runtime(),{CanonicalAccountWork:Account}=rt.load('src/components/CanonicalAccountWork.js');
const s={canonicalWork:api,customers:[],replyActions:{},screen:'workHub',ownerWorkspaceScope:context.scope,ownerSession:{userId:O},cloudWorkspace:{businessId:B,role:'owner'}};
const original=JSON.stringify([s.customers,s.replyActions]);let t=rt.render(Account,{s});await find(t,'Find my account engagements').props.onPress();t=rt.render(Account,{s});await find(t,'Inspect account engagement '+ID).props.onPress();t=rt.render(Account,{s});assert.ok(JSON.stringify(t).includes('Fictional Alex'));assert.ok(JSON.stringify(t).includes('Recorded wording'));assert.equal(JSON.stringify([s.customers,s.replyActions]),original);assert.equal(api.status().status,'idle');
await find(t,'Inspect account private follow-up').props.onPress();t=rt.render(Account,{s});assert.ok(JSON.stringify(t).includes('Saved private words'));
s.ownerSession={userId:'another-owner'};s.ownerWorkspaceScope={};t=rt.render(Account,{s});assert.ok(!JSON.stringify(t).includes('Saved private words'));assert.ok(!JSON.stringify(t).includes('Recorded wording'));
assert.equal(await find(t,'Find my account engagements').props.onPress(),false,'Stale old-owner adapter cannot expose its responses to the new UI owner');t=rt.render(Account,{s});assert.ok(!JSON.stringify(t).includes('Inspect account engagement '+ID));
// Existing editor accepts new typing while an account read is pending.
const pr=runtime(),{CanonicalPrivateFollowUp:Private}=pr.load('src/components/CanonicalPrivateFollowUp.js');
const ps={...s,ownerSession:{userId:O},ownerWorkspaceScope:context.scope};const record=await api.read('c',ID),customer={id:'c'};
const render=()=>pr.render(Private,{s:ps,customer,record,api});t=render();await find(t,'Inspect private follow-up').props.onPress();t=render();hold=true;
const pending=find(t,'Inspect private follow-up').props.onPress();await new Promise(r=>setImmediate(r));t=render();assert.equal(find(t,'Private engagement follow-up wording').props.editable,true);find(t,'Private engagement follow-up wording').props.onChangeText('New typing during read');release();assert.equal(await pending,false);t=render();assert.equal(find(t,'Private engagement follow-up wording').props.value,'New typing during read');assert.equal(api.status().status,'idle');
// Malformed absent/available evidence is not converted into an empty draft.
const invalid=createCanonicalWorkSession().bind({enabled:true,getCurrent:()=>context,ownerAccessToken:async()=>'inert',request:async()=>({businessId:B,customerId:'c',engagementId:ID,ownerId:O,kind:'followup',revision:0,text:undefined,notOwnReceipt:true,needsReview:true})});await assert.rejects(()=>invalid.privateRead('c',ID,'followup'));
console.log('PASS original account-only discovery/selection with no local customer, separate private observation, scope hiding, genuine typing during delayed read and absent-versus-unavailable denial. Inert transport only; SQL tested separately.');
