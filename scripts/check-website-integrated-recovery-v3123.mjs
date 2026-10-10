import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {websiteDraftFreshness} from "../src/core/websiteDraftFreshness.mjs";
import {websiteCustomerSafetySummary} from "../src/core/websiteCustomerSafetySummary.mjs";
import {websiteAutomationBoundary} from "../src/core/websiteAutomationBoundary.mjs";
import {readOnlyStatusWithRecovery,checkAllReadOnlySources} from "../src/domain/readOnlyStatusRecovery.mjs";
import {websiteBrainCoaching} from "../src/core/websiteBrainCoaching.mjs";
import {websitePilotReadiness} from "../src/core/websitePilotReadiness.mjs";
import {websiteReleaseReadiness} from "../src/core/websiteReleaseReadiness.mjs";
let tests=0;
const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);tests++};
const yes=(x,msg)=>{assert.ok(x,msg);tests++};
const uuid="91edb6db-3a02-4de4-9ba8-5c93b4e790a1";
const userId="d8836a0e-fbb0-4cb9-a613-509af50eb114";
const draft={id:"fictional",generation:7};
const preview={id:"hosted-v7",state:"preview_ready",source_generation:7,content_hash:"hash-v7"};
const live={id:"public-v6",source_generation:6};
const freshness=(a=draft,b=preview,c=live,d={id:"out-of-order",source_generation:99})=>
 websiteDraftFreshness({draft:a,preview:b,live:c,latest:d});
eq(freshness().status,"same","Exact preview generation wins over a mismatched first record");
eq(freshness().verified,true,"Confirmed same revision is safe");
eq(freshness().changed,false,"No stale version");
eq(freshness({...draft,generation:8}).status,"changed","New private edit invalidates old hosted version");
eq(freshness({...draft,generation:8}).changed,true,"Changed draft blocks Go Live");
eq(freshness({...draft,generation:5}).status,"mismatched","Older private draft cannot approve newer hosted site");
eq(freshness(draft,{...preview,source_generation:null}).status,"unknown",
 "Unknown hosted source generation cannot qualify for approval");
eq(freshness(draft,{...preview,source_generation:null}).changed,true,
 "Missing evidence fails closed");
eq(freshness(draft,null,live).status,"changed",
 "Live version is the fallback only when there is no hosted preview");
eq(freshness(draft,null,null).status,"no-hosted-version",
 "No hosted version does not imply public delivery");
eq(freshness(null,preview).status,"no-draft",
 "No private draft cannot be compared");
eq(freshness({...draft,generation:0},preview).status,"unknown",
 "Unverified generation zero is not proof of freshness");
const statusArgs={businessId:uuid,userId,accessToken:"fictional-jwt",
 publishableKey:"fictional-public",supabaseUrl:"https://example.supabase.co"};
let calls=0,pauses=0,attempts=[];
const responded=async()=>{calls++;
 if(calls===1)return {ok:false,status:503};
 return {ok:true,json:async()=>({businessId:uuid,website:{id:"site"}})};
};
const recovered=await readOnlyStatusWithRecovery({...statusArgs,fetchImpl:responded},
 "website",{pause:async()=>{pauses++},onAttempt:e=>attempts.push(e)});
eq(recovered.ok,true,"Actual authenticated status transport recovers on transient 503");
eq(recovered.attempts,2,"Only two requests permitted");
eq(recovered.recoveredRead,true,"Recovered status is identified");
eq(calls,2,"Bounded status retry makes exactly two network calls");
eq(pauses,1,"One bounded wait");
eq(attempts.length,2,"Both status observations recorded without private payloads");
let blockedCalls=0;
const rateLimited=await readOnlyStatusWithRecovery({...statusArgs,
 fetchImpl:async()=>{blockedCalls++;return {ok:false,status:429};}},"social",
 {pause:async()=>{throw Error("429 should never be retried")}});
eq(rateLimited.ok,false,"Rate limit is not retried");
eq(rateLimited.attempts,1,"429 only sends one request");
eq(blockedCalls,1,"No rate-limit storm");
let exhausted=0;
const failure=await readOnlyStatusWithRecovery({...statusArgs,
 fetchImpl:async()=>{exhausted++;return {ok:false,status:503};}},"business_app",
 {pause:async()=>{}});
eq(failure.attempts,2,"Persistent 503 stops after bounded second attempt");
eq(exhausted,2,"Repeated unavailable service never runs unbounded");
let network=0;
const transient=await readOnlyStatusWithRecovery({...statusArgs,
 fetchImpl:async()=>{network++;if(network===1)throw Error("fetch failed");
 return {ok:true,json:async()=>({businessId:uuid})};}},"website",
 {pause:async()=>{}});
eq(transient.ok,true,"Verified transient network issue may have one recovery");
eq(network,2,"Network failure retries once only");
let foreignCalls=0;
const foreign=await readOnlyStatusWithRecovery({...statusArgs,
 fetchImpl:async()=>{foreignCalls++;return {ok:true,
 json:async()=>({businessId:userId})};}},"website",
 {pause:async()=>{throw Error("Wrong tenant must not be retried")}});
eq(foreign.ok,false,"Wrong-business response is never accepted");
eq(foreignCalls,1,"Cross-business response not automatically retried");
await assert.rejects(()=>readOnlyStatusWithRecovery(statusArgs,"website_publish"),
 /Only known reporting status sources/, "No publishing action through read transport");tests++;
