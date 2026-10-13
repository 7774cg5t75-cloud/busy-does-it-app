/**
 * V3.201 isolated first-app concurrency contract.
 * Only used in a separate, manually activated staging exercise. This module
 * never publishes, deletes test rows or initiates customer requests.
 */
const STAGING_PROJECT="pnjdlogwegnqbsfpcofw";
const BASE_URL="https://"+STAGING_PROJECT+".supabase.co";
const SYNTHETIC_NAME="BDI STAGING TEST - V3201";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function preflightIsolatedFirstAppRace({
 projectRef="",baseUrl="",businessId="",ownerApproved=false,
 verifiedSyntheticBusiness=false,ownerStatus=null
}={}){
 const result={ok:false,reason:"Isolated staging test cannot start.",
  mayMakeCustomerRequests:false,noProductionAccess:true};
 let url;
 try{url=new URL(baseUrl);}catch{return result;}
 if(projectRef!==STAGING_PROJECT||url.origin!==BASE_URL||
    url.pathname!=="/"||url.search||url.hash||!UUID.test(businessId)||
    ownerApproved!==true||verifiedSyntheticBusiness!==true)
  return result;
 if(ownerStatus?.ok!==true||ownerStatus.businessId!==businessId||
    !["owner","admin"].includes(ownerStatus.role)||
    ownerStatus.app!==null||
    ownerStatus.publicProfile?.profile?.businessName!==SYNTHETIC_NAME)
  return {...result,reason:"The signed-in staging owner must select an empty, independently verified synthetic business workspace."};
 return {ok:true,kind:"isolated_first_app_race_preflight_v3201",
  projectRef:STAGING_PROJECT,businessId,source:"authenticated_owner_status",
  mayAttemptFirstAppRace:true,neverProduction:true,
  requiresSeparateHumanApproval:true,mayMakeCustomerRequests:false,
  noPublishing:true,noProviderSpending:true,noCustomerDataNeeded:true};
}
function evaluateIsolatedFirstAppRace({businessId="",before=null,
 responses=[],after=null}={}){
 const blocked={ok:false,reason:"Concurrent first-create evidence is incomplete.",
  noCustomerJourneyProof:true,noAutomaticRetry:true};
 if(!UUID.test(businessId)||before?.ok!==true||
    before.businessId!==businessId||before.app!==null||
    !Array.isArray(responses)||responses.length!==2||
    after?.ok!==true||after.businessId!==businessId)
  return blocked;
 const app=after.app;
 if(!app||app.business_id!==businessId||app.app_key!=="main"||
    app.discoverable!==false||app.status!=="draft"||
    !UUID.test(app.id)||!Number.isSafeInteger(app.draft_revision)||
    app.draft_revision<2)
  return {...blocked,reason:"The final private app is not verified."};
 const successes=responses.filter(x=>x?.ok===true&&x?.atomicFirstCreate===true&&
  x?.app?.id===app.id&&x?.app?.business_id===businessId&&
  x?.app?.discoverable===false&&x?.app?.status==="draft");
 const other=responses.filter(x=>!successes.includes(x));
 const oneWinner=successes.length===1&&other.length===1&&
  other[0]?.ok===false;
 if(!oneWinner)return {...blocked,reason:"First-create results are ambiguous, conflicting or both claimed success."};
 if(Number(app.draft_revision)!==Number(successes[0].app.draft_revision))
  return {...blocked,reason:"The stored app was changed during the concurrency test."};
 return {ok:true,kind:"isolated_first_app_race_readback_v3201",
  sameTenantVerifiedInResponses:true,
  exactlyOneSuccessObserved:true,secondCreateRefused:true,
  finalPrivateAppRevision:app.draft_revision,
  serverOwnerStatusReadback:true,
  databaseRowCountIndependentlyAudited:false,
  requestRetryWasAutomatic:false,secondAppWasNotPublished:true,
  customerJourneyVerified:false,appStoreReady:false,
  liveNotificationVerified:false,bookingConfirmed:false,
  needsAuthenticatedDbAudit:true,
  noCustomerDataReturned:true,noCustomerRequestsSent:true};
}
export {STAGING_PROJECT,BASE_URL,SYNTHETIC_NAME,
 preflightIsolatedFirstAppRace,evaluateIsolatedFirstAppRace};
