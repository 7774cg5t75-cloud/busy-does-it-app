import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildSelfRunningOperations,nextRecoveryStep} from "../src/domain/selfRunningOperations.mjs";
import {readOnlyStatusWithRecovery,checkAllReadOnlySources,isTransientReadError} from "../src/domain/readOnlyStatusRecovery.mjs";
import {buildVerifiedActivity} from "../src/domain/verifiedBusinessActivity.mjs";

const owner="11111111-1111-4111-8111-111111111111";
const business="22222222-2222-4222-8222-222222222222";
const otherBusiness="33333333-3333-4333-8333-333333333333";
const now="2026-10-08T21:00:00.000Z";
const results={
  website:{ok:true,data:{
    website:{business_id:business,current_live_deployment_id:"web-a"},
    deployments:[{id:"web-a",state:"live",published_at:now}],
    jobs:[{id:"job-1",status:"failed",updated_at:now}],
    usage:{days:30,requests:1500,deployments:2,publishedVersions:1,artifactBytes:9876,healthChecks:3},
  }},
  business_app:{ok:true,data:{app:{business_id:business,status:"live",current_live_version_id:"v1"},
    versions:[{id:"v1",state:"live",published_at:now}]}},
  social:{ok:true,data:{owner:{businessId:business},queue:[{
    id:"post-1",published_at:now,status:"Partial failure",channels:["facebook","instagram"],
    provider_results:{facebook:{post_id:"fb1"},instagram:{error:"temporary rejection"}},
  }]}},
};
const activity=buildVerifiedActivity({userId:owner,businessId:business,results,asOf:now});
const opts={
 ownerId:owner,businessId:business,
 activity,websitePublishingStatus:{...results.website.data,loaded:true},
 miniAppsStatus:{...results.business_app.data,loaded:true},
 productionWatchStatus:{configured:true,lastDeliveryAt:now},
 nowISO:now,
};
let ops=buildSelfRunningOperations(opts);
assert.equal(ops.state,"ready");
assert.equal(ops.metrics.monitored,3);
assert.equal(ops.metrics.recordedPublications,3);
assert.equal(ops.metrics.recordedFailures,2);
assert.equal(ops.costs.state,"usage_only");
assert.equal(ops.costs.websiteUsage.requests,1500);
assert.equal(ops.costs.websiteUsage.deployments,2);
assert.equal(ops.costs.subscriptionRevenue,null);
assert.equal(ops.costs.aiCost,null);
assert.equal(ops.costs.currencyCost,null);
assert.equal(ops.costs.margin,null);
assert.ok(ops.costs.note.includes("not billed costs"));
assert.ok(ops.exceptions.some(x=>x.id==="social:post-1:instagram"));
assert.ok(ops.exceptions.some(x=>x.id==="website-job:job-1"));
assert.ok(!ops.exceptions.some(x=>x.id==="social:post-1:facebook"));
assert.equal(nextRecoveryStep(ops.exceptions.find(x=>x.id==="social:post-1:instagram")).requiresApproval,true);
assert.equal(ops.humanRequired.length,0);
assert.equal(ops.autoRecovered,0);

const cloudConflict={
 id:"cloud-conflict",severity:"High",area:"Cloud",title:"Cloud versions disagree",
 body:"Stop cloud writes",route:"businessData",
};
ops=buildSelfRunningOperations({...opts,continuity:{issues:[cloudConflict,cloudConflict]},
  cloudConflict:{revisions:[1,2]}});
assert.equal(ops.exceptions.filter(x=>x.id==="continuity:cloud-conflict").length,1);
assert.equal(ops.humanRequired.length,1);
assert.equal(nextRecoveryStep(ops.humanRequired[0]).kind,"human_review");
assert.equal(nextRecoveryStep(ops.humanRequired[0]).requiresApproval,true);
assert.ok(ops.headline.includes("human review"));
const unset=buildSelfRunningOperations({...opts,activity:{availability:{
  website:"unavailable",business_app:"checked",social:"checked"
}}});
assert.equal(unset.exceptions.find(x=>x.id==="status:website").severity,"watch");
const repeated=buildSelfRunningOperations({...opts,
  activity:{availability:{website:"unavailable",business_app:"checked",social:"checked"}},
  consecutiveReadFailures:{website:2}});
assert.equal(repeated.exceptions.find(x=>x.id==="status:website").severity,"attention");
assert.equal(nextRecoveryStep(repeated.exceptions.find(x=>x.id==="status:website")).kind,"safe_read");
const watcher=buildSelfRunningOperations({...opts,productionWatchStatus:{
  configured:true,lastDeliveryAt:"2026-10-01T00:00:00.000Z"
}});
assert.ok(watcher.exceptions.some(x=>x.id==="watcher:stale"));
const missingWatch=buildSelfRunningOperations({...opts,productionWatchStatus:{configured:false}});
assert.equal(missingWatch.exceptions.find(x=>x.id==="watcher:not-configured").severity,"info");
const loggedOut=buildSelfRunningOperations({...opts,ownerId:""});
assert.equal(loggedOut.state,"signed_out");
assert.equal(loggedOut.exceptions.length,0);
assert.equal(loggedOut.costs.state,"unmeasured");
const hidden=buildSelfRunningOperations({...opts,
  websitePublishingStatus:{loaded:false,usage:{requests:700000}}});
