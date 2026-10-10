import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {showcaseBrandBrain} from "../sites/busy-headquarters/demo-brand-brain.mjs";
import {buildWebsiteLaunchProof,exactBusyHost} from "../src/core/websiteLaunchProof.mjs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";

const root=new URL("../",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");
const stripExport=source=>source.replace(/export\s*\{[\s\S]*?\};?\s*$/,"");
// Evaluate ONLY repository-owned local modules, avoiding production code edits
// needed solely for Node's extensionless import resolution. Never eval input.
const management=new Function(stripExport(read("src/domain/websiteManagement.js"))+
 ";return {syncWebsitePageModel};")();
const source=stripExport(read("src/domain/websiteBuilder.js"))
 .replace(/^import \{ syncWebsitePageModel \} from "\.\/websiteManagement";\s*/,"")
 .replace(/^import \{ designForWebsite, designCss \} from "\.\.\/\.\.\/supabase\/functions\/busy-website-worker\/designSystem\.mjs";\s*/,"");
assert.ok(!source.includes("import { syncWebsitePageModel }"));
const build=new Function("syncWebsitePageModel","designForWebsite","designCss",source+
 ";return {buildWebsiteDraft,renderWebsiteHtml};")(management.syncWebsitePageModel,designForWebsite,designCss);
const draft=build.buildWebsiteDraft({brandBrain:showcaseBrandBrain});
const committedDemo=read("sites/busy-headquarters/demo/index.html");
assert.ok(draft.html.includes('class="hero hero-large'),"Current builder renders professionally styled pages.");
assert.ok(draft.html.includes("sector-"),"Current builder applies sector designs.");
assert.ok(committedDemo.includes("Northfield Property Care"),"Existing static demonstration still contains its labelled fictitious business.");
// The committed public demo is a historical snapshot. Changing the generator
// no longer implies that the already-hosted demo file changed in production.
assert.equal(draft.publicStatus,"Not published");
assert.equal(draft.publish.enabled,false);
assert.equal(draft.businessName,"Northfield Property Care — Demo");
assert.ok(draft.sections.some(s=>s.type==="services"));
assert.ok(!draft.sections.some(s=>s.type==="testimonials"));
assert.ok(committedDemo.includes("Fictional")||committedDemo.includes("fictional"));
assert.ok(!committedDemo.includes("<form"));
assert.ok(!committedDemo.includes("mailto:"));
assert.ok(!committedDemo.includes("tel:"));
assert.ok(!committedDemo.includes("£50"));
const variants=["Plumbing","Outdoor Cleaning","Festival Catering","Pet Grooming"];
for(const type of variants){
 const brand={...showcaseBrandBrain,websiteBrief:{...showcaseBrandBrain.websiteBrief,
   businessType:type,businessName:type+" Example (fictional)"}};
 const output=build.buildWebsiteDraft({brandBrain:brand});
 assert.ok(output.html.includes(type));
 assert.equal(output.publicStatus,"Not published");
 assert.ok(!output.sections.some(s=>s.type==="testimonials"));
}
const unsafe=build.buildWebsiteDraft({brandBrain:{...showcaseBrandBrain,
 websiteBrief:{...showcaseBrandBrain.websiteBrief,businessName:"<script>alert(1)</script>"}}});
assert.ok(!unsafe.html.includes("<script>alert(1)</script>"));
assert.ok(unsafe.html.includes("&lt;script&gt;"));

const home=read("sites/busy-headquarters/index.html");
const css=read("sites/busy-headquarters/styles.css");
const privacy=read("sites/busy-headquarters/privacy.html");
assert.ok(home.includes('href="styles.css"'));
assert.ok(home.includes('href="demo/index.html"'));
assert.ok(home.includes('href="privacy.html"'));
assert.ok(home.includes('content="noindex,nofollow"'));
assert.ok(privacy.includes('LEGAL CONTENT DRAFT'));
assert.ok(privacy.includes('content="noindex,nofollow"'));
assert.ok(!home.includes('<form'));
assert.ok(!home.includes('type="submit"'));
assert.ok(!home.includes('stripe.com'));
assert.ok(!home.includes('£50/month'));
assert.ok(!home.includes('src="https://'));
assert.ok(css.includes('@media(max-width:680px)'));
assert.ok(css.includes('prefers-reduced-motion'));
for(const anchor of ["features","pricing","how-it-works","questions","launch"]){
 assert.ok(home.includes('id="'+anchor+'"'));
}
const noRoot=buildWebsiteLaunchProof({});
assert.equal(noRoot.verified,false);
assert.equal(noRoot.passed,0);
assert.equal(noRoot.publicRootWebsiteVerified,false);
assert.equal(noRoot.publicPublishingTriggered,false);
assert.equal(exactBusyHost("https://demo.busydoesit.co.uk/"),"demo.busydoesit.co.uk");
for(const bad of ["https://busydoesit.co.uk","https://demo.busydoesit.co.uk.attacker.net",
 "http://demo.busydoesit.co.uk","https://localhost","https://a.b.busydoesit.co.uk",
 "https://demo.busydoesit.co.uk:8443"]){
 assert.equal(exactBusyHost(bad),"");
}
const id="22222222-2222-4222-8222-222222222222";
const stamp=new Date().toISOString();
const base={
 websiteDraftPresent:true,
 website:{
  current_live_deployment_id:id,default_hostname:"demo.busydoesit.co.uk",
  default_url:"https://demo.busydoesit.co.uk",health_status:"healthy",
  delivery_status:"active",last_healthy_at:stamp,last_health_check_at:stamp,
  last_observed_deployment_id:id
 },
 previewDeployment:{id:"p",state:"preview_ready",content_hash:"a".repeat(64),
 preview_storage_path:"private/preview.html"},
 liveDeployment:{id,published_at:stamp,public_storage_path:"public/index.html"},
 providerState:{activationReady:true},
 defaultDomainHealth:{status:"healthy",observed_deployment_id:id,
  expected_deployment_id:id,checked_url:"https://demo.busydoesit.co.uk",checked_at:stamp}
};
assert.equal(buildWebsiteLaunchProof(base).verified,true);
assert.equal(buildWebsiteLaunchProof(base).passed,7);
assert.equal(buildWebsiteLaunchProof({...base,liveDeployment:null}).verified,false);
assert.equal(buildWebsiteLaunchProof({...base,providerState:{activationReady:false}}).verified,false);
assert.equal(buildWebsiteLaunchProof({...base,website:{...base.website,health_status:"degraded"}}).verified,false);
assert.equal(buildWebsiteLaunchProof({...base,website:{...base.website,last_observed_deployment_id:"old"}}).verified,false);
assert.equal(buildWebsiteLaunchProof({...base,website:{...base.website,default_url:"https://attacker.net"}}).verified,false);
assert.equal(buildWebsiteLaunchProof({...base,defaultDomainHealth:null}).verified,false);
assert.equal(buildWebsiteLaunchProof({...base,defaultDomainHealth:{
 ...base.defaultDomainHealth,expected_deployment_id:"other"}}).verified,false);
assert.equal(buildWebsiteLaunchProof({...base,defaultDomainHealth:{
 ...base.defaultDomainHealth,checked_url:"https://wrong.busydoesit.co.uk"}}).verified,false);
assert.equal(buildWebsiteLaunchProof({...base,defaultDomainHealth:{
 ...base.defaultDomainHealth,checked_at:"2020-01-01T00:00:00.000Z"}}).verified,false);
assert.equal(buildWebsiteLaunchProof({...base,website:{
 ...base.website,default_hostname:"different.busydoesit.co.uk"}}).verified,false);
assert.equal(buildWebsiteLaunchProof({...base,website:{...base.website,
 last_healthy_at:"2020-01-01T00:00:00.000Z"}}).verified,false);
assert.equal(buildWebsiteLaunchProof({...base,website:{...base.website,
 last_health_check_at:"2020-01-01T00:00:00.000Z",
 last_healthy_at:"2020-01-01T00:00:00.000Z"}}).verified,false);

const screen=read("src/screens/websitePublishing.js");
const ci=read(".github/workflows/production-check.yml");
assert.ok(screen.includes('buildWebsiteLaunchProof('));
assert.ok(screen.includes("Real-world launch proof"));
assert.ok(screen.includes("No automatic Go Live"));
assert.ok(ci.includes("node scripts/check-headquarters-v380.mjs"));
console.log("V3.80 PASS: BUSY-generated demo, independent official site, no checkout, responsive marketing, strict actual-public-delivery proof and CI wiring.");
