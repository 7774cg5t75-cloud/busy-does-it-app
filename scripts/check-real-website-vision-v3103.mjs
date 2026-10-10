import assert from "node:assert/strict";
import {reviewScreenshots,validateScreenshot} from "./lib/websiteVisionReview-v3103.mjs";
const makePng=(w,h)=>{
  const bytes=Buffer.alloc(96);Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes,0);
  bytes.write("IHDR",12,"ascii");bytes.writeUInt32BE(w,16);bytes.writeUInt32BE(h,20);return bytes;
};
const mobile=makePng(390,844),desktop=makePng(1440,900);
const info=validateScreenshot(mobile,"Mobile");assert.equal(info.width,390);
let calls=0,body=null;
const fakeFetch=async(url,options)=>{
 calls++;assert.equal(url,"https://api.openai.com/v1/responses");
 body=JSON.parse(options.body);
 assert.equal(body.store,false);assert.equal(body.max_output_tokens,650);
 assert.equal(body.input[0].content.filter(x=>x.type==="input_image").length,2);
 assert.equal(options.headers.Authorization,"Bearer fake-key");
 return {ok:true,json:async()=>({
  output:[{content:[{type:"output_text",text:JSON.stringify({
   summary:"On mobile the service cards are cramped.",
   proposals:[{path:"theme.cardLayout",value:"rows",reason:"Larger touch targets"},
    {path:"sections[0].body",value:"Fake content",reason:"unsafe"},
    {path:"theme.heroLayout",value:"image-feature",reason:"unapproved image"}]
  })}]}],
  usage:{input_tokens:311,output_tokens:89}
 })};
};
const disabled=await reviewScreenshots({mobile,desktop,apiKey:"fake-key",model:"gpt-4.1-mini",fetchImpl:fakeFetch});
assert.equal(disabled.providerCalls,0);assert.equal(calls,0);
const missing=await reviewScreenshots({enabled:true,ownerApproved:true,mobile,desktop,fetchImpl:fakeFetch});
assert.equal(missing.status,"needs-configuration");assert.equal(calls,0);
const reviewed=await reviewScreenshots({enabled:true,ownerApproved:true,mobile,desktop,
  apiKey:"fake-key",model:"gpt-4.1-mini",fetchImpl:fakeFetch});
assert.equal(calls,1,"Exactly one provider call");
assert.equal(reviewed.status,"completed");
assert.equal(reviewed.report.proposals.length,1);
assert.equal(reviewed.report.proposals[0].path,"theme.cardLayout");
assert.equal(reviewed.usage.inputTokens,311);
assert.equal(reviewed.report.requiresOwnerReview,true);
assert.throws(()=>validateScreenshot(Buffer.from("not png"),"Bad"),/invalid image size|real PNG/);
assert.throws(()=>validateScreenshot(makePng(50,99),"Bad"),/dimensions/);
let forbiddenCalls=0;
await assert.rejects(reviewScreenshots({enabled:true,ownerApproved:true,mobile:Buffer.from("no"),desktop,
  apiKey:"fake-key",model:"gpt-4.1-mini",fetchImpl:async()=>{forbiddenCalls++;}}));
assert.equal(forbiddenCalls,0,"Validate both files before provider call");
console.log("V3.103 PASS: private real-image reviewer interface, explicit opt-in, one model call, structured safety and budget bounds.");
