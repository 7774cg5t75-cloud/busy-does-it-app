import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareBusinessContentEnquiry} from '../src/core/businessContentRecords.mjs';
// Actual standalone form pre-render body; no Babel, React renderer or network.
const source=fs.readFileSync(new URL('../standalone/template/App.js',import.meta.url),'utf8');
const a=source.indexOf('function RequestScreen('),b=source.indexOf(' return <View',a);assert.ok(a>0&&b>a);
const feed={ok:true,version:1,businessId:'business-a',checkedAt:'2026-10-17T12:00:00.000Z',records:[{id:'product_record_001',kind:'product',revision:2,data:{name:'Bowl',description:'Owner wording',category:'Ceramics',image:null,status:'active',currency:'GBP',amountMinor:2450,availability:'not_tracked'}}],stockTracked:false,checkoutEnabled:false,attendanceConfirmed:false};
const prepared=prepareBusinessContentEnquiry(feed,'business-a',{recordId:'product_record_001',revision:2});
let persisted=null,calls=0,resolve;const transport=async()=>{calls++;return new Promise(done=>resolve=done);};
const props={screen:{key:'enquiry'},live:{supportsEnquiry:true,businessContent:feed},runtime:{},initialService:prepared.service,initialMessage:prepared.message,contentSelection:{...prepared.selection,businessId:'business-a'},onSaveState:value=>persisted=value};
function component(savedState=null){let slots=[],index=0,effects=[];const React={useRef(value){const key=index++;return slots[key]||(slots[key]={current:value});},useMemo(fn){index++;return fn();}};const useState=initial=>{const key=index++;if(!(key in slots))slots[key]=initial;return [slots[key],value=>slots[key]=typeof value==='function'?value(slots[key]):value];};const useEffect=fn=>{index++;effects.push(fn);};const Form=new Function('React','useState','useEffect','nativePreferredDates','prepareBusinessContentEnquiry','sendNativeGuestRequest',source.slice(a,b)+'return {input,set,send,result};}return RequestScreen;')(React,useState,useEffect,()=>[],prepareBusinessContentEnquiry,transport);return {render(extra={}){index=0;effects=[];const result=Form({...props,savedState,...extra});effects.forEach(fn=>fn());return result;}};}
let c=component(),ui=c.render();ui.set('name')('Fictional visitor');ui=c.render();ui.set('email')('visitor@example.invalid');ui=c.render();
assert.equal(ui.input.message,prepared.message);const pending=ui.send();assert.equal(calls,1);assert.equal(persisted.result.mayHaveBeenReceived,true);
// Leaving and returning while the first call is unresolved must not send again.
let returned=component(persisted);ui=returned.render();assert.equal(ui.input.service,prepared.service);await ui.send();assert.equal(calls,1);
resolve({ok:true,requestId:'saved-request',message:'Enquiry sent.'});await pending;assert.equal(persisted.result.ok,true);
returned=component(persisted);ui=returned.render();await ui.send();assert.equal(calls,1,'saved success survives navigation and cannot be silently submitted twice');
const changed={...feed,records:[{...feed.records[0],revision:3}]};const stale=component().render({live:{supportsEnquiry:true,businessContent:changed}});await stale.send();assert.equal(calls,1,'a changed listing blocks before transport');
assert.ok(source.includes('const requestFormKey=JSON.stringify([live?.versionId,chosen?.key,requestedKind,requestedService,requestedIntent,requestSelection])'));
console.log('PASS actual standalone form logic: selected context, typed fields, pending navigation, success receipt continuity, no implicit duplicate and stale listing rejection. Hooks/transport fixtures, no native rendering or live service claim.');
