import {validWorkPreparation} from '../../../src/core/workPreparation.mjs';
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(x);
export async function workPreparationService({client,sourceRead,actorId,businessId,body,enabled}){
 if(enabled!=='true')throw Error('Private Work preparation is not enabled');
 const read=body?.operation==='read',undo=body?.operation==='undo',allowed=read?['action','businessId','operation','customerId','engagementId','quoteRevision']:['action','businessId','operation','customerId','engagementId','quoteRevision','snapshotRevision','expectedRevision','operationId','ownerApproved',...(undo?[]:['plan'])];
 allowed.push('connectedStaging','expectedProfileRevision');
 if(body?.connectedStaging!==undefined&&body.connectedStaging!==true||body?.expectedProfileRevision!==undefined&&(!Number.isSafeInteger(body.expectedProfileRevision)||body.expectedProfileRevision<1))throw Error('Invalid original connected context');
 if(!body||Object.keys(body).some(k=>!allowed.includes(k))||body.action!=='private_work_preparation'||!['read','save','undo'].includes(body.operation)||!uuid(businessId)||!uuid(actorId)||!uuid(body.engagementId)||typeof body.customerId!=='string'||!body.customerId.length||body.customerId.length>240||!Number.isSafeInteger(body.quoteRevision)||body.quoteRevision<1||JSON.stringify(body).length>16000)throw Error('Unsupported private preparation request');
 if(body.businessId!==undefined&&body.businessId!==businessId)throw Error('Business changed');
 if(!read&&(body.ownerApproved!==true||!Number.isSafeInteger(body.snapshotRevision)||!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision<0||typeof body.operationId!=='string'||!/^work_[a-f0-9-]{36}$/i.test(body.operationId)||!undo&&!validWorkPreparation(body.plan)))throw Error('Exact reviewed preparation required');
 // Called only after original requireUser/current owner membership. These minimal
 // service reads disclose nothing until original authenticated source_review passes.
 const row=await client.from('business_work_engagements').select('id,business_id,customer_id,enquiry_id,created_by,revision,source_hash,customer_hash').eq('business_id',businessId).eq('customer_id',body.customerId).eq('id',body.engagementId).eq('created_by',actorId).maybeSingle();
 if(row.error||!row.data||row.data.revision!==body.quoteRevision)throw Error('Exact original Work record is unavailable');
 const snapshot=await client.from('busy_business_snapshots').select('revision').eq('business_id',businessId).maybeSingle();if(snapshot.error||!snapshot.data)throw Error('Current source unavailable');
 const revision=snapshot.data.revision;if(!read&&body.snapshotRevision!==revision)throw Error('Source changed since review');
 const source=await sourceRead({p_business_id:businessId,p_customer_id:body.customerId,p_enquiry_id:row.data.enquiry_id,p_expected_snapshot_revision:revision});
 if(source?.businessId!==businessId||source.ownerId!==actorId||source.customerId!==body.customerId||source.enquiryId!==row.data.enquiry_id||source.snapshotRevision!==revision||source.sourceHash!==row.data.source_hash||source.customerHash!==row.data.customer_hash)throw Error('Original customer/enquiry source is stale or foreign');
 const args={b:businessId,c:body.customerId,e:body.engagementId,a:actorId,q:body.quoteRevision,snap:revision};
 const r=await client.rpc(read?'busy_work_preparation_read_v1':'busy_work_preparation_write_v1',read?args:{...args,expected:body.expectedRevision,p:undo?null:body.plan,op:body.operationId,mode:body.operation});
 if(r.error)throw Error('Private preparation could not be independently confirmed');return {ok:true,...r.data,...(read?{sourceContext:{customerName:source.customer.name,service:source.customer.service,customerMessage:source.enquiry.rawText}}:{})};
}
