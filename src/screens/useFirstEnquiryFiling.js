import React from 'react';
import {stableJson} from '../core/stableJson.mjs';
// Transient review of ORIGINAL Quick Capture fields. No customer/draft store.
// The account session owns IO and receipts; original parent owns all field state.
export function useFirstEnquiryFiling(input){
 const live=React.useRef(input),pending=React.useRef(null),[state,setState]=React.useState(null);live.current=input;
 const scope=input.scope,workspace=input.workspace;
 const valid=()=>live.current.enabled===true&&live.current.scope===scope&&input.scopeRef.current===scope&&!!workspace&&!!live.current.ownerId&&live.current.workspace===workspace&&workspace.actorId===live.current.ownerId&&workspace.memberRole==='owner'&&['empty','present'].includes(workspace.snapshotStatus)&&live.current.screen==='quickCaptureReview'&&(live.current.contextRef.current.businessId!==workspace.businessId||live.current.contextRef.current.role==='owner');
 const getCurrent=()=>{const v=live.current,original=v.contextRef.current;return {...original,identity:workspace,ownerId:v.ownerId,businessId:workspace?.businessId,role:workspace?.memberRole,ready:valid(),inputEpoch:v.epochRef.current,getPayload:()=>({device:original.getPayload(),capture:live.current.capture,screen:live.current.screen,selected:live.current.selectedInboxItemId})};};
 const priorManualSource=source=>['Customer message','Owner-supplied manual capture'].includes(source);
 const publish=task=>{if(pending.current===task)setState({...task});};
 const review=async()=>{
  const c=live.current.capture;
  if(!valid()||['checking','saving','unknown'].includes(pending.current?.status)||c.stage!=='Enquiry'||c.forceNew||c.screenshots.length||c.analysis||!c.name.trim()||!c.service.trim()||(!c.phone.trim()&&!c.email.trim())||!c.rawText.trim()||c.value.trim()||!live.current.selectedInboxItemId&&!priorManualSource(c.source))return false;
  const prior=pending.current?.scope===scope&&pending.current.workspace===workspace?pending.current:null,sourceId=live.current.selectedInboxItemId||prior?.registered?.enquiryId||null;
  const typing=input.epochRef.current,view=live.current.screen,captured=stableJson(getCurrent().getPayload());
  const task={scope,workspace,status:'checking',registered:prior?.registered};pending.current=task;publish(task);
  const fresh=()=>valid()&&pending.current===task&&live.current.epochRef.current===typing&&live.current.screen===view&&stableJson(getCurrent().getPayload())===captured;
  let result;try{result=await input.sessionRef.current.reviewEnquiry({getCurrent,enquiryId:sourceId,ownerAccessToken:input.ownerAccessToken,request:input.request});}catch{result={ok:false};}
  if(!fresh()||!result.ok||sourceId&&result.review.pending.rawText!==c.rawText){task.status='reviewRequired';publish(task);return false;}
  const manual=!sourceId,seed=String(Date.now()),ids={customerId:'intake-'+seed,enquiryId:sourceId||'inbox-owner-'+seed,sourceRecordId:'source-intake-'+seed,intakeId:'intake-log-'+seed,activityId:'activity-intake-'+seed};
  const capture={...ids,sourceHash:result.review.sourceHash,name:c.name,phone:c.phone,email:c.email,address:c.address,service:c.service,eventDate:c.date,eventTime:c.time,note:c.note,confidence:c.confidence};
  task.status='review';publish(task);let used=false;
  input.confirm(manual?'Review owner-supplied source':'Review first account Enquiry','Account: '+workspace.businessName+'\n\n'+(manual?'This registers your supplied text, not an independently verified incoming message. Filing requires another review.':'Current Pending source: '+result.review.pending.source)+'\n'+c.rawText+'\n\nOwner-reviewed fields:\n'+[c.name,c.phone,c.email,c.address,c.service,c.date+' '+c.time,c.note].join('\n')+'\n\n'+(manual?'No customer is filed yet.':'Only the first Enquiry and its original intake/source records will be filed.')+' Device work stays separate. Nothing is sent.',[
   {text:'Keep editing',style:'cancel',onPress:()=>{used=true;task.status='cancelled';publish(task);return false;}},
   {text:manual?'Register owner-supplied source':'File reviewed Enquiry',onPress:async()=>{
    if(used||!fresh())return false;used=true;
    const ticket=input.sessionRef.current.prepareEnquiryOperation({getCurrent,review:result.review,...manual?{manual:{enquiryId:ids.enquiryId,rawText:c.rawText}}:{capture}});
    if(!ticket){task.status='reviewRequired';publish(task);return false;}
    task.status='saving';publish(task);let saved;
    try{saved=await input.sessionRef.current.commitEnquiry({getCurrent,ticket,ownerAccessToken:input.ownerAccessToken,request:input.request});}catch{saved={ok:false,uncertain:true};}
    if(pending.current!==task)return false;
    if(!saved.ok||!fresh()){task.status=saved.uncertain||saved.ok?'unknown':'reviewRequired';publish(task);return false;}
    task.receipt=saved.receipt;task.status=manual?'registered':'filed';if(manual)task.registered=saved.receipt;publish(task);
    if(!manual)input.go('quickCaptureSaved');return true;
   }},
  ]);return true;
 };
 return {review,state:state?.scope===scope&&state.workspace===workspace&&workspace?.actorId===input.ownerId&&(input.contextRef.current.businessId!==workspace.businessId||input.contextRef.current.role==='owner')?state:null,enabled:input.enabled===true,openReply:()=>state?.scope===scope&&state.workspace===workspace&&state.status==='filed'?input.openReply({customerId:state.receipt.customerId,enquiryId:state.receipt.enquiryId}):false};
}
