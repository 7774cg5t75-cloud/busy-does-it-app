import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {websiteQualityGuidance} from "../src/core/websiteQualityGuidance.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
let checks=0;
const ok=(value,message)=>{assert.ok(value,message);checks++;};
const eq=(a,b,message)=>{assert.deepEqual(a,b,message);checks++;};
const blank=websiteQualityGuidance();
ok(blank.suggestions.some(x=>x.id==="facts"),"missing basic facts should be highlighted");
ok(blank.suggestions.some(x=>x.id==="photos"),"real customer images should be suggested");
eq(blank.priority.length,3,"show no more than three improvement ideas");
eq(blank.remaining,blank.suggestions.length-3,"count remaining without expanding long page");
const full={
  websiteBrief:{
    businessName:"Acme Gardens",
    description:"Local garden care",
    tagline:"Neat gardens, happy customers",
    differentiators:"Family-run",
    photos:[{storagePath:"approved/garden.jpg"}],
    heroAsset:{key:"approved"},
    services:[{name:"Lawn care",description:"Regular mowing and maintenance"}],
    visualStyle:"warm",
    colours:["#336633"],
    testimonials:[],
  },
  completeness:{coreMissing:[]}
};
const ready=websiteQualityGuidance({brandBrain:full,draft:{pages:[{id:"home"}]}});
eq(ready.suggestions.length,0,"genuine content can satisfy guidance without fake reviews");
eq(ready.counts.confirmedReviews,0,"absence of reviews must not block release");
eq(ready.counts.approvedPhotos,1,"approved photo evidence counted");
const noClaims=websiteQualityGuidance({brandBrain:{websiteBrief:{...full.websiteBrief,description:"",tagline:"",differentiators:""}}});
ok(noClaims.suggestions.some(x=>x.id==="description"),"short description");
ok(noClaims.suggestions.some(x=>x.id==="personality"),"truthful distinctiveness");
const browser=read("src/screens/hostedWebsitePreview.js");
const builder=read("src/screens/websiteBuilder.js");
const app=read("src/app/AppController.js");
const security=read("src/core/hostedPreviewSecurity.mjs");
const brand=read("src/domain/brandBrain.js");
const draft=read("src/domain/websiteBuilder.js");
const worker=read("supabase/functions/busy-website-worker/index.ts");
const publish=read("src/screens/websitePublishing.js");
for(const item of [
  'ScrollView horizontal showsHorizontalScrollIndicator={false}',
  'preview.pages.map((page, index) => (',
  'disabled={!!preview.loading}',
  'onPress={() => s.openHostedWebsitePreviewPage(page.url)}',
  'accessibilityRole="button"',
  'preview.pageId === page.id',
  'preview.brandName ? "Previewing " + preview.brandName',
  'javaScriptEnabled={false}',
  'domStorageEnabled={false}',
])ok(browser.includes(item),"safe native page tabs: "+item);
ok(app.includes('brandName: String(previewRow?.source_draft?.businessName'),"customer brand in preview header");
ok(app.includes('resolveHostedPreviewPage('),"only signed manifest pages loaded");
ok(security.includes('signedPreviewPath(page?.previewUrl, supabaseUrl, deploymentId)'),"page selector uses validated signed URLs");
ok(builder.includes('websiteQualityGuidance({ brandBrain: brand, draft })'),"computed actual guidance");
ok(builder.includes('qualityGuide.priority[0]?.title'),"only one compact tip initially");
ok(builder.includes('showQualityIdeas ? ('),"extra tips collapsed until requested");
ok(builder.includes('qualityGuide.suggestions.slice(1, 4).map((item)'),"optional extra tips available");
ok(builder.includes('onPress={s.openBrandIdentity}'),"customer can improve real saved facts");
ok(builder.includes('Continue editing with BUSY'),"not forced to complete suggestions");
ok(brand.includes('logoLabel: profile.logoLabel'),"approved customer brand passed into website brief");
ok(draft.includes('brandLabel: clean(brief.logoLabel).slice(0, 100) || clean(brief.businessName)'),"text wordmark is business-owned, not BUSY default");
ok(draft.includes('escapeHtml(draft.brandLabel || draft.businessName)'),"editable HTML uses customer label");
ok(worker.includes('draft?.brandLabel || draft?.businessName || "Home"'),"hosted HTML uses customer label in navigation");
ok(worker.includes('draft.brandLabel || draft.businessName'),"hosted hero uses customer label");
ok(publish.includes('reviewedHostedPreview!==preview.id'),"exact review gate remains intact");
ok(publish.includes('confirmPublishHostedWebsite(preview.id)'),"publication still explicit");
ok(!worker.includes('draft?.brandLabel || "BUSY DOES IT"'),"do not brand customer websites as BUSY");
const pkg=JSON.parse(read("package.json")),expo=JSON.parse(read("app.json")).expo;
eq(pkg.version,"3.98.0");eq(expo.version,pkg.version);
eq(expo.ios.buildNumber,"18");eq(expo.android.versionCode,18);
ok(read(".github/workflows/production-check.yml").includes("check-website-quality-v398.mjs"),"CI wired");
console.log("V3.98 PASS: "+checks+" quality, customer-brand, private-page-navigation and approval-safety checks.");
