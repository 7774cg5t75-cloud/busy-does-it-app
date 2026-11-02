import {operationalWorkService} from './operationalWorkService.mjs';
import {enquiryPreparationService} from './enquiryPreparationService.mjs';
import {validWorkPreparation} from '../../../src/core/workPreparation.mjs';
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(x);
export async function workPreparationService({client,sourceRead,actorId,businessId,body,enabled,enquiryEnabled,operationalEnabled}){
 if(enabled!=='true')throw Error('Private Work preparation is not enabled');
 if(['operational_app','preparation_overview'].includes(body?.targetKind))return operationalWorkService({client,actorId,businessId,body,enabled:enquiryEnabled==='true'?operationalEnabled:undefined,readWork:async b=>{let filedSource;const r=await workPreparationService({client,sourceRead:async args=>{const source=await sourceRead(args);filedSource=source;return source;},actorId,businessId,body:b,enabled,enquiryEnabled});return {...r,filedSource:r.filedSource||filedSource};}});
 if(body?.targetKind==='filed_enquiry')return enquiryPreparationService({client,sourceRead,actorId,businessId,body,enabled:enquiryEnabled});
 const read=body?.operation==='read',undo=body?.operation==='undo',allowed=read?['action','businessId','operation','customerId','engagementId','quoteRevision']:['action','businessId','operation','customerId','engagementId','quoteRevision','snapshotRevision','expectedRevision','operationId','ownerApproved',...(undo?[]:['plan'])];
 allowed.push('connectedStaging','expectedProfileRevision');
 if(body?.connectedStaging!==undefined&&body.connectedStaging!==true||body?.expectedProfileRevision!==undefined&&(!Number.isSafeInteger(body.expectedProfileRevision)||body.expectedProfileRevision<1))throw Error('Invalid original connected context');
 if(!body||Object.keys(body).some(k=>!allowed.includes(k))||body.action!=='private_work_preparation'||!['read','save','undo'].includes(body.operation)||!uuid(businessId)||!uuid(actorId)||!uuid(body.engagementId)||typeof body.customerId!=='string'||!body.customerId.length||body.customerId.length>240||!Number.isSafeInteger(body.quoteRevision)||body.quoteRevision<1||JSON.stringify(body).length>16000)throw Error('Unsupported private preparation request');
 if(body.businessId!==undefined&&body.businessId!==businessId)throw Error('Business changed');
 if(!read&&(body.ownerApproved!==true||!Number.isSafeInteger(body.snapshotRevision)||!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision<0||typeof body.operationId!=='string'||!/^work_[a-f0-9-]{36}$/i.test(body.operationId)||!undo&&!validWorkPreparation(body.plan)))throw Error('Exact reviewed preparation required');
 // Called only after original requireUser/current owner membership. Original
 // raw table grants stay closed; the finite basis reader locks exact scope.
 const basis=await client.rpc('busy_work_preparation_basis_v1',{b:businessId,c:body.customerId,e:body.engagementId,a:actorId});
 const row=basis.data;if(basis.error||!row||row.businessId!==businessId||row.customerId!==body.customerId||row.engagementId!==body.engagementId||row.ownerId!==actorId||row.quoteRevision!==body.quoteRevision)throw Error('Exact original Work record is unavailable');
 const revision=row.snapshotRevision;if(!Number.isSafeInteger(revision)||!read&&body.snapshotRevision!==revision)throw Error('Source changed since review');
 const source=await sourceRead({p_business_id:businessId,p_customer_id:body.customerId,p_enquiry_id:row.enquiryId,p_expected_snapshot_revision:revision});
 if(source?.businessId!==businessId||source.ownerId!==actorId||source.customerId!==body.customerId||source.enquiryId!==row.enquiryId||source.snapshotRevision!==revision||source.sourceHash!==row.sourceHash||source.customerHash!==row.customerHash)throw Error('Original customer/enquiry source is stale or foreign');
 const args={b:businessId,c:body.customerId,e:body.engagementId,a:actorId,q:body.quoteRevision,snap:revision};
 const r=await client.rpc(read?'busy_work_preparation_read_v1':'busy_work_preparation_write_v1',read?args:{...args,expected:body.expectedRevision,p:undo?null:body.plan,op:body.operationId,mode:body.operation});
 if(r.error)throw Error('Private preparation could not be independently confirmed');
 if(read&&enquiryEnabled==='true'){const linked=await client.rpc('busy_work_enquiry_plan_marker_v1',{b:businessId,c:body.customerId,e:row.enquiryId,a:actorId});if(linked.error)throw Error('Enquiry continuity unavailable');r.data.enquiryPreparationExists=linked.data.existingEnquiryPlan===true;r.data.enquiryId=row.enquiryId;}
 return {ok:true,...r.data,...(read?{sourceContext:{customerName:source.customer.name,service:source.customer.service,customerMessage:source.enquiry.rawText}}:{})};
}
