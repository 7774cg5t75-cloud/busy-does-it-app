/**
 * V3.204 — read-only AUTHENTICATED customer receipt isolation rehearsal.
 * No-op by default. --verify-read-only requires explicitly approved staging
 * credentials and a separately created synthetic saved request. Never
 * creates, publishes, notifies, updates unread, or logs personal data.
 */
import {pathToFileURL} from "node:url";
const PROJECT="pnjdlogwegnqbsfpcofw";
const HOST="https://"+PROJECT+".supabase.co";
const ENDPOINT=HOST+"/functions/v1/busy-mini-apps";
const APPROVAL="APPROVE_SYNTHETIC_STAGING_RECEIPT_READ_V3204";
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const JWT=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const KEY=/^[A-Za-z0-9:_-]{8,180}$/;
const nope=reason=>({ok:false,reason,networkRequests:0,
 newCustomerRequests:0,customerPIIReturned:false,
 productionEndpointsUsed:false,verifiedCustomerDelivery:false});
async function runStagingCustomerReceiptRead({
 argv=process.argv.slice(2),env=process.env,fetchImpl=fetch
}={}){
 if(!Array.isArray(argv)||argv.length>1||
  (argv.length===1&&argv[0]!=="--verify-read-only"))
  return nope("Only the no-op default or explicit read-only staging mode is allowed.");
 if(!argv.length)return {ok:true,kind:"staging_customer_receipt_not_run_v3204",
   networkRequests:0,realSavedRequestVerified:false,
   approvalRequired:true,noCustomerWrites:true};
 const userA=env.BDI_STAGING_RECEIPT_CUSTOMER_A_ID||"";
 const userB=env.BDI_STAGING_RECEIPT_CUSTOMER_B_ID||"";
 const appId=env.BDI_STAGING_RECEIPT_APP_ID||"";
 const tokenA=env.BDI_STAGING_RECEIPT_CUSTOMER_A_JWT||"";
 const tokenB=env.BDI_STAGING_RECEIPT_CUSTOMER_B_JWT||"";
 const apiKey=env.BDI_STAGING_PUBLISHABLE_KEY||"";
 const slug=env.BDI_STAGING_RECEIPT_APP_SLUG||"";
 const reqKey=env.BDI_STAGING_RECEIPT_REQUEST_KEY||"";
 const kind=env.BDI_STAGING_RECEIPT_KIND||"";
 if(env.BDI_STAGING_RECEIPT_APPROVAL!==APPROVAL||
  ![userA,userB,appId].every(x=>UUID.test(x))||
  new Set([userA,userB,appId]).size!==3||
  ![tokenA,tokenB].every(x=>JWT.test(x)&&x.length>30)||tokenA===tokenB||
  !/^sb_publishable_[A-Za-z0-9_-]{15,}$/.test(apiKey)||
  !/^bdi-staging-[a-z0-9-]{2,70}$/.test(slug)||
  !KEY.test(reqKey)||!["booking_request","enquiry"].includes(kind)||
  typeof fetchImpl!=="function")
  return nope("Staging-only fictional identities, saved request and explicit approval are required.");
 let networkRequests=0;
 const auth=async token=>{
  networkRequests++;
  const r=await fetchImpl(HOST+"/auth/v1/user",{
   method:"GET",redirect:"error",cache:"no-store",
   signal:AbortSignal.timeout(10000),
   headers:{apikey:apiKey,Authorization:"Bearer "+token}
  });
  if(r?.status!==200)return "";
  const data=await r.json().catch(()=>null);
  return data?.id||"";
 };
 const [a,b]=await Promise.all([auth(tokenA),auth(tokenB)]);
 if(a!==userA||b!==userB)return {...nope("Actual Supabase Auth identity did not match."),
   networkRequests};
 const readReceipt=async token=>{
  networkRequests++;
  const r=await fetchImpl(ENDPOINT,{
   method:"POST",redirect:"error",cache:"no-store",
   signal:AbortSignal.timeout(10000),
   headers:{apikey:apiKey,Authorization:"Bearer "+token,
    "Content-Type":"application/json"},
   body:JSON.stringify({action:"request_receipt",slug,
     requestType:kind,requestKey:reqKey})
  });
  if(r?.status!==200)return {ok:false};
  return await r.json().catch(()=>({ok:false}));
 };
 const [own,other]=await Promise.all([readReceipt(tokenA),readReceipt(tokenB)]);
 const pass=own?.ok===true&&own.found===true&&own.verifiedSaved===true&&
   UUID.test(own.receipt?.id)&&own.receipt?.appId===appId&&
   own.receipt?.requestType===kind&&own.receipt?.saved===true&&
   own.receipt?.notificationDelivered===false&&
   other?.ok===true&&other.found===false&&other.verifiedSaved===false;
 return {ok:pass,kind:"isolated_staging_customer_receipt_readback_v3204",
  networkRequests,authenticatedTwoCustomers:true,
  originalCustomerReceiptSeen:pass,crossCustomerRequestDenied:pass,
  independentDeliveryReceiptVerified:false,
  businessOwnerReplyVerified:false,confirmedDiaryBooking:false,
  noCustomerRequestsCreated:true,noCustomerMessagesSent:true,
  productionEndpointsUsed:false,realCustomerOutcomeVerified:false,
  source:"live_staging_jwt_read_only",
  noCustomerPIIReturned:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 runStagingCustomerReceiptRead().then(r=>{
  console.log(JSON.stringify(r,null,2));
  if(!r.ok)process.exitCode=1;
 }).catch(()=>{
  console.error("Staging customer receipt check blocked or unavailable. No credentials printed.");
  process.exitCode=1;
 });
}
export {PROJECT,HOST,ENDPOINT,APPROVAL,runStagingCustomerReceiptRead};
