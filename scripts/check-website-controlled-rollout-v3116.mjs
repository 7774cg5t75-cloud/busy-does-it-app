import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {checkScreenshotProof} from "../supabase/functions/busy-website-design-review/screenshotProof.mjs";
import {websiteLearningReadiness} from "../src/core/websiteLearningReadiness.mjs";
import {founderProviderReview} from "../src/core/founderProviderReview.mjs";
import {websiteDomainSwitchSafety} from "../src/core/websiteDomainSwitchSafety.mjs";
import {validateDesignFeedback,designPreferenceSummary} from "../supabase/functions/busy-website-publish/designFeedback.mjs";
let n=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++;};const ok=(v,m)=>{assert.ok(v,m);n++;};
const dep="11111111-2222-4333-8444-555555555555";
const png=(w,h)=>{const b=Buffer.alloc(96);Buffer.from([137,80,78,71,13,10,26,10]).copy(b,0);
 b.write("IHDR",12,"ascii");b.writeUInt32BE(w,16);b.writeUInt32BE(h,20);return b;};
const viewport={width:390,height:844};
const headers=new Headers({"Content-Type":"image/png","Cache-Control":"private,no-store",
 "X-Busy-Deployment":dep,"X-Busy-Viewport":"390x844"});
const proof=(bytes=png(390,844),meta=headers,deploymentId=dep,screen=viewport)=>
 checkScreenshotProof({bytes,headers:meta,deploymentId,viewport:screen});
eq(proof().valid,true,"Correct private mobile screenshot tied to hosted deployment");
eq(proof(png(390,1210)).valid,true,"Full-length mobile page accepted");
eq(proof(png(390,843)).valid,false,"Too-short first viewport rejected");
eq(proof(png(1440,844)).valid,false,"Wrong width cannot masquerade as mobile");
eq(proof(Buffer.from("not png")).valid,false,"Incorrect bytes rejected");
eq(proof(Buffer.alloc(2100001)).valid,false,"Oversized screenshot rejected");
eq(proof(png(390,844),new Headers({...Object.fromEntries(headers),
 "x-busy-deployment":"different"})).valid,false,"Deployment provenance mismatch rejected");
const wrongDep=new Headers({"content-type":"image/png","cache-control":"no-store",
"x-busy-deployment":"99999999-2222-4333-8444-555555555555","x-busy-viewport":"390x844"});
eq(proof(png(390,844),wrongDep).valid,false,"Cannot reuse screenshot for other deployment");
eq(proof(png(390,844),new Headers({"content-type":"image/png",
 "cache-control":"no-store","x-busy-deployment":dep,"x-busy-viewport":"1440x900"})).valid,false,
 "Cannot relabel mobile capture as desktop");
eq(proof(png(390,844),new Headers({"content-type":"text/html",
 "cache-control":"no-store","x-busy-deployment":dep,"x-busy-viewport":"390x844"})).valid,false,
 "Requires PNG response MIME");
eq(proof(png(390,844),new Headers({"content-type":"image/png",
 "x-busy-deployment":dep,"x-busy-viewport":"390x844"})).valid,false,
 "Private images must not be cached");
eq(proof(png(390,844),headers,dep,{width:400,height:844}).valid,false,
 "Unsupported viewport rejected");
const source=readFileSync(new URL("../supabase/functions/busy-website-design-review/index.ts",import.meta.url),"utf8");
const worker=readFileSync(new URL("../cloudflare/busy-website-screenshot/worker.js",import.meta.url),"utf8");
ok(source.includes("checkScreenshotProof({")&&source.includes("headers:render.headers"),
 "AI review validates provenance before sending images to any model");
ok(worker.includes('"X-Busy-Deployment":deployment')&&
 worker.includes('"X-Busy-Viewport":width+"x"+height'),"Trusted screenshot service writes matching audit markers");
ok(source.includes('body.ownerConsent!==true')&&source.includes("busy_reserve_website_visual_ai_call"),
 "AI review is consented and metered, not automatically billable");
const readiness=websiteLearningReadiness();
eq(readiness.status,"blocked","No real-world canary permission assumed");
eq(readiness.missing.length,7,"Every privacy and rollback condition is initially missing");
eq(readiness.mayDeployAutomatically,false,"Never automatically execute migrations");
eq(readiness.mayEnableCrossBusinessLearning,false,"No cross-tenant learning");
const evidence={schemaConfirmed:true,tenantIsolationTested:true,authAndReplayTested:true,
 deletionProcessReviewed:true,retentionAndNoticeApproved:true,canaryOwnerApproved:true,
 rollbackVerified:true};