await assert.rejects(()=>readOnlyStatusWithRecovery({...statusArgs,businessId:userId.slice(0,5)},"website"),
 /Sign in and select a valid business/, "Invalid tenant blocked before network");tests++;
const acts=[];
const multi=await checkAllReadOnlySources({...statusArgs,
 fetchImpl:async(url,{body})=>{
  const action=JSON.parse(body).action;acts.push(action);
  return {ok:true,json:async()=>({businessId:uuid})};
 }},{pause:async()=>{}});
eq(Object.keys(multi).sort(),["business_app","social","website"].sort(),
 "All three named read-only activity sources queried");
yes(Object.values(multi).every(x=>x.ok&&x.attempts===1),
 "No unnecessary extra retries");
yes(acts.includes("owner_status")&&acts.includes("status"),"Only existing status actions sent");
const policy=websiteAutomationBoundary({action:"business_activity_status_read",
 attempt:1,httpStatus:503,tenantAuthorized:true});
eq(policy.mayAutoRetryRead,true,"V3.123 real transport connected to explicit retry boundary");
eq(websiteAutomationBoundary({action:"business_activity_status_read",
 attempt:1,httpStatus:0,verifiedNetworkFailure:true,
 tenantAuthorized:true}).mayAutoRetryRead,true,"Only verified status network fault can be retried");
eq(websiteAutomationBoundary({action:"business_activity_status_read",
 attempt:1,httpStatus:0,tenantAuthorized:true}).mayAutoRetryRead,false,
 "Unknown status zero without verified network signal is denied");
for(const forbidden of ["website_publish","website_rollback",
 "domain_purchase","domain_dns_edit","social_post","paid_ai_generate"]){
 eq(websiteAutomationBoundary({action:forbidden,attempt:1,httpStatus:503,
  tenantAuthorized:true}).mayAutoRetryRead,false,forbidden+" never automatically retried");
}
const summary=(view,extra={})=>websiteCustomerSafetySummary({
 publishing:view,businessReady:true,hasDraft:true,...extra});
const v={previewDeployment:preview,canPublish:true,
 draftChangedSinceHosted:false,liveDeployment:live};
const reviewed=summary(v,{openedId:preview.id,reviewedId:preview.id});
eq(reviewed.category,"approval","Reviewed current preview awaits independent owner click");
eq(reviewed.automaticPublication,false,"Owner review never publishes");
eq(reviewed.paidServiceCalled,false,"Guidance never spends");
eq(summary(v).category,"review","Unopened hosted preview needs human review");
eq(summary({...v,draftChangedSinceHosted:true}).category,"prepare",
 "Changed draft takes priority over outdated approval");
eq(summary({...v,activeJob:{status:"processing"}}).category,"wait",
 "Running background job overrides new requests");
eq(summary({...v,recoveryState:{automatic:true,healthy:false}}).category,"wait",
 "Bounded automatic recovery prevents parallel manual action");
eq(summary({...v,recoveryState:{ownerActionRequired:true}}).category,"owner-action",
 "DNS owner action clearly distinguished");
eq(summary({...v,recoveryState:{healthy:false},healthStatus:"down",
 canRetrySafeRecovery:true}).category,"manual-recovery","Server-permitted retry requires review");
eq(summary({...v,previewDeployment:null,liveDeployment:null,
 canPublish:false}).category,"prepare","No published version does not imply delivery");
eq(summary({...v,previewDeployment:null,canPublish:false},
 {publicDeliveryVerified:false}).category,"verify",
 "Recorded live version but missing HTTPS proof requires checking");
eq(summary({...v,previewDeployment:null,canPublish:false},
 {publicDeliveryVerified:true}).category,"manage",
 "Independent live delivery proof allows management wording");
eq(summary(v,{businessReady:false}).category,"business",
 "Unconfirmed business facts come before website publish");
eq(summary(v,{hasDraft:false}).category,"private-draft",
 "No draft starts with private design");
const scoped={scope:"current_business_only",source:"owner_explicit_feedback",
 globalLearningEnabled:false,modelRetrained:false,likedFamilies:["editorial"],
 rejectedFamilies:["boutique"]};
eq(websiteBrainCoaching({summary:scoped,alternative:{suggested:{family:"editorial"}}})
 .sharedLearningEnabled,false,"Owner preferences never shared across businesses");
eq(websiteBrainCoaching({summary:{...scoped,scope:"another-business"},
 alternative:{suggested:{family:"editorial"}}}).scope,"general-business-context",
 "Foreign tenant feedback excluded");
eq(websitePilotReadiness().status,"blocked","No real pilot automatically enabled");
eq(websiteReleaseReadiness().status,"blocked","No automatic release from passing tests");
const code=readFileSync(new URL("../src/domain/websitePublishing.js",import.meta.url),"utf8");
yes(code.includes('draftFreshness.verified === true &&'),
 "Real website state requires proof of the exact current hosted generation");
yes(code.includes("websiteDraftFreshness({"),"Real publishing view uses the shared generation guard");
const ui=readFileSync(new URL("../src/screens/websitePublishing.js",import.meta.url),"utf8");
yes(ui.includes("websiteCustomerSafetySummary({"),
 "Customer website management uses joined safety guidance");
const prod=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
yes(prod.includes("check-website-integrated-recovery-v3123.mjs"),
 "Production regressions include real status transport tests");
console.log("V3.123 PASS: "+tests+" read-only recovery, tenant, draft-version, customer-journey and release assertions.");
