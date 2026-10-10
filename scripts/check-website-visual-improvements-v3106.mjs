import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {applyApprovedVisualProposals,normalizeVisualCritique} from "../supabase/functions/busy-website-worker/visualCriticContract.mjs";
import {hasMeasuredAudits,runWebsiteDesignReviewCycle,changesAreDesignOnly} from "../supabase/functions/busy-website-worker/websiteReviewCycle.mjs";

let checks=0;
const equal=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++};
const yes=(actual,message)=>{assert.ok(actual,message);checks++};
const draft={id:"private-test",businessId:"tenant-a",tenantId:"tenant-a",generation:4,
 updatedAt:"2026-10-10T15:00:00Z",businessName:"Example Garden Care",
 sections:[{id:"hero",title:"Locally grown",body:"Provided by owner"}],
 contact:{phone:"01234 555 444"},seo:{title:"Garden care"},
 gallery:[{storagePath:"tenant-a/approved.png",approved:true}],
 theme:{heroLayout:"type-left",navStyle:"quiet",spacing:"comfortable"},
 html:"<html>old</html>",designPlan:{signals:{approvedPhotos:0}},
 publish:{enabled:false},ownerId:"owner-a"};
const measure=(overflow=0,navigationFits=true)=>({
 horizontalOverflowPixels:overflow,headingVisible:true,navigationFits,heroHeadingFontPx:35
});
const snap=(mobile,desktop=measure())=>({
 mobile:new Uint8Array([1,2,3]),desktop:new Uint8Array([4,5,6]),
 mobileAudit:mobile,desktopAudit:desktop,source:"private-test-browser"
});
const first=snap(measure(27));
const fixed=snap(measure(0));
const regressed=snap(measure(0,false)); // Equal number of faults, different problem.
const photoMismatch=normalizeVisualCritique({reviewedScreenshots:true,proposals:[
 {path:"theme.heroLayout",value:"image-left",reason:"Make up a photo"}]},{approvedPhotos:1});
equal(applyApprovedVisualProposals(draft,photoMismatch,{ownerApproved:true}).applied,false,
 "A forged image-layout recommendation cannot override the draft's approved-photo evidence");
const noopReport=normalizeVisualCritique({reviewedScreenshots:true,proposals:[
 {path:"theme.navStyle",value:"quiet"}]});
equal(applyApprovedVisualProposals(draft,noopReport,{ownerApproved:true}).applied,false,
 "An unchanged design token is not an improvement");
const report=normalizeVisualCritique({reviewedScreenshots:true,proposals:[
 {path:"theme.spacing",value:"generous",reason:"Give the cards more room"}]});
const original=JSON.stringify(draft);
const core={draft,tenantId:"tenant-a",allowedTenantId:"tenant-a",consent:true,
 allowPaidReview:true,ownerApprovedSuggestions:true,
 creditReservation:{reservationId:"reservation-1",tenantId:"tenant-a",status:"reserved",maxCalls:1},
 visionReview:async()=>({status:"completed",source:"screenshot-ai",providerCalls:1,report}),
 rebuildPrivateDraft:async(d)=>({...d,html:"<html>new private candidate</html>",
    generation:d.generation+1,designPlan:{...d.designPlan}})};
const run=async(after,before=first)=>runWebsiteDesignReviewCycle({...core,
 captureScreenshots:async(d,options)=>options.stage==="original"?before:after});
const improved=await run(fixed);
equal(improved.status,"candidate-ready","Safer candidate is ready only after measured recheck");
equal(improved.comparison.improved,true,"Evidence shows fewer measured problems");
equal(improved.comparison.newProblems,[],"No new measured problems");
equal(improved.published,false,"Never published automatically");
equal(JSON.stringify(draft),original,"Original customer draft remains untouched");
const rejected=await run(regressed);
equal(rejected.status,"candidate-rejected","Equal-count regression must not pass");
equal(rejected.comparison.noNewMeasuredProblems,false,"New navigation problem is recognised");
yes(!("candidate" in rejected),"Regression is not returned as a ready candidate");
equal(JSON.stringify(draft),original,"Regressed candidate cannot overwrite original");
const same=await run(first);
equal(same.status,"candidate-ready","Equal measured issues with no new faults isn't falsely rejected");
equal(same.comparison.improved,false,"No false measured improvement claim");
const incomplete=await run(snap({horizontalOverflowPixels:0,headingVisible:true,navigationFits:true}));
equal(incomplete.status,"candidate-audit-unavailable","Incomplete candidate measurements fail closed");
let paidCalls=0;
const unaudited=await runWebsiteDesignReviewCycle({...core,
 captureScreenshots:async()=>snap({horizontalOverflowPixels:0,headingVisible:true,navigationFits:true}),
 visionReview:async()=>{paidCalls++;return {status:"completed",source:"screenshot-ai",providerCalls:1,report}}});
equal(unaudited.status,"measurement-unavailable","Do not spend credit when original measurements missing");
equal(paidCalls,0,"No model call before confirmed layout evidence");
yes(!hasMeasuredAudits(snap({horizontalOverflowPixels:NaN,headingVisible:true,navigationFits:true,heroHeadingFontPx:34})),
 "Invalid measurements do not count as real evidence");
yes(!changesAreDesignOnly(draft,{...draft,ownerId:"other-owner"}),"Owner immutability enforced");
yes(!changesAreDesignOnly(draft,{...draft,contact:{phone:"tampered"}}),"Contact immutability enforced");
yes(!changesAreDesignOnly(draft,{...draft,tenantId:"other-tenant"}),"Tenant immutability enforced");
const worker=readFileSync(new URL("../supabase/functions/busy-website-worker/visualCriticContract.mjs",import.meta.url),"utf8");
const api=readFileSync(new URL("../supabase/functions/busy-website-design-review/visualCriticContract.mjs",import.meta.url),"utf8");
equal(api,worker,"Deployed backend and website worker must use identical photo/approval restrictions");
console.log("V3.106 PASS: "+checks+" safer measurable website-design improvements, denied regressions, immutable owner facts and zero unsolicited AI calls.");
