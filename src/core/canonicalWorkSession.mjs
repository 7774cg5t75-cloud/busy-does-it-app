import {stableJson} from './stableJson.mjs';
// V22.51 canonical individual records. Rollout is NOT authorization.
export const CANONICAL_WORK_ACCOUNT_ENABLED=false;
export const CANONICAL_OWNER_REPORT_ENABLED=false;
export const CANONICAL_AGREEMENT_DECISIONS_ENABLED=false;
export const CANONICAL_QUOTE_REFERENCE_ENABLED=false;
export const CANONICAL_RECIPIENT_REVIEW_ENABLED=false;
export const CANONICAL_RECIPIENT_BINDING_ENABLED=false;
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const hash=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const same=(a,b)=>stableJson(a)===stableJson(b);
const ownerAccount=v=>{if(typeof v!=='string'||!v.trim())return false;try{return encodeURIComponent(v).replace(/%[A-F0-9]{2}/g,'x').length<=5000;}catch{return false;}};
// Volatile finite-operation evidence only; canonical rows remain server authority.
export function createCanonicalWorkSession(){
 const observations=new WeakMap(),tickets=new WeakMap(),outcomes=new WeakMap();
 return {bind({enabled=CANONICAL_WORK_ACCOUNT_ENABLED,agreementEnabled=CANONICAL_OWNER_REPORT_ENABLED,decisionEnabled=CANONICAL_AGREEMENT_DECISIONS_ENABLED,quoteReferenceEnabled=CANONICAL_QUOTE_REFERENCE_ENABLED,recipientReviewEnabled=CANONICAL_RECIPIENT_REVIEW_ENABLED,bindingEnabled=CANONICAL_RECIPIENT_BINDING_ENABLED,getCurrent,ownerAccessToken,request,evidence='account'}){
  const initial=getCurrent(),scope=initial?.scope,start={ownerId:initial?.ownerId,businessId:initial?.businessId,role:initial?.role};
  const valid=()=>{const c=getCurrent();return enabled===true&&!!scope&&typeof scope==='object'&&c?.scope===scope&&c.ready===true&&c.ownerId===start.ownerId&&c.businessId===start.businessId&&c.role==='owner'&&start.role==='owner'&&!!c.ownerId&&uuid(c.businessId);};
  const observe=(value,kind)=>{observations.set(value,{scope,owner:start.ownerId,business:start.businessId,kind,localRevision:getCurrent().revision,stamp:stableJson(value)});return value;};
  const observed=(value,kind)=>{const b=value&&observations.get(value);return valid()&&b?.scope===scope&&b.owner===start.ownerId&&b.business===start.businessId&&b.kind===kind&&b.stamp===stableJson(value)&&(kind!=='source'||getCurrent().revision===value.snapshotRevision)&&(!['edit','agreement','decision','reference','recipient','binding'].includes(kind)||getCurrent().revision===b.localRevision);};
  const io=async(name,body,beforeSend=()=>true)=>{if(!valid())throw Error('Canonical Work is disabled or the workspace changed.');const token=await ownerAccessToken();if(!valid()||!token||!beforeSend())throw Error('Current authentication or review unavailable.');const value=await request('rpc/busy_work_'+name+'_v1',{method:'POST',token,body:{p_business_id:start.businessId,...body}});if(!valid())throw Error('Workspace changed during the request. Keep local work.');return value;};
  const scoped=(v,c,id=null)=>v&&v.businessId===start.businessId&&v.customerId===c&&(v.ownerId===start.ownerId||v.actorId===start.ownerId)&&(!id||v.engagementId===id);
  const source=async(customerId,enquiryId,revision)=>{
   const value=await io('source_review',{p_customer_id:customerId,p_enquiry_id:enquiryId,p_expected_snapshot_revision:revision});
   if(!scoped(value,customerId)||value.enquiryId!==enquiryId||value.snapshotRevision!==revision||value.schemaVersion!==1||!hash(value.sourceHash)||!hash(value.customerHash)||value.notOwnReceipt!==true||typeof value.hasLegacyWork!=='boolean')throw Error('Source review did not match the requested business/customer/enquiry.');
   return observe(value,'source');
  };
  const list=async(customerId,after=null)=>{const value=await io('list',{p_customer_id:customerId,p_after:after,p_limit:20});
   if(!scoped(value,customerId)||!Array.isArray(value.items)||value.items.length>20||value.nextCursor!==null&&!uuid(value.nextCursor)||value.notOwnReceipt!==true||value.items.some(x=>!uuid(x.engagementId)||x.type!=='quote'||x.status!=='Prepared'||!Number.isSafeInteger(x.revision)||x.revision<1||Object.keys(x).some(k=>!['engagementId','enquiryId','type','status','revision'].includes(k)))||new Set(value.items.map(x=>x.engagementId)).size!==value.items.length)throw Error('Unsupported canonical engagement page.');
   return value;
  };
  const read=async(customerId,id)=>{if(!uuid(id))throw Error('Invalid engagement identity.');const value=await io('read',{p_customer_id:customerId,p_engagement_id:id});
   if(!scoped(value,customerId,id)||value.schemaVersion!==1||!Number.isSafeInteger(value.revision)||value.revision<1||value.type!=='quote'||value.status!=='Prepared'||!hash(value.sourceHash)||!hash(value.recordHash)||value.notOwnReceipt!==true||value.record?.type!=='quote'||!value.record.details||Object.keys(value.record).some(k=>!['type','done','details'].includes(k))||Object.keys(value.record.details).some(k=>!['quoteStatus','quoteAmount','message','plannedSentDate'].includes(k)))throw Error('Unsupported or mismatched engagement read.');
   return observe(value,'record');
  };
  const history=async(customerId,id)=>{if(!uuid(id))throw Error('Invalid engagement identity.');const value=await io('history',{p_customer_id:customerId,p_engagement_id:id});if(!scoped(value,customerId,id)||value.historicalOnly!==true||value.mutationAuthorised!==false||value.notOwnReceipt!==true||!['current','changed','restricted','unsupported','unavailable'].includes(value.sourceState)||value.originalSource?.enquiryId!==value.enquiryId||!hash(value.sourceHash)||!Number.isSafeInteger(value.revision)||value.revision<1)throw Error('Historical identity mismatch.');return value;};
  const discover=async(after=null)=>{const value=await io('discover',{p_after:after,p_limit:20});if(value?.businessId!==start.businessId||value.ownerId!==start.ownerId||value.notOwnReceipt!==true||!Array.isArray(value.items)||value.items.length>20||value.nextCursor!==null&&!uuid(value.nextCursor)||value.items.some(x=>!uuid(x.engagementId)||typeof x.customerId!=='string'||typeof x.enquiryId!=='string'||x.type!=='quote'||x.status!=='Prepared'||!Number.isSafeInteger(x.revision)||x.revision<1||Object.keys(x).some(k=>!['engagementId','customerId','enquiryId','type','status','revision'].includes(k)))||new Set(value.items.map(x=>x.engagementId)).size!==value.items.length)throw Error('Unsupported account engagement page.');return value;};
  const compare=async(customerId,id)=>{if(!uuid(id))throw Error('Invalid engagement identity.');const value=await io('compare',{p_customer_id:customerId,p_engagement_id:id});if(!scoped(value,customerId,id)||value.notOwnReceipt!==true||value.historicalOnly!==true||value.comparisonOnly!==true||value.mutationAuthorised!==false||!['current','changed','restricted','unsupported','unavailable'].includes(value.sourceState)||!value.originalContext||value.currentContext!==null&&typeof value.currentContext!=='object')throw Error('Unsupported source comparison.');return value;};
  const editContext=async(customerId,id,revision)=>{if(!uuid(id)||!Number.isSafeInteger(revision)||revision<1)throw Error('Current engagement revision required.');const value=await io('edit_context',{p_customer_id:customerId,p_engagement_id:id,p_expected_revision:revision});if(!scoped(value,customerId,id)||value.currentEditContext!==true||value.schemaVersion!==1||value.revision!==revision||value.type!=='quote'||value.status!=='Prepared'||!hash(value.sourceHash)||!hash(value.recordHash)||!Number.isSafeInteger(value.contextSnapshotRevision)||value.contextSnapshotRevision<1||value.notOwnReceipt!==true||!Array.isArray(value.allowedOperations)||!value.allowedOperations.includes('edit_quote')||value.allowedOperations.some(x=>!['edit_quote','private_followup'].includes(x))||value.record?.type!=='quote'||!value.record.details||Object.keys(value.record.details).some(k=>!['quoteStatus','quoteAmount','message','plannedSentDate'].includes(k)))throw Error('Current edit context unavailable.');return observe(value,'edit');};
  const isEditContext=(value,operation='edit_quote')=>observed(value,'edit')&&value.currentEditContext===true&&value.allowedOperations.includes(operation);
  const privateRead=async(customerId,id,kind)=>{if(!['reply','followup','work_notes'].includes(kind))throw Error('Unsupported private purpose.');const value=await io('private_read',{p_customer_id:customerId,p_engagement_id:id,p_kind:kind});if(!scoped(value,customerId,id)||value.kind!==kind||!Number.isSafeInteger(value.revision)||value.revision<0||value.notOwnReceipt!==true||typeof value.needsReview!=='boolean'||value.revision===0&&value.text!==null||value.revision>0&&(typeof value.text!=='string'||!Number.isSafeInteger(value.engagementRevision)||value.engagementRevision<1))throw Error('Private draft identity mismatch.');return observe(value,'private');};
  const agreementContext=async(customerId,id,revision)=>{if(!uuid(id)||!Number.isSafeInteger(revision)||revision<1)throw Error('Exact quote version required.');if(!agreementEnabled)throw Error('Owner-report evidence is disabled.');const v=await io('agreement_review',{p_customer_id:customerId,p_engagement_id:id,p_expected_revision:revision});if(!scoped(v,customerId,id)||v.revision!==revision||v.currentAgreementReview!==true||v.schemaVersion!==1||v.type!=='quote'||v.status!=='Prepared'||v.notOwnReceipt!==true||v.evidenceClass!=='owner_reported_offline'||v.verification!=='unverified'||v.bookingEligible!==false||!hash(v.termsHash)||!hash(v.sourceHash)||v.terms?.quoteRevision!==revision||v.terms?.customerId!==customerId||v.terms?.enquiryId!==v.enquiryId||v.terms?.engagementId!==id||v.terms?.presentation!=='internal_prepared_quote')throw Error('Agreement review unavailable.');return observe(v,'agreement');};
  const agreementList=async(customerId,id,after=null)=>{if(!agreementEnabled)throw Error('Owner-report evidence is disabled.');const v=await io('agreement_list',{p_customer_id:customerId,p_engagement_id:id,p_after:after,p_limit:20});if(!scoped(v,customerId,id)||v.notOwnReceipt!==true||!Array.isArray(v.items)||v.items.length>20||v.nextCursor!==null&&!uuid(v.nextCursor)||new Set(v.items.map(x=>x.evidenceId)).size!==v.items.length||v.items.some(x=>!uuid(x.evidenceId)||!Number.isSafeInteger(x.quoteRevision)||x.quoteRevision<1||x.evidenceClass!=='owner_reported_offline'||x.verification!=='unverified'||Object.keys(x).some(k=>!['evidenceId','quoteRevision','evidenceClass','verification'].includes(k))))throw Error('Unsupported evidence page.');return v;};
  const agreementRead=async(customerId,id,evidenceId)=>{if(!agreementEnabled)throw Error('Owner-report evidence is disabled.');const v=await io('agreement_read',{p_customer_id:customerId,p_engagement_id:id,p_evidence_id:evidenceId});if(!scoped(v,customerId,id)||v.evidenceId!==evidenceId||v.revision!==1||v.notOwnReceipt!==true||v.bookingEligible!==false||v.evidenceClass!=='owner_reported_offline'||v.verification!=='unverified'||typeof v.ownerAccount!=='string'||!hash(v.termsHash)||v.terms?.engagementId!==id||v.terms?.quoteRevision!==v.quoteRevision||typeof v.termsChanged!=='boolean')throw Error('Unsupported evidence read.');if(decisionEnabled&&(!Number.isSafeInteger(v.decisionRevision)||v.decisionRevision<0||!['original','corrected','withdrawn'].includes(v.reportState)||v.decisionRevision>0&&(!uuid(v.decisionId)||typeof v.decisionStatement!=='string'||!Number.isFinite(Date.parse(v.decisionRecordedAt)))||v.reportState==='withdrawn'&&v.currentOwnerAccount!==null||v.reportState!=='withdrawn'&&typeof v.currentOwnerAccount!=='string'))throw Error('Unsupported evidence decision status.');return v;};
  const quoteReferenceContext=async(customerId,id,revision)=>{
   if(!quoteReferenceEnabled||!uuid(id)||!Number.isSafeInteger(revision)||revision<1)throw Error('Quote references disabled or invalid.');
   const v=await io('quote_reference_review',{p_customer_id:customerId,p_engagement_id:id,p_expected_revision:revision});
   if(!scoped(v,customerId,id)||v.currentQuoteReferenceReview!==true||v.revision!==revision||v.status!=='Prepared'||!hash(v.sourceHash)||!hash(v.recordHash)||!hash(v.termsHash)||v.terms?.engagementId!==id||v.terms?.customerId!==customerId||v.terms?.quoteRevision!==revision||v.terms?.presentation!=='internal_prepared_quote'||v.presentationState!=='prepared_not_presented'||v.executionAuthorised!==false||v.notOwnReceipt!==true)throw Error('Unsupported quote reference review.');
   return observe(v,'reference');
  };
  const quoteReferenceList=async(customerId,id,after=null)=>{
   if(!quoteReferenceEnabled||!uuid(id))throw Error('Quote references disabled or invalid.');const v=await io('quote_reference_list',{p_customer_id:customerId,p_engagement_id:id,p_after:after,p_limit:20});
   if(!scoped(v,customerId,id)||v.notOwnReceipt!==true||!Array.isArray(v.items)||v.items.length>20||v.nextCursor!==null&&!uuid(v.nextCursor)||new Set(v.items.map(x=>x.referenceId)).size!==v.items.length||v.items.some(x=>!uuid(x.referenceId)||!Number.isSafeInteger(x.quoteRevision)||x.quoteRevision<1||x.presentationState!=='prepared_not_presented'||Object.keys(x).some(k=>!['referenceId','quoteRevision','presentationState'].includes(k))))throw Error('Unsupported quote reference page.');return v;
  };
  const quoteReferenceRead=async(customerId,id,referenceId)=>{
   if(!quoteReferenceEnabled||!uuid(id)||!uuid(referenceId))throw Error('Quote references disabled or invalid.');const v=await io('quote_reference_read',{p_customer_id:customerId,p_engagement_id:id,p_reference_id:referenceId});
   if(!scoped(v,customerId,id)||v.referenceId!==referenceId||v.revision!==1||!Number.isSafeInteger(v.quoteRevision)||v.quoteRevision<1||!hash(v.termsHash)||v.terms?.engagementId!==id||v.terms?.customerId!==customerId||v.terms?.quoteRevision!==v.quoteRevision||v.presentationState!=='prepared_not_presented'||v.executionAuthorised!==false||v.notOwnReceipt!==true||typeof v.termsChanged!=='boolean'||v.providerEvidence!=='not_established_by_protocol'||v.customerResponseEvidence!=='no_exact_quote_reference_in_original_protocol'||v.requestAssociationState!=='not_established_by_protocol')throw Error('Unsupported quote reference read.');return v;
  };
  const recipientCandidates=async(customerId,id,referenceId,after=null)=>{
   if(!recipientReviewEnabled||!quoteReferenceEnabled||!uuid(id)||!uuid(referenceId))throw Error('Recipient inspection disabled.');
   const v=await io('quote_recipient_candidates',{p_customer_id:customerId,p_engagement_id:id,p_reference_id:referenceId,p_after:after,p_limit:20});
   if(!scoped(v,customerId,id)||v.referenceId!==referenceId||v.candidateOnly!==true||v.notOwnReceipt!==true||v.consumerAccessAuthorised!==false||!Array.isArray(v.items)||v.items.length>20||v.nextCursor!==null&&!uuid(v.nextCursor)||new Set(v.items.map(x=>x.requestId)).size!==v.items.length||v.items.some(x=>!uuid(x.requestId)||!uuid(x.appId)||!Number.isFinite(Date.parse(x.requestRevision))||Object.keys(x).some(k=>!['requestId','appId','requestRevision'].includes(k))))throw Error('Unsupported recipient candidates.');return v;
  };
  const recipientReview=async(customerId,id,referenceId,requestId)=>{
   if(!recipientReviewEnabled||!quoteReferenceEnabled||![id,referenceId,requestId].every(uuid))throw Error('Recipient inspection disabled or invalid.');
   const v=await io('quote_recipient_review',{p_customer_id:customerId,p_engagement_id:id,p_reference_id:referenceId,p_request_id:requestId});
   if(!scoped(v,customerId,id)||v.referenceId!==referenceId||!Number.isSafeInteger(v.quoteRevision)||v.quoteRevision<1||!hash(v.termsHash)||typeof v.recipientIdentified!=='boolean'||typeof v.provenance!=='string'||v.notOwnReceipt!==true||v.consumerAccessAuthorised!==false||v.quoteRequestAssociated!==false||v.customerResponseLinked!==false||v.executionAuthorised!==false||!v.recipientIdentified&&v.recipient!==null||v.recipientIdentified&&(v.provenance!=='owner_linked_signed_in_request'||v.recipient?.requestId!==requestId||![v.recipient?.consumerId,v.recipient?.linkId,v.recipient?.appId,v.recipient?.appVersionId].every(uuid)||!Number.isFinite(Date.parse(v.recipient?.requestRevision))||!Number.isFinite(Date.parse(v.recipient?.linkRevision))))throw Error('Unsupported recipient review.');return observe(v,'recipient');
  };
  const quoteBindingContext=async(customerId,id,referenceId,requestId,revision)=>{
   if(!bindingEnabled||!recipientReviewEnabled||!quoteReferenceEnabled||![id,referenceId,requestId].every(uuid)||!Number.isSafeInteger(revision)||revision<1)throw Error('Private binding disabled or invalid.');
   const v=await io('quote_binding_context',{p_customer_id:customerId,p_engagement_id:id,p_reference_id:referenceId,p_request_id:requestId,p_expected_quote_revision:revision});
   if(!scoped(v,customerId,id)||v.referenceId!==referenceId||v.currentBindingReview!==true||v.revision!==revision||v.quoteRevision!==revision||!hash(v.sourceHash)||!hash(v.recordHash)||!hash(v.termsHash)||!hash(v.reviewHash)||v.terms?.engagementId!==id||v.terms?.quoteRevision!==revision||v.terms?.customerId!==customerId||v.recipientReview?.recipient?.requestId!==requestId||v.recipientReview?.recipientIdentified!==true||v.recipientReview?.consumerAccessAuthorised!==false||!uuid(v.recipientReview?.recipient?.consumerId)||v.consumerAccessAuthorised!==false||v.notOwnReceipt!==true||typeof v.bindingExists!=='boolean')throw Error('Unsupported fresh private binding context.');return observe(v,'binding');
  };
  const quoteBindingRead=async(customerId,id,referenceId)=>{
   if(!bindingEnabled||!quoteReferenceEnabled||![id,referenceId].every(uuid))throw Error('Private binding inspection disabled.');
   const v=await io('quote_binding_read',{p_customer_id:customerId,p_engagement_id:id,p_reference_id:referenceId});
   if(!scoped(v,customerId,id)||v.referenceId!==referenceId||v.notOwnReceipt!==true||v.consumerAccessAuthorised!==false||v.quoteRequestAssociated!==false||v.executionAuthorised!==false||!['absent','current','stale_quote_version','changed_source_evidence','unavailable_recipient'].includes(v.eligibility)||v.eligibility==='absent'&&v.binding!==null||v.eligibility!=='absent'&&(!uuid(v.binding?.bindingId)||v.binding?.revision!==1||!Number.isSafeInteger(v.binding?.quoteRevision)||v.binding.quoteRevision<1||!hash(v.binding?.termsHash)||!hash(v.binding?.reviewHash))||v.eligibility==='current'&&!uuid(v.recipient?.consumerId)||v.eligibility!=='current'&&v.recipient!==null)throw Error('Unsupported private binding observation.');return v;
  };
  const bookingReadiness=async(customerId,id,evidenceId)=>{
   if(!agreementEnabled||!decisionEnabled||!uuid(id)||!uuid(evidenceId))throw Error('Readiness proposal disabled.');
   const v=await io('booking_readiness',{p_customer_id:customerId,p_engagement_id:id,p_evidence_id:evidenceId});
   if(!scoped(v,customerId,id)||v.evidenceId!==evidenceId||v.notOwnReceipt!==true||v.verification!=='unverified'||v.bookingEligible!==false||v.executionAuthorised!==false||v.requestAssociationState!=='unsupported_missing_canonical_request_contract'||v.customerResponseEvidence!=='not_established_by_protocol'||!['original','corrected','withdrawn'].includes(v.reportState)||!Array.isArray(v.requirements)||v.requirements.length!==4||v.requirements.some(x=>typeof x!=='string'))throw Error('Unsupported readiness inspection.');
   return v;
  };
  const decisionContext=async(customerId,id,evidenceId,revision)=>{
   if(!agreementEnabled||!decisionEnabled||!uuid(id)||!uuid(evidenceId)||!Number.isSafeInteger(revision)||revision<1)throw Error('Evidence decisions are disabled or invalid.');
   const v=await io('agreement_decision_review',{p_customer_id:customerId,p_engagement_id:id,p_evidence_id:evidenceId,p_expected_revision:revision});
   if(!scoped(v,customerId,id)||v.evidenceId!==evidenceId||v.revision!==revision||v.currentDecisionReview!==true||!Number.isSafeInteger(v.quoteRevision)||v.quoteRevision<1||!hash(v.sourceHash)||!hash(v.recordHash)||!hash(v.termsHash)||v.terms?.engagementId!==id||v.terms?.quoteRevision!==v.quoteRevision||v.verification!=='unverified'||v.bookingEligible!==false||!Number.isSafeInteger(v.decisionRevision)||v.decisionRevision<0||!['original','corrected','withdrawn'].includes(v.reportState)||typeof v.originalOwnerAccount!=='string'||v.notOwnReceipt!==true)throw Error('Evidence decision review mismatch.');
   return observe(v,'decision');
  };
  const review=({operation,source:src,record,draft,fields,operationId,editor})=>{
   if(!valid()||!['create','edit','private','agreement','decision','reference','binding'].includes(operation)||typeof operationId!=='string'||!/^[A-Za-z0-9_-]{8,120}$/.test(operationId)||!editor||!Number.isSafeInteger(editor.typingEpoch)||editor.typingEpoch<0)return null;
   const base=operation==='create'?src:record;
   const sourceKind=operation==='binding'?'binding':operation==='reference'?'reference':operation==='decision'?'decision':operation==='agreement'?'agreement':operation==='create'?'source':observed(base,'edit')?'edit':'record';
   if(!observed(base,sourceKind)||editor.customerId!==base.customerId||operation==='private'&&(!observed(draft,'private')||draft.engagementId!==record.engagementId||draft.customerId!==record.customerId))return null;
   if(sourceKind==='edit'&&!isEditContext(base,operation==='private'?'private_followup':'edit_quote'))return null;
   if(sourceKind==='edit'&&operation==='private'&&!['followup','work_notes'].includes(draft?.kind))return null;
   if(['edit','private','agreement','decision','reference','binding'].includes(operation)&&editor.engagementId!==record.engagementId)return null;
   if(operation==='create'&&editor.engagementId!==null)return null;
   if(['create','edit'].includes(operation)&&(!fields||typeof fields.text!=='string'||!fields.text.trim()||typeof fields.amount!=='string'||!/^\d+(?:\.\d{1,2})?$/.test(fields.amount)||typeof fields.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(fields.date)))return null;
   if(operation==='agreement'&&(!agreementEnabled||!ownerAccount(fields?.text)||editor.purpose!=='owner_reported_offline'||base.verification!=='unverified'||base.bookingEligible!==false))return null;
   if(operation==='decision'&&(!agreementEnabled||!decisionEnabled||base.reportState==='withdrawn'||!ownerAccount(fields?.text)||!['correct','withdraw'].includes(fields?.action)||editor.purpose!=='agreement_decision'||editor.evidenceId!==base.evidenceId))return null;
   if(operation==='reference'&&(!quoteReferenceEnabled||editor.purpose!=='quote_reference'||!fields||Object.keys(fields).length!==0))return null;
   if(operation==='binding'&&(!bindingEnabled||base.bindingExists||editor.purpose!=='quote_recipient_binding'||editor.referenceId!==base.referenceId||editor.requestId!==base.recipientReview?.recipient?.requestId||!fields||Object.keys(fields).length))return null;
   if(!same(editor.fields,fields))return null;
   if(operation==='create'&&src.hasLegacyWork)return null;
   if(operation==='private'&&editor.purpose!==undefined&&editor.purpose!==draft?.kind)return null;
   if(operation==='private'&&(!['reply','followup','work_notes'].includes(draft.kind)||typeof fields?.text!=='string'||!fields.text.trim()))return null;
   const ticket=Object.freeze({operation,operationId,customerId:base.customerId,enquiryId:base.enquiryId||record?.enquiryId,engagementId:record?.engagementId||null,fields:JSON.parse(stableJson(fields||{})),source:base});
   tickets.set(ticket,{scope,editor:stableJson(editor),source:base,sourceKind,draft,stamp:stableJson(ticket),used:false});return ticket;
  };
  const cancel=ticket=>{const t=tickets.get(ticket);if(t)t.used=true;return false;};
  const commit=async(ticket,getEditor)=>{
   const t=tickets.get(ticket),previous=outcomes.get(scope);
   if(!t||t.used||!valid()||t.scope!==scope||t.stamp!==stableJson(ticket)||!same(getEditor(),JSON.parse(t.editor))||!observed(t.source,t.sourceKind)||t.draft&&!observed(t.draft,'private')||previous&&['pending','unknown'].includes(previous.status))return {status:'reviewRequired'};
   t.used=true;const pending={status:'pending',ticket};outcomes.set(scope,pending);
   const base=t.source,fields=ticket.fields,body={p_customer_id:ticket.customerId,p_operation_id:ticket.operationId};let name,expected,operation;
   if(ticket.operation==='create'){
    name='create_quote';operation='engagement_create_quote';expected=0;
    Object.assign(body,{p_enquiry_id:base.enquiryId,p_expected_snapshot_revision:base.snapshotRevision,p_source_hash:base.sourceHash,p_customer_hash:base.customerHash,p_amount:fields.amount,p_text:fields.text,p_date:fields.date});
   }else if(ticket.operation==='edit'){
    name='edit_quote';operation='engagement_edit_quote';expected=base.revision;Object.assign(body,{p_engagement_id:base.engagementId,p_expected_revision:base.revision,p_source_hash:base.sourceHash,p_amount:fields.amount,p_text:fields.text,p_date:fields.date});
   }else if(ticket.operation==='binding'){
    name='quote_binding_write';operation='quote_recipient_binding';expected=0;Object.assign(body,{p_engagement_id:base.engagementId,p_reference_id:base.referenceId,p_request_id:base.recipientReview.recipient.requestId,p_expected_quote_revision:base.quoteRevision,p_expected_binding_revision:0,p_review_hash:base.reviewHash});
   }else if(ticket.operation==='reference'){
    name='quote_reference_create';operation='engagement_quote_reference';expected=0;Object.assign(body,{p_engagement_id:base.engagementId,p_expected_revision:base.revision,p_terms_hash:base.termsHash});
   }else if(ticket.operation==='decision'){
    name='agreement_decide';operation='engagement_owner_report_decision';expected=base.decisionRevision;Object.assign(body,{p_engagement_id:base.engagementId,p_evidence_id:base.evidenceId,p_expected_revision:base.revision,p_expected_decision_revision:expected,p_terms_hash:base.termsHash,p_action:fields.action,p_statement:fields.text});
   }else if(ticket.operation==='agreement'){
    name='agreement_create';operation='engagement_owner_report';expected=0;Object.assign(body,{p_engagement_id:base.engagementId,p_expected_revision:base.revision,p_terms_hash:base.termsHash,p_owner_account:fields.text});
   }else{
    name='private_write';operation='engagement_private_wording';expected=t.draft.revision;Object.assign(body,{p_engagement_id:base.engagementId,p_engagement_revision:base.revision,p_expected_draft_revision:expected,p_source_hash:base.sourceHash,p_kind:t.draft.kind,p_text:fields.text});
   }
   let sent=false;
   try{
    const receipt=await io(name,body,()=>{if(!same(getEditor(),JSON.parse(t.editor))||!observed(t.source,t.sourceKind))return false;sent=true;return true;});
    if(!scoped(receipt,ticket.customerId,ticket.engagementId)||receipt.operation!==operation||receipt.operationId!==ticket.operationId||receipt.schemaVersion!==1||receipt.previousRevision!==expected||receipt.revision!==expected+1||!uuid(receipt.engagementId)||!['private','agreement','decision','reference','binding'].includes(ticket.operation)&&!hash(receipt.recordHash)||ticket.operation==='private'&&(receipt.kind!==t.draft.kind||receipt.engagementRevision!==base.revision||!hash(receipt.textHash))||ticket.operation==='create'&&receipt.enquiryId!==base.enquiryId||ticket.operation!=='private'&&receipt.sourceHash!==base.sourceHash||ticket.operation==='agreement'&&(!uuid(receipt.evidenceId)||receipt.quoteRevision!==base.revision||receipt.termsHash!==base.termsHash||receipt.verification!=='unverified'||receipt.evidenceClass!=='owner_reported_offline'||receipt.bookingEligible!==false||!Number.isFinite(Date.parse(receipt.recordedAt))))throw Error('Exact operation receipt mismatch.');
    if(ticket.operation==='decision'&&(receipt.evidenceId!==base.evidenceId||!uuid(receipt.decisionId)||receipt.engagementRevision!==base.revision||receipt.quoteRevision!==base.quoteRevision||receipt.termsHash!==base.termsHash||receipt.action!==fields.action||receipt.verification!=='unverified'||receipt.bookingEligible!==false||!Number.isFinite(Date.parse(receipt.recordedAt))))throw Error('Exact decision receipt mismatch.');
    if(ticket.operation==='reference'&&(!uuid(receipt.referenceId)||receipt.quoteRevision!==base.revision||receipt.termsHash!==base.termsHash||receipt.presentationState!=='prepared_not_presented'||receipt.executionAuthorised!==false||!Number.isFinite(Date.parse(receipt.recordedAt))))throw Error('Exact quote reference receipt mismatch.');
    if(ticket.operation==='binding'&&(!uuid(receipt.bindingId)||receipt.referenceId!==base.referenceId||receipt.requestId!==base.recipientReview.recipient.requestId||receipt.consumerId!==base.recipientReview.recipient.consumerId||receipt.quoteRevision!==base.quoteRevision||receipt.termsHash!==base.termsHash||receipt.reviewHash!==base.reviewHash||receipt.consumerAccessAuthorised!==false||receipt.quoteRequestAssociated!==false||receipt.executionAuthorised!==false||!Number.isFinite(Date.parse(receipt.recordedAt))))throw Error('Exact private binding receipt mismatch.');
    const result={status:'confirmed',evidence,receipt,ticket};outcomes.set(scope,result);return result;
   }catch{const status=sent?'unknown':'reviewRequired';if(outcomes.get(scope)===pending)outcomes.set(scope,{status,ticket});return {status,ticket};}
  };
  return {bindingEnabled:bindingEnabled===true,quoteBindingContext,quoteBindingRead,isBindingContext:v=>bindingEnabled&&observed(v,'binding'),recipientReviewEnabled:recipientReviewEnabled===true,recipientCandidates,recipientReview,isRecipientReview:v=>recipientReviewEnabled&&observed(v,'recipient'),quoteReferenceEnabled:quoteReferenceEnabled===true,quoteReferenceContext,quoteReferenceList,quoteReferenceRead,isQuoteReferenceContext:v=>quoteReferenceEnabled&&observed(v,'reference'),enabled:enabled===true,agreementEnabled:agreementEnabled===true,decisionEnabled:agreementEnabled===true&&decisionEnabled===true,bookingReadiness,decisionContext,isDecisionContext:v=>decisionEnabled&&observed(v,'decision'),isAgreementContext:v=>agreementEnabled&&observed(v,'agreement'),evidence,source,list,read,history,discover,compare,editContext,isEditContext,privateRead,agreementContext,agreementList,agreementRead,review,cancel,commit,status:()=>outcomes.get(scope)||{status:'idle'}};
 }};
}

const accountSessions=new WeakMap();
// Reuse the original account-session identity; no second root state/store.
export function canonicalWorkBindings({sessionRef,...options}){
 const key=sessionRef?.current;if(!key||typeof key!=='object')return {enabled:false};
 if(!accountSessions.has(key))accountSessions.set(key,createCanonicalWorkSession());
 return accountSessions.get(key).bind(options);
}
