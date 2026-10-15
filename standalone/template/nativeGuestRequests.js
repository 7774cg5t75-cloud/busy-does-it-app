/**
 * V3.155 direct native customer enquiry/booking request via the existing
 * public BUSY challenge → proof → submit service, not an imitation booking.
 * No authenticated owner token, payment details, fake confirmation or
 * customer-record cache is included in this standalone runtime.
 */
import {verifiedPublicRuntime} from "./nativeBusinessClient.js";
import {solveGuestChallenge} from "./nativeGuestProof.js";
import {validateNativeGuestRequest} from "./nativeCustomerActions.mjs";
async function sendNativeGuestRequest(runtime,livePublicApp,type,payload,{
 fetcher=fetch,solve=solveGuestChallenge}={}){
 if(!verifiedPublicRuntime(runtime)||livePublicApp?.ok!==true||
    livePublicApp.kind!=="public_native_app_v1"||
    livePublicApp.appId!==runtime.expectedAppId||
    livePublicApp.versionId!==runtime.expectedVersionId||
    livePublicApp.slug!==runtime.slug||
    (type==="booking_request"?!livePublicApp.supportsBookingRequest:
     type==="enquiry"?!livePublicApp.supportsEnquiry:true))
  return {ok:false,reason:"This exact published Business App cannot accept that request."};
 const validated=validateNativeGuestRequest(type,payload);
 if(!validated.ok)return validated;
 async function request(body){
  const response=await fetcher(runtime.endpoint,{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify(body)
  });
  const data=await response.json();
  if(!response.ok||data.ok!==true)throw Error(String(data.error||"The request was not accepted.").slice(0,200));
  return data;
 }
 try{
  const one=await request({action:"challenge",slug:runtime.slug,
   requestType:type,source:"web"});
  const challenge=one.challenge;
  if(!challenge?.challengeId||challenge.requestType!==type)
   throw Error("BUSY did not return a matching guest verification challenge.");
  const proof=await solve(challenge);
  if(!proof.ok)return proof;
  const result=await request({action:"submit",slug:runtime.slug,
   challengeId:challenge.challengeId,token:challenge.token,
   solution:proof.solution,idempotencyKey:challenge.challengeId,
   website:"",payload:validated.payload});
  if(result.request?.type!==type||!result.request?.id||
     !["new","received","pending","reviewing","open","requested"].includes(result.request.status))
   throw Error("BUSY could not confirm that your request was safely recorded.");
  return {ok:true,requestId:result.request.id,status:result.request.status,
   ownerConfirmed:false,
   message:type==="booking_request"?
    "Booking request sent. The business must confirm the appointment.":
    "Enquiry sent. The business will need to respond.",
   // Guest access token is deliberately NOT persisted on the device here.
   // Customer may lose status lookup ability when they close this prototype.
   receiptHeldInMemoryOnly:true};
 }catch(err){
  return {ok:false,reason:String(err?.message||"Could not send your request.").slice(0,200),
   mayHaveBeenReceived:true};
 }
}
export {validateNativeGuestRequest,sendNativeGuestRequest};
