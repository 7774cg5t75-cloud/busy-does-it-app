import assert from 'node:assert/strict';
import {createAppDesignFeedbackActions as create} from '../src/core/appDesignFeedbackActions.mjs';
const businessId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',appId='cccccccc-cccc-4ccc-8ccc-cccccccccccc',ownerId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const initial={userId:ownerId,businessId,app:{id:appId,business_id:businessId,draft_revision:4,draft_config:{modules:[{key:'business_profile',enabled:true}],navigation:['business_profile'],presentation:{navigationStyle:'list'}}}};
const data=new Map(),storage={getItemAsync:async k=>data.get(k)||null,setItemAsync:async(k,v)=>data.set(k,v),deleteItemAsync:async k=>data.delete(k)};
let scope=initial,finish,keys=[],calls=0;const actions=create(()=>scope,{storage}),reviewed={ownerId,businessId};
const args={appId,expectedRevision:4,field:'navigationStyle',value:'list',verdict:'better',context:'saved_revision',source:'manual'};
const receipt={ok:true,businessId,appId,draftRevision:4,feedbackRecorded:true,feedbackContext:'saved_revision',publishedAppUnchanged:true};
const send=async(action,body,options)=>{calls++;assert.equal(options.isCurrent(),true);keys.push(options.requestKey);return receipt;};
assert.equal((await actions.record(args,send,reviewed)).ok,true);assert.equal((await actions.record(args,send,reviewed)).ok,true);assert.notEqual(keys[0],keys[1],"Confirmed choices are distinct owner actions");assert.match(keys[0],/^[a-zA-Z0-9:_-]{8,160}$/);
// Unconfirmed attempts retain the key; confirmed later opinions receive a new identity;
// this fixture transport itself does not simulate a durable database insert.
const pending=actions.record(args,()=>new Promise(r=>{finish=r;}),reviewed);assert.equal((await actions.clear({appId},send,reviewed)).ok,false);await new Promise(r=>setTimeout(r,0));scope={...initial,userId:'dddddddd-dddd-4ddd-8ddd-dddddddddddd'};finish(receipt);assert.equal((await pending).ok,false);
assert.equal((await actions.record(args,send,reviewed)).ok,false);scope=initial;
const stale=actions.clear({appId},()=>new Promise(r=>{finish=r;}),reviewed);await new Promise(r=>setTimeout(r,0));scope={...initial,app:{...initial.app,draft_revision:5}};finish({ok:true,businessId,appId,cleared:true,publicAppUnchanged:true});assert.equal((await stale).ok,false);
scope=initial;const before=calls;assert.equal((await actions.record({...args,expectedRevision:3},send,reviewed)).ok,false);assert.equal(calls,before);
assert.equal((await actions.clear({appId},async()=>({ok:true,businessId,appId,cleared:true,publicAppUnchanged:true}),reviewed)).ok,true);
console.log('PASS: scoped feedback/clear receipts, actor/revision changes, duplicate in-flight rejection and stable original-ledger request identity. Fake transport; hosted uniqueness remains unverified.');
const injected=await actions.record({...args,action:'clear_design_feedback',businessId:'foreign'},async(action,body)=>{
 assert.equal(action,'record_design_feedback');assert.equal(Object.hasOwn(body,'action'),false);assert.equal(Object.hasOwn(body,'businessId'),false);return receipt;
},reviewed);assert.equal(injected.ok,true);
const sentBefore=calls;assert.equal((await actions.record({...args,source:null},send,reviewed)).ok,false);assert.equal(calls,sentBefore);
