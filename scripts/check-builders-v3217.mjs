/**
 * V3.217 focused offline regressions. No network, customer, database,
 * public endpoint, provider billing, paid build or remote AI operations.
 */
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {planPrivateWebsiteFormApprovalV3217,
 comparePrivateApprovalReviewV3217}
 from "../src/core/websiteFormApprovalV3217.mjs";
import {designWebsiteRequestTransactionV3217}
 from "../supabase/functions/busy-website-request-intake/requestTransactionDesignV3217.mjs";
import {reviewSharedCustomerReceiptV3217}
 from "../src/core/customerJourneyEvidenceV3217.mjs";
import {planBusinessJourneyNextStepV3217}
 from "../src/core/businessJourneyCoachV3217.mjs";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
let checks=0;
const ok=(x,m)=>{assert.ok(x,m);checks++;};
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const BID="11111111-1111-4111-8111-111111111111";
const OTHER="88888888-8888-4888-8888-888888888888";
const SITE="22222222-2222-4222-8222-222222222222";
const DEP="33333333-3333-4333-8333-333333333333";
const APP="55555555-5555-4555-8555-555555555555";
const VER="66666666-6666-4666-8666-666666666666";
const REQ="77777777-7777-4777-8777-777777777777";
const TOKEN="AbCdEf1234567890_-AbCdEf1234567890";
const ORIGIN="https://slow-roast.example";
const now="2026-10-14T12:00:00Z";
const privateSite=()=>({id:SITE,businessId:BID,generation:12,sections:[
 {id:"contact",type:"contact",email:"owner@example.test",enabled:true},
 {id:"services",type:"services",items:[{title:"Pitch hire"}]}
]});
const pub=()=>({website:{current_live_deployment_id:DEP},
 liveDeployment:{id:DEP,public_origin:ORIGIN},draftChangedSinceHosted:false});
const spec=()=>({businessId:BID,website:privateSite(),publishing:pub(),
 kind:"enquiry",purpose:"Respond to customer enquiries about events",
 notice:"We use contact details to reply to customer enquiries.",
 retentionDays:90});
const plan=planPrivateWebsiteFormApprovalV3217(spec());
ok(plan.ok);
eq(plan.readyForSeparateOwnerAndLegalReview,true);
eq(plan.liveDeploymentCandidateId,DEP);
eq(plan.publicFormEnabled,false);
eq(plan.serverApprovalStored,false);
eq(plan.ownerApprovalRecorded,false);
eq(plan.customerConsentCollected,false);
eq(plan.noticeRevisionIssued,false);
eq(plan.proposedRetentionDays,90);
eq(plan.fieldKeys,["name","email","phone","message"]);
eq(comparePrivateApprovalReviewV3217({prepared:plan,current:plan}).ok,true);
const change=(fn,name)=>{
 const args=spec();fn(args);
 const next=planPrivateWebsiteFormApprovalV3217(args);
 if(!next.ok){eq(next.publicFormEnabled,false,name);return;}
 eq(next.publicFormEnabled,false,name+" remains inactive");
 eq(comparePrivateApprovalReviewV3217({prepared:plan,current:next}).ok,false,name);
};
change(x=>x.businessId=OTHER,"different tenant");
change(x=>x.website.businessId=OTHER,"other business site");
change(x=>x.website.generation=13,"new website draft");
change(x=>x.publishing.liveDeployment.id=OTHER,"different deployment");
change(x=>x.publishing.draftChangedSinceHosted=true,"stale draft");
change(x=>x.notice="Different owner notice requiring fresh approval.","changed notice");
change(x=>x.purpose="Different purpose requiring separate review","changed purpose");
change(x=>x.retentionDays=180,"changed retention");
change(x=>x.fields=["name","email","message"],"narrowed fields");
change(x=>x.fields=["name","phone","message"],"contact method change");
for(const fields of [
 ["name","email","email","message"],
 ["email","message"],
 ["name","message"],
 ["name","email","preferredDate"],
 ["name","email","message","card"],
 ["name","email"]
]){
 const x=planPrivateWebsiteFormApprovalV3217({...spec(),fields});
 eq(x.ok,false,"Reject inappropriate or duplicate fields");
}
eq(planPrivateWebsiteFormApprovalV3217({...spec(),kind:"billing"}).ok,false);
eq(planPrivateWebsiteFormApprovalV3217({...spec(),notice:"too short"}).readyForSeparateOwnerAndLegalReview,false);
eq(planPrivateWebsiteFormApprovalV3217({...spec(),purpose:"pay"}).readyForSeparateOwnerAndLegalReview,false);
eq(planPrivateWebsiteFormApprovalV3217({...spec(),retentionDays:0}).readyForSeparateOwnerAndLegalReview,false);
eq(planPrivateWebsiteFormApprovalV3217({...spec(),retentionDays:731}).readyForSeparateOwnerAndLegalReview,false);
eq(planPrivateWebsiteFormApprovalV3217({...spec(),retentionDays:90.5}).readyForSeparateOwnerAndLegalReview,false);
const bookingPlan=planPrivateWebsiteFormApprovalV3217({...spec(),
 kind:"booking_request",services:["Pitch hire"]});
