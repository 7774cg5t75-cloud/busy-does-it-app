/**
 * V3.229 source-only privacy-minimal Expo ticket mapping. The ticket
 * array aligns by position with the recipient array sent to the gateway.
 * Never expose or store raw device tokens, owner IDs or customer details.
 * This cannot verify phone/display delivery without later Expo receipts.
 */
const DIGEST=/^[0-9a-f]{64}$/;
const TICKET=/^[A-Za-z0-9_-]{5,120}$/;
function buildGuestDeviceGatewayEvidenceV3229({
 deviceHashes=[],tickets=null,responseOk=false
}={}){
 if(!Array.isArray(deviceHashes)||deviceHashes.length>20||
    deviceHashes.some(h=>typeof h!=="string"||!DIGEST.test(h)))
  return {ok:false,reason:"Invalid private device evidence scope.",
   mayPersist:false,notificationDelivered:false};
 if(deviceHashes.length===0)
  return {ok:true,items:[],mayPersist:true,outcome:"uncertain",
   notificationDelivered:false,deviceReceiptVerified:false,
   customerDataIncluded:false};
 const validBatch=responseOk&&Array.isArray(tickets)&&
   tickets.length===deviceHashes.length;
 const used=new Set();
 const items=deviceHashes.map((device_hash,slot)=>{
  const t=validBatch?tickets[slot]:null;
  let state="unknown",ticket_id=null;
  if(t&&typeof t==="object"&&!Array.isArray(t)){
   if(t.status==="ok"&&typeof t.id==="string"&&
       TICKET.test(t.id)&&!used.has(t.id)){
    state="accepted";ticket_id=t.id;used.add(t.id);
   }else if(t.status==="error"&&typeof t.message==="string"&&
             t.message.trim().length>0){
    state="rejected";
   }
  }
  return {slot,device_hash,state,ticket_id};
 });
 const accepted=items.filter(i=>i.state==="accepted").length;
 const rejected=items.filter(i=>i.state==="rejected").length;
 const unknown=items.length-accepted-rejected;
 const outcome=accepted===items.length?"provider_accepted":
  rejected===items.length?"definitively_rejected":"uncertain";
 return {ok:true,items,mayPersist:true,outcome,
  accepted,rejected,unknown,deviceReceiptVerified:false,
  notificationDelivered:false,customerDataIncluded:false,
  rawDeviceTokensReturned:false,autoRetryUnknown:false};
}
export {buildGuestDeviceGatewayEvidenceV3229};
