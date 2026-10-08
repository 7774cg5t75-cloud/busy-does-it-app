import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildVerifiedActivity,resultBrief} from "../src/domain/verifiedBusinessActivity.mjs";
import {readOne,loadVerifiedActivity} from "../src/domain/verifiedBusinessActivityCloud.mjs";
import {isBusinessActivityQuestion} from "../src/domain/businessActivityQuestions.mjs";

const owner="11111111-1111-4111-8111-111111111111";
const business="22222222-2222-4222-8222-222222222222";
const other="33333333-3333-4333-8333-333333333333";
const published="2026-10-08T18:00:00Z";
const response={
 website:{ok:true,data:{website:{business_id:business,current_live_deployment_id:"deploy-1"},
    deployments:[{id:"deploy-1",state:"live",published_at:published},
      {id:"deploy-2",state:"preview_ready",created_at:published}],
    jobs:[{id:"job-1",status:"failed",action:"publish",updated_at:published}]}},
 business_app:{ok:true,data:{app:{business_id:business,id:"app-1",status:"live",current_live_version_id:"v-1"},
    versions:[{id:"v-1",state:"live",published_at:published},
      {id:"v-2",state:"preview_ready",created_at:published}]}},
 social:{ok:true,data:{owner:{businessId:business},queue:[{
    id:"post-1",channels:["facebook","instagram","google_business"],published_at:published,
    updated_at:published,status:"Partial failure",
    provider_results:{
      facebook:{post_id:"fb-123"},
      instagram:{error:"Temporarily unavailable"},
      google_business:{}, // intentionally unverified
    },
  },{id:"post-2",channels:["facebook"],status:"Scheduled",scheduled_for:published}]}}
};
const build=(results=response,options={})=>buildVerifiedActivity({
 businessId:business,userId:owner,results,asOf:published,...options,
});
const view=build();
assert.equal(view.state,"checked");
assert.equal(view.verified,3); // website deployment, app version, FB channel
assert.equal(view.failed,2); // website job and IG channel
assert.equal(view.channels.length,4);
assert.equal(view.channels.find(x=>x.channel==="facebook"&&x.postId==="post-1").status,"provider_recorded");
assert.equal(view.channels.find(x=>x.channel==="instagram").status,"failed");
assert.equal(view.channels.find(x=>x.channel==="instagram").retryEligible,true);
assert.equal(view.channels.find(x=>x.channel==="facebook").retryEligible,false);
assert.equal(view.channels.find(x=>x.channel==="google_business").status,"unverified");
assert.equal(view.events.filter(x=>x.kind==="scheduled").length,1);
assert.ok(view.events.every(x=>x.scope===business && !x.verifiedPublicReachability && !x.associatedGrowthProject));
assert.ok(resultBrief(view).includes("business-wide"));
assert.ok(resultBrief(view).includes("independently checked"));
assert.equal(view.crossServiceAttribution,false);
const restricted=build({
 ...response,
 website:{ok:false,error:"network"},
 business_app:{ok:false,error:"auth"},
});
assert.equal(restricted.state,"partial");
assert.equal(restricted.verified,1);
assert.ok(resultBrief(restricted).includes("Could not check"));
assert.equal(build({website:{ok:false},business_app:{ok:false},social:{ok:false}}).state,"unavailable");
assert.equal(build(response,{businessId:""}).state,"signed_out");
assert.equal(build(response,{userId:""}).state,"signed_out");
// Cross-business data must be treated as unavailable, never silently merged.
const wrong=build({
 ...response,website:{...response.website,data:{...response.website.data,
 website:{business_id:other,current_live_deployment_id:"deploy-1"}}},
 business_app:{...response.business_app,data:{...response.business_app.data,
 app:{business_id:other,status:"live",current_live_version_id:"v-1"}}},
 social:{...response.social,data:{...response.social.data,owner:{businessId:other}}},
});
assert.equal(wrong.state,"unavailable");
assert.equal(wrong.events.length,0);
assert.equal(wrong.verified,0);
// Live record without an exact matching, dated active hosting record is unverified.
const noProof=build({...response,
  website:{...response.website,data:{...response.website.data,
    deployments:[{id:"deploy-1",state:"preview_ready",published_at:published}]}},
  business_app:{...response.business_app,data:{...response.business_app.data,
    versions:[{id:"v-1",state:"preview_ready"}]}},
  social:{...response.social,data:{...response.social.data,
    queue:[{id:"post-1",status:"Published",channels:["facebook"],published_at:published,provider_results:{facebook:{}}}]}}
});
assert.equal(noProof.verified,0);
assert.ok(noProof.events.some(x=>x.kind==="unverified"));
assert.equal(noProof.channels[0].retryEligible,false);
// No provider ID or published timestamp => no social provider confirmation.
const statusAlone=build({social:{ok:true,data:{owner:{businessId:business},queue:[{
  id:"x",status:"Published",channels:["facebook"],provider_results:{facebook:{ok:true}}
}]}}});
assert.equal(statusAlone.verified,0);
assert.equal(statusAlone.channels[0].status,"unverified");
assert.equal(build({social:{ok:true,data:{owner:{businessId:business},queue:[
  {id:"x",status:"Published",channels:["facebook"],published_at:published,
    provider_results:{facebook:{post_id:"fb-1"}}},
  {id:"x",status:"Published",channels:["facebook"],published_at:published,
    provider_results:{facebook:{post_id:"fb-1"}}},
]}}}).events.length,2); // individual source records; no dedup write/side effects

