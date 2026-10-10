import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildWebsiteLaunchProof} from "../src/core/websiteLaunchProof.mjs";

// The journey is an Expo-bundled .js module with no Node package type. Keep
// this test isolated from the RN runtime, matching the existing V3.77 gate.
const source=readFileSync(new URL("../src/core/websiteLaunchJourney.js",import.meta.url),"utf8");
const {buildWebsiteLaunchJourney}=await import("data:text/javascript,"+encodeURIComponent(source));
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const now=new Date().toISOString();
const past=new Date(Date.now()-49*3600*1000).toISOString();
const id="22222222-2222-4222-8222-222222222222";
const brand={websiteReady:true,completeness:{coreMissing:[]}};
const draft={businessName:"Demo Workshop",generation:1};
const base={
 websiteDraftPresent:true,
 healthStatus:"healthy",
 website:{
  current_live_deployment_id:id,
  default_hostname:"demo.busydoesit.co.uk",
  default_url:"https://demo.busydoesit.co.uk",
  health_status:"healthy",
  delivery_status:"active",
  last_healthy_at:now,
  last_health_check_at:now,
  last_observed_deployment_id:id
 },
 previewDeployment:{id:"preview-1",state:"preview_ready",content_hash:"a".repeat(64),
   preview_storage_path:"preview/index.html"},
 liveDeployment:{id,published_at:now,public_storage_path:"public/index.html"},
 providerState:{activationReady:true},
 defaultDomainHealth:{
  status:"healthy",
  expected_deployment_id:id,
  observed_deployment_id:id,
  checked_url:"https://demo.busydoesit.co.uk",
  checked_at:now
 }
};
let assertions=0;
function check(name, view, shouldVerify){
 const proof=buildWebsiteLaunchProof(view);
 const journey=buildWebsiteLaunchJourney({brand,draft,publishing:view,deliveryProof:proof});
 assert.equal(proof.verified,shouldVerify,name+": strict proof");
 assert.equal(journey.isVerified,shouldVerify,name+": journey agrees");
 assert.equal(journey.isPublic,shouldVerify,name+": public availability");
 assert.equal(journey.canClaimPublished,shouldVerify,name+": public claim");
 assert.equal(journey.stages.at(-1).state,shouldVerify?"complete":"ready",name+": stage");
 assert.equal(journey.publishedRecordExists,true,name+": deployment record kept");
 assert.equal(journey.currentStatus,shouldVerify?"live_verified":"live_unverified",name+": status");
 assert.equal(journey.nextAction,shouldVerify?"maintain":"verify",name+": next action");
 assertions+=8;
}
check("fully evidenced live website",base,true);
check("stale public-domain check",{...base,defaultDomainHealth:{...base.defaultDomainHealth,checked_at:past}},false);
check("stale live health",{...base,website:{...base.website,last_health_check_at:past,last_healthy_at:past}},false);
check("wrong deployment served",{...base,defaultDomainHealth:{...base.defaultDomainHealth,observed_deployment_id:"old"}},false);
check("old health observation",{...base,website:{...base.website,last_observed_deployment_id:"old"}},false);
check("domain not activated",{...base,providerState:{activationReady:false}},false);
check("HTTPS not proven",{...base,defaultDomainHealth:{...base.defaultDomainHealth,checked_url:"http://demo.busydoesit.co.uk"}},false);
check("wrong BUSY hostname",{...base,website:{...base.website,default_hostname:"other.busydoesit.co.uk"}},false);
check("unapproved live artifact",{...base,liveDeployment:{...base.liveDeployment,published_at:null}},false);
check("unhealthy route",{...base,website:{...base.website,health_status:"degraded"}},false);
check("unhealthy HTTPS address",{...base,defaultDomainHealth:{...base.defaultDomainHealth,status:"failed"}},false);
check("wrong website live version",{...base,website:{...base.website,current_live_deployment_id:"other"}},false);
const noProof=buildWebsiteLaunchJourney({brand,draft,publishing:base});
assert.equal(noProof.isVerified,false);
assert.equal(noProof.isPublic,false);
assert.equal(noProof.nextAction,"verify");
assert.equal(buildWebsiteLaunchJourney({brand,draft,publishing:{
 ...base,liveDeployment:null
},deliveryProof:{verified:true}}).isVerified,false);
assertions+=4;

// Verify both user-visible screens derive their journey from the exact strict
// proof, never from a mere DB flag or a fabricated remote 'verified' boolean.
for(const screen of ["src/screens/websiteBuilder.js","src/screens/websitePublishing.js"]){
 const ui=read(screen);
 assert.ok(ui.includes("buildWebsiteLaunchProof("),screen+" must calculate strict evidence");
 assert.ok(ui.includes("deliveryProof"),screen+" must pass proof to journey");
 assert.ok(ui.includes("buildWebsiteLaunchJourney("),screen+" must use the same journey");
 assertions+=3;
}
const builder=read("src/screens/websiteBuilder.js");
const publishing=read("src/screens/websitePublishing.js");
assert.ok(builder.includes("Website version recorded — public address not verified yet"));
assert.ok(builder.includes("See delivery checks and recovery"));
assert.ok(publishing.includes("Next missing check: "));
assert.ok(read(".github/workflows/production-check.yml").includes("node scripts/check-website-proof-v393.mjs"));
assertions+=4;
console.log("V3.93 PASS: "+assertions+" public website truth/consistency and UI checks. No site was published.");
