import {workPreparationSummary} from '../../../src/core/workPreparation.mjs';
import {validOperationalSource} from '../../../src/core/operationalScreen.mjs';
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(x);
export async function operationalWorkService({client,actorId,businessId,body,enabled,readWork}){
 if(enabled!=='true')throw Error('Private operational views are not enabled');
 const common=['action','businessId','connectedStaging','expectedProfileRevision','targetKind','operation'],overview=body?.targetKind==='preparation_overview';
 const allowed=overview?[...common,'after']:[...common,'app','expectedRevision','source','screenId','workRevision','snapshotRevision','ownerApproved','requestKey'];
 if(!uuid(actorId)||!uuid(businessId)||!body||Object.keys(body).some(k=>!allowed.includes(k))||body.action!=='private_work_preparation'||body.businessId!==undefined&&body.businessId!==businessId||body.connectedStaging!==undefined&&body.connectedStaging!==true||body.expectedProfileRevision!==undefined&&(!Number.isSafeInteger(body.expectedProfileRevision)||body.expectedProfileRevision<1)||JSON.stringify(body).length>6000)throw Error('Exact private operational request required');
 const rpc=async(name,args)=>{const r=await client.rpc(name,args);if(r.error||!r.data)throw Error('Private operational authority unavailable or changed');return r.data;};
 const read=source=>readWork({action:'private_work_preparation',operation:'read',customerId:source.customerId,...(source.targetKind==='filed_enquiry'?{targetKind:source.targetKind,enquiryId:source.enquiryId}:{engagementId:source.engagementId,quoteRevision:source.quoteRevision})});
 if(overview){
  if(body.operation!=='read'||body.after!==undefined&&(typeof body.after!=='string'||body.after.length>500))throw Error('Bounded private overview required');
  const args={b:businessId,a:actorId,after_key:body.after||null},basis=await rpc('busy_work_preparation_candidates_v1',args),rows=[];
  for(const candidate of basis.candidates){const {key,...source}=candidate;if(!validOperationalSource(source))throw Error('Unknown original source');try{const w=await read(source);if(!w.plan)throw Error();const summary=workPreparationSummary(w.plan);rows.push({key,source,status:w.needsSourceReview?'needs_review':'current',customerName:w.sourceContext.customerName,title:w.plan.title,stage:summary.stage,remaining:summary.remaining,completedCount:summary.completed.length,remainingCount:summary.remaining.length,workRevision:w.revision,snapshotRevision:w.snapshotRevision,lifecycle:{preparation:'owner_private',quote:source.targetKind==='prepared_quote'?'Prepared':'not_inferred',customerAcceptance:'not_established',job:'not_established',completion:'not_established',financialAction:'unavailable'}});}catch{rows.push({key,source,status:'unavailable',title:'Original preparation unavailable',remainingCount:null});}}
  // Fail the entire page if membership/snapshot changed while individual sources were checked.
  const end=await rpc('busy_work_preparation_candidates_v1',args);if(end.snapshotRevision!==basis.snapshotRevision||JSON.stringify(end.candidates)!==JSON.stringify(basis.candidates))throw Error('Overview changed; inspect again');
  return {ok:true,privateOnly:true,businessId,ownerId:actorId,snapshotRevision:basis.snapshotRevision,rows,nextCursor:basis.candidates.length===20?basis.candidates.at(-1).key:null,notOwnReceipt:true};
 }
 if(body.targetKind!=='operational_app'||!body.app||Object.keys(body.app).sort().join(',')!=='id,revision'||!uuid(body.app.id)||!Number.isSafeInteger(body.app.revision)||body.app.revision<1||!['read','save','remove'].includes(body.operation))throw Error('Exact original private App required');
 const args={b:businessId,a:actorId,app:body.app.id,mode:'read',app_rev:body.app.revision,expected:null,request:null,selection:null,context:null};
 if(body.operation==='read'){
  const observed=await rpc('busy_private_operational_v1',args);let work=null;
  if(observed.binding&&observed.status==='accepted_private')try{work=await read(observed.binding.source);const checked=await rpc('busy_private_operational_v1',{...args,mode:'check',expected:observed.revision,context:work.filedSource});if(checked.workRevision!==work.revision||checked.snapshotRevision!==work.snapshotRevision)throw Error();}catch{work=null;observed.status='source_unavailable';}
  return {ok:true,...observed,work,notOwnReceipt:true};
 }
 if(body.ownerApproved!==true||!uuid(body.requestKey)||!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision<0)throw Error('Review this exact private placement first');
 let work=null,selection=null;
 if(body.operation==='save'){
  if(!validOperationalSource(body.source)||!['business_profile','services','contact'].includes(body.screenId)||!Number.isSafeInteger(body.workRevision)||body.workRevision<1||!Number.isSafeInteger(body.snapshotRevision))throw Error('Exact reviewed Work source required');
  work=await read(body.source);if(!work.plan||work.needsSourceReview||work.existingQuotePlan||work.enquiryPreparationExists||work.revision!==body.workRevision||work.snapshotRevision!==body.snapshotRevision)throw Error('Review the current original preparation');
  selection={version:1,screenId:body.screenId,source:body.source,preparationId:work.preparationId||work.engagementId,reviewedRevision:work.revision,snapshotRevision:work.snapshotRevision};
 }else if(['source','screenId','workRevision','snapshotRevision'].some(k=>body[k]!==undefined))throw Error('Removal only changes the private placement');
 const receipt=await rpc('busy_private_operational_v1',{...args,mode:body.operation,expected:body.expectedRevision,request:body.requestKey,selection,context:work?.filedSource||null});return {ok:true,...receipt};
}
