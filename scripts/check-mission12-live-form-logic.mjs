// Executes unchanged production function bodies up to their JSX return.
// Native rendering/effects are modelled; this is not a JSX build or device test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareBusinessContentEnquiry,canApproveSavedBusinessContent,parseBusinessContentInterest} from '../src/core/businessContentRecords.mjs';
import {validateNativeGuestRequest} from '../standalone/template/nativeCustomerActions.mjs';
import {confirmAppToWebsiteDesign,planAppToWebsiteDesign} from '../src/core/appToWebsiteBrandTransferV3196.mjs';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
function hooks(){let slots=[],index=0,effects=[];const React={useState(initial){const key=index++;if(!(key in slots))slots[key]=typeof initial==='function'?initial():initial;return [slots[key],value=>slots[key]=typeof value==='function'?value(slots[key]):value];},useRef(value){const key=index++;return slots[key]||(slots[key]={current:value});},useEffect(fn){index++;effects.push(fn);},useMemo(fn){index++;return fn();}};return {React,run(fn,props){index=0;effects=[];const result=fn(props);effects.forEach(fn=>fn());return result;}};}
const businessId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',appId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const product={name:'Bowl',description:'Owner copy',category:'Ceramics',image:null,status:'active',amountMinor:2450,currency:'GBP',availability:'not_tracked'};
const feed={ok:true,version:1,businessId,checkedAt:'2026-10-17T12:00:00.000Z',records:[{id:'product_record_001',kind:'product',revision:2,data:product}],stockTracked:false,checkoutEnabled:false,attendanceConfirmed:false};
const selected=prepareBusinessContentEnquiry(feed,businessId,{recordId:'product_record_001',revision:2});
const source=read('src/screens/miniApps.js'),start=source.indexOf('function BusyAppDetailForm('),end=source.indexOf('\n  return (',start);
assert.ok(start>0&&end>start);const logic=source.slice(start,end)+'\n return {chooseContent,submitEnquiry,setName,setEmail,setMessage,message,service,contentInterest};}';
let draft=null,sent=null;const s={selectedBusyAppDetail:{app:{id:appId,business_id:businessId},version:{id:'version',config:{modules:[{key:'enquiry',enabled:true}]}},businessContent:feed},readBusyAppCustomerForm:()=>draft,saveBusyAppCustomerForm:value=>draft=value,submitBusyAppRequest:async(type,payload)=>{sent={type,payload};return true;}};
function form(){const h=hooks();const Form=new Function('React','prepareBusinessContentEnquiry','validateNativeGuestRequest','searchPublicNativeServices','nativePreferredDates','Alert',logic+';return BusyAppDetailForm;')(h.React,prepareBusinessContentEnquiry,validateNativeGuestRequest,()=>[],()=>[],{alert:(_a,_b,choices)=>choices.at(-1).onPress()});return {render:()=>h.run(Form,{s})};}
let f=form(),ui=f.render();ui.chooseContent(selected.service,selected);ui=f.render();assert.equal(ui.service,selected.service);assert.equal(ui.message,selected.message);
ui.setName('Fictional visitor');ui.setEmail('visitor@example.invalid');ui=f.render();
// A fresh component instance after navigation restores the same private form.
f=form();ui=f.render();assert.equal(ui.message,selected.message);assert.equal(ui.contentInterest.recordId,'product_record_001');await ui.submitEnquiry();assert.equal(sent.payload.message,selected.message);assert.equal(sent.payload.service,selected.service);
ui=f.render();assert.equal(ui.message,'');f=form();ui=f.render();assert.equal(ui.message,'');assert.equal(ui.contentInterest,null,'completed context must not revive after remount');
const current={id:'product_record_001',revision:2},fields={name:'Bowl'},baseline={...current,formStamp:JSON.stringify(fields)};
assert.equal(canApproveSavedBusinessContent(current,fields,baseline),true);assert.equal(canApproveSavedBusinessContent(current,{name:'Unsaved'},baseline),false);assert.equal(canApproveSavedBusinessContent({...current,revision:3},fields,baseline),false);
// Execute the real AppController private website apply handler, not a parallel implementation.
const controller=read('src/app/AppController.js'),a=controller.indexOf('  const applyAppDesignToWebsite=evidence=>'),b=controller.indexOf('  // V3.148:',a);assert.ok(a>0&&b>a);
const website={id:'site',businessId,generation:1,theme:{},sections:[{id:'hero',type:'hero',title:'Keep',body:'Owner words'}]},app={id:appId,business_id:businessId,draft_revision:1,draft_config:{modules:[{key:'business_profile',enabled:true}],navigation:['business_profile'],publicProfile:{faqs:[{question:'Can I collect?',answer:'Please contact us first.'}]}}};
const review=planAppToWebsiteDesign({website,app,businessId,includeDesign:false,includePublicInformation:true});assert.equal(review.ok,true,review.reason);let committed=null;
const apply=new Function('websiteDraftRef','miniAppsStatus','cloudWorkspace','confirmAppToWebsiteDesign','setWebsiteBuilderNotice','applyWebsiteLayoutChange','rebuildPrivateWebsiteDraft','commitReviewedBuilderDraft',controller.slice(a,b)+';return applyAppDesignToWebsite;')({current:website},{app},{businessId},confirmAppToWebsiteDesign,()=>{},()=>{throw Error('No style edits expected');},draft=>({...draft,generation:draft.generation+1}),(_before,after)=>{committed=after;return true;});
assert.equal(apply(review),true);assert.equal(committed.sections.find(x=>x.id==='faq').items[0].title,'Can I collect?');assert.deepEqual(committed.sections[0],website.sections[0]);assert.equal(apply({...review,targetWebsiteGeneration:0}),false);
// Source wiring assertions supplement the executed handlers; they are not render tests.
assert.ok(source.includes('onSelectContent={enabled.has(\'enquiry\')?chooseContent:null}'));assert.ok(controller.includes('target.contentInterest || null'));assert.equal(parseBusinessContentInterest({content:'product_record_001',content_revision:'2'}).recordId,'product_record_001');
const ca=controller.indexOf('  const customerFormRef=useRef('),cb=controller.indexOf('  const submitBusyAppRequest =',ca);assert.ok(ca>0&&cb>ca);
const formStore=new Function('useRef','ownerSession','customerRequestRenderEpoch','customerRequestEpochRef',controller.slice(ca,cb)+';return {read:readBusyAppCustomerForm,save:saveBusyAppCustomerForm};');
const ref={current:null},useRef=()=>ref,epoch={key:'account/app/version/item-a'},epochRef={current:epoch};
const store=formStore(useRef,{userId:'owner-a'},epoch,epochRef);assert.equal(store.save({message:'private enquiry'}),true);assert.equal(store.read().message,'private enquiry');
const nextEpoch={key:'account/app/version/item-b'};epochRef.current=nextEpoch;const nextStore=formStore(useRef,{userId:'owner-a'},nextEpoch,epochRef);assert.equal(nextStore.read(),null);assert.equal(store.save({message:'late old callback'}),false);
epochRef.current=epoch;assert.equal(formStore(useRef,{userId:'owner-a'},epoch,epochRef).read().message,'private enquiry');
assert.equal(formStore(useRef,{userId:'owner-b'},epoch,epochRef).read(),null,'a different account never inherits the form');
assert.equal(formStore(useRef,null,epoch,epochRef).read(),null,'sign-out clears customer form memory');
console.log('PASS actual customer form logic: selected context, navigation/remount, unchanged submission, cleared completion; saved-record approval guard and actual controller FAQ apply. Hooks/transport are inert fixtures, no JSX/device claim.');
