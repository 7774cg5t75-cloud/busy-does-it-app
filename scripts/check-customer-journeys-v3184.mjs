import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {summarizeJourneyCheckpoints} from "../src/core/storedJourneyCheckpointsV3184.mjs";
import {reviewMigrationSideEffects} from "../src/core/stagingMigrationRiskV3184.mjs";
import {sendAtomicConversation} from "../supabase/functions/busy-mini-apps/atomicConversationService.mjs";
const root=fileURLToPath(new URL("../",import.meta.url));
const read=x=>readFileSync(join(root,x),"utf8");
let checks=0;
const ok=x=>{assert.ok(x);checks++},eq=(x,y)=>{assert.deepEqual(x,y);checks++};
const business="11111111-1111-4111-8111-111111111111";
const app="33333333-3333-4333-8333-333333333333";
const one="44444444-4444-4444-8444-444444444444";
const two="55555555-5555-4555-8555-555555555555";
const actor="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const makeRequest=(id,request_type,status,origin="signed_in")=>({
 id,business_id:business,mini_app_id:app,request_type,status,request_origin:origin,
 privateName:"DO_NOT_LEAK"});
const proof=summarizeJourneyCheckpoints({
 businessId:business,appId:app,
 requests:[makeRequest(one,"booking_request","accepted"),
  makeRequest(two,"enquiry","reviewing","guest_web"),
  {...makeRequest(one,"booking_request","accepted"),business_id:"22222222-2222-4222-8222-222222222222"}],
 links:[{business_id:business,request_id:one,bridge_state:"booking_confirmed"}],
 work:[{business_id:business,mini_app_id:app,request_id:one,state:"confirmed"}],
 messages:[{id:"m1",business_id:business,mini_app_id:app,request_id:one,sender_role:"business",
  body:"NO_MESSAGE_CONTENT_RETURN"},
  {id:"m2",business_id:business,mini_app_id:app,request_id:one,sender_role:"customer"}]
});
ok(proof.ok);eq(proof.counts.savedRequests,2);
eq(proof.counts.ownerRepliesSaved,1);
eq(proof.counts.customerRepliesSaved,1);
eq(proof.counts.ownerConfirmedAndWorkSaved,1);
eq(proof.counts.requestsAwaitingOwnerReply,1);
eq(proof.counts.guestRequestsRequiringExternalContact,1);
eq(proof.customerContentReturned,false);
eq(proof.realEndToEndStagingTested,false);
eq(proof.providerReceiptsVerified,false);
ok(!JSON.stringify(proof).includes("DO_NOT_LEAK"));
ok(!JSON.stringify(proof).includes("NO_MESSAGE_CONTENT_RETURN"));
ok(!summarizeJourneyCheckpoints({
 businessId:business,appId:app,
 messages:[{request_id:one,mini_app_id:app,
  business_id:"22222222-2222-4222-8222-222222222222"}]
}).ok);
eq(summarizeJourneyCheckpoints({businessId:business,appId:app,
 requests:[makeRequest(one,"booking_request","accepted")],
 messages:[],work:[],messagesTruncated:true}).coveragePartial,true);
const closed=summarizeJourneyCheckpoints({businessId:business,appId:app,
 requests:[makeRequest(one,"booking_request","closed")],
 work:[{business_id:business,mini_app_id:app,request_id:one,state:"confirmed"}]});
eq(closed.counts.closedRequestsWithActiveWork,1);
const dir=join(root,"supabase/migrations");
const migrations=readdirSync(dir).filter(n=>n.endsWith(".sql"))
 .map(name=>({name,sql:readFileSync(join(dir,name),"utf8")}));