ok(bookingPlan.ok);
eq(bookingPlan.readyForSeparateOwnerAndLegalReview,true);
eq(bookingPlan.fieldKeys,["name","email","phone","service","preferredDate"]);
eq(bookingPlan.publicFormEnabled,false);
eq(planPrivateWebsiteFormApprovalV3217({...spec(),kind:"booking_request",
 services:[]}).readyForSeparateOwnerAndLegalReview,false);
eq(planPrivateWebsiteFormApprovalV3217({...spec(),kind:"booking_request",
 services:["Pitch hire","Pitch hire"]}).readyForSeparateOwnerAndLegalReview,false);
const app=()=>({id:APP,business_id:BID,status:"live",current_live_version_id:VER});
const version=()=>({id:VER,mini_app_id:APP,state:"live",config:{
 modules:[{key:"enquiry",enabled:true},{key:"booking_request",enabled:true}],
 publicProfile:{services:[{name:"Pitch hire"}]}
}});
const req=()=>({origin:ORIGIN,requestType:"enquiry",idempotencyKey:TOKEN,
 consentRevision:TOKEN,consentAccepted:true,payload:{
 name:"An Example",email:"a@example.test",message:"Could we book a stall?"
}});
const facts=()=>({
 website:{id:SITE,business_id:BID,current_live_deployment_id:DEP},
 deployment:{id:DEP,website_id:SITE,business_id:BID,
  public_origin:ORIGIN,status:"live"},
 approval:{website_id:SITE,business_id:BID,deployment_id:DEP,
  status:"approved",enabled:true,request_type:"enquiry",
  app_id:APP,app_version_id:VER,
  consent:{notice:"We use the details you send to reply to your enquiry.",revision:TOKEN}},
 challenge:{website_id:SITE,business_id:BID,deployment_id:DEP,
  origin:ORIGIN,status:"verified",single_use:true,consumed:false,
  abuse_limits_passed:true,request_type:"enquiry",idempotency_key:TOKEN,
  expires_at:"2026-10-14T12:05:00Z"}
});
const txArgs=()=>({request:req(),serverFacts:facts(),app:app(),
 version:version(),now});
