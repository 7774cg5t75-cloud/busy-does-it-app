/**
 * One bounded Expo push attempt's provider-ticket classification.
 * Expo status "ok" is gateway ACCEPTANCE, never proof of device delivery.
 * Unknown/erroring HTTP/partial malformed tickets become UNCERTAIN and
 * MUST NOT be automatically resent.
 */
function classifyGuestAlertProviderTicketsV3227({
 responseOk=false,tickets=null,expectedCount=0
}={}){
 const base={notificationDelivered:false,deviceReceiptChecked:false,
  customerDataReturned:false,providerAccepted:false,
  safeToRetryAutomatically:false};
 if(!Number.isInteger(expectedCount)||expectedCount<1||expectedCount>20||
  !responseOk||!Array.isArray(tickets)||tickets.length!==expectedCount)
  return {...base,outcome:"uncertain"};
 if(tickets.some(t=>!t||typeof t!=="object"||
  !["ok","error"].includes(t.status)))
  return {...base,outcome:"uncertain"};
 const accepted=tickets.filter(t=>t.status==="ok"&&typeof t.id==="string"&&t.id.length>4);
 if(accepted.length)
  return {...base,outcome:"provider_accepted",providerAccepted:true,
   acceptedTicketCount:accepted.length};
 // Only a complete explicit provider rejection, with no accepted tickets,
 // is safe for a bounded delayed retry. Unknown error shape = uncertain.
 if(tickets.every(t=>t.status==="error"&&typeof t.message==="string"&&t.message.length>0))
  return {...base,outcome:"definitively_rejected"};
 return {...base,outcome:"uncertain"};
}
export {classifyGuestAlertProviderTicketsV3227};
