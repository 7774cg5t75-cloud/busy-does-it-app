/** V3.78, deliberate customer-success foundation.
 * Owner-entered leads only. Never submit a visitor form, send customer
 * messages, use AI tokens or silently convert website clicks into leads.
 */
const STATUSES=new Set(["new","reviewing","quoted","booked","closed"]);
const NEXT={new:new Set(["reviewing","closed"]),
  reviewing:new Set(["quoted","booked","closed"]),
  quoted:new Set(["booked","closed"]),booked:new Set(["closed"]),closed:new Set()};
const clean=(v,max=160)=>typeof v==="string"?v.trim().slice(0,max):"";
function validatedLeadInput(input){
  if(!input||typeof input!=="object"||Array.isArray(input))return {ok:false,error:"invalid_lead"};
  const name=clean(input.name,121), contactMethod=clean(input.contactMethod,20);
  const contactValue=clean(input.contactValue,181);
  const service=clean(input.service,161), notes=clean(input.notes,1201);
  const key=clean(input.idempotencyKey,161);
  if(!name||name.length>120||!["email","phone"].includes(contactMethod))
    return {ok:false,error:"missing_contact_details"};
  if(!key||key.length<8||key.length>160||!/^[a-zA-Z0-9_:.\-]{8,160}$/.test(key))
    return {ok:false,error:"invalid_request_key"};
  if(service.length>160||notes.length>1200)return {ok:false,error:"lead_too_large"};
  const valid=contactMethod==="email"?
    /^[^\s@]{1,64}@[^\s@]{1,200}\.[^\s@]{2,}$/i.test(contactValue)&&contactValue.length<=180:
    /^[+0-9 ()-]{7,30}$/.test(contactValue);
  if(!valid)return {ok:false,error:"invalid_contact"};
  if(input.contactPermissionConfirmed!==true)
    return {ok:false,error:"permission_confirmation_required"};
  return {ok:true,record:{
    request_key:key,name,contact_method:contactMethod,contact_value:contactValue,
    service_requested:service,notes,source:"owner_entered",
    contact_permission_confirmed:true,status:"new"
  }};
}
function validTransition(from,to){
  return STATUSES.has(from)&&STATUSES.has(to)&&NEXT[from].has(to);
}
function leadSuggestion(row){
  const status=clean(row?.status,20);
  if(status==="new")return "Review this enquiry and verify its details before contacting the customer.";
  if(status==="reviewing")return "If a quote has been sent, mark it quoted. No message is sent automatically.";
  if(status==="quoted")return "Follow up appropriately or mark booked only after a booking is confirmed.";
  if(status==="booked")return "Record the completed work in BUSY's booking workflow; this lead status alone is not a verified booking.";
  return "Closed enquiries are retained for review according to the business's privacy policy.";
}
function safeLeadRow(row){
  if(!row||typeof row!=="object"||!STATUSES.has(row.status))return null;
  return {id:row.id,name:row.name,contactMethod:row.contact_method,
    contactValue:row.contact_value,service:row.service_requested,
    notes:row.notes,status:row.status,createdAt:row.created_at,
    nextStep:leadSuggestion(row),source:"owner_entered",
    messageSent:false,verifiedBooking:false};
}
function buildLeadDigest(rows){
  if(!Array.isArray(rows))return {status:"unavailable",recent:null};
  const sample=rows.map(safeLeadRow).filter(Boolean).slice(0,25);
  const counts={new:0,reviewing:0,quoted:0,booked:0,closed:0};
  sample.forEach(row=>counts[row.status]++);
  return {status:"available",recent:sample,sampled:sample.length,counts,
    limitedTo:25,trackedWebsiteContacts:0,
    statusCaveat:"These are owner-entered records, not public website form submissions. A booked status is a manual label, not independently verified revenue or work."};
}
export {validatedLeadInput,validTransition,buildLeadDigest};