const args={
 businessId:business,userId:owner,accessToken:"user-jwt",publishableKey:"sb_publishable_example",
 supabaseUrl:"https://sample.supabase.co",
};
async function main(){
 const calls=[];
 const routes={
  "busy-website-publish":response.website.data,
  "busy-mini-apps":{status:response.business_app.data},
  "busy-social-publish":response.social.data,
 };
 const fetchImpl=async (url,init)=>{
   const key=Object.keys(routes).find(x=>url.endsWith(x));
   assert.ok(key,url);
   assert.equal(init.method,"POST");
   assert.equal(init.headers.Authorization,"Bearer user-jwt");
   assert.equal(init.headers.apikey,"sb_publishable_example");
   const body=JSON.parse(init.body);
   assert.equal(body.businessId,business);
   assert.equal(body.action,key==="busy-mini-apps"?"owner_status":"status");
   assert.equal(Object.keys(body).sort().join(","),"action,businessId");
   calls.push(key);
   return {ok:true,json:async()=>routes[key]};
 };
 const loaded=await loadVerifiedActivity({...args,fetchImpl});
 assert.equal(Object.values(loaded).filter(x=>x.ok).length,3);
 assert.equal(calls.length,3);
 const partial=await loadVerifiedActivity({...args,fetchImpl:async(url,init)=>{
   if(url.endsWith("busy-social-publish"))throw Error("offline");
   return fetchImpl(url,init);
 }});
 assert.equal(partial.social.ok,false);
 assert.equal(partial.website.ok,true);
 const mismatch=await loadVerifiedActivity({...args,fetchImpl:async(url)=>{
   return {ok:true,json:async()=>({businessId:other})};
 }});
 assert.ok(Object.values(mismatch).every(x=>!x.ok));
 await assert.rejects(()=>loadVerifiedActivity({...args,userId:""},{}),/Sign in/);
 await assert.rejects(()=>loadVerifiedActivity({...args,businessId:"not-uuid"},{}),/Sign in/);
 const questions=[
  "Did everything go live for my new carpet cleaning service?",
  "Has my website published?",
  "Which Instagram posts failed?",
  "What publishing results were recorded?",
  "Check whether the business app is live",
 ];
 for(const q of questions)assert.equal(isBusinessActivityQuestion(q),true,q);
 for(const q of ["Publish Facebook now","Post this for me","Schedule that now",
   "Delete the Instagram post","Book my customer for tomorrow",
   "Where are we with carpet cleaning?"]){
   assert.equal(isBusinessActivityQuestion(q),false,q);
 }
 const screen=readFileSync(new URL("../src/screens/businessActivityCentre.js",import.meta.url),"utf8");
 const routes=readFileSync(new URL("../src/screens/index.js",import.meta.url),"utf8");
 const home=readFileSync(new URL("../src/screens/home.js",import.meta.url),"utf8");
 const command=readFileSync(new URL("../src/app/AppController.js",import.meta.url),"utf8");
 const cloud=readFileSync(new URL("../src/domain/verifiedBusinessActivityCloud.mjs",import.meta.url),"utf8");
 for(const fragment of ['businessActivityCentre: BusinessActivityCentre','BusinessActivityCentreScreens'])assert.ok(routes.includes(fragment));
 assert.ok(home.includes('s.go("businessActivityCentre")'));
 assert.ok(screen.includes("loadVerifiedActivity(args)"));
 assert.ok(screen.includes("No automatic retry"));
 assert.ok(command.includes("tryBusinessActivityOperator(cleanText,growthNonce)"));
 assert.ok(command.includes("tryBusinessActivityOperator(result.transcript,growthNonce)"));
 assert.ok(cloud.includes('action:p.action'));
 assert.ok(!cloud.includes('retry_post'));
 assert.ok(!cloud.includes('publish_now'));
 assert.ok(!screen.includes('publishSocial('));
 console.log("V3.67 source-verified activity, mismatch isolation, no-false-success and Operator checks passed");
}
await main();
