import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateDesignFeedback,designPreferenceSummary} from "../supabase/functions/busy-website-publish/designFeedback.mjs";
import {websiteDesignAlternative} from "../src/core/websiteDesignAlternatives.mjs";
import {websiteDomainLaunchGuide} from "../src/core/websiteDomainLaunchGuide.mjs";
import {founderUsageEvidence} from "../src/core/founderUsageEvidence.mjs";
import {hasMeasuredAudits,compareWebsiteAudits} from "../supabase/functions/busy-website-worker/websiteReviewCycle.mjs";
let n=0;
const eq=(actual,expected,why)=>{assert.deepEqual(actual,expected,why);n++};
const ok=(value,why)=>{assert.ok(value,why);n++};
const input={action:"design_feedback_record",businessId:"91edb6db-3a02-4de4-9ba8-5c93b4e790a1",
 family:"organic",choice:"liked",draftVersion:"3",requestKey:"design-20261010-abc123xyz123456"};
const valid=validateDesignFeedback(input);
eq(valid.ok,true,"Owner-initiated private preference accepted");
eq(Object.keys(valid.record).sort(),["aggregate_consent","design_family","draft_version","preference","request_key"].sort(),
 "Never store photos, names, contact data or website content");
eq(valid.record.aggregate_consent,false,"Cross-business learning opt-in never assumed");
for(const changed of [
 {...input,extra:"private content"},{...input,choice:"auto-trained"},
 {...input,family:"fictional-template"},{...input,draftVersion:"<script>"},
 {...input,requestKey:"short"},{...input,photos:["secret.png"]},
 {...input,aggregate_consent:true}
])eq(validateDesignFeedback(changed).ok,false,"Malformed private feedback fails closed");
const summary=designPreferenceSummary([
 {design_family:"minimal",preference:"liked",photos:["not shared"]},
 {design_family:"editorial",preference:"rejected"},
 {design_family:"minimal",preference:"liked"},
 {design_family:"unknown",preference:"liked"}
]);
eq(summary.eventCount,3,"Only known feedback recorded");
eq(summary.likedFamilies,["minimal"],"Likes are deduplicated");
eq(summary.rejectedFamilies,["editorial"],"Rejections are remembered");
eq(summary.globalLearningEnabled,false,"Never activate cross-business learning automatically");
eq(summary.modelRetrained,false,"Feedback never claims self-retraining");
eq(JSON.stringify(summary).includes("not shared"),false,"Images do not flow into summary");
const draft={id:"example",businessType:"Gardening",theme:{designFamily:"organic"},sections:[{id:"hero"}]};
eq(websiteDesignAlternative(draft).suggested.family,"minimal","Default industry-aware style");
eq(websiteDesignAlternative(draft,{likedFamilies:["editorial"],rejectedFamilies:["minimal"]}).suggested.family,
 "editorial","Private preferences influence future business-specific suggestions");
eq(websiteDesignAlternative(draft,{likedFamilies:["showcase"]}).options.some(x=>x.family==="showcase"),
 false,"Unapproved photos never unlocked from memory");
const server=readFileSync(new URL("../supabase/functions/busy-website-publish/index.ts",import.meta.url),"utf8");
const app=readFileSync(new URL("../src/app/AppController.js",import.meta.url),"utf8");
const ui=readFileSync(new URL("../src/screens/websiteBuilder.js",import.meta.url),"utf8");
const sql=readFileSync(new URL("../supabase/migrations/20261010182000_v3115_website_design_feedback.sql",import.meta.url),"utf8");
ok(["design_feedback_record","design_feedback_read","design_feedback_clear"].every(x=>
 server.includes('"'+x+'",')&&server.includes('if(action==="'+x+'")')),
 "All three feedback routes are owner/admin-scoped server actions");
ok(server.includes('business_id:businessId,created_by:user.id'),
 "Server assigns real tenant rather than trusting customer input");
ok(server.includes('.eq("business_id",businessId)'),"Read, duplicate checks and clearing are scoped");
ok(sql.includes("enable row level security")&&sql.includes("check(aggregate_consent=false)")&&
 sql.includes("revoke all"),"Private database and no silent aggregation");
