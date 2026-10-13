/**
 * V3.209 — one private, evidence-limited customer journey review for the
 * website and Business App belonging to the SAME owner workspace.
 * This is a design/feature consistency check, never proof of real delivery.
 *
 * No customer records, external calls, quote/booking/payment side-effects,
 * publish operations or cross-tenant learning.
 */
import {validPrivateBuilderPair} from "./ownerBuilderDraftGuardV3195.mjs";
import {enabledAppKeys} from "./appSectionOrder.mjs";
import {photographicCount} from "../../supabase/functions/busy-website-worker/designPlanner.mjs";
const clean=x=>typeof x==="string"?x.trim():"";
const key=x=>clean(x).normalize("NFKC").toLowerCase().replace(/\s+/g," ");
const list=x=>Array.isArray(x)?x:[];
const fail=reason=>({ok:false,reason,ownerApprovalRequired:true,
 customerActionVerified:false,neverPublishes:true});

function reviewBuilderJourneyContinuity({website,app,businessId=""}={}){
 if(!validPrivateBuilderPair(website,app,businessId)||
   (typeof website.businessId==="string"&&website.businessId&&
     website.businessId!==businessId))
  return fail("Choose current private website and app drafts from the same business.");
 const nav=enabledAppKeys(app.draft_config);
 if(!nav.ok)return fail("Review the app's valid enabled screens and navigation first.");
 const config=app.draft_config;
 const profile=config.publicProfile||{};
 const webSections=list(website.sections).filter(s=>s?.enabled!==false);
 const webServices=new Set(list(webSections.find(s=>s?.id==="services")?.items)
  .map(s=>key(s?.title)).filter(Boolean));
 const appServices=new Set(list(profile.services)
  .map(s=>key(s?.name)).filter(Boolean));
 const servicesShared=[...webServices].filter(x=>appServices.has(x)).length;
 const contact=webSections.find(s=>s?.id==="contact");
 const websiteContact=!!(clean(contact?.phone)||clean(contact?.email));
 const hasAppEnquiry=nav.keys.includes("enquiry");
 const hasAppContact=nav.keys.includes("contact");
 const hasBooking=nav.keys.includes("booking_request");
 const websitePhotos=photographicCount(webSections);
 const appPhotos=list(profile?.assets?.gallery).filter(photo=>
  photo?.approved===true&&typeof photo.uri==="string"&&
  /^https:\/\/[^\s"'<>]+$/i.test(photo.uri)).length;
 const appName=clean(profile.businessName||config.display?.name);
 const websiteName=clean(website.businessName);
 const recommendations=[];
 const add=(id,level,text)=>recommendations.push({id,level,text,
  ownerReviewNeeded:true});
 if(appName&&websiteName&&key(appName)!==key(websiteName))
  add("identity","important",
   "The business names differ. Check which approved name should appear on both surfaces.");
 if(webServices.size&&appServices.size&&servicesShared===0)
  add("services","important",
   "The website and app use different service names. Review the two private service lists before release.");
 else if(webServices.size&&!appServices.size)
  add("app-services","review",
   "The website has services but the app has none recorded. Consider reusing the approved service information.");
 else if(!webServices.size&&appServices.size)
  add("website-services","review",
   "The app has services but the website has none recorded. Consider adding an accurate website overview.");
 if(hasAppEnquiry&&!websiteContact)
  add("website-contact","review",
   "The app has an enquiry screen, but the website lacks recorded public contact details. Check both customer entry routes.");
 if(websiteContact&&!hasAppEnquiry&&!hasAppContact)
  add("app-contact","review",
   "The website shows contact details but the app has no enabled contact or enquiry screen.");
 if(hasBooking)
  add("booking-handoff","review",
   "The app allows booking requests. Check that website visitors understand where to request one; a request still needs owner confirmation.");
 if(websitePhotos&&!appPhotos)
  add("app-gallery","optional",
   "The website has approved images. Consider whether any are suitable for the app, after checking reuse permission.");
 if(appPhotos&&!websitePhotos)
  add("website-gallery","optional",
   "The app has approved images. Consider whether they also belong on the website, with permission.");
 return {ok:true,kind:"builder_journey_continuity_v3209",
  businessId,source:{websiteId:website.id,websiteGeneration:website.generation,
   appId:app.id,appRevision:app.draft_revision},
  evidence:{websiteServices:webServices.size,appServices:appServices.size,
   matchingServiceNames:servicesShared,websiteContact,
   appHasEnquiry:hasAppEnquiry,appHasContact:hasAppContact,
   appHasBookingRequest:hasBooking,websiteApprovedImages:websitePhotos,
   appApprovedImages:appPhotos},
  recommendations:recommendations.slice(0,8),
  summary:recommendations.length?
    "BUSY found "+recommendations.length+" cross-builder detail(s) worth the owner's review.":
    "The checked draft details are consistent. Real requests, screen quality and delivery still need separate testing.",
  reviewerMustCheckCurrentRevisions:true,ownerApprovalRequired:true,
  noContentTransferred:true,customerActionVerified:false,
  noRealDeviceReview:true,noSubmissionTested:true,noBookingConfirmed:true,
  noMarketingConsentInferred:true,noCustomerRecordsRead:true,
  neverPublishes:true,neverCharges:true};
}
export {reviewBuilderJourneyContinuity};