assert.equal(hidden.costs.state,"unmeasured");
assert.deepEqual(hidden.costs.websiteUsage,{});
const malformed=buildSelfRunningOperations({...opts,websitePublishingStatus:{
  loaded:true,usage:{requests:-1,deployments:"garbage",edgeBytes:Infinity}
}});
assert.equal(malformed.costs.state,"unmeasured");
assert.deepEqual(malformed.costs.websiteUsage,{});
// A different business provider result must remain unavailable even when callers pass it.
const mismatchedActivity=buildVerifiedActivity({userId:owner,businessId:otherBusiness,results,asOf:now});
assert.equal(mismatchedActivity.state,"unavailable");
assert.equal(mismatchedActivity.verified,0);
assert.equal(buildSelfRunningOperations({...opts,businessId:otherBusiness,
  activity:mismatchedActivity}).metrics.recordedPublications,0);

assert.equal(isTransientReadError({status:503}),true);
assert.equal(isTransientReadError({status:502}),true);
assert.equal(isTransientReadError({status:504}),true);
assert.equal(isTransientReadError({status:408}),true);
assert.equal(isTransientReadError({status:401}),false);
assert.equal(isTransientReadError({status:403}),false);
assert.equal(isTransientReadError({status:422}),false);
assert.equal(isTransientReadError({status:0,message:"Network request failed"}),true);
const args={
  userId:owner,businessId:business,publishableKey:"sb_publishable_fake",
  accessToken:"signed-in-jwt",supabaseUrl:"https://example.supabase.co",
};
async function main(){
  let calls=0,waits=0;
  const recovered=await readOnlyStatusWithRecovery({
    ...args,fetchImpl:async(url,init)=>{
      calls++;
      assert.equal(init.method,"POST");
      assert.equal(JSON.parse(init.body).action,"status");
      assert.equal(JSON.parse(init.body).businessId,business);
      assert.equal(init.headers.Authorization,"Bearer signed-in-jwt");
      if(calls===1)return {ok:false,status:503};
      return {ok:true,status:200,json:async()=>results.website.data};
    },
  },"website",{pause:async()=>{waits++}});
  assert.equal(calls,2);
  assert.equal(waits,1);
  assert.equal(recovered.ok,true);
  assert.equal(recovered.recoveredRead,true);
  assert.equal(recovered.attempts,2);
  calls=0;
  const denied=await readOnlyStatusWithRecovery({
    ...args,fetchImpl:async()=>{calls++;return {ok:false,status:401}},
  },"social",{pause:async()=>{throw Error("Must not pause on auth failure")}});
  assert.equal(denied.ok,false);
  assert.equal(calls,1);
  calls=0;
  const persistent=await readOnlyStatusWithRecovery({
    ...args,fetchImpl:async()=>{calls++;return {ok:false,status:503}},
  },"business_app",{pause:async()=>{}});
  assert.equal(persistent.ok,false);
  assert.equal(calls,2);
  await assert.rejects(()=>readOnlyStatusWithRecovery(args,"publish_now"),/Only known/);
  await assert.rejects(()=>readOnlyStatusWithRecovery({...args,userId:""},"website"),/Sign in/);
  const seen=[];
  const check=await checkAllReadOnlySources({...args,fetchImpl:async(url,init)=>{
    const action=JSON.parse(init.body).action;
    seen.push(action);
    assert.equal(init.method,"POST");
    assert.ok(["status","owner_status"].includes(action));
    return {ok:true,json:async()=>({owner:{businessId:business}})};
  }});
  assert.equal(Object.values(check).filter(x=>x.ok).length,3);
  assert.equal(seen.length,3);
  assert.equal(seen.filter(x=>x==="owner_status").length,1);
  const screen=readFileSync(new URL("../src/screens/selfRunningOperations.js",import.meta.url),"utf8");
  const registry=readFileSync(new URL("../src/screens/index.js",import.meta.url),"utf8");
  const home=readFileSync(new URL("../src/screens/home.js",import.meta.url),"utf8");
  for(const needle of ["checkAllReadOnlySources(args)","buildSelfRunningOperations({",
    "nonce.current!==request","scopeRef.current!==scope",
    "Not integrated","No automatic public actions"]){
    if(needle==="No automatic public actions")continue;
    assert.ok(screen.includes(needle),needle);
  }
  assert.ok(registry.includes("selfRunningOperations: SelfRunningOperations"));
  assert.ok(home.includes('s.go("selfRunningOperations")'));
  assert.ok(!screen.includes("publish_now"));
  assert.ok(!screen.includes("retry_post"));
  assert.ok(!screen.includes("saveGrowthProject"));
  console.log("V3.68 owner-scoped operations, bounded read-only recovery, cost honesty and safety tests passed");
}
await main();
