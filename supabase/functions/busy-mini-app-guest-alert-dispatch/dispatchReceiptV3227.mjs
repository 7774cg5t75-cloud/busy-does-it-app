/**
 * V3.228: gateway success does NOT mean device receipt. Mixed tickets
 * must be manual-review, never blindly resent or treated as full success.
 */
function classifyGuestAlertProviderTicketsV3227({
 responseOk=false,tickets=null,expectedCount=0
}={}){
 const base={notificationDelivered:false,deviceReceiptChecked:false,
  customerDataReturned:false,providerAccepted:false,
  safeToRetryAutomatically:false,acceptedTicketCount:0,
  rejectedTicketCount:0,partialGatewayAcceptance:false};
 if(!Number.isInteger(expectedCount)||expectedCount<1||expectedCount>20||
  !responseOk||!Array.isArray(tickets)||tickets.length!==expectedCount)
  return {...base,outcome:"uncertain"};
 let accepted=0,rejected=0;
 for(const t of tickets){
  if(!t||typeof t!=="object"||Array.isArray(t))
   return {...base,outcome:"uncertain"};
  if(t.status==="ok"&&typeof t.id==="string"&&
   /^[a-zA-Z0-9_-]{5,120}$/.test(t.id))accepted++;
  else if(t.status==="error"&&typeof t.message==="string"&&
   t.message.trim())rejected++;
  else return {...base,outcome:"uncertain"};
 }
 if(accepted===expectedCount)
  return {...base,outcome:"provider_accepted",providerAccepted:true,
   acceptedTicketCount:accepted};
 if(rejected===expectedCount)
  return {...base,outcome:"definitively_rejected",rejectedTicketCount:rejected};
 return {...base,outcome:"uncertain",partialGatewayAcceptance:true,
  acceptedTicketCount:accepted,rejectedTicketCount:rejected};
}
export {classifyGuestAlertProviderTicketsV3227};
