/**
 * V3.219 — version drift/cross-builder source evidence reconciliation.
 * Read-only, fail-closed. Old customer links do NOT self-heal/redirect after
 * a republish; an owner must explicitly review and republish new content.
 */
import {canonicalWebsiteHandoffUrl} from "./websiteAppHandoffV3214.mjs";
const TYPES=new Set(["enquiry","booking_request"]);
const fail=reason=>({ok:false,reason,currentLinkValid:false,
 canAutoReconnect:false,customerRequestCreated:false,
 bookingConfirmed:false,providerDelivered:false});
function reviewWebsiteAppVersionDriftV3219({
 businessId="",website=null,app=null,liveVersion=null,
 kind="enquiry",pendingWrite="none",endpoint=""
}={}){
 if(!businessId||website?.businessId!==businessId||
   app?.business_id!==businessId||!TYPES.has(kind)||
   !["none","unknown","committed","not_started"].includes(pendingWrite))
  return fail("Use current website and app evidence from the same business.");
 const previous=website?.theme?.appRequestLinks?.[kind];
 const pinned=previous?.ownerApproved===true&&
   previous.intent===kind&&previous.appId===app.id&&
   typeof previous.liveVersionId==="string";
 const live=!!liveVersion&&liveVersion.mini_app_id===app.id&&
   liveVersion.id===app.current_live_version_id&&
   liveVersion.state==="live"&&
   ["live","update_pending"].includes(app.status);
 const module=live&&Array.isArray(liveVersion.config?.modules)&&
   liveVersion.config.modules.some(x=>x?.key===kind&&x?.enabled===true);
 const canonical=app?.public_slug&&endpoint?
   canonicalWebsiteHandoffUrl({endpoint,slug:app.public_slug,kind,
    appId:app.id,liveVersionId:liveVersion?.id||""}):"";
 const exactLink=!!canonical&&pinned&&previous.url===canonical&&
   previous.slug===app.public_slug;
 const changed=!!pinned&&(!live||
   previous.liveVersionId!==liveVersion?.id||!module||!exactLink);
 const action=pendingWrite==="unknown"||pendingWrite==="committed"?
   "reconcile_existing_receipt_before_any_retry":
   changed?"owner_reapprove_and_republish":
   !pinned?"review_new_handoff":
   !module?"review_published_app_module":
   "review_private_handoff";
 const linked=!!pinned&&live&&module&&exactLink&&!changed;
 return {ok:true,kind:"published_version_recovery_v3219",
  businessId,requestKind:kind,action,
  currentLinkValid:linked,canonicalLinkMatched:!!exactLink,
  storedLinkOwnerApproved:!!pinned,
  publishedAppCurrent:!!live,modulePresent:!!module,
  requiresOwnerReapproval:changed||!pinned,
  requiresSeparateWebsiteRepublish:changed,
  pendingRequestNeedsReadback:pendingWrite==="unknown"||
    pendingWrite==="committed",
  // A private draft containing a matching link does NOT prove real public click.
  publicClickVerified:false,
  publicLinkRedirectRecommended:false,
  canAutoReconnect:false,canRepublishWithoutOwner:false,
  recommendNewSubmission:false,customerRequestCreated:false,
  bookingConfirmed:false,providerDelivered:false,
  customerDataIncluded:false,
  explanation:pendingWrite==="unknown"||pendingWrite==="committed"?
   "The previous request may be saved. BUSY must check the existing server receipt before recommending another submission.":
   changed?"The published app or request module changed. Review a fresh owner-approved link and separately republish the website.":
   linked?"A current private link is recorded; the public website and real click still need verification.":
   "Review the live Business App request capability before preparing a website link."};
}
export {reviewWebsiteAppVersionDriftV3219};
