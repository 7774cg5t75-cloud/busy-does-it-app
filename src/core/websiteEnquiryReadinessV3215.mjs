import {currentWebsiteLiveEvidence} from './websiteLaunchProof.mjs';
import {websiteDraftHasScope} from './websiteDraftScope.mjs';
/**
 * V3.215 - bounded, privacy-minimal roadmap for transactional WEBSITE enquiry.
 * This is intentionally only evidence/planning. A Business App guest challenge
 * is not automatically a website-hosted form. No mutation, HTTP, credentials,
 * customer data or "ready to publish" authority.
 */
import {planWebsiteAppRequestHandoff} from "./websiteAppHandoffV3214.mjs";
const asBool=x=>x===true;
const checks=({siteProof=false,unchanged=false,linked=false,approved=false}={})=>[
 {id:"site_identity",title:"Owner-approved business and site identity",ready:approved,
  detail:"The website draft must remain in the signed-in owner's workspace."},
 {id:"public_https",title:"Exact public HTTPS website version",ready:siteProof&&unchanged,
  detail:"A private preview, hostname or old health check is not public delivery evidence."},
 {id:"existing_live_app",title:"Current owner-approved published Business App",ready:linked,
  detail:"An existing Business App request link is only a handoff, not a website-native form."},
 {id:"verified_site_origin",title:"Server-resolved published-site origin and ownership",ready:false,
  detail:"New server code must resolve the published site and tenant; browser-supplied business IDs are never authority."},
 {id:"abuse_and_browser_challenge",title:"Challenge, rate limits, honeypot and automated abuse controls",ready:false,
  detail:"A protected guest Business App request does not automatically protect a new website form."},
 {id:"customer_consent",title:"Owner-approved privacy text and explicit visitor consent",ready:false,
  detail:"Consent, purpose, retention and regulatory requirements must be reviewed before accepting personal information."},
 {id:"safe_fields",title:"Validated customer fields and size limits",ready:false,
  detail:"Never infer hidden fields, upload permission, contact consent, services or payment information."},
 {id:"idempotent_saved_receipt",title:"Atomic request creation and independent idempotent receipt recovery",ready:false,
  detail:"Reconnect the existing owner inbox only after server-owned tenant-scoped request and retry rules are proven."},
 {id:"owner_delivery",title:"Verified owner inbox and message notification state",ready:false,
  detail:"A saved request is not automatically a delivered email or owner response."},
 {id:"staging",title:"Isolated staging integration and real browser accessibility checks",ready:false,
  detail:"Test real submissions and their recovery before any public website form is activated."}
];
function websiteEnquiryReadinessV3215({
 businessId="",website=null,app=null,liveVersion=null,catalog=[],
 endpoint="",publishing=null,deliveryProof=null,kind="enquiry"
}={}){
 const owner=typeof businessId==="string"&&businessId.length>0&&
  websiteDraftHasScope(website,businessId);
 const existing=planWebsiteAppRequestHandoff({
  businessId,website,app,liveVersion,catalog,endpoint,kind
 });
 const sameLiveSite=currentWebsiteLiveEvidence({businessId,draft:website,publishing});
 const stages=checks({
  siteProof:sameLiveSite,unchanged:sameLiveSite,
  linked:existing.ok,approved:owner
 });
 const verified=stages.filter(c=>c.ready).length;
 return {ok:owner,kind:"website_enquiry_readiness_v3215",
  businessId:owner?businessId:null,
  siteDraftId:owner?website.id:null,
  siteDraftGeneration:owner?website.generation:null,
  existingBusinessAppHandoffSupported:owner&&existing.ok,
  existingBusinessAppLinkOwnerReviewRequired:true,
  currentWebsiteLiveVersionVerified:owner&&sameLiveSite,
  liveWebsiteContainsApprovedHandoffVerified:false,
  requirements:stages,verifiedPrerequisites:verified,totalPrerequisites:stages.length,
  missing:stages.filter(c=>!c.ready).map(c=>c.id),
  nextPriority:stages.find(c=>!c.ready)?.detail||
   "Real browser and provider verification is still required.",
  nativeWebsiteFormImplemented:false,canAcceptCustomerData:false,
  websiteSubmissionEndpointActive:false,publicFormPublicationApproved:false,
  customerRequestCreated:false,bookingConfirmed:false,
  chargeAuthorised:false,noNetworkRequest:true,readOnly:true,
  customerIdentityIncluded:false,customerContactIncluded:false,
  safeExplanation:owner?
   "BUSY can already prepare an owner-approved link to an existing live Business App, but a native website enquiry form needs separate server-side security, consent, rate limits, durable receipts and real staging verification.":
   "Choose a current website in your signed-in business workspace before preparing customer intake."
 };
}
export {websiteEnquiryReadinessV3215};
