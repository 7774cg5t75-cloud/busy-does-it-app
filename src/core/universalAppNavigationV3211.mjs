/**
 * V3.211: one shared-requirements -> owner-reviewed Business App navigation
 * handoff. Works ONLY on existing enabled modules in the supported runtime.
 *
 * Saving remains the existing authenticated apply_coordinated_edits endpoint
 * with expected draft revision. No module activation or public publishing.
 */
import {planUniversalBuilderRequest} from "./universalBuilderPlanV3210.mjs";
import {appRuntimeScreenSchema} from "./appRuntimeScreenSchema.mjs";
import {enabledAppKeys} from "./appSectionOrder.mjs";
import {proposeCoordinatedAppChanges} from "./appCoordinatedStudio.mjs";

const fail=reason=>({ok:false,reason,noChangeSaved:true,neverPublishes:true});
function planUniversalAppNavigation({businessId="",request="",app=null,website=null,catalog=[]}={}){
 if(typeof businessId!=="string"||!businessId||
    app?.business_id!==businessId||typeof app?.id!=="string"||!app.id||
    !Number.isSafeInteger(app?.draft_revision)||app.draft_revision<1||
    !Array.isArray(catalog)||catalog.length>50)
  return fail("Open an owner-scoped current private app and its supported module catalogue.");
 const requirements=planUniversalBuilderRequest({request,businessId,
   website,app,catalog,
   businessType:app.category||app.draft_config?.display?.category||""});
 if(!requirements.ok)return fail(requirements.reason);
 const config=app.draft_config;
 const nav=enabledAppKeys(config);
 if(!nav.ok)return fail(nav.reason);
 const runtime=appRuntimeScreenSchema(config,catalog);
 if(!runtime.ok)return fail("The private app runtime needs review: "+runtime.reason);
 const supported=new Set(runtime.screens.map(screen=>screen.key));
 const allowed={
  booking_request:"booking_request",enquiry:"enquiry",services:"services",
  gallery:"gallery",contact:"contact",offers:"offers",loyalty:"loyalty"
 };
 const profile=config.publicProfile&&typeof config.publicProfile==="object"?
   config.publicProfile:{};
 const serviceReady=Array.isArray(profile.services)&&profile.services.some(
   s=>typeof s?.name==="string"&&!!s.name.trim());
 const galleryReady=Array.isArray(profile.assets?.gallery)&&profile.assets.gallery.some(
   x=>x?.approved===true&&
     ((typeof x.uri==="string"&&/^https:\/\/[^\s"'<>]+$/i.test(x.uri))||
      (typeof x.storagePath==="string"&&!!x.storagePath.trim())));
 const offersReady=Array.isArray(config.offers)&&config.offers.some(
   x=>x?.approved===true&&typeof x.title==="string"&&!!x.title.trim());
 const candidateIds=requirements.detectedGoals.filter(id=>allowed[id]&&
   supported.has(allowed[id])&&
   (id!=="booking_request"||serviceReady)&&
   (id!=="services"||serviceReady)&&
   (id!=="gallery"||galleryReady)&&
   (id!=="offers"||offersReady));
 const preferred=[...new Set(candidateIds.map(id=>allowed[id]))];
 const before=nav.keys;
 // The public identity remains first, even when an owner requests to move
 // a customer action to the front. Only explicitly requested *working*
 // screens are promoted, never unsupported capabilities or dependency-only
 // placeholders.
 const remainder=before.filter(key=>key!=="business_profile"&&!preferred.includes(key));
 const after=["business_profile",...preferred,...remainder];
 const changed=after.some((key,index)=>before[index]!==key);
 let preview=null;
 if(changed){
  const operation={kind:"navigation",value:after};
  const edit=proposeCoordinatedAppChanges(config,[operation]);
  if(!edit.ok)return fail("The reviewed app section order was not safe: "+edit.reason);
  preview={before:[...before],after:[...after],operations:edit.operations,
   privateOnly:true,requiresOwnerApproval:true,changesCustomerRecords:false,
   enablesModules:false,createsCustomerRequests:false};
 }
 const unready=requirements.detectedGoals.filter(id=>allowed[id]&&
   !candidateIds.includes(id));
 return {ok:true,kind:"universal_app_navigation_v3211",
  businessId,appId:app.id,appRevision:app.draft_revision,
  websiteId:website?.id||null,websiteRevision:website?.generation||null,
  requestedCapabilities:[...requirements.detectedGoals],
  promotedExistingModules:preferred,notPromotedWithoutEvidence:unready,
  currentRuntimeScreenCount:runtime.screens.length,preview,
  reason:preview?
   "BUSY can place real, enabled, relevant app screens earlier. Review this private order before saving.":
   "No safe app navigation change is needed. Missing capabilities are still listed separately in your requirements plan.",
  independentlyVerifiedCustomerAction:false,
  realDeviceTested:false,ownerApprovalRequired:true,
  noNewModules:true,noChangeSaved:true,noCustomerRecordsRead:true,
  neverPublishes:true,neverCharges:true};
}
function confirmUniversalAppNavigation({businessId="",request="",app,website=null,
 catalog=[],review=null}={}){
 if(!review||review.kind!=="universal_app_navigation_v3211")
  return fail("Prepare a new private app navigation review first.");
 const fresh=planUniversalAppNavigation({businessId,request,app,website,catalog});
 if(!fresh.ok||!fresh.preview||
   review.businessId!==fresh.businessId||
   review.appId!==fresh.appId||review.appRevision!==fresh.appRevision||
   review.websiteId!==fresh.websiteId||
   review.websiteRevision!==fresh.websiteRevision||
   JSON.stringify(review.requestedCapabilities)!==JSON.stringify(fresh.requestedCapabilities)||
   JSON.stringify(review.preview?.before)!==JSON.stringify(fresh.preview.before)||
   JSON.stringify(review.preview?.after)!==JSON.stringify(fresh.preview.after)||
   JSON.stringify(review.preview?.operations)!==JSON.stringify(fresh.preview.operations))
  return fail("The app, website, requested capabilities or current module evidence changed. Review the latest plan.");
 return fresh;
}
export {planUniversalAppNavigation,confirmUniversalAppNavigation};
