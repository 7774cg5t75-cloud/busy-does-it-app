/**
 * V3.153 — Two first-class Business App distribution paths.
 *
 * A plan is a read-only design artifact. It does NOT verify a paid subscription,
 * create an app-store account, collect money, sign a binary, submit to an app
 * store, or make an in-BUSY app discoverable.
 */
import {businessAppPreviewProof} from "./businessAppPreviewProof.mjs";
import {appRuntimeScreenSchema} from "./appRuntimeScreenSchema.mjs";
import {publicAppAppearance} from "./appAppearanceEditing.mjs";
const MODES=Object.freeze(["busy_marketplace","standalone"]);
const COSTS=Object.freeze([
 {key:"apple",title:"Apple Developer membership",detail:"Apple may require an external developer membership and its own fees to publish an iPhone app. Paid separately; amount and renewal terms depend on Apple's current rules."},
 {key:"google",title:"Google Play developer registration",detail:"Google Play may require an external developer account and registration charge. Paid separately; eligibility and testing rules depend on Google."},
 {key:"provider",title:"Optional third-party services",detail:"Payment processing, messaging, maps, push delivery or other providers may require separate accounts, fees and ongoing usage charges."},
 {key:"maintenance",title:"Ongoing app upkeep",detail:"App-store rules, SDK updates, certificates and support can involve ongoing work or additional charges. Any Busy fee or allowance must be disclosed before ordering."}
]);
const trim=v=>typeof v==="string"?v.trim().slice(0,120):"";
const validPlatforms=p=>Array.isArray(p)&&p.length>0&&p.length<=2&&
 p.every(x=>x==="ios"||x==="android")&&new Set(p).size===p.length;
function standaloneEntitlementEvidence(entitlement={}){
 const verified=entitlement?.source==="verified_billing"&&
   entitlement?.confirmed===true&&entitlement?.standaloneIncluded===true&&
   typeof entitlement?.tierId==="string"&&entitlement.tierId.length>0&&
   entitlement?.status==="active";
 return {verified,mayRequestBuild:verified,
  label:verified?"A verified subscription includes standalone-app creation":
   "Standalone-app eligibility has not been verified. Higher-tier inclusion is planned, not an activated entitlement.",
  doesNotPayStoreFees:true,doesNotGuaranteeApproval:true};
}
function buildAppDistributionPlan({mode="busy_marketplace",app=null,preview=null,
 requestedPlatforms=["ios","android"],entitlement=null,
 acknowledgements={},ownerApproval=false}={}){
 if(!MODES.includes(mode))return {ok:false,reason:"Choose a supported app distribution route."};
 const proof=businessAppPreviewProof({app,preview});
 const standalone=mode==="standalone";
 const eligible=standaloneEntitlementEvidence(entitlement);
 const constraints=[
  {id:"approved-preview",label:"An immutable private app preview matches the current owner draft",passed:proof.matches},
  {id:"external-fees",label:"External developer registrations, store charges and provider fees are separate",passed:standalone?acknowledgements.externalFees===true:true},
  {id:"external-accounts",label:"The customer may need Apple, Google and provider accounts",passed:standalone?acknowledgements.externalAccounts===true:true},
  {id:"store-approval",label:"Store acceptance, review and distribution are not guaranteed",passed:standalone?acknowledgements.storeApproval===true:true},
  {id:"maintenance",label:"Ongoing app-store and third-party upkeep may cost extra",passed:standalone?acknowledgements.ongoingCosts===true:true},
  {id:"subscription",label:"Higher-tier standalone eligibility must be verified against billing",passed:standalone?eligible.verified:true},
  {id:"owner-approval",label:"The owner must explicitly approve a real submission separately",passed:ownerApproval===true}
 ];
 if(standalone&&!validPlatforms(requestedPlatforms))
  return {ok:false,reason:"Select iOS, Android, or both for the standalone app."};
 return {ok:true,mode,proof,eligible,
  name:trim(app?.display_name||preview?.config?.display?.name||"Business App"),
  requestedPlatforms:standalone?[...requestedPlatforms]:[],
  requirements:constraints,missing:constraints.filter(x=>!x.passed).map(x=>x.label),
  costs:standalone?COSTS:[],
  customerCanExplore:true,
  mayPreparePrivateHandoff:proof.matches,
  mayPackageOrSubmit:false,mayPublishMarketplace:false,mayCharge:false,
  requiresServerEntitlementCheck:standalone,
  requiresSeparateOwnerSubmissionApproval:true,
  description:standalone?
   "Standalone iPhone/Android app planning, packaging and store review are a separate process. A qualifying higher subscription could include Busy creation work, but not automatically third-party fees.":
   "An app used within the Busy Does It marketplace, with business-owned booking requests and other enabled real modules. Listing requires a live approved version and an explicit owner decision."
 };
}
function buildStandalonePrivateHandoff({app,preview,plan,catalog,ownerConfirmed=false}={}){
 if(!plan?.ok||plan.mode!=="standalone"||!ownerConfirmed||
    !plan.proof?.matches||!businessAppPreviewProof({app,preview}).matches||
    !validPlatforms(plan.requestedPlatforms))
  return {ok:false,reason:"Select a matching private app preview and confirm a standalone planning handoff."};
 if(plan.requirements.filter(x=>!["owner-approval","subscription"].includes(x.id))
   .some(x=>x.passed!==true))
  return {ok:false,reason:"Review the external-account, store-cost and maintenance disclosures first."};
 // A manifest contains ONLY safe descriptive configuration, never credentials,
 // customer records or arbitrary generated source code.
 const config=preview?.config||{};
 const runtime=appRuntimeScreenSchema(config,catalog);
 if(!runtime.ok)return {ok:false,reason:runtime.reason};
 const modules=runtime.screens.map(item=>item.key);
 // Exact finite owner-approved presentation crosses into the offline native
 // shell. The preview is immutable and is checked against the draft revision.
 const look=publicAppAppearance(config.presentation||{});
 if(!look.ok)return look;
 const appearance=look.appearance;
 return {ok:true,kind:"private_standalone_planning_manifest_v1",
  appearance,appearanceSource:"matching_immutable_private_preview",
  ownerAppId:app.id,previewVersionId:preview.id,
  previewVersionNo:preview.version_no,sourceDraftRevision:preview.source_draft_revision,
  platformTargets:plan.requestedPlatforms,appName:plan.name,modules,
  screenSchema:runtime,
  requirements:plan.requirements.map(x=>({id:x.id,passed:x.passed})),
  customerDisclosuresAcknowledged:true,
  requiresVerifiedBilling:true,requiresDeveloperAccounts:true,
  requiresSecurityAndStoreReview:true,automaticallyPublished:false,
  packageProduced:false,appStoreSubmitted:false,chargesCreated:false,
  note:"A private planning specification only; a separate, authenticated, verified-billing build and submission process is still required."};
}
export {MODES,COSTS,standaloneEntitlementEvidence,buildAppDistributionPlan,buildStandalonePrivateHandoff};