const tx=designWebsiteRequestTransactionV3217(txArgs());
ok(tx.ok,tx.reason);
eq(tx.transactionExecutable,false);
eq(tx.nativeWebsiteIntakeEnabled,false);
eq(tx.requestSaved,false);
eq(tx.receiptVerified,false);
eq(tx.bookingConfirmed,false);
eq(tx.providerDelivered,false);
eq(tx.customerDetailsIncluded,false);
eq(tx.existingGuestRpcReusableWithoutChange,false);
eq(tx.intendedExistingTable,"busy_mini_app_requests");
eq(tx.phases.length,6);
ok(tx.phases.every(x=>x.implemented===false));
ok(!JSON.stringify(tx).includes("a@example.test"));
const mutateTx=(change,name)=>{
 const x=txArgs();change(x);
 const result=designWebsiteRequestTransactionV3217(x);
 eq(result.ok,false,name);
 eq(result.transactionExecutable,false,name+" never commits");
 eq(result.nativeWebsiteIntakeEnabled,false,name+" never publishes");
};
mutateTx(x=>x.serverFacts.approval.app_id=OTHER,"other approved app");
mutateTx(x=>x.serverFacts.approval.app_version_id=OTHER,"stale approved app version");
mutateTx(x=>x.app.business_id=OTHER,"cross tenant app");
mutateTx(x=>x.app.status="draft","unpublished app");
mutateTx(x=>x.app.current_live_version_id=OTHER,"changed live version");
mutateTx(x=>x.version.mini_app_id=OTHER,"version owned by other app");
mutateTx(x=>x.version.state="draft","not live version");
mutateTx(x=>x.version.config.modules=[],"missing enabled module");
mutateTx(x=>x.request.origin="https://evil.example","cross-origin request");
mutateTx(x=>x.request.consentAccepted=false,"missing visitor consent");
mutateTx(x=>x.serverFacts.challenge.consumed=true,"replayed challenge");
mutateTx(x=>x.request.payload.newField="raw confidential","unexpected input");
const bookingTx=txArgs();
bookingTx.request.requestType="booking_request";
bookingTx.request.payload={name:"A Person",email:"a@example.test",service:"Pitch hire"};
bookingTx.serverFacts.approval.request_type="booking_request";
bookingTx.serverFacts.approval.services=["Pitch hire"];
bookingTx.serverFacts.challenge.request_type="booking_request";
ok(designWebsiteRequestTransactionV3217(bookingTx).ok);
eq(designWebsiteRequestTransactionV3217(bookingTx).bookingConfirmed,false);
mutateTx(x=>{
 x.request.requestType="booking_request";
 x.serverFacts.approval.request_type="booking_request";
 x.serverFacts.approval.services=["Pitch hire"];
 x.serverFacts.challenge.request_type="booking_request";
 x.request.payload={name:"A",email:"a@example.test",service:"Unknown"};
},"booking service unapproved");
const row=()=>({id:REQ,business_id:BID,mini_app_id:APP,
 request_type:"enquiry",status:"received",request_origin:"guest_web"});
const receiptArgs=()=>({businessId:BID,appId:APP,requestId:REQ,
 request:row(),source:"website_handoff",readbackTrusted:true,writeOutcome:"unknown"});
const receipt=reviewSharedCustomerReceiptV3217(receiptArgs());
ok(receipt.ok,receipt.reason);
eq(receipt.verifiedSaved,true);
eq(receipt.status,"saved_in_business_app");
eq(receipt.publicWebsiteSubmissionVerified,false);
eq(receipt.ownerInboxReadVerified,false);
eq(receipt.providerDelivered,false);
eq(receipt.bookingConfirmed,false);
eq(receipt.shouldCheckExistingReceiptFirst,true);
eq(receipt.retryCreateRecommended,false);
eq(receipt.trustedServerReadbackClaimed,true);
eq(receipt.businessId,BID);
eq(receipt.appId,APP);
eq(reviewSharedCustomerReceiptV3217({...receiptArgs(),source:"website_native"}).ok,false);
eq(reviewSharedCustomerReceiptV3217({...receiptArgs(),readbackTrusted:false}).verifiedSaved,false);
eq(reviewSharedCustomerReceiptV3217({...receiptArgs(),readbackTrusted:false}).status,"commit_uncertain");
eq(reviewSharedCustomerReceiptV3217({...receiptArgs(),businessId:OTHER}).verifiedSaved,false);
eq(reviewSharedCustomerReceiptV3217({...receiptArgs(),request:{...row(),mini_app_id:OTHER}}).verifiedSaved,false);
eq(reviewSharedCustomerReceiptV3217({...receiptArgs(),request:{...row(),request_origin:"signed_in"}}).verifiedSaved,false);
eq(reviewSharedCustomerReceiptV3217({...receiptArgs(),request:null}).verifiedSaved,false);
eq(reviewSharedCustomerReceiptV3217({...receiptArgs(),request:{...row(),id:OTHER}}).verifiedSaved,false);
const bookingRow={...row(),request_type:"booking_request",status:"accepted"};
const bookingReceipt=reviewSharedCustomerReceiptV3217({...receiptArgs(),
 request:bookingRow,link:{request_id:REQ,business_id:BID,bridge_state:"booking_confirmed"}});
