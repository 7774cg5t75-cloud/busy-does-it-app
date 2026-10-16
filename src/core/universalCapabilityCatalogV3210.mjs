/**
 * V3.210 UNIVERSAL BUILDER INTELLIGENCE - versioned, descriptive capability
 * catalogue shared by the website + Business App planning surfaces.
 *
 * "section" means an existing private website draft section, NOT a verified
 * live website; "module" means an existing controlled Business App module,
 * NOT that its backend or mobile release passed live tests.
 * "guarded" and "planned" MUST NOT be rendered as operational functionality.
 * This file cannot activate, execute or publish any capability.
 */
const VERSION="universal_capabilities_v3210";
const row=(id,title,description,dependsOn,website,app,extra={})=>Object.freeze({
 id,version:1,title,description,dependsOn:Object.freeze([...dependsOn]),
 website:Object.freeze({...website}),app:Object.freeze({...app}),
 ownerApprovalRequired:true,liveProofProvided:false,
 ...extra
});
const SECTION=id=>({kind:"section",id});
const MODULE=id=>({kind:"module",id});
const GUARDED=reason=>({kind:"guarded",reason});
const PLANNED=reason=>({kind:"planned",reason});
const CAPABILITIES=Object.freeze([
 row("identity","Business identity","Owner-approved business information and branding",[],
   SECTION("hero"),MODULE("business_profile")),
 row("services","Services and information","Owner-entered services, offerings or general information",["identity"],
   SECTION("services"),MODULE("services")),
 row("contact","Contact details","Public owner-approved contact routes",["identity"],
   SECTION("contact"),MODULE("contact")),
 row("gallery","Photographs and portfolios","Images provided and approved for the intended use",["identity"],
   SECTION("gallery"),MODULE("gallery")),
 row("faq","Questions and answers","Owner-authored answers to common customer questions",["identity"],
   SECTION("faq"),MODULE("business_profile"),{publicContentField:"faqs",contentOnly:true}),
 row("testimonials","Customer testimonials","Only genuine permissioned testimonials",["identity"],
   SECTION("testimonials"),MODULE("business_profile"),{publicContentField:"testimonials",contentOnly:true}),
 row("enquiry","Customer enquiries","Tracked request and business follow-up",["contact"],
   GUARDED("Website form delivery needs approved hosting, challenge protection and live verification."),
   MODULE("enquiry"),{customerRequestType:"enquiry",
    sharedRequestContract:"v3212",authoritativeReceiptRequired:true}),
 row("booking_request","Booking requests","Submit a request for owner review, not a confirmed appointment",["services","contact"],
   PLANNED("A verified standalone website booking-request workflow is not established by page design."),
   MODULE("booking_request"),{customerRequestType:"booking_request",
    sharedRequestContract:"v3212",authoritativeReceiptRequired:true,
    independentDiaryConfirmationRequired:true}),
 row("availability","Availability and inventory","Verified dates, spaces, stock or capacity",["services"],
   PLANNED("Live availability and inventory require a trusted source and concurrency controls."),
   PLANNED("Availability is not an existing Business App runtime module.")),
 row("confirmed_booking","Confirmed reservations","Business-approved time or capacity commitments",["booking_request","availability"],
   PLANNED("Requests are not confirmed diary bookings."),
   PLANNED("Requests are not confirmed diary bookings.")),
 row("accounts","Customer accounts","Authenticated customer-specific access",["identity"],
   PLANNED("Customer-specific website accounts and access policies require implementation."),
   PLANNED("Signing into BUSY is not a tenant-specific customer account feature.")),
 row("catalogue","Product catalogue","Genuine products, accurate details, variants and stock facts",["identity"],
   PLANNED("A transaction-ready product catalogue is not proven in the website renderer."),
   PLANNED("A product catalogue module is not in the controlled Business App runtime.")),
 row("checkout","Shopping basket and checkout","Order validation and safe checkout handoff",["catalogue","payments"],
   PLANNED("No supported customer checkout is established by a website draft."),
   PLANNED("No supported customer checkout is established by an app draft.")),
 row("payments","Payments","Provider-authorised collection with real payment status",["identity"],
   PLANNED("Payment provider onboarding, charge authority and real receipts are required."),
   PLANNED("Payment provider onboarding, charge authority and real receipts are required."),
   {externalProviderNeeded:true,financialRisk:true}),
 row("deposits","Deposits","Conditional payment linked to an agreed booking workflow",["booking_request","payments"],
   PLANNED("A deposit request needs owner policy, provider, refund and booking-state checks."),
   PLANNED("A deposit request needs owner policy, provider, refund and booking-state checks."),
   {externalProviderNeeded:true,financialRisk:true}),
 row("memberships","Memberships and restricted areas","Entitlements, membership status and gated content",["accounts"],
   PLANNED("Membership authorisation and tenant-controlled access require implementation."),
   PLANNED("Membership authorisation and tenant-controlled access require implementation.")),
 row("subscriptions","Recurring billing","Recurring payment mandates and entitlements",["payments","accounts"],
   PLANNED("Customer subscription billing and cancellation workflows need a provider."),
   PLANNED("Customer subscription billing and cancellation workflows need a provider."),
   {externalProviderNeeded:true,financialRisk:true}),
 row("uploads","Customer uploads","User media with storage consent, moderation and protection",["accounts"],
   PLANNED("Public customer uploads need abuse, access and retention controls."),
   PLANNED("A safe customer-upload module has not been verified.")),
 row("voting","Voting and competitions","Contest rules, entries, eligibility and anti-abuse checks",["accounts"],
   PLANNED("Voting and competition integrity require new server-side functionality."),
   PLANNED("Voting and competition integrity require new server-side functionality.")),
 row("events","Events and schedules","Business-approved event details and dates",["identity"],
   PLANNED("A reusable event calendar and venue-capacity system are not verified."),
   PLANNED("An event calendar is not among the current controlled app screens.")),
 row("tickets","Ticketing","Event capacity, ticket entitlements and fulfilment",["events","payments"],
   PLANNED("Ticket inventory and ticket fulfilment are not implemented by existing page sections."),
   PLANNED("The Business App runtime does not currently have ticket checkout.")),
 row("donations","Donations","Permissioned fundraising with verified payment/donation records",["payments"],
   PLANNED("Donations require a suitable provider and any relevant charity compliance."),
   PLANNED("Donations require a suitable provider and any relevant charity compliance."),
   {externalProviderNeeded:true,financialRisk:true}),
 row("search","Search and discovery","Accessible indexing of real content or approved listings",["identity"],
   PLANNED("General-purpose onsite search and indexing are not yet a reusable builder component."),
   PLANNED("Business-specific search is not verified in the controlled app runtime.")),
 row("notifications","Confirmations and reminders","Verified delivery to authorised recipients",["enquiry"],
   PLANNED("A visible success message is not proof of a delivered email or SMS."),
   PLANNED("Message recording is not provider-confirmed delivery."),
   {externalProviderNeeded:true}),
 row("offers","Special offers","Owner-approved discounts with accurate terms",["identity"],
   PLANNED("Website offer display requires an approved source and renderer support."),
   MODULE("offers")),
 row("loyalty","Loyalty rewards","Recorded loyalty rules and verified redemption",["accounts"],
   PLANNED("A reusable verified loyalty website feature is not yet supported."),
   MODULE("loyalty")),
 row("course_content","Courses and lessons","Structured lessons and access to owner-authored learning material",["identity"],
   PLANNED("A full learning-management course experience needs new functionality."),
   PLANNED("Course progression and authenticated learning require new functionality.")),
 row("custom_feature","Custom business functionality","A novel, explicitly reviewed and securely scoped capability",["identity"],
   PLANNED("Custom code requires a separately reviewed extension and security process."),
   PLANNED("Arbitrary generated executable app code is not an available runtime capability."))
]);
const BY_ID=new Map(CAPABILITIES.map(item=>[item.id,item]));
function getUniversalCapability(id){
 return typeof id==="string"?BY_ID.get(id)||null:null;
}
function universalCapabilityCatalog(){
 return {version:VERSION,capabilities:CAPABILITIES,hasNoExecutionAuthority:true,
  canEnablePayments:false,canPublish:false,canConfirmBooking:false};
}
export {VERSION,CAPABILITIES,getUniversalCapability,universalCapabilityCatalog};
