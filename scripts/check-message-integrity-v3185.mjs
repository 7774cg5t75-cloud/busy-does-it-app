import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 stableMessageSlot,textChecksum,prepareDurableMessageAttempt,
 clearDurableMessageAttempt
} from "../src/core/durableMessageRetryV3185.mjs";
import {reviewMessageDeliveryIntents} from "../src/core/messageDeliveryEvidenceV3185.mjs";
let assertions=0;
const ok=x=>{assert.ok(x);assertions++};
const eq=(a,b)=>{assert.deepEqual(a,b);assertions++};
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const u="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const b="11111111-1111-4111-8111-111111111111";
const app="33333333-3333-4333-8333-333333333333";
const rid="44444444-4444-4444-8444-444444444444";
const rid2="55555555-5555-4555-8555-555555555555";
const storeMap=new Map();
const store={
 async getItemAsync(k){return storeMap.get(k)||null;},
 async setItemAsync(k,v){storeMap.set(k,v);},
 async deleteItemAsync(k){storeMap.delete(k);}
};
let created=0;
const id=()=>`msg_key_${++created}_xyz789012345`;
const args={actorUserId:u,businessId:b,role:"business",requestId:rid,
 message:"Please confirm for Thursday"};
const first=await prepareDurableMessageAttempt(store,args,id);
ok(first.ok);eq(first.retrying,false);eq(created,1);
eq(storeMap.size,1);
ok(!JSON.stringify([...storeMap.values()]).includes("Please confirm"));
const restarted=await prepareDurableMessageAttempt(store,args,id);
eq(restarted.ok,true);eq(restarted.retrying,true);
eq(restarted.key,first.key);eq(created,1);
const edited=await prepareDurableMessageAttempt(store,
 {...args,message:"Different quote body"},id);
eq(edited.ok,false);eq(created,1);
const differentRequest=await prepareDurableMessageAttempt(store,
 {...args,requestId:rid2},id);
ok(differentRequest.ok);eq(created,2);
const otherActor=await prepareDurableMessageAttempt(store,
 {...args,actorUserId:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"},id);
ok(otherActor.ok);eq(created,3);
const customer=await prepareDurableMessageAttempt(store,{
 actorUserId:u,role:"customer",requestId:rid,message:args.message},id);
ok(customer.ok);eq(created,4);
ok(stableMessageSlot(args)!==stableMessageSlot({
 actorUserId:u,role:"customer",requestId:rid}));
ok(!stableMessageSlot({...args,businessId:"wrong"}));
ok(!textChecksum(""));eq(textChecksum("same"),textChecksum("same"));
ok(textChecksum("same")!==textChecksum("different"));
ok(!await prepareDurableMessageAttempt({
 ...store,async setItemAsync(){throw Error("Storage unavailable")}
},{...args,requestId:"66666666-6666-4666-8666-666666666666"},id)
 .then(r=>r.ok));
eq(await clearDurableMessageAttempt(store,first),true);
const newSend=await prepareDurableMessageAttempt(store,args,id);
ok(newSend.ok);ok(newSend.key!==first.key);eq(created,6);
const row=(id,state,recipient_role="customer",attempt_count=0)=>({
 id,business_id:b,mini_app_id:app,request_id:rid,recipient_role,
 state,attempt_count,created_at:"2026-10-12T10:00:00.000Z"
});
const evidence=reviewMessageDeliveryIntents({
 businessId:b,appId:app,nowISO:"2026-10-12T12:00:00.000Z",
 rows:[row(rid,"pending"),row(rid2,"submitted_unverified","business",1),
 row("66666666-6666-4666-8666-666666666666","no_submission_evidence","customer",2)]
});
ok(evidence.ok);eq(evidence.counts.total,3);
eq(evidence.counts.pending,1);eq(evidence.counts.pendingOver60Minutes,1);
eq(evidence.counts.submittedButDeliveryUnverified,1);
eq(evidence.counts.submissionWithoutProviderReceipt,1);
eq(evidence.counts.retriedAttemptCount,1);
eq(evidence.customerDeliveryVerified,false);
eq(evidence.productionPushVerified,false);
ok(!reviewMessageDeliveryIntents({
 businessId:b,appId:app,rows:[{...row(rid,"pending"),
 business_id:"22222222-2222-4222-8222-222222222222"}]}).ok);
ok(!reviewMessageDeliveryIntents({
 businessId:b,appId:app,rows:[row(rid,"pending"),row(rid,"pending")]}).ok);
const sql=read("supabase/migrations/20261012211000_v3_185_durable_message_delivery_intent.sql");
for(const needle of ["message_id uuid not null unique",
 "busy_send_mini_app_message_v3185",
 "busy_send_mini_app_message_v3184",
 "busy_record_mini_app_push_submission_v3185",
 "revoke execute on function public.busy_send_mini_app_message_v3184",
 "force row level security","provider_delivery_verified boolean not null default false"])
 ok(sql.includes(needle));
const endpoint=read("supabase/functions/busy-mini-apps/index.ts");
ok(endpoint.includes("createOwnerStatusReader"));
const edge=endpoint+"\n"+read("supabase/functions/busy-mini-apps/ownerStatusReader.mjs");
const service=read("supabase/functions/busy-mini-apps/atomicConversationService.mjs");
ok(service.includes('supabase.rpc("busy_send_mini_app_message_v3185"'));
ok(service.includes("deliveryIntentDurable!==true"));
ok(edge.includes('supabase.rpc("busy_record_mini_app_push_submission_v3185"'));
ok(edge.includes("messageDeliveryOutbox:{rows:"));
ok(edge.includes('submitted=Number(attempt?.sent||0)'));
ok(edge.includes("if(!saved.reused)"));
const controller=read("src/app/AppController.js");
ok(controller.includes("prepareDurableMessageAttempt(SecureStore"));
ok(controller.includes("clearDurableMessageAttempt(SecureStore,attempt)"));
ok(controller.includes("miniAppMessageInFlightRef.current.has(activeKey)"));
ok(controller.includes("requestKey:attempt.key"));
ok(controller.includes('"x-busy-request-id": requestKey || busyRequestId'));
ok(controller.includes("includeBusiness:false,requestKey:attempt.key"));
const domain=read("src/domain/miniApps.js");
const screen=read("src/screens/miniApps.js");
ok(domain.includes("reviewMessageDeliveryIntents({"));
ok(screen.includes("V3.185 • Customer notification checks"));
const ci=read("staging/ci-message-delivery-outbox-v3185.sql");
ok(ci.includes("PARTIAL COMMIT"));
ok(ci.includes("V3.185 DURABLE MESSAGE AND DELIVERY INTENT POSTGRES PASS"));
console.log("V3.185 "+assertions+" durable retry, outbox evidence and wiring assertions PASS.");