ok(bookingReceipt.ok);
eq(bookingReceipt.bookingMarkedConfirmedInBusy,true);
eq(bookingReceipt.bookingConfirmed,false);
eq(bookingReceipt.independentDiaryVerification,false);
eq(bookingReceipt.notificationDelivered,false);
const adviceArgs={businessId:BID,website:privateSite(),businessType:"Event hire",
 description:"We want customer enquiries",app:app(),liveVersion:version(),
 catalog:[{module_key:"enquiry",status:"available"}]};
const coached=planBusinessJourneyNextStepV3217(adviceArgs);
ok(coached.ok);
eq(coached.action,"review_website_app_handoff");
eq(coached.websiteNativeFormActive,false);
eq(coached.noCustomerMessageSent,true);
eq(coached.providerDelivered,false);
eq(coached.capability,"enquiry");
eq(planBusinessJourneyNextStepV3217({...adviceArgs,
 website:{...privateSite(),businessId:OTHER}}).action,"check_contact_details");
eq(planBusinessJourneyNextStepV3217({...adviceArgs,
 liveVersion:{...version(),state:"draft"}}).action,"review_business_app_setup");
eq(planBusinessJourneyNextStepV3217({...adviceArgs,savedReceipt:receipt}).action,"review_existing_request");
eq(planBusinessJourneyNextStepV3217({...adviceArgs,
 savedReceipt:{...receipt,businessId:OTHER}}).action,"review_website_app_handoff");
eq(planBusinessJourneyNextStepV3217({...adviceArgs,
 savedReceipt:{...receipt,trustedServerReadbackClaimed:false}})
 .action,"review_website_app_handoff");
const unknown=planBusinessJourneyNextStepV3217({
 businessId:BID,website:privateSite(),businessType:"Unusual cooperative"});
ok(unknown.ok);
eq(unknown.capability,"enquiry");
eq(unknown.nextActionIsRecommendationOnly,true);
const ui=source("src/screens/websiteAppHandoffReview.js");
ok(ui.includes("WebsiteFormSpecReviewV3217"));
ok(ui.includes("planBusinessJourneyNextStepV3217"));
ok(ui.includes("nativeForm.safeExplanation"));
const formUi=source("src/screens/websiteFormSpecReviewV3217.js");
ok(formUi.includes("No form or privacy notice is published"));
ok(formUi.includes("Check that my proposal is still unchanged"));
const guard=source("supabase/functions/busy-website-request-intake/requestTransactionDesignV3217.mjs");
ok(guard.includes("existingGuestRpcReusableWithoutChange:false"));
ok(guard.includes("transactionExecutable:false"));
ok(!guard.includes("supabase.rpc("));
ok(!existsSync(new URL("../supabase/functions/busy-website-request-intake/index.ts",import.meta.url)));
const journey=source("src/core/sharedRequestJourneyV3212.mjs");
ok(journey.includes("websiteIntakeEndpointActive:false"));
console.log("V3.217 offline confidence: "+checks+" assertions passed; zero public writes or paid operations.");
