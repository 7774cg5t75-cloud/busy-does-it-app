import {assertFiniteData} from './privateCalculation.mjs';
import {evaluatePrivateForm,formRelevant} from './privateForm.mjs';
import {verifyPrivateFunction} from './privateFunctionAccount.mjs';
import {canonicalArtifactText} from './artifactIntegrity.mjs';
import {stableJson} from './stableJson.mjs';
import {validateNativeGuestRequest} from '../../standalone/template/nativeCustomerActions.mjs';
import {supportedAppCatalogModule} from './appCatalogSupport.mjs';
import {prepareContextualAppEnquiry} from './appEnquirySource.mjs';
const fail=reason=>({ok:false,reason,submitted:false,maySend:false});
// This finite private handoff owns no customer records or submission permission.
export function activeFormAnswers(spec,values){
 assertFiniteData(values);const r=evaluatePrivateForm(spec,values);if(!r.ok||!r.valid) return {...fail(r.reason||'Check the highlighted form answers.'),validation:r};
 for(const f of spec.fields)if(formRelevant(f,values)&&typeof values[f.id]==='string')canonicalArtifactText(values[f.id]);
 return {ok:true,answers:Object.fromEntries(spec.fields.filter(f=>formRelevant(f,values)&&Object.hasOwn(values,f.id)).map(f=>[f.id,values[f.id]])),validation:r};
}
export async function preparePrivateFormEnquiry({context,placement,artifact,screenId,values,customer,catalog,feed=null,selection=null,integrity}){
 try{
  const a=await verifyPrivateFunction(artifact,context,integrity),scope=context?.scope,b=placement?.bindings?.find(b=>b.screenId===screenId);
  if(!a.ok||!a.eligible||a.artifact.spec.kind!=='private-form'||!placement?.eligible||placement.ownerId!==scope.ownerId||placement.businessId!==scope.businessId||placement.appId!==scope.projectId||placement.appRevision!==scope.sourceRevision||placement.record?.revision!==placement.currentRevision||!b||b.functionId!==a.reference.functionId||b.version!==a.reference.version||b.hash!==a.reference.hash||b.stateRevision!==a.reference.stateRevision)return fail('Reopen the exact eligible saved form and private screen.');
  if(!customer||Object.keys(customer).some(k=>!['name','email','phone','message'].includes(k)))return fail('Review the original supported contact information.');
  const checked=activeFormAnswers(a.artifact.spec,values);if(!checked.ok)return checked;
  const app=context.anchor.project;let original;
  if(selection)original=prepareContextualAppEnquiry({businessId:scope.businessId,app,catalog,feed,selection,customer});
  else {if(!supportedAppCatalogModule(catalog,'enquiry')||!app.draft_config?.modules?.some(m=>m.key==='enquiry'&&m.enabled===true))return fail('This App has no supported original enquiry authority.');original=validateNativeGuestRequest('enquiry',{...customer,service:'General enquiry'});}
  if(!original.ok)return fail(original.reason);
  const privateForm={version:1,appRevision:scope.sourceRevision,placementRevision:placement.currentRevision,placementHash:placement.record.digest,screenId,functionId:a.reference.functionId,artifactVersion:a.reference.version,artifactHash:a.reference.hash,artifactStateRevision:a.reference.stateRevision,answers:checked.answers};
  const size=[...stableJson(privateForm)].reduce((n,c)=>n+(c.codePointAt(0)<128?1:c.codePointAt(0)<2048?2:c.codePointAt(0)<65536?3:4),0);
  if(size>5800)return fail('The reviewed answers exceed this private enquiry limit. Nothing was discarded.');
  return {ok:true,privateOnly:true,submitted:false,maySend:false,submissionVerified:false,businessId:scope.businessId,ownerId:scope.ownerId,appId:scope.projectId,sourceRevision:scope.sourceRevision,payload:{...original.payload,...original.listingContext?{listingContext:original.listingContext}:{},privateForm},review:{title:a.artifact.spec.title,fields:a.artifact.spec.fields.filter(f=>Object.hasOwn(checked.answers,f.id)),answers:checked.answers,outputs:checked.validation.outputs,customer:original.payload,source:original.reference||null},validation:checked.validation};
 }catch{return fail('The exact form answers or source could not be prepared. Your input is kept.');}
}
export function createPrivateFormEnquiryPreparation({getCurrent,isCurrent,screens,artifacts,integrity}){
 const tickets=new WeakMap();let busy=false;
 const stamp=()=>stableJson(getCurrent()),live=s=>isCurrent()&&stamp()===s;
 return {
  async review({screenId,expected,values,customer,catalog,feed,selection}){
   if(busy||!isCurrent())return fail('Open the current private App.');busy=true;const s=stamp();
   try{const p=await screens.read();if(!p.ok||!p.eligible||p.record?.digest!==expected?.record?.digest||p.appId!==expected.appId||p.currentRevision!==expected.currentRevision||p.ownerId!==expected.ownerId||p.businessId!==expected.businessId||!live(s))return fail('The private screen or account changed. Reopen it; your answers are kept.');
    const b=p.bindings.find(b=>b.screenId===screenId);if(!b)return fail('No reviewed form is placed here.');const a=await artifacts.read(b.functionId,b.version);if(!live(s))return fail('The account changed.');
    const prepared=await preparePrivateFormEnquiry({context:getCurrent(),placement:p,artifact:a,screenId,values,customer,catalog,feed,selection,integrity});const after=await screens.read();if(!prepared.ok||!live(s)||!after.eligible||after.record?.digest!==p.record.digest)return prepared.ok?fail('The source changed during review.'):prepared;
    const ticket={};tickets.set(ticket,{stamp:s,prepared:JSON.parse(stableJson(prepared)),used:false});return {...prepared,ticket};
   }catch{return fail('Review is unavailable. Your values remain local.');}finally{busy=false;}
  },
  async accept(ticket,{ownerApproved=false}={}){const r=tickets.get(ticket);if(!r||r.used||!ownerApproved||!live(r.stamp))return fail('Review this exact current preparation first.');r.used=true;const d=r.prepared.payload.privateForm;try{const p=await screens.read(),a=await artifacts.read(d.functionId,d.artifactVersion);if(!live(r.stamp)||!p.eligible||p.record?.digest!==d.placementHash||p.currentRevision!==d.placementRevision||!a.eligible||a.reference.hash!==d.artifactHash||a.reference.stateRevision!==d.artifactStateRevision)return fail('The form changed after review. Keep your answers and review again.');}catch{return fail('Current form eligibility could not be checked.');}return {...JSON.parse(stableJson(r.prepared)),preparedOnly:true,mayReplay:false};}
 };
}
// Read-only display of a finite authenticated projection, never source authority.
export function formEnquiryRows(context){
 if(context?.version!==1||context.authority!=='busy_private_form_enquiry_v1'||!Array.isArray(context.fields)||context.fields.length>8||!context.answers)return [];
 return context.fields.filter(f=>Object.hasOwn(context.answers,f.id)).map(f=>({id:f.id,label:f.label,value:f.type==='choice'?f.options?.find(o=>o.value===context.answers[f.id])?.label??'Unavailable option':String(context.answers[f.id]),unit:f.type==='number'?f.unit:''}));
}