ok(sql.includes("unique (business_id,request_key)"),"Idempotent retry scope");
ok(app.includes('websitePublishingRequest("design_feedback_record"'),"Authenticated owner action");
ok(app.includes('websitePublishingRequest("design_feedback_clear"'),"Customer can clear preferences");
ok(ui.includes("Clear my saved style preferences"),"Clear action exposed to owner");
ok(ui.includes("likedFamilies:savedStylePreferences?.likedFamilies"),"Saved memory influences suggestions");
const q={version:1,assessedTextCount:12,unassessedContrastCount:0,
 lowContrastCount:0,smallBodyTextCount:0,smallTouchTargetCount:0,
 unnamedControlsCount:0,missingInputLabelCount:0,missingImageAltCount:0,
 headingLevelSkips:0,hasDocumentLanguage:true,hasMainLandmark:true};
const viewport=cta=>({horizontalOverflowPixels:0,headingVisible:true,
 navigationFits:true,heroHeadingFontPx:34,qualityAudit:q,ctaAudit:cta});
const audit=(cta,desktop=cta)=>({mobileAudit:viewport(cta),desktopAudit:viewport(desktop)});
const good={version:1,present:true,visible:true,reachable:true};
eq(hasMeasuredAudits(audit(good)),true,"Complete CTA evidence");
eq(hasMeasuredAudits({mobileAudit:viewport(good),desktopAudit:viewport(null)}),false,
 "Missing desktop audit is not verified");
eq(compareWebsiteAudits(audit(good),audit(good)).noNewMeasuredProblems,true,
 "No regression on unchanged design");
for(const bad of [{...good,visible:false},{...good,reachable:false},{...good,present:false}])
 eq(compareWebsiteAudits(audit(good),audit(bad)).noNewMeasuredProblems,false,
 "Hidden, unreachable or deleted CTA cannot be improvement");
const blank=websiteDomainLaunchGuide({choice:"busy"});
eq(blank.ready,false,"No invented live BUSY address");
eq(blank.publicAddress,null,"No invented hostname");
eq(websiteDomainLaunchGuide({publishing:{defaultAddressState:{address:{
 hostname:"demo.busydoesit.co.uk",live:false}}}}).ready,false,
 "Assigned hostname is not automatically live");
eq(websiteDomainLaunchGuide({publishing:{defaultAddressState:{address:{
 hostname:"demo.busydoesit.co.uk",live:true}}}}).ready,true,
 "Externally verified address is distinguished");
eq(websiteDomainLaunchGuide({choice:"new"}).checkoutAvailable,false,"No registrar purchase yet");
eq(websiteDomainLaunchGuide({choice:"existing",publishing:{
 domainState:{latest:{hostname:"salon.co.uk"},journey:{complete:true}},
 canOpenCustomDomain:false}}).ready,false,"Ownership is not public health");
const unavailable=founderUsageEvidence();
eq(unavailable.status,"unavailable","No service inventory is not zero usage");
eq(unavailable.providersMissing,null,"Unknown provider count remains unknown");
const evidence=founderUsageEvidence({scope:"founder_service_register",privacy:"founder_only",services:[
 {key:"github",latest:{source:"provider_api_readonly"},freshness:"within_24h"},
 {key:"cloudflare",latest:{source:"provider_api_readonly"},freshness:"historical"},
 {key:"supabase",latest:{source:"verified_log_sample"}},
 {key:"expo",latest:{source:"founder_entered"}},
 {key:"ai",latest:null}
]});
eq(evidence.readOnlyRecent,1,"Only one recent provider observation");
eq(evidence.historicalReadings,2,"Old and log samples differentiated");
eq(evidence.manualRecords,1,"Manual report distinguished");
eq(evidence.providersMissing,1,"Missing records not treated as free");
eq(evidence.invoiceCount,null,"No fabricated provider invoice");
eq(evidence.actualTotalGbp,null,"No cross-unit fake GBP total");
ok(readFileSync(new URL("../src/screens/founderServiceCosts.js",import.meta.url),"utf8")
 .includes("Recent read-only provider observations"),"Founder view displays measured evidence labels");
ok(readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8")
 .includes("check-website-intelligence-v3115.mjs"),"Production CI runs all four tracks");
console.log("V3.115 PASS: "+n+" feedback/privacy, design, domain and founder checks.");
