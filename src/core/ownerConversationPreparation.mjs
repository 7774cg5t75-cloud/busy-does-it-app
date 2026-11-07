/** Private reply preparation over the original request, never send authority.
 * Customer text is untrusted data. Only an exact current published FAQ can
 * supply factual answer wording; prices/availability are never inferred.
 */
import {validPublicCollection} from './appPublicCollections.mjs';
import {RECORD_ID,prepareBusinessContentEnquiry,contentPrice,contentEventSchedule} from './businessContentRecords.mjs';
import {validServiceDetails} from './publicServiceDetails.mjs';
const bounded=(s,n)=>typeof s==='string'?s.trim().slice(0,n):'';
const questionKey=s=>bounded(s,3000).toLocaleLowerCase().replace(/[?!.]+$/,'').replace(/\s+/g,' ').trim();
function conversationReviewSignal(message){
 const value=bounded(message,3000);
 if(/\b(stop (?:messaging|contacting)|do not contact|don't contact|unsubscribe|no more messages)\b/i.test(value))return 'review_contact_preference';
 if(/^(?:thanks[,! ]*)?(?:that's all|that is all|all sorted|no thanks|not interested)[.! ]*$/i.test(value))return 'review_closure';
 return null;
}
function parseEnquiryListingReference(message){
 const text=bounded(message,3000),matches=[...text.matchAll(/^Listing reference: ([A-Za-z0-9_-]+) \/ approved revision ([1-9]\d{0,9})(?: \/ option ([A-Za-z0-9_-]+))?\.$/gm)];
 if(matches.length!==1||text.split('Listing reference:').length!==2)return null;
 const [,recordId,revision,variantId]=matches[0];
 return RECORD_ID.test(recordId)&&(!variantId||RECORD_ID.test(variantId))?{recordId,revision:Number(revision),...(variantId?{variantId}:{})}:null;
}
function customerQuestionText(message){
 const value=bounded(message,3000);
 if(!parseEnquiryListingReference(value))return value;
 return value.split('\n').filter(line=>!(/^(?:Product: |Event: |Displayed price: |Listed dates: |Listing reference: |This is an enquiry, not an order, reservation or confirmed attendance\.|Please tell me more\.)/.test(line))).join('\n').trim();
}
function enquiryQuestionKinds(message){
 const categories=[
  ['price',/\b(prices?|costs?|how much|quotes?|discounts?)\b/i,'Confirm the current price and scope before quoting.'],
  ['availability',/\b(available|availability|preferred timing|preferred dates?|book|booking|reserve|stock|tickets?|spaces?)\b/i,'Check actual availability before offering a time or item.'],
  ['location',/\b(where|location|address|venue|deliver|delivery|travel)\b/i,'Confirm the relevant location or service area.'],
  ['accessibility',/\b(accessib\w*|wheelchair|step.free)\b/i,'Confirm the requested accessibility arrangements.'],
  ['options',/\b(options?|variants?|sizes?|colours?|colors?|quantity|quantities|group size)\b/i,'Review the selected option, requested quantity or group size and current details.']
 ];
 return categories.filter(([,pattern])=>pattern.test(customerQuestionText(message))).map(([id,,check])=>({id,check}));
}
function prepareOwnerConversation({request={},latestMessage=null,publishedConfig=null,listingFeed=null,businessId='',now=Date.now()}={}){
 const originalQuestion=request.request_type==='booking_request'?request.payload?.note:request.payload?.message;
 const message=customerQuestionText(latestMessage?.sender_role==='customer'?latestMessage.body:originalQuestion);
 const context=bounded(request.service_name||request.payload?.service,240);
 const intents=enquiryQuestionKinds(message);
 const faqs=publishedConfig?.publicProfile?.faqs;
 // No semantic guess: negation, extra requests and quoted instructions must
 // not accidentally select an unrelated approved answer.
 const matches=validPublicCollection('faqs',faqs)?faqs.filter(f=>{
  if(typeof f?.question!=='string'||typeof f?.answer!=='string'||!f.answer.trim()||f.answer.length>240)return false;
  return questionKey(message)===questionKey(f.question);
 }):[];
 let answer=matches.length===1?bounded(matches[0].answer,240):'';
 let answerSource=answer?'current_published_faq':'no_verified_answer';
 const selection=parseEnquiryListingReference(request.payload?.message);
 let listingStatus=selection?'needs_review':'none';
 if(selection&&listingFeed){
  const checked=prepareBusinessContentEnquiry(listingFeed,businessId,selection,{now});
  if(checked.ok){
   listingStatus='current';const row=listingFeed.records.find(r=>r.id===selection.recordId),d=row.data;
   const variant=selection.variantId?(d.variants||[]).find(v=>v.id===selection.variantId):null;
   if(!answer){
    answer=row.kind==='product'?
     'The approved listing shows '+bounded(d.name,80)+(variant?' — '+bounded(variant.label,60):'')+' at '+contentPrice(variant?variant.amountMinor:d.amountMinor,d.currency)+'.':
     'The approved event listing shows '+bounded(d.name,80)+': '+contentEventSchedule(d)+' at '+bounded(d.location||'the online event',100)+'.';
    answer+=' Listed information is not an order, reservation or availability confirmation.';
    answerSource='current_approved_listing';
   }
  }
 }
 if(!answer&&!selection){
  const services=publishedConfig?.publicProfile?.services;
  const service=Array.isArray(services)&&services.length<=50?services.filter(row=>
   typeof row?.name==='string'&&questionKey(row.name)===questionKey(context)&&validServiceDetails(row)&&
   typeof row.description==='string'&&row.description.length<=600&&!/[<>\u0000-\u001f\u007f]/.test(row.description)):[];
  if(service.length===1){
   const s=service[0];answer=bounded(s.description,160)+(s.priceLabel?' Listed price information: '+bounded(s.priceLabel,80)+'.':'')+(s.durationLabel?' Typical duration: '+bounded(s.durationLabel,60)+'.':'');
   if(answer.trim()){answer+=' Scope, availability and any quotation still need confirmation.';answerSource='current_published_service';}
  }
 }
 const booking=request.request_type==='booking_request';
 const lead='Thank you for your '+(booking?'booking request':'enquiry')+'.';
 const draft=answer?lead+' '+answer+' Please let us know if this answers your question.':
  lead+' '+(intents.some(i=>i.id==='availability')||booking?
   "I'll check the details and availability before confirming anything.":
   intents.some(i=>i.id==='price')?"I'll review the scope and current price before quoting.":
   "I'll review your question and the relevant details before replying.");
 return {kind:'owner_conversation_preparation_v1',intents,
  subject:context||'Customer enquiry',hasSelectedListingReference:/Listing reference: [A-Za-z0-9_-]+ \/ approved revision \d+/.test(bounded(request.payload?.message,3000)),
  contextAuthority:'customer_supplied_enquiry_not_transaction',
  answerSource,listingStatus,
  missingInformation:[...(selection&&listingStatus!=='current'?['The selected listing changed or is unavailable. Review it before making commitments.']:[]),...(answer&&answerSource==='current_published_faq'?[]:intents.map(i=>i.check))].slice(0,5),
  draft:draft.slice(0,600),ownerMustReview:true,maySend:false,
  providerDeliveryVerified:false,bookingConfirmed:false};
}
function validOwnerConversationPreparation(value){
 return !!value&&value.kind==='owner_conversation_preparation_v1'&&
  typeof value.subject==='string'&&value.subject.length<=240&&
  typeof value.draft==='string'&&value.draft.length>0&&value.draft.length<=600&&
  ['current_published_faq','current_approved_listing','current_published_service','no_verified_answer'].includes(value.answerSource)&&
  Array.isArray(value.missingInformation)&&value.missingInformation.length<=5&&
  value.missingInformation.every(s=>typeof s==='string'&&s.length<=120)&&
  value.ownerMustReview===true&&value.maySend===false&&
  value.providerDeliveryVerified===false&&value.bookingConfirmed===false;
}
export {prepareOwnerConversation,validOwnerConversationPreparation,parseEnquiryListingReference,conversationReviewSignal,enquiryQuestionKinds,customerQuestionText};
