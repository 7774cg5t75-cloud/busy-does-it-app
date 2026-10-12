/* V3.189: evaluate incomplete customer evidence without actions. */
function prepareOwnerNextAction({outcomeProof=null,evidenceCompleteness=null}={}){
 if(!outcomeProof?.ok||!evidenceCompleteness?.ok)
  return {ok:false,message:"Check the customer records first."};
 const counts=outcomeProof.counts||{};
 const items=[
  {id:"conflicting_booking",number:counts.closedButWorkActive||0,title:"A booking needs checking",next:"Check the saved request and Work booking before changing anything."},
  {id:"booking_readback",number:counts.acceptedWithoutConfirmedWork||0,title:"Check a booking's details",next:"Open the full booking; a recent sample may not contain it."},
  {id:"reply_readback",number:counts.requestsWithoutStoredOwnerReply||0,title:"Check the conversation",next:"Read the complete conversation before replying."}
 ];
 if(items.some(x=>!Number.isSafeInteger(x.number)||x.number<0))return {ok:false};
 return {ok:true,kind:"owner_next_action_v3189",
  suggestions:items.filter(x=>x.number>0).slice(0,3),
  sampleIsIncomplete:true,fullRecordLookupsPerformed:false,
  customersContacted:false,bookingsChanged:false,
  verifiedCustomerDelivery:false};
}
export {prepareOwnerNextAction};
