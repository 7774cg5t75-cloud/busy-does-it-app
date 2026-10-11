import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateAppScreenshotReview,normalizeAppVisualAIResult,
 previewAppVisualSuggestion,MAX_JPEG_BASE64} from "../src/core/appVisualReviewContract.mjs";
import {proposeCoordinatedAppChanges} from "../src/core/appCoordinatedStudio.mjs";
import {reviewPrivateAppServices} from "../src/core/appServiceCollection.mjs";
import {prepareSource} from "./snack-source.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const id="00000000-0000-4000-8000-000000000159";
const validB64="a".repeat(120);
const input={appId:id,expectedRevision:3,ownerConsent:true,
 captureScope:"public_app_only",imageBase64:validB64};
assert.equal(validateAppScreenshotReview(input).ok,true);
for(const invalid of [{...input,ownerConsent:false},
 {...input,expectedRevision:0},{...input,appId:"another-company"},
 {...input,captureScope:"whole_screen"},
 {...input,imageBase64:"data:image/jpeg;base64,"+validB64},
 {...input,imageBase64:"<script>"}, {...input,imageBase64:"a".repeat(MAX_JPEG_BASE64+4)}])
 assert.equal(validateAppScreenshotReview(invalid).ok,false,"Unsafe upload must fail.");
const config={display:{name:"Sample salon"},modules:[
 {key:"business_profile",enabled:true},{key:"services",enabled:true}
],navigation:["business_profile","services"],
 presentation:{headerStyle:"refined",layoutDensity:"comfortable",navigationStyle:"tabs"},
 publicProfile:{services:[{name:"Cut",description:"A service"},
  {name:"Colour",description:"Another service"}]},
 privateCustomers:[{email:"private@example.test"}],payments:{enabled:false}};
const original=JSON.stringify(config);
const report=normalizeAppVisualAIResult({summary:
 "Contact 07700 900123 or hello@example.test to fix this view.",
 observations:["Call +44 7700 900123","This screenshot shows spacing differences"],
 suggestions:[
  {field:"layoutDensity",value:"airy",reason:"More space could improve legibility"},
  {field:"secret",value:"publish",reason:"invalid"},
  {field:"headerStyle",value:"refined",reason:"No-op"},
  {field:"imageScale",value:"large",reason:"Improve photo visibility"},
  {field:"layoutDensity",value:"compact",reason:"Duplicate"},
  {field:"navigationStyle",value:"dropdown",reason:"Unsupported"}
]},config);
assert.equal(report.ok,true,report.reason);
assert.deepEqual(report.suggestions.map(s=>s.field),["layoutDensity","imageScale"]);
assert.ok(!report.summary.includes("hello@example.test"));
assert.ok(!report.summary.includes("07700"));
assert.ok(!report.observations.join().includes("7700"));
assert.equal(report.autoPublished,false);
assert.equal(report.screenshotAuthenticityIndependentlyVerified,false);
assert.equal(report.measuredLayout,false);
const proposal=previewAppVisualSuggestion(config,report.suggestions[0]);
assert.equal(proposal.ok,true,proposal.reason);
assert.equal(proposal.nextConfig.presentation.layoutDensity,"airy");
assert.equal(previewAppVisualSuggestion(config,{kind:"payment",field:"payments",value:"on"}).ok,false);
assert.equal(normalizeAppVisualAIResult({suggestions:"run code"},config).ok,false);
assert.equal(normalizeAppVisualAIResult({suggestions:Array(7).fill({field:"layoutDensity",value:"airy"})},config).ok,false);
const combined=proposeCoordinatedAppChanges(config,[
 proposal.operation,
 {kind:"services",value:[{name:"Colour",description:"Another service"},
  {name:"Cut",description:"A service"}]}
]);
assert.equal(combined.ok,true,combined.reason);
assert.equal(combined.nextConfig.publicProfile.services[0].name,"Colour");
assert.deepEqual(combined.nextConfig.privateCustomers,config.privateCustomers);
assert.deepEqual(combined.nextConfig.payments,config.payments);
assert.equal(combined.publishes,false);
assert.equal(proposeCoordinatedAppChanges(combined.nextConfig,
 combined.undoOperations).ok,true);
assert.equal(JSON.stringify(config),original,"Safe previews never mutate source.");
assert.equal(reviewPrivateAppServices(config,config.publicProfile.services.slice().reverse()).ok,true,
 "Older owner-written service lists without IDs must remain editable.");
assert.equal(read("src/core/appVisualReviewContract.mjs"),
 read("supabase/functions/busy-mini-apps/appVisualReviewContract.mjs"));
assert.equal(read("src/core/appServiceCollection.mjs"),
 read("supabase/functions/busy-mini-apps/appServiceCollection.mjs"));
const api=read("supabase/functions/busy-mini-apps/index.ts");
for(const marker of [
 'action==="visual_review_status"','action==="review_app_screenshot"',
 '"busy_app_visual_ai_limits"','"busy_app_visual_ai_calls"',
 '"busy_reserve_app_visual_ai_call"','"busy_finish_app_visual_ai_call"',
 'validateAppScreenshotReview(body)','store:false','max_output_tokens:620',
 '"data:image/jpeg;base64,"+input','app.id!==fields.appId',
 'Number(app.draft_revision)!==fields.revision',
 'p_business_id:businessId','p_draft_revision:fields.revision',
 'screenshotStored:false','BUSY_APP_VISUAL_AI_ENABLED'
])assert.ok(api.includes(marker),"Missing verified server review guard: "+marker);
assert.ok(api.includes('"visual_review_status",')&&api.includes('"review_app_screenshot",'),
 "Both endpoints must require owner/admin membership.");
const migration=read("supabase/migrations/20261011205000_v3_159_app_visual_ai_meter.sql");
for(const marker of ["enabled boolean not null default false",
 "monthly_request_cap integer not null default 0","for update",
 "enable row level security","revoke all",
 "service_role","unique(business_id,request_key)",
 "busy_reserve_app_visual_ai_call","busy_finish_app_visual_ai_call",
 "state in ('reserved','completed','failed')"])
 assert.ok(migration.includes(marker),"Missing opt-in billing invariant: "+marker);
const controller=read("src/app/AppController.js"),ui=read("src/screens/miniApps.js");
for(const marker of ['checkPrivateAppVisualReview=async','reviewPrivateAppScreenshot=async',
  'miniAppsRequest("review_app_screenshot"','photo.base64()',
  'data.screenshotStored!==false','captureScope:"public_app_only"'])
 assert.ok(controller.includes(marker),"Missing owner-confirmed local photo handoff: "+marker);
for(const marker of ['captureRef(appSurfaceRef.current','collapsable={false}',
 'Ask AI to inspect this screenshot','Approve one AI review',
 'previewAppVisualSuggestion(config,item)','Keep my original design',
 'Move this service earlier','Move this service later',
 's.saveCoordinatedAppChanges','s.checkPrivateAppVisualReview'])
 assert.ok(ui.includes(marker),"Missing safe customer preview and choice: "+marker);
assert.ok(!ui.includes("captureScreen({format:"),"Avoid screenshot of the entire private device.");
const snack=prepareSource('import {captureRef} from "react-native-view-shot";');
assert.ok(snack.includes('../components/snackScreenCapture'));
assert.ok(read("src/components/snackScreenCapture.js").includes("captureRef"));
console.log("V3.159 PASS: opt-in and metered AI screenshot contract, privacy boundaries, approved only design edits, legacy service reorder, no false screenshot authenticity.");
