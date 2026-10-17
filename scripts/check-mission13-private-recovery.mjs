import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCustomerEnquiryCheckpoint as create,validCustomerEnquiryDraft} from '../src/core/customerEnquiryCheckpoint.mjs';
import {prepareBusinessContentEnquiry} from '../src/core/businessContentRecords.mjs';
const U='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',A='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',V='cccccccc-cccc-4ccc-8ccc-cccccccccccc',OTHER='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const scope={userId:U,appId:A,versionId:V},draft={name:'Fictional customer',email:'test@example.invalid',phone:'',service:'Product: Cup',message:'My unsent question',contentInterest:null};
const rows=new Map();let now=100000,sets=0;
const storage={getItemAsync:async key=>rows.get(key)||null,setItemAsync:async(key,value)=>{sets++;rows.set(key,value);},deleteItemAsync:async key=>rows.delete(key)};
const store=create(storage,scope,{now:()=>now});assert.equal(await store.load(),null);assert.equal(sets,0,'no implicit save');await store.save(draft);
// A new helper instance models process reconstruction. Native encryption and
// actual OS restart remain separate acceptance requirements.
assert.deepEqual(await create(storage,scope,{now:()=>now}).load(),draft);
assert.equal(await create(storage,{...scope,userId:OTHER},{now:()=>now}).load(),null);
await assert.rejects(create(storage,{...scope,versionId:OTHER},{now:()=>now}).load(),/app has changed/);
await store.save({...draft,message:'Newer unsent text'});assert.equal(await store.clearIfSame(draft),false);assert.equal((await store.load()).message,'Newer unsent text');
await store.clearIfSame({...draft,message:'Newer unsent text'});assert.equal(rows.size,0);
assert.equal(validCustomerEnquiryDraft({...draft,token:'forbidden'}),false);assert.equal(validCustomerEnquiryDraft({...draft,message:'x'.repeat(3001)}),false);
assert.equal(validCustomerEnquiryDraft({...draft,contentInterest:{recordId:'item',revision:1,password:'no'}}),false);
await assert.rejects(create(null,scope).save(draft),/unavailable/);await assert.rejects(create(storage,{...scope,userId:'not-authenticated'}).save(draft),/unavailable/);
await store.save(draft);now+=86400001;assert.equal(await store.load(),null);assert.equal(rows.size,0);
await store.save(draft);const key=[...rows.keys()][0];rows.set(key,'not-json');await assert.rejects(store.load(),/could not be read/);await store.remove();
// Actual asynchronous hook: stale typing and cross-account changes must not
// apply saved fields. No network or native storage is available in this test.
const source=fs.readFileSync('src/screens/useCustomerEnquiryRecovery.js','utf8');const begin=source.indexOf('function useCustomerEnquiryRecovery('),end=source.indexOf('\nexport ',begin);assert.ok(begin>0&&end>begin);
let slots=[],index=0,applied=null,finish=null,gets=0;
const React={useState(v){const k=index++;if(!(k in slots))slots[k]=v;return [slots[k],v=>slots[k]=v]},useRef(v){const k=index++;return slots[k]||(slots[k]={current:v})},useMemo(fn){index++;return fn()},useEffect(){index++;}};
const delayed={...storage,getItemAsync:()=>{gets++;return new Promise(resolve=>finish=resolve)}};
const Hook=new Function('React','SecureStore','createCustomerEnquiryCheckpoint','prepareBusinessContentEnquiry',source.slice(begin,end)+';return useCustomerEnquiryRecovery;')(React,delayed,create,prepareBusinessContentEnquiry);
const props={userId:U,detail:{app:{id:A},version:{id:V}},draft,onRestore:value=>applied=value};
function render(extra={}){index=0;return Hook({...props,...extra})}
const value=JSON.stringify({v:1,...scope,at:Date.now(),draft});let ui=render(),pending=ui.restore();await Promise.resolve();await Promise.resolve();
render({draft:{...draft,message:'New typing'}});finish(value);assert.equal(await pending,false);assert.equal(applied,null);
ui=render();pending=ui.restore();await Promise.resolve();await Promise.resolve();render({userId:OTHER});finish(value);assert.equal(await pending,false);assert.equal(applied,null);
ui=render();pending=ui.restore();await Promise.resolve();await Promise.resolve();finish(value);assert.equal(await pending,true);assert.deepEqual(applied,draft);
assert.ok(gets>=3);
console.log('PASS encrypted-storage boundary fixtures, explicit save, reconstructed helper restore, account/version/expiry checks, newer-draft preservation, corrupted-storage denial and actual async hook stale-typing/account guards. No OS encryption/device-restart claim.');
