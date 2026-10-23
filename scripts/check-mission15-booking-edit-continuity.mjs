import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createOwnerEditNavigation} from '../src/core/ownerEditNavigation.mjs';
const require=createRequire(import.meta.url),{parse}=require('@babel/parser'),{createRuntime}=require('./lib/offline-component-runtime.cjs');
const src=fs.readFileSync('src/app/AppController.js','utf8');let completeSource,completionSource;
function visit(node){if(!node||typeof node!=='object')return;if(node.type==='VariableDeclarator'&&node.id?.name==='completeReplyAction')completeSource=src.slice(node.init.start,node.init.end);if(node.type==='VariableDeclarator'&&node.id?.name==='markBookingCompleted')completionSource=src.slice(node.init.start,node.init.end);for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}}visit(parse(src,{sourceType:'module',plugins:['jsx']}));
const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[],find=(t,label)=>walk(t).find(x=>x.props?.label===label);
function fixture(){
 const rt=createRuntime(),{ReplyActionDetail}=rt.load('src/screens/work.js'),scope={};
 const data={scope,actor:'owner',business:'business',role:'owner',view:'replyActionDetail',customer:{id:'a',name:'Alex Example',service:'Cleaning',history:[]},table:{a:{type:'booking',origin:'manual',done:true,details:{bookingDate:'2099-01-02',bookingTime:'10:00',bookingStatus:'Confirmed',jobValue:'70',completionNote:'Recorded note'}},unrelated:{type:'quote',details:{quoteAmount:'999',unknown:{keep:true}}}},date:'2099-01-02',time:'10:00',value:'70',note:'Recorded note',route:'replyActionDetail',writes:0,opened:0,statusWrites:0,photoPrompts:0};
 let prompt,state;
 const guard=createOwnerEditNavigation({getScope:()=>data.scope,confirm:p=>prompt=p});
 const complete=()=>Function('replyActions','setReplyActions','setCustomers','appendCustomerActivity','return '+completeSource)(data.table,fn=>{data.table=fn(data.table);data.writes++;},fn=>{data.customer=fn([data.customer])[0];},()=>{});
 const render=()=>{
  state={view:data.view,ownerWorkspaceScope:data.scope,ownerSession:{userId:data.actor},cloudWorkspace:{businessId:data.business,role:data.role},selectedReplyCustomer:data.customer,replyActions:data.table,customers:[data.customer],lastSimulatedRecipients:[],eligibleCustomers:[],quietSlot:'Friday morning',actionBookingDate:data.date,actionBookingTime:data.time,actionJobValue:data.value,actionJobNote:data.note,
   setActionBookingDate:v=>data.date=v,setActionBookingTime:v=>data.time=v,setActionJobValue:v=>data.value=v,setActionJobNote:v=>data.note=v,
   setOwnerEditDirty:b=>guard.report({...b,scope:data.scope}),releaseOwnerEdit:t=>guard.release(t),withOwnerEditCommit:(t,id,fn)=>guard.withCommit(t,id,fn),requestOwnerEditTransition:(fn,opt)=>guard.request(fn,opt),completeReplyAction:complete(),back:()=>guard.request(()=>data.route='home'),openCustomer:()=>{data.opened++;data.route='customer';},setBookingStatus:()=>{data.statusWrites++;},markBookingCompleted:Function('replyActions','setReplyActions','setCustomers','formatUKDate','nextRepeatDueDate','services','verticalId','return '+completionSource)(data.table,fn=>{data.table=fn(data.table);data.writes++;},fn=>data.customer=fn([data.customer])[0],v=>v,()=>'',[],'cleaning'),startJobPhotoPrompt:()=>data.photoPrompts++};
  return rt.render(ReplyActionDetail,{s:state});
 };
 return {data,rt,render,get state(){return state;},get prompt(){return prompt;},effects:()=>rt.effects.slice(-6).forEach(fn=>fn())};
}
let f=fixture(),t=f.render();const note=()=>walk(t).find(n=>n.props?.accessibilityLabel==='Completed job note');
note().props.onChangeText('  Exact unfinished job note\nSecond line  ');t=f.render();assert.equal(f.state.back(),false);f.prompt.keep();assert.equal(f.data.note,'  Exact unfinished job note\nSecond line  ');
find(t,'Open customer').props.onPress();const stale=f.prompt.discard;note().props.onChangeText('Newer exact note');t=f.render();assert.equal(stale(),false);assert.equal(f.data.opened,0);assert.equal(f.data.note,'Newer exact note');
find(t,'Open customer').props.onPress();const kept=f.prompt.discard;f.prompt.keep();assert.equal(kept(),false);assert.equal(f.data.opened,0);
find(t,'Open customer').props.onPress();assert.equal(f.prompt.discard(),true);assert.equal(f.data.opened,1);assert.equal(f.data.note,'Recorded note');assert.equal(f.prompt.discard(),false);
// Actual original completion records only booking-owned fields. An unfinished completion note remains dirty.
f=fixture();t=f.render();note().props.onChangeText('Completion note not included in date save');t=f.render();find(t,'Or enter a time').props.onChangeText('11:30');t=f.render();const save=find(t,'Save booking changes').props.onPress;save();save();assert.equal(f.data.writes,1);assert.equal(f.data.table.a.details.bookingTime,'11:30');assert.equal(f.data.table.a.details.completionNote,'Recorded note');t=f.render();f.effects();assert.equal(f.data.note,'Completion note not included in date save');assert.equal(f.data.route,'replyActionDetail');assert.equal(f.state.back(),false);f.prompt.keep();assert.equal(f.data.table.unrelated.details.quoteAmount,'999');assert.equal(f.data.table.unrelated.details.unknown.keep,true);
// A later own record write cannot navigate away from words typed while React readback was pending.
f=fixture();t=f.render();find(t,'Or enter a time').props.onChangeText('12:30');t=f.render();find(t,'Save booking changes').props.onPress();note().props.onChangeText('Typed after save request');t=f.render();f.effects();assert.equal(f.data.route,'replyActionDetail');assert.equal(f.data.note,'Typed after save request');
// Exact clean own-record readback may leave. This is not a device/account acknowledgement.
f=fixture();t=f.render();find(t,'Or enter a time').props.onChangeText('13:30');t=f.render();find(t,'Save booking changes').props.onPress();t=f.render();f.effects();assert.equal(f.data.route,'home');
// Completion keeps its original history/normalisation contract and waits for current record readback before photos.
f=fixture();t=f.render();note().props.onChangeText('  Completed wording\nSecond line  ');t=f.render();find(t,'Mark job completed').props.onPress();assert.equal(f.data.photoPrompts,0);assert.equal(f.data.customer.history[0].note,'Completed wording\nSecond line');t=f.render();f.effects();assert.equal(f.data.photoPrompts,1);assert.equal(f.data.note,'  Completed wording\nSecond line  ');
f=fixture();t=f.render();find(t,'Mark job completed').props.onPress();note().props.onChangeText('Newer note while completing');t=f.render();f.effects();assert.equal(f.data.photoPrompts,0);assert.equal(f.data.note,'Newer note while completing');assert.equal(f.state.back(),false);
// Retained save/navigation actions cannot mutate after source, identity, view or role changes.
for(const mutate of [d=>d.role='viewer',d=>d.actor='another-owner',d=>d.business='foreign',d=>d.scope={},d=>d.view='customerDetail',d=>d.table={...d.table,other:{type:'booking',done:true,details:{bookingDate:d.date,bookingTime:d.time}}},d=>d.customer={...d.customer,id:'b'},d=>d.table={...d.table,a:{...d.table.a,details:{...d.table.a.details,bookingTime:'09:00'}}}]){
 f=fixture();t=f.render();const save=find(t,'Save booking changes').props.onPress,open=find(t,'Open customer').props.onPress;mutate(f.data);f.render();save();open();assert.equal(f.data.writes,0);assert.equal(f.data.opened,0);
}
f=fixture();t=f.render();find(t,'Or enter a time').props.onChangeText('14:30');t=f.render();const cancel=find(t,'Cancel booking').props.onPress;cancel();assert.equal(f.data.statusWrites,0);f.prompt.keep();assert.equal(f.data.time,'14:30');cancel();assert.equal(f.prompt.discard(),true);assert.equal(f.data.statusWrites,1);assert.equal(f.prompt.discard(),false);
// Quote review also binds view, exact current role and observed revision before using retained callbacks.
for(const mutate of [s=>s.view='another-screen',s=>s.cloudWorkspace.role='admin',s=>s.cloudRevision++]){
 const q=require('./lib/quote-preparation-fixture.cjs')();const tree=q.render(),save=q.find(tree,'Save quote as prepared').props.onPress;mutate(q.state);save();assert.equal(q.data.writes,0);
}
console.log('PASS original booking UI → dirty-navigation → actual original completion parent: exact notes, Keep/Discard one-use/stale typing, customer navigation, record/role/business/view changes, duplicate save, new typing during readback, independent completion note and unrelated quote preservation. No account/device save, provider booking or native acceptance claimed.');
