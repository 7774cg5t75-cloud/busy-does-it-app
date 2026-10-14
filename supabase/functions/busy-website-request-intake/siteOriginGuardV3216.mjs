/**
 * V3.216 — future website-native request intake PRE-COMMIT boundary.
 *
 * Pure, offline-verifiable server adapter contract. NOT an Edge endpoint.
 * Only pass rows re-read by a privileged, tenant-aware SERVER implementation
 * into serverFacts. Request metadata is public and cannot assert ownership.
 * An Origin header is NOT authentication: a one-time server-verified challenge,
 * traffic limits, transactional RPC and readback are independently mandatory.
 * Never return visitor PII or reuse website/app draft claims as server proof.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const TOKEN=/^[A-Za-z0-9_-]{32,128}$/;
const TYPES=Object.freeze(["enquiry","booking_request"]);
const FIELDS=Object.freeze(["name","email","phone","message","service","preferredDate"]);
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const clean=(v,max)=>typeof v==="string"&&v.length<=max?v.trim():"";
const deny=(reason)=>({ok:false,reason,mayCommit:false,mayIssueReceipt:false,
  bookingConfirmed:false,providerDelivered:false,publicEndpointActive:false,
  noCustomerDataReturned:true,requiresServerTransaction:true});
function exactOrigin(value){
  if(typeof value!=="string"||value.length>300)return "";
  try{
    const u=new URL(value);
    if(u.protocol!=="https:"||u.username||u.password||u.port||u.pathname!=="/"||
       u.search||u.hash||u.origin!==value.replace(/\/$/,""))return "";
    if(!u.hostname||u.hostname==="localhost"||u.hostname.endsWith(".local"))return "";
    return u.origin;
  }catch{return "";}
}
function strictVisitorFields(kind,payload){
  if(!TYPES.includes(kind)||!payload||typeof payload!=="object"||
     Array.isArray(payload)||Object.keys(payload).length>FIELDS.length||
     Object.keys(payload).some(k=>!FIELDS.includes(k)))return deny("Unexpected visitor fields.");
  const name=clean(payload.name,160),email=clean(payload.email,250),
    phone=clean(payload.phone,50),message=clean(payload.message,5000),
    service=clean(payload.service,240),preferredDate=clean(payload.preferredDate,240);
  if(!name||!(email||phone))return deny("A name and contact method are required.");
  if(email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return deny("Email address is invalid.");
  if(phone&&!/^[+()\d\s.-]{6,50}$/.test(phone))
    return deny("Phone number is invalid.");
  if(kind==="enquiry"&&!message)return deny("An enquiry message is required.");
  if(kind==="booking_request"&&!service)return deny("A booking service is required.");
  if(kind==="enquiry"&&(own(payload,"service")||own(payload,"preferredDate")))
    return deny("Booking-only fields are not allowed for enquiries.");
  if(kind==="booking_request"&&own(payload,"message")&&message.length>3000)
    return deny("Booking notes are too long.");
  return {ok:true,fieldKeys:FIELDS.filter(k=>own(payload,k)),
    personalDataReturned:false,normalizedVisitorPayloadReturned:false,
    noNetworkRequest:true};
}
/**
 * SERVER-ONLY proof gate. This validates supplied server facts but cannot
 * authenticate their provenance in isolation. Call only after independent DB
 * reads, and only within a separate real challenge + atomic RPC flow.
 */
function verifySiteOriginIntakeV3216({request=null,serverFacts=null,now=""}={}){
  if(!request||typeof request!=="object"||Array.isArray(request)||!serverFacts||
    typeof serverFacts!=="object")return deny("Missing verified published website facts.");
  const {website,deployment,approval,challenge}=serverFacts;
  if(!website||!deployment||!approval||!challenge)
    return deny("The server must resolve all four independent records.");
  if(!UUID.test(website.id)||!UUID.test(website.business_id)||
     !UUID.test(deployment.id)||!UUID.test(approval.website_id)||
     !UUID.test(challenge.deployment_id))
    return deny("Invalid published website identity.");
  if(website.id!==deployment.website_id||
     website.business_id!==deployment.business_id||
     website.current_live_deployment_id!==deployment.id||
     deployment.status!=="live")
    return deny("Website publication is stale or belongs to another business.");
  if(approval.website_id!==website.id||
     approval.business_id!==website.business_id||
     approval.deployment_id!==deployment.id||approval.status!=="approved"||
     approval.enabled!==true)
    return deny("There is no current, approved public contact configuration.");
  const deployedOrigin=exactOrigin(deployment.public_origin);
  const requestOrigin=exactOrigin(request.origin);
  if(!deployedOrigin||requestOrigin!==deployedOrigin)
    return deny("The submitted site origin does not match the published website.");
  if(request.requestType!=="enquiry"&&request.requestType!=="booking_request")
    return deny("Unsupported request type.");
  if(request.requestType!==approval.request_type||
     request.requestType!==challenge.request_type)
    return deny("The visitor action changed after owner approval.");
  if(!TOKEN.test(request.idempotencyKey)||
     request.idempotencyKey!==challenge.idempotency_key)
    return deny("A fresh idempotency key tied to the challenge is required.");
  if(challenge.deployment_id!==deployment.id||
     challenge.website_id!==website.id||
     challenge.business_id!==website.business_id||
     challenge.origin!==deployedOrigin||challenge.status!=="verified"||
     challenge.single_use!==true||challenge.consumed===true||
     challenge.abuse_limits_passed!==true)
    return deny("The server has not independently verified this browser challenge.");
  const at=Date.parse(now),expires=Date.parse(challenge.expires_at);
  if(!Number.isFinite(at)||!Number.isFinite(expires)||expires<=at||
     expires-at>15*60*1000)
    return deny("The browser challenge is expired or has an invalid lifetime.");
  const consent=approval.consent;
  if(!consent||typeof consent.notice!=="string"||
     consent.notice.trim().length<20||consent.notice.length>1200||
     typeof consent.revision!=="string"||!TOKEN.test(consent.revision)||
     request.consentRevision!==consent.revision||
     request.consentAccepted!==true)
    return deny("Current, explicit visitor privacy notice acceptance is required.");
  const visitor=strictVisitorFields(request.requestType,request.payload);
  if(!visitor.ok)return deny(visitor.reason);
  if(request.requestType==="booking_request"&&
     (!Array.isArray(approval.services)||!approval.services.some(s=>
       typeof s==="string"&&s.trim()===request.payload.service)))
    return deny("Requested service is not in the owner-approved published list.");
  // Readiness is not authorisation. A separate server transaction must
  // atomically consume challenge, enforce unique idempotency scope and commit
  // an owner/website-scoped request; readback alone can confirm a saved receipt.
  return {ok:true,kind:"site_origin_precommit_v3216",
    websiteId:website.id,liveDeploymentId:deployment.id,
    businessId:website.business_id,requestType:request.requestType,
    visitorFieldsValidated:true,privacyRevisionMatched:true,
    serverChallengeStateValidated:true,challengeMustBeConsumedAtomically:true,
    sameBusinessInboxAdapterRequired:true,idempotentRpcRequired:true,
    authoritativeReceiptReadbackRequired:true,customerDataReturned:false,
    mayCommit:false,mayIssueReceipt:false,bookingConfirmed:false,
    providerDelivered:false,publicEndpointActive:false,
    requiresServerTransaction:true,siteOriginIsNotAuthentication:true};
}
export {exactOrigin,strictVisitorFields,verifySiteOriginIntakeV3216};