const reviewed=websiteLearningReadiness(evidence);
eq(reviewed.status,"reviewed-for-manual-deployment","Complete checklist is review only");
eq(reviewed.mayDeployAutomatically,false,"Approval alone cannot mutate production");
eq(websiteLearningReadiness({...evidence,deletionProcessReviewed:false}).status,"blocked",
 "Deletion must be verified before rollout");
eq(websiteLearningReadiness({...evidence,canaryOwnerApproved:false}).status,"blocked",
 "Founder sign-off not assumed");
const request={action:"design_feedback_record",businessId:"91edb6db-3a02-4de4-9ba8-5c93b4e790a1",
 family:"organic",choice:"liked",draftVersion:"1",requestKey:"design-20261010-a-b-c-d-123456"};
eq(validateDesignFeedback(request).ok,true,"Actual feedback remains a minimal explicit preference");
const preference=designPreferenceSummary([
 {design_family:"organic",preference:"rejected"},
 {design_family:"organic",preference:"liked"},
 {design_family:"minimal",preference:"liked"},
 {design_family:"minimal",preference:"rejected"}
]);
eq(preference.likedFamilies,["minimal"],"Most recent accepted likes win");
eq(preference.rejectedFamilies,["organic"],"Most recent rejection overrides old like");
eq(preference.globalLearningEnabled,false,"Still only this business");
const feedbackServer=readFileSync(new URL("../supabase/functions/busy-website-publish/index.ts",import.meta.url),"utf8");
ok(feedbackServer.includes("previous.data.created_by!==user.id")&&
 feedbackServer.includes("previous.data.design_family!==checked.record.design_family")&&
 feedbackServer.includes("previous.data.preference!==checked.record.preference"),
 "Idempotency reuse with a changed request, family or user is rejected");
const nothing=websiteDomainSwitchSafety();
eq(nothing.readyToRecommend,false,"No saved domain does not mean ready");
eq(nothing.willSwitchAutomatically,false,"Safe transition never changes DNS");
eq(nothing.willBuyOrTransferDomain,false,"Domain switching is not purchasing");
const previous={hostname:"shop.busydoesit.co.uk",live:true};
const target={hostname:"shop.co.uk"};
const p={defaultAddressState:{address:previous},domainState:{latest:target,
 journey:{complete:true}},canOpenCustomDomain:true,
 liveDeployment:{id:"live-a"},verifiedDeploymentId:"live-a"};
eq(websiteDomainSwitchSafety(p).readyToRecommend,true,"Proofs exist for fallback, destination, exact live deployment");
eq(websiteDomainSwitchSafety({...p,verifiedDeploymentId:"old"}).readyToRecommend,false,
 "Stale health proof cannot approve a domain switch");
eq(websiteDomainSwitchSafety({...p,defaultAddressState:{address:{...previous,live:false}}}).readyToRecommend,
 false,"Original BUSY address must remain available");
eq(websiteDomainSwitchSafety({...p,canOpenCustomDomain:false}).readyToRecommend,false,
 "Domain ownership without reachable website is not enough");
const review=founderProviderReview({scope:"founder_service_register",privacy:"founder_only",
 services:[{key:"github",name:"GitHub",latest:{source:"provider_api_readonly"},freshness:"within_24h"},
 {key:"cloudflare",name:"Cloudflare",latest:{source:"verified_log_sample"},freshness:"historical"},
 {key:"ai",name:"AI provider",latest:null,freshness:"not_measured"}]});
eq(review.status,"available","Only trusted private founder inventory accepted");
eq(review.items[0].key,"ai","Unmeasured AI provider should be flagged first");
eq(review.items.every(x=>x.invoiceVerified===false),true,"Supplier observations never become invoices");
eq(review.autonomousCharges,false,"No automatic subscription upgrades or payments");
eq(founderProviderReview().status,"unavailable","Missing founder report never described as zero costs");
const founderScreen=readFileSync(new URL("../src/screens/founderServiceCosts.js",import.meta.url),"utf8");
ok(founderScreen.includes('title="What needs checking"'),"Actual founder screen exposes next verification tasks");
const domainScreen=readFileSync(new URL("../src/screens/websitePublishing.js",import.meta.url),"utf8");
ok(domainScreen.includes("websiteDomainSwitchSafety(view)"),"Customer sees safe-domain handoff notice");
ok(readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8")
 .includes("check-website-controlled-rollout-v3116.mjs"),"Regression suite runs in production foundation");
console.log("V3.116 PASS: "+n+" screenshot provenance, private learning, domain fallback and founder QA assertions.");