const risks=reviewMigrationSideEffects(migrations);
ok(risks.ok);ok(risks.migrationCount>=62);
ok(risks.filesWithReviewSignals>0);
ok(risks.byCategory.privileged_routines>0);
ok(risks.byCategory.privileges_or_policies>0);
eq(risks.canAutomaticallyInstall,false);
eq(risks.installationPerformed,false);
ok(!reviewMigrationSideEffects([{name:"unknown.sql",sql:""}]).ok);
const synthetic=reviewMigrationSideEffects([
 {name:"20261013000000_check.sql",
  sql:"-- cron.schedule hidden in comment\nselect cron.schedule('x','* * * * *','select 1');\ncreate extension if not exists pg_net;"},
 {name:"20261013000001_check.sql",
  sql:"/* drop table secret */ create table if not exists public.safe_table(id uuid);"}
]);
eq(synthetic.byCategory.scheduled_work,1);
eq(synthetic.byCategory.extension_setup,1);
eq(synthetic.byCategory.data_or_schema_destructiveness,0);
const receipt={changed:true,databaseMessageSaved:true,providerDeliveryVerified:false,
 deliveryIntentDurable:true,outboxId:"88888888-8888-4888-8888-888888888888",outboxState:"pending",
 message:{id:"m123",request_id:one,business_id:business,
 sender_user_id:actor,sender_role:"business"}};
const rpcCalls=[];
const stub={rpc:async(name,body)=>{rpcCalls.push({name,body});return {data:receipt,error:null}}};
const result=await sendAtomicConversation(stub,{
 actorUserId:actor,businessId:business,requestId:one,
 senderRole:"business",message:"Hello",idempotencyKey:"message-1234"
});
ok(result.databaseMessageSaved);eq(result.customerDeliveryVerified,false);
eq(rpcCalls.length,1);
eq(rpcCalls[0].name,"busy_send_mini_app_message_v3185");
eq(rpcCalls[0].body.p_request_id,one);
eq(rpcCalls[0].body.p_body,"Hello");
ok(!await sendAtomicConversation(stub,{
 actorUserId:actor,businessId:business,requestId:one,
 senderRole:"business",message:"Hello",idempotencyKey:"invalid space"
}).then(()=>true).catch(()=>false));
const replay=await sendAtomicConversation({rpc:async()=>({
 data:{...receipt,changed:false},error:null
})},{actorUserId:actor,businessId:business,requestId:one,
 senderRole:"business",message:"Hello",idempotencyKey:"message-1234"});
eq(replay.reused,true);
ok(!await sendAtomicConversation({rpc:async()=>({data:{...receipt,
 providerDeliveryVerified:true},error:null})},{
 actorUserId:actor,businessId:business,requestId:one,
 senderRole:"business",message:"Hello",idempotencyKey:"message-1234"
}).then(()=>true).catch(()=>false));
const sql=read("supabase/migrations/20261012200000_v3_184_atomic_customer_conversation.sql");
for(const fragment of ["for update","busy_mini_app_request_messages",
 "busy_business_memberships","consumer_user_id","customer_unread_count",
 "business_unread_count","conflicting message replay",
 "revoke all on function","to service_role"])ok(sql.toLowerCase().includes(fragment.toLowerCase()));
const edge=read("supabase/functions/busy-mini-apps/index.ts");
ok(edge.includes('import {sendAtomicConversation} from "./atomicConversationService.mjs"'));
const fragment=edge.slice(edge.indexOf("async function sendRequestMessage("),
 edge.indexOf("async function updateRequestStatus("));
ok(fragment.includes('await sendAtomicConversation(supabase'));
ok(!fragment.includes('.from("busy_mini_app_request_messages").insert('));
ok(edge.includes("statusRefreshRequired:true"));
const controller=read("src/app/AppController.js");
ok(controller.includes('if(data?.databaseMessageSaved!==true)'));
ok(controller.includes("Push delivery has not been verified"));
const domain=read("src/domain/miniApps.js");
ok(domain.includes("summarizeJourneyCheckpoints({"));
const screen=read("src/screens/miniApps.js");
ok(screen.includes("V3.184 • Customer journey checkpoints"));
const prep=read("scripts/prepare-staging-install-v3180.mjs");
ok(prep.includes("review-signals.json"));
ok(prep.includes("reviewMigrationSideEffects(migrations)"));
console.log("V3.184 "+checks+" focused conversation, outcome and migration review assertions passed.");
