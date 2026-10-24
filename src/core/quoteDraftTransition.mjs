// Deliberate transitions over the original transient quote wording, not persistence.
export function protectQuoteDraftTransition({workspace,workspaceRef,draftRef,epochRef,renderEpoch,sourceCurrent,confirm,apply,promptTitle="Keep your current follow-up?",promptBody="Opening this quote will replace unfinished private wording. Nothing will be sent."}){
 if(workspaceRef.current!==workspace||epochRef.current!==renderEpoch||!sourceCurrent())return false;
 const draft=draftRef.current,epoch=epochRef.current;
 const current=()=>workspaceRef.current===workspace&&draftRef.current===draft&&epochRef.current===epoch&&sourceCurrent();
 let resolved=false;
 const run=()=>{if(resolved)return false;resolved=true;if(!current())return false;apply();return true;};
 if(draft?.workspace===workspace&&draft.words?.trim()){
  confirm(promptTitle,promptBody,[
   {text:'Keep editing',style:'cancel',onPress:()=>{resolved=true;}},
   {text:'Discard changes',style:'destructive',onPress:run},
  ]);return false;
 }
 return run();
}

export function isQuoteDraftSourceCurrent(draft,workspace,customerId,action,customer){
 return !!draft&&draft.workspace===workspace&&draft.customerId===customerId&&draft.action===action&&!!action&&(!draft.customer||draft.customer===customer);
}

// One original quote field, local workspace only. No send/status/time authority.
export function reviewPrivateQuoteFollowUp({workspace,workspaceRef,draftRef,epochRef,renderEpoch,getCurrent,confirm,write}){
 const source=getCurrent(),draft=draftRef.current,customerId=source.selectedId,action=source.replyActions?.[customerId],customer=source.customers?.find(c=>c.id===customerId)||source.lastSimulatedRecipients?.find(c=>c.id===customerId);
 const words=draft?.words,stamp=JSON.stringify([customer,action,draft?.originItem]),typing=epochRef.current;
 const sourceCurrent=()=>{const now=getCurrent();return workspaceRef.current===workspace&&now.ownerId===source.ownerId&&now.businessId===source.businessId&&now.role===source.role&&now.revision===source.revision&&now.view===source.view&&now.selectedId===customerId&&epochRef.current===typing&&now.replyActions?.[customerId]===action&&[...(now.customers||[]),...(now.lastSimulatedRecipients||[])].includes(customer)&&JSON.stringify([customer,action,draft.originItem])===stamp&&(!draft.originItem||now.inboxItems?.includes(draft.originItem)&&draft.originItem.status==='Filed'&&draft.originItem.filedCustomerId===customerId);};
 const current=()=>draftRef.current===draft&&sourceCurrent();
 if(typeof write!=='function'||typeof confirm!=='function'||[...(source.customers||[]),...(source.lastSimulatedRecipients||[])].filter(row=>row?.id===customerId).some(row=>row!==customer)||action?.details?.enquiryReference&&!draft?.originItem||!source.ownerId||!source.businessId||!['owner','admin'].includes(source.role)||!Number.isSafeInteger(source.revision)||source.revision<1||typing!==renderEpoch||!isQuoteDraftSourceCurrent(draft,workspace,customerId,action,customer)||action.details?.quoteStatus!=='Sent'||action.details?.followUpSentAt||typeof words!=='string'||!words.trim()||words.length>12000||[customer?.businessId,customer?.business_id].some(id=>id&&id!==source.businessId)||!current())return false;
 let used=false;
 confirm('Save private follow-up wording?','Currently recorded private wording:\n'+(action.details?.followUpMessage??'(none)')+'\n\nProposed wording:\n'+words+'\n\nThis records only private wording in this workspace. The quote amount, dates, status and customer history stay unchanged. Device/account saving and delivery are not confirmed.',[
  {text:'Keep editing',style:'cancel',onPress:()=>{used=true;}},
  {text:'Record private wording',onPress:()=>{
   if(used||!current())return false;used=true;
   const next={...action,details:{...action.details,followUpMessage:words}};
   const pending={...draft,privateSave:{before:action,next,ownerId:source.ownerId,businessId:source.businessId,role:source.role,revision:source.revision,customerStamp:JSON.stringify(customer),originStamp:JSON.stringify(draft.originItem)}};
   draftRef.current=pending;
   write(customerId,action,next,()=>draftRef.current===pending&&sourceCurrent());
   return true; // Submitted to original React owner, not an acknowledgement.
  }}
 ]);return true;
}

// Exact own object readback, not matching words or a durable/account receipt.
function privateQuoteRecordObserved(draft,workspace,source){
 const saved=draft?.privateSave;
 return !!saved&&draft.workspace===workspace&&source.ownerId===saved.ownerId&&source.businessId===saved.businessId&&source.role===saved.role&&source.revision===saved.revision&&source.replyActions?.[draft.customerId]===saved.next&&JSON.stringify(draft.customer)===saved.customerStamp&&JSON.stringify(draft.originItem)===saved.originStamp&&[...(source.customers||[]),...(source.lastSimulatedRecipients||[])].includes(draft.customer);
}
export function continuePrivateQuoteFollowUp(draft,workspace,source){
 return privateQuoteRecordObserved(draft,workspace,source)&&draft.action!==draft.privateSave.next?{...draft,action:draft.privateSave.next}:draft;
}
export function isPrivateQuoteFollowUpRecorded(draft,workspace,source,customerId){
 return draft?.customerId===customerId&&privateQuoteRecordObserved(draft,workspace,source)&&draft.words===draft.privateSave.next.details.followUpMessage;
}
