/**
 * V3.240 major-sweep structural health gate (read-only).
 * Not a vulnerability audit, hosted API test or proof of mobile-device QA.
 */
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {resolve} from "node:path";
const read=p=>readFileSync(resolve(p),"utf8");
const paths=[
 "src/core/appGoalDesignReviewV3240.mjs",
 "src/core/websiteCurrentCandidateV3240.mjs",
 "src/screens/miniApps.js",
 "src/screens/websiteBuilder.js",
 "scripts/check-builder-intelligence-v3240.mjs"
];
let checks=0;
const check=(v,message)=>{assert.ok(v,message);checks++};
for(const path of paths){
 const content=read(path);
 check(content.length>200&&content.length<400000,"Bounded source: "+path);
 check(!content.includes("eval(")&&!content.includes("new Function(")&&
   !content.includes("api.openai.com"),
  "No new untrusted execution or direct paid provider: "+path);
 check(!content.includes("publishWebsiteAutomatically(")&&
   !content.includes("forcePublishMiniApp("),
  "No automatic public release: "+path);
}
const app=read(paths[0]),web=read(paths[1]);
const mini=read(paths[2]),site=read(paths[3]);
for(const name of ["evaluateResponsiveApp","recommendResponsiveDesign",
 "taskReadiness","prepareAppVisualBatch","buildBusinessBrandDnaSnapshot",
 "enabledAppKeys"]){
 check(app.includes(name),"Reuse established app/brand intelligence: "+name);
}
for(const t of ["app?.business_id!==businessId","app.draft_revision",
 "ownerApprovalRequired:true","mayPublish:false","realDeviceVerified:false",
 "noNativeScreenshots:true","noCrossBusinessLearning:true"]){
 check(app.includes(t),"Keep app decision guards: "+t);
}
for(const t of ["reviewPrivateWebsiteCandidateWidthsV3239",
 "compareWebsiteVisualReports","baseGeneration","mayPublish:false",
 "safeForPrivateApproval","screenshotEvidence:false"]){
 check(web.includes(t),"Keep existing website evidence guard: "+t);
}
check(mini.includes("Why does Busy choose different layouts?"),
 "Use existing disclosure instead of another builder screen");
check(site.includes("s.applyWebsiteLayoutAction(designCandidate.operation,"),
 "Original owner-approval/apply path remains the authority");
check(site.includes("setPrivateWidthEvidence(null)"),
 "Reset state when preview identity changes");
const workflow=read(".github/workflows/builders-major-v3240.yml");
for(const t of ["check-builder-intelligence-v3240.mjs",
 "audit-builder-changes-v3240.mjs",
 "check-private-responsive-review-v3239.mjs",
 "check-builder-visual-receipt-v3238.mjs",
 "check-builder-design-evidence-v3237.mjs",
 "check-production.mjs",
 "offline-real-browser-visual-compare",
 "disposable-durable-booking-close",
 "disposable-staging-core-rollback"]){
 check(workflow.includes(t),"Inherited validation: "+t);
}
const arch=read("ARCHITECTURE.md");
check(arch.includes("## V3.240 — contextual App Builder design intelligence"),
 "Master must document new scope.");
const migrations=readdirSync(resolve("supabase/migrations"))
 .filter(x=>x.endsWith(".sql"));
check(migrations.length>=69,"No migration history accidentally removed");
const newSource=[app,web];
for(const [i,source] of newSource.entries()){
 check(!source.includes("AsyncStorage"),"No new local data ledger "+i);
 check(!source.includes("fetch("),"New intelligence does not call providers "+i);
}
console.log("V3.240 ARCHITECTURE/HEALTH: "+checks+
 " source-only checks passed; "+migrations.length+
 " migrations present. Not real device/provider/security certification.");
