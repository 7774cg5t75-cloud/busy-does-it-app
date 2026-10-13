/**
 * V3.203 two-owner BUSINESS APP scoped read probe.
 * READ operations only, even though owner_status uses HTTP POST as RPC.
 * No production hosts, no service-role access, no customer request creation.
 * Real staging JWTs must come from pre-existing TEST Auth accounts.
 */
const REF="pnjdlogwegnqbsfpcofw";
const HOST="https://"+REF+".supabase.co";
const SAFE_EDGE=HOST+"/functions/v1/busy-mini-apps";
const APPROVAL="APPROVE_READ_ONLY_TWO_TENANT_APPS_V3203";
const ID=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const TOKEN=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const NAME_A="BDI STAGING TEST - V3203 OWNER A";
const NAME_B="BDI STAGING TEST - V3203 OWNER B";
const blocked=reason=>({ok:false,reason,requestsMade:0,
 actualTenantJWTVerified:false,externalCustomerActionVerified:false,
 neverProduction:true});
function checkTenantProbeConfig({env={},argv=[]}={}){
 if(!Array.isArray(argv)||argv.length>1||
  (argv.length===1&&argv[0]!=="--verify-owners-read-only"))
  return blocked("Unsupported staging mode.");
 if(!argv.length)return {ok:true,kind:"tenant_probe_noop_v3203",
  runAllowed:false,requestsMade:0,approved:false,
  noNetwork:true,neverProduction:true};
 const a=env.BDI_STAGING_OWNER_A_ID||"";
 const b=env.BDI_STAGING_OWNER_B_ID||"";
 const ba=env.BDI_STAGING_BUSINESS_A_ID||"";
 const bb=env.BDI_STAGING_BUSINESS_B_ID||"";
 const jwtA=env.BDI_STAGING_OWNER_A_JWT||"";
 const jwtB=env.BDI_STAGING_OWNER_B_JWT||"";
 const key=env.BDI_STAGING_PUBLISHABLE_KEY||"";
 if(env.BDI_STAGING_TENANT_READ_APPROVAL!==APPROVAL||
  ![a,b,ba,bb].every(x=>ID.test(x))||
  new Set([a,b,ba,bb]).size!==4||
  ![jwtA,jwtB].every(x=>TOKEN.test(x)&&x.length>30)||
  jwtA===jwtB||!/^sb_publishable_[A-Za-z0-9_-]{15,}$/.test(key))
  return blocked("Exact staging test identities, credentials and operator approval required.");
 // The config result is deliberately safe to inspect or log; never
 // return actual JWTs or even the publishable key from validation helpers.
 return {ok:true,kind:"tenant_read_config_v3203",runAllowed:true,
  ownerA:a,ownerB:b,businessA:ba,businessB:bb,neverProduction:true};
}
function sanitizeOwnerStatus({result={},businessId="",ownerId="",name=""}={}){
 if(result?.ok!==true||result?.businessId!==businessId||
   !["owner","admin"].includes(result.role)||
   result?.publicProfile?.profile?.businessName!==name||
   result?.publicProfile?.business_id!==businessId||
   result?.app&&result.app.business_id!==businessId||
   !ID.test(ownerId))
  return {ok:false,reason:"Authenticated synthetic workspace facts did not match."};
 const existingApp=result.app;
 if(existingApp&&(!ID.test(existingApp.id)||existingApp.discoverable!==false||
   !["draft","preview_ready"].includes(existingApp.status)))
  return {ok:false,reason:"Only private synthetic app drafts are valid for this probe."};
 // Never return publicProfile, requests, messages, contact details or JWTs.
 return {ok:true,businessId,verifiedOwner:true,
  verifiedExactSyntheticProfile:true,appPresent:!!existingApp,
  appIsPrivate:!!existingApp?existingApp.discoverable===false:true,
  noCustomerRowsReturned:true};
}
async function runTenantReadProbe({
 env=process.env,argv=process.argv.slice(2),fetchImpl=fetch
}={}){
 const config=checkTenantProbeConfig({env,argv});
 if(!config.ok||!config.runAllowed)return config;
 if(typeof fetchImpl!=="function")return blocked("No trusted staging transport.");
 let calls=0;
 async function readAuth(token){
  calls++;
  const response=await fetchImpl(HOST+"/auth/v1/user",{
    method:"GET",redirect:"error",cache:"no-store",
    signal:AbortSignal.timeout(10000),
    headers:{apikey:env.BDI_STAGING_PUBLISHABLE_KEY,Authorization:"Bearer "+token}
  });
  if(response?.status!==200)return null;
  const data=await response.json().catch(()=>null);
  return data&&typeof data.id==="string"?data.id:null;
 }
 async function ownerStatus(token,businessId){
  calls++;
  const response=await fetchImpl(SAFE_EDGE,{
   method:"POST",redirect:"error",cache:"no-store",
   signal:AbortSignal.timeout(10000),
   headers:{apikey:env.BDI_STAGING_PUBLISHABLE_KEY,Authorization:"Bearer "+token,
    "Content-Type":"application/json"},
   body:JSON.stringify({action:"owner_status",businessId})
  });
  if(response?.status!==200)return {ok:false,httpStatus:response?.status||0};
  return await response.json().catch(()=>({ok:false}));
 }
 // A forged JWT-shaped string never counts: verify BOTH with Supabase Auth.
 const [idA,idB]=await Promise.all([readAuth(env.BDI_STAGING_OWNER_A_JWT),readAuth(env.BDI_STAGING_OWNER_B_JWT)]);
 if(idA!==config.ownerA||idB!==config.ownerB)return {
  ...blocked("One or both Supabase Auth identities are unverified."),
  requestsMade:calls};
 const [ownA,ownB]=await Promise.all([
  ownerStatus(env.BDI_STAGING_OWNER_A_JWT,config.businessA),
  ownerStatus(env.BDI_STAGING_OWNER_B_JWT,config.businessB)]);
 const a=sanitizeOwnerStatus({result:ownA,businessId:config.businessA,
  ownerId:idA,name:NAME_A});
 const b=sanitizeOwnerStatus({result:ownB,businessId:config.businessB,
  ownerId:idB,name:NAME_B});
 if(!a.ok||!b.ok)return {...blocked("Synthetic staging workspace identity or private state was not verified."),
  requestsMade:calls};
 // Only after verifying BOTH synthetic workspaces may cross-tenant denial be tested.
 const [wrongA,wrongB]=await Promise.all([
  ownerStatus(env.BDI_STAGING_OWNER_A_JWT,config.businessB),
  ownerStatus(env.BDI_STAGING_OWNER_B_JWT,config.businessA)]);
 const denied=response=>response?.ok!==true&&[400,401,403,404].includes(
  response?.httpStatus);
 const crossBlocked=denied(wrongA)&&denied(wrongB);
 return {ok:crossBlocked,kind:"authenticated_tenant_owner_read_v3203",
  requestsMade:calls,realAuthEndpointContacted:true,
  actualTenantJWTVerified:true,ownAReadVerified:a.ok,ownBReadVerified:b.ok,
  crossTenantDeniedBothDirections:crossBlocked,
  noProductionEndpoints:true,noCustomerWrites:true,
  appDataNotLogged:true,customerRecordsNotLogged:true,
  source:"authenticated_isolated_staging_read_only",
  publishedAppTested:false,customerRequestDelivered:false,
  externallyConfirmedOutcome:false,productionTouched:false};
}
export {REF,HOST,SAFE_EDGE,APPROVAL,NAME_A,NAME_B,blocked,
 checkTenantProbeConfig,sanitizeOwnerStatus,runTenantReadProbe};
