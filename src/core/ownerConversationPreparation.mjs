/** Private reply preparation over the original request, never send authority.
 * Customer text is untrusted data. Only an exact current published FAQ can
 * supply factual answer wording; prices/availability are never inferred.
 */
import {validPublicCollection} from './appPublicCollections.mjs';
const bounded=(s,n)=>typeof s==='string'?s.trim().slice(0,n):'';
const questionKey=s=>bounded(s,3000).toLocaleLowerCase().replace(/[?!.]+$/,'').replace(/\s+/g,' ').trim();
function prepareOwnerConversation({request={},latestMessage=null,publishedConfig=null}={}){
 const message=bounded(latestMessage?.sender_role==='customer'?latestMessage.body:request.payload?.message,3000);
 const context=bounded(request.service_name||request.payload?.service,240);
 const categories=[
  ['price',/\b(price|cost|how much|quote|discount)\b/i,'Confirm the current price and scope before quoting.'],
  ['availability',/\b(available|availability|book|booking|reserve|stock|tickets?|spaces?)\b/i,'Check actual availability before offering a time or item.'],
  ['location',/\b(where|location|address|venue|deliver|delivery|travel)\b/i,'Confirm the relevant location or service area.'],
  ['accessibility',/\b(accessib\w*|wheelchair|step.free)\b/i,'Confirm the requested accessibility arrangements.'],
  ['options',/\b(options?|variants?|sizes?|colours?|colors?)\b/i,'Review the selected option and current details.']
 ];
 const intents=categories.filter(([,pattern])=>pattern.test(message)).map(([id,,check])=>({id,check}));
 const faqs=publishedConfig?.publicProfile?.faqs;
 // No semantic guess: negation, extra requests and quoted instructions must
 // not accidentally select an unrelated approved answer.
 const matches=validPublicCollection('faqs',faqs)?faqs.filter(f=>{
  if(typeof f?.question!=='string'||typeof f?.answer!=='string'||!f.answer.trim()||f.answer.length>240)return false;
  return questionKey(message)===questionKey(f.question);
 }):[];
 const answer=matches.length===1?bounded(matches[0].answer,240):'';
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
  answerSource:answer?'current_published_faq':'no_verified_answer',
  missingInformation:answer?[]:intents.map(i=>i.check),
  draft:draft.slice(0,600),ownerMustReview:true,maySend:false,
  providerDeliveryVerified:false,bookingConfirmed:false};
}
function validOwnerConversationPreparation(value){
 return !!value&&value.kind==='owner_conversation_preparation_v1'&&
  typeof value.subject==='string'&&value.subject.length<=240&&
  typeof value.draft==='string'&&value.draft.length>0&&value.draft.length<=600&&
  ['current_published_faq','no_verified_answer'].includes(value.answerSource)&&
  Array.isArray(value.missingInformation)&&value.missingInformation.length<=5&&
  value.missingInformation.every(s=>typeof s==='string'&&s.length<=120)&&
  value.ownerMustReview===true&&value.maySend===false&&
  value.providerDeliveryVerified===false&&value.bookingConfirmed===false;
}
export {prepareOwnerConversation,validOwnerConversationPreparation};
