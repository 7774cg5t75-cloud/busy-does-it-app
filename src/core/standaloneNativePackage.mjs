/**
 * V3.154: offline-only per-business native shell preview.
 *
 * A packaging descriptor is NOT a purchasable/eligible standalone app.
 * Runtime module keys come only from the finite, previously validated
 * immutable app-preview schema. No passwords, business contact databases,
 * arbitrary AI code, signing keys or live payment interfaces enter the shell.
 */
import {publicNativeRuntimePlan} from "./nativeAppRuntimePlan.mjs";
import {publicAppAppearance} from "./appAppearanceEditing.mjs";
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const SAFE_MODULES=new Set(["business_profile","services","gallery","contact",
 "enquiry","booking_request","offers","loyalty"]);
const safeName=value=>typeof value==="string"?value.trim().replace(/[\u0000-\u001f<>]/g,"").slice(0,48):"";
function nativeShellDescriptor(manifest,{purpose="private_prototype",runtimeEvidence=null}={}){
 if(purpose!=="private_prototype"||manifest?.ok!==true||
   manifest.kind!=="private_standalone_planning_manifest_v1"||
   !UUID.test(String(manifest.ownerAppId||""))||
   !UUID.test(String(manifest.previewVersionId||""))||
   !Number.isSafeInteger(manifest.previewVersionNo)||manifest.previewVersionNo<1||
   !Number.isSafeInteger(manifest.sourceDraftRevision)||manifest.sourceDraftRevision<1||
   !Array.isArray(manifest.platformTargets)||!manifest.platformTargets.length||
   !manifest.platformTargets.every(p=>["ios","android"].includes(p))||
   new Set(manifest.platformTargets).size!==manifest.platformTargets.length||
   manifest.screenSchema?.ok!==true||
   !Array.isArray(manifest.screenSchema?.screens)||
   !manifest.screenSchema.screens.length||
   manifest.screenSchema.screens.length>16||
   !Array.isArray(manifest.modules)||
   manifest.modules.length!==manifest.screenSchema.screens.length||
   !manifest.modules.every((key,i)=>SAFE_MODULES.has(key)&&
     manifest.screenSchema.screens[i]?.key===key)||
   manifest.automaticallyPublished!==false||
   manifest.packageProduced!==false||
   manifest.appStoreSubmitted!==false||
   manifest.chargesCreated!==false||
   manifest.requiresVerifiedBilling!==true)
  return {ok:false,reason:"This is not a validated, owner-reviewed standalone app prototype plan."};
 if(typeof manifest.appName!=="string"||/[<>\u0000-\u001f]/.test(manifest.appName))
  return {ok:false,reason:"An unsafe app name cannot be packaged."};
 const name=safeName(manifest.appName);
 if(!name)return {ok:false,reason:"A customer-facing app name is required."};
 const submittedLook=manifest.appearance||{};
 if(Object.hasOwn(submittedLook,"ownerLockedElements"))
  return {ok:false,reason:"Private owner edit metadata cannot enter a native package."};
 const checkedLook=publicAppAppearance(submittedLook);
 if(!checkedLook.ok)return checkedLook;
 const appearance=checkedLook.appearance;
 let liveRuntime=null;
 if(runtimeEvidence){
  const evidence=publicNativeRuntimePlan(runtimeEvidence);
  if(!evidence.ok||evidence.runtime.expectedAppId!==manifest.ownerAppId||
     evidence.runtime.expectedVersionId!==manifest.previewVersionId)
    return {ok:false,reason:"Standalone public connection must match this immutable live app version."};
  liveRuntime=evidence.runtime;
 }
 const ident=manifest.ownerAppId.replaceAll("-","").slice(0,24);
 const publicScreens=manifest.screenSchema.screens.map(item=>({
  key:item.key,title:safeName(item.title)||item.key,
  component:item.component,
  customerRequest:item.customerRequest===true,
  requiresBusinessConfirmation:item.requiresBusinessConfirmation===true,
  // Never expose private owner or customer records in a generated binary.
  nativeActionEnabled:false
 }));
 return {ok:true,purpose:"private_prototype",version:1,
  appName:name,slug:"busy-preview-"+ident.slice(0,16),
  ownerAppId:manifest.ownerAppId,
  sourcePreviewVersionId:manifest.previewVersionId,
  sourceDraftRevision:manifest.sourceDraftRevision,
  platformTargets:manifest.platformTargets,
  appearance,appearanceSource:manifest.appearanceSource==="matching_immutable_private_preview"?
    "matching_immutable_private_preview":"legacy_private_defaults",
  // Deliberately separate from busydoesit.app, and not a final customer ID.
  iosBundleIdentifier:"co.busydoesit.prototype.a"+ident,
  androidPackage:"co.busydoesit.prototype.a"+ident,
  screenSchema:{version:1,screens:publicScreens},
  // The offline project is never connected just because an owner asks.
  // Only separately verified published app packaging can activate runtime.
  runtimeConnection:liveRuntime||{enabled:false,endpoint:"",publicWebEndpoint:"",
    slug:"",expectedAppId:"",expectedVersionId:"",
    ownerApproved:false,liveOnly:true,canCollectPayments:false},
  signingConfigured:false,appStoreSubmitEnabled:false,
  developerRegistrationRequired:true,providerBillingVerified:false,
  buildIsProductionReady:false,
  warning:"This is an unsigned offline native shell for private development only. Real backend actions, permanent app identity, verified subscription, signing, privacy policy and store review are still required."};
}
export {nativeShellDescriptor};
