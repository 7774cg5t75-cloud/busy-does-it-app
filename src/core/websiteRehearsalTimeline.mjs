/**
 * V3.120 OFFLINE fictional end-to-end rehearsal. This code NEVER calls the
 * network, alters real hosting, posts to a provider, or certifies delivery.
 * Synthetic proof is intentionally returned as simulation metadata only.
 *
 * A sandbox owner can rehearse the lifecycle of an immutable hosted preview:
 * create private draft -> edit -> preview -> approve exact hash -> record a
 * simulated deployment -> verify that exact deployment -> optionally rollback.
 */
import {websitePilotReadiness} from "./websitePilotReadiness.mjs";
const HASH=/^[a-zA-Z0-9_.:-]{4,100}$/;
const EVENT=new Set(["draft_created","draft_edited","preview_prepared",
 "owner_approved","deployment_recorded","delivery_observed",
 "rollback_approved","rollback_recorded"]);
const clone=x=>JSON.parse(JSON.stringify(x));
function websiteRehearsalTimeline({context=null,events=[]}={}){
 const gate=websitePilotReadiness(context||{});
 const denied=reason=>({status:"blocked",reason,simulated:true,
  liveWebsiteVerified:false,publishedToInternet:false,
  externallyContactedCustomers:false,chargedProvider:false,
  proofForActualProduction:false,steps:[],failAt:null});
 if(gate.status!=="ready-for-manual-sandbox-rehearsal")
  return denied("An independently verified local/sandbox test gate is required");
 if(!Array.isArray(events)||events.length>24)return denied("Invalid rehearsal length");
 const tenant=context.businessId,history=[];
 const s={draft:null,preview:null,approved:null,live:null,verified:false,
  previous:null,rollbackApproval:null};
 function fail(index,reason){return {status:"rejected",reason,failAt:index,
   simulated:true,liveWebsiteVerified:false,publishedToInternet:false,
   externallyContactedCustomers:false,chargedProvider:false,
   proofForActualProduction:false,steps:history,
   currentSimulatedLiveHash:s.live?.hash||null};}
 const hashOk=x=>typeof x==="string"&&HASH.test(x);
 for(let i=0;i<events.length;i++){
  const e=events[i];
  if(!e||typeof e!=="object"||Array.isArray(e)||!EVENT.has(e.type))
   return fail(i,"Unknown or invalid test event");
  if(e.businessId!==tenant)return fail(i,"Cross-business event rejected");
  if(e.paid===true||e.externalWrite===true||e.production===true)
   return fail(i,"Real provider calls and production writes are forbidden");
  if(e.type==="draft_created"){
   if(s.draft||!hashOk(e.hash))return fail(i,"Create exactly one valid private draft");
   s.draft={hash:e.hash};s.preview=null;s.approved=null;
  }else if(e.type==="draft_edited"){
   if(!s.draft||!hashOk(e.hash)||e.hash===s.draft.hash)
    return fail(i,"The private revision must change");
   s.draft={hash:e.hash};s.preview=null;s.approved=null;
   s.rollbackApproval=null;
  }else if(e.type==="preview_prepared"){
   if(!s.draft||!hashOk(e.hash)||e.hash!==s.draft.hash)
    return fail(i,"Hosted preview must match the current private draft");
   s.preview={hash:e.hash,previewId:String(e.previewId||"").slice(0,80)};
   if(!s.preview.previewId)return fail(i,"Synthetic preview identifier required");
   s.approved=null;
  }else if(e.type==="owner_approved"){
   if(!s.preview||s.preview.hash!==e.hash||e.actorRole!=="owner"||
       e.explicitApproval!==true)
    return fail(i,"Owner must explicitly approve the exact hosted preview");
   s.approved={hash:e.hash,previewId:s.preview.previewId};
  }else if(e.type==="deployment_recorded"){
   if(!s.approved||s.approved.hash!==e.hash||
      e.previewId!==s.approved.previewId||!e.deploymentId)
    return fail(i,"Publication record must match the owner-approved hosted version");
   if(s.live)s.previous=clone(s.live);
   s.live={hash:e.hash,deploymentId:String(e.deploymentId).slice(0,80)};
   s.verified=false;s.approved=null;
  }else if(e.type==="delivery_observed"){
   if(!s.live||e.deploymentId!==s.live.deploymentId||
      e.hash!==s.live.hash||e.httpsHealthy!==true)
    return fail(i,"Simulated HTTPS observation must match exact live version");
   s.verified=true;
  }else if(e.type==="rollback_approved"){
   if(!s.previous||!s.live||e.actorRole!=="owner"||
      e.explicitApproval!==true||e.hash!==s.previous.hash)
    return fail(i,"Rollback requires owner approval of the prior recorded version");
   s.rollbackApproval={hash:s.previous.hash};
  }else if(e.type==="rollback_recorded"){
   if(!s.rollbackApproval||!s.previous||
       e.hash!==s.rollbackApproval.hash||!e.deploymentId)
    return fail(i,"Rollback must match owner-approved prior version");
   const old=clone(s.live);
   s.live={hash:s.previous.hash,deploymentId:String(e.deploymentId).slice(0,80)};
   s.previous=old;s.verified=false;s.rollbackApproval=null;
  }
  history.push({index:i+1,action:e.type,
   currentPrivateHash:s.draft?.hash||null,
   currentHostedHash:s.preview?.hash||null,
   currentSimulatedPublicHash:s.live?.hash||null,
   ownerApprovedHash:s.approved?.hash||null,
   simulatedDeliveryMatched:s.verified});
 }
 return {status:events.length?"simulated":"awaiting-events",
  reason:"No real cloud or public domain was contacted",
  steps:history,failAt:null,simulated:true,simulatedDeliveryMatched:s.verified,
  simulatedPublishedHash:s.live?.hash||null,
  simulatedRollbackAvailable:!!s.previous,
  liveWebsiteVerified:false,publishedToInternet:false,
  externallyContactedCustomers:false,chargedProvider:false,
  proofForActualProduction:false,
  privacyScope:"fictional_single_business_only"};
}
export {websiteRehearsalTimeline};
