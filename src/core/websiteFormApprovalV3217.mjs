/**
 * V3.217 — private form specification review. Not an approval write, form,
 * consent collection, customer data collector or publishing authority.
 * The owner must explicitly approve a future persistable snapshot in a
 * server-authorised, version checked route (not implemented here).
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const KINDS=["enquiry","booking_request"];
const CONTACT=["name","email","phone"];
const OPTIONS={enquiry:["message"],booking_request:["service","preferredDate"]};
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const no=reason=>({ok:false,reason,reviewOnly:true,ownerApprovalRecorded:false,
  serverApprovalStored:false,publicFormEnabled:false,customerDataCollected:false});
function planPrivateWebsiteFormApprovalV3217({
 businessId="",website=null,publishing=null,kind="enquiry",
 fields=null,notice="",purpose="",retentionDays=null,services=[]
}={}){
 if(!UUID.test(businessId)||website?.businessId!==businessId||
    typeof website.id!=="string"||!website.id||
    !Number.isSafeInteger(website.generation)||website.generation<1)
   return no("Choose the current private website and business workspace.");
 if(!KINDS.includes(kind))return no("Choose an enquiry or booking request.");
 const keys=fields===null?[...CONTACT,...OPTIONS[kind]]:fields;
 if(!Array.isArray(keys)||keys.length>6||
    keys.some(x=>typeof x!=="string")||
    new Set(keys).size!==keys.length||
    keys.some(k=>![...CONTACT,...OPTIONS[kind]].includes(k))||
    !keys.includes("name")||
    !(keys.includes("email")||keys.includes("phone"))||
    (kind==="enquiry"&&!keys.includes("message"))||
    (kind==="booking_request"&&!keys.includes("service")))
   return no("The form must keep its minimum contact and request fields without duplicates.");
 const site=publishing?.website,live=publishing?.liveDeployment;
 const bound=live&&site&&
   typeof live.id==="string"&&UUID.test(live.id)&&
   site.current_live_deployment_id===live.id&&
   publishing.draftChangedSinceHosted===false;
 const savedOrigin=typeof live?.public_origin==="string"?live.public_origin:"";
 const normalizedNotice=typeof notice==="string"?notice.trim():"";
 const normalizedPurpose=typeof purpose==="string"?purpose.trim():"";
 const validNotice=normalizedNotice.length>=20&&normalizedNotice.length<=1200;
 const validPurpose=normalizedPurpose.length>=12&&normalizedPurpose.length<=240;
 const validRetention=Number.isInteger(retentionDays)&&
   retentionDays>=1&&retentionDays<=730;
 const validServices=kind==="enquiry"||
   (Array.isArray(services)&&services.length>0&&services.length<=50&&
    services.every(x=>typeof x==="string"&&x.trim().length>0&&x.length<=120)&&
    new Set(services.map(x=>x.trim())).size===services.length);
 // Explicit owner review can proceed without existing live deployment; a
 // proposed private form never inherits release permission from that status.
 const blocked=[
  ...(!bound?["exact_published_deployment_unverified"]:[]),
  ...(!validNotice?["owner_privacy_notice_missing"]:[]),
  ...(!validPurpose?["data_processing_purpose_missing"]:[]),
  ...(!validRetention?["retention_review_missing"]:[]),
  ...(!validServices?["owner_approved_services_missing"]:[])
 ];
 return {ok:true,kind:"private_website_form_review_v3217",
  businessId,websiteId:website.id,websiteGeneration:website.generation,
  proposedRequestType:kind,fieldKeys:[...keys],requiresEmailOrPhone:true,
  proposedOwnerNotice:validNotice?normalizedNotice:null,
  proposedPurpose:validPurpose?normalizedPurpose:null,
  proposedRetentionDays:validRetention?retentionDays:null,
  proposedServices:validServices&&kind==="booking_request"?[...services]:[],
  liveDeploymentCandidateId:bound?live.id:null,
  liveOriginVerifiedByServer:false,
  sourceSnapshotMatchesOwnerView:!!bound,
  additionalPrerequisites:blocked,
  readyForSeparateOwnerAndLegalReview:blocked.length===0,
  noticeRevisionIssued:false,customerConsentCollected:false,
  formSchemaStored:false,serverApprovalStored:false,ownerApprovalRecorded:false,
  publicFormEnabled:false,customerDataCollected:false,
  readOnly:true,requiresIndependentServerRevisionCheck:true,
  requiresExplicitOwnerApproval:true,
  explanation:"This is an editable PRIVATE proposal. BUSY has not approved privacy wording, saved a consent revision or activated a website form."};
}
function comparePrivateApprovalReviewV3217({prepared=null,current=null}={}){
 if(!prepared?.ok||!current?.ok)return no("Prepare the current form before reviewing again.");
 const fields=["businessId","websiteId","websiteGeneration",
   "proposedRequestType","liveDeploymentCandidateId","proposedOwnerNotice",
   "proposedPurpose","proposedRetentionDays"];
 if(fields.some(x=>prepared[x]!==current[x])||
    JSON.stringify(prepared.fieldKeys)!==JSON.stringify(current.fieldKeys)||
    JSON.stringify(prepared.proposedServices)!==JSON.stringify(current.proposedServices))
   return no("Business, published website or form details changed. Review again.");
 return {ok:true,unchanged:true,ownerApprovalRecorded:false,
  approvalEligibleForFutureServerReview:current.readyForSeparateOwnerAndLegalReview,
  publicFormEnabled:false,readOnly:true};
}
export {planPrivateWebsiteFormApprovalV3217,comparePrivateApprovalReviewV3217};
