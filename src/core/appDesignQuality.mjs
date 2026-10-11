/**
 * V3.157 read-only design and customer-journey readiness. These are config
 * checks, not AI screenshot evaluations, successful live form submissions or
 * proof that Apple/Google approved a standalone app.
 */
import {appRuntimeScreenSchema} from "./appRuntimeScreenSchema.mjs";
function appDesignQualityReport(config,catalog){
 const rows=[],notice=(id,passed,detail)=>rows.push({id,passed,detail});
 const profile=config?.publicProfile||{};
 const enabled=(Array.isArray(config?.modules)?config.modules:[])
  .filter(x=>x?.enabled).map(x=>x.key);
 const runtime=appRuntimeScreenSchema(config,catalog);
 notice("shared_runtime",runtime.ok,runtime.ok?
  "All enabled app modules match the verified shared runtime catalogue.":runtime.reason);
 notice("business_identity",Boolean(profile.businessName||config?.display?.name),
  "Use the actual approved business identity.");
 if(enabled.includes("services"))notice("services",Array.isArray(profile.services)&&
  profile.services.some(x=>typeof x?.name==="string"&&x.name.trim()),
  "Customer-facing service names need owner-approved content.");
 if(enabled.includes("gallery"))notice("gallery",Array.isArray(profile.assets?.gallery)&&
  profile.assets.gallery.some(x=>x?.approved===true||x?.marketingOk===true),
  "Only approved business photos should reach customer views.");
 if(enabled.includes("contact"))notice("contact",Boolean(profile.contact?.phone||profile.contact?.email),
  "Provide at least one customer contact route.");
 if(enabled.includes("booking_request"))notice("booking_state",runtime.ok&&
  runtime.screens.some(x=>x.key==="booking_request"&&x.requiresBusinessConfirmation),
  "Booking requests require explicit business confirmation; no automatic booking.");
 if(enabled.includes("enquiry"))notice("enquiry_state",runtime.ok&&
  runtime.screens.some(x=>x.key==="enquiry"&&x.customerRequest),
  "A request service must acknowledge submissions and preserve accurate status.");
 notice("real_device_review",false,
  "iPhone, Android and tablet visuals have not been checked by this static review.");
 notice("screenshot_review",false,
  "A real rendered screenshot must be captured and evaluated separately.");
 return {kind:"private_app_static_readiness_v1",ok:runtime.ok,
  checks:rows,readyForHumanReview:runtime.ok,
  verifiedStaticChecks:rows.filter(x=>x.passed).length,
  remainingChecks:rows.filter(x=>!x.passed).length,
  sharedBetweenMarketplaceAndStandalone:true,bookingsNeverAutoConfirmed:true,
  screenshotEvidenceProvided:false,storeApprovalVerified:false};
}
export {appDesignQualityReport};
