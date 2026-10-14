/**
 * V3.217 — DRY RUN server-owned transactional adapter design.
 * No deployable index.ts, privileged DB client, HTTP action, mutating RPC,
 * migration or public endpoint. Never pass raw customer payload to a plan.
 * Native website submissions cannot call the existing mini-app guest RPC
 * without a mini-app challenge; replacing its challenge is future backend work.
 */
import {verifySiteOriginIntakeV3216} from "./siteOriginGuardV3216.mjs";
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const no=reason=>({ok:false,reason,transactionExecutable:false,
  nativeWebsiteIntakeEnabled:false,requestSaved:false,receiptVerified:false,
  bookingConfirmed:false,providerDelivered:false});
const PHASES=Object.freeze([
 {id:"resolve",action:"Authoritatively resolve owner-approved site/deployment/app records"},
 {id:"challenge",action:"Verify same-origin browser challenge and rate/abuse controls"},
 {id:"atomic",action:"In one DB transaction: claim challenge, source-bound idempotency, insert shared request"},
 {id:"readback",action:"Re-read exact saved request under server-owned business/app/site scope"},
 {id:"inbox",action:"Surface committed record in existing business owner inbox"},
 {id:"outbox",action:"Record notification delivery independently and reconcile failures"}
]);
function designWebsiteRequestTransactionV3217({
 request=null,serverFacts=null,app=null,version=null,now=""
}={}){
 const checked=verifySiteOriginIntakeV3216({request,serverFacts,now});
 if(!checked.ok)return no(checked.reason);
 if(!app||!version||!UUID.test(app.id)||!UUID.test(version.id)||
    app.business_id!==checked.businessId||
    app.current_live_version_id!==version.id||
    version.mini_app_id!==app.id||version.state!=="live"||
    !["live","update_pending"].includes(app.status))
  return no("A same-business immutable published app version is required for a shared inbox.");
 const module=Array.isArray(version.config?.modules)&&
   version.config.modules.some(x=>x?.key===checked.requestType&&x?.enabled===true);
 if(!module)return no("The published Business App does not support that request.");
 if(checked.requestType==="booking_request"&&
    !version.config?.publicProfile?.services?.some(s=>
      typeof s?.name==="string"&&s.name.trim()===request.payload.service))
  return no("That booking service is not in the current published app.");
 const site=serverFacts.website,dep=serverFacts.deployment,approval=serverFacts.approval;
 if(approval.app_id!==app.id||approval.app_version_id!==version.id||
    dep.business_id!==app.business_id||site.business_id!==app.business_id)
  return no("The owner form approval must pin the same current live Business App version.");
 return {ok:true,kind:"native_website_transaction_design_v3217",
  businessId:checked.businessId,websiteId:site.id,
  deploymentId:dep.id,appId:app.id,appVersionId:version.id,
  requestType:checked.requestType,phases:PHASES.map(x=>({...x,implemented:false})),
  intendedExistingTable:"busy_mini_app_requests",
  intendedOwnerInbox:"existing Business App request inbox",
  existingGuestRpcReusableWithoutChange:false,
  newVersionedWebsiteChallengeSchemaRequired:true,
  newAtomicWebsiteRequestAdapterRequired:true,
  newWebsiteOriginReceiptContractRequired:true,
  requireServerScopeAndIdempotencyUniqueness:true,
  requireIndependentReadbackAfterCommit:true,
  postCommitNotificationNotWriteAuthority:true,
  transactionExecutable:false,nativeWebsiteIntakeEnabled:false,
  customerDetailsIncluded:false,requestSaved:false,receiptVerified:false,
  bookingConfirmed:false,providerDelivered:false,
  reason:"Design complete for these source facts. A reviewed schema, server-owned transactional RPC and staging are still required."};
}
export {PHASES,designWebsiteRequestTransactionV3217};
