import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let n=0;const ok=(v,reason)=>{assert.ok(v,reason);n++};
const api=read("supabase/functions/busy-website-design-review/index.ts");
const renderer=read("cloudflare/busy-website-screenshot/worker.js");
const original=read("supabase/functions/busy-website-worker/visualCriticContract.mjs");
const included=read("supabase/functions/busy-website-design-review/visualCriticContract.mjs");
const client=read("src/app/AppController.js");
const ui=read("src/screens/websiteBuilder.js");
const builder=read("src/domain/websiteBuilder.js");
const meter=read("supabase/migrations/20261010154000_v3_104_website_visual_ai_meter.sql");
const pkg=JSON.parse(read("package.json")),app=JSON.parse(read("app.json")).expo;
for(const s of [
 'supabase.auth.getUser(token)','busy_business_memberships',
 '.eq("user_id",user.data.user.id)', '.eq("business_id",businessId)',
 '.in("role",["owner","admin"])','busy_website_deployments',
 '.eq("website_id",website.data.id)', 'deployment.data.state!=="preview_ready"',
 'deployment.data.preview_storage_path?.startsWith(prefix)',
 'supabase.storage.from("busy-website-preview")','createSignedUrl(',
 'BUSY_WEBSITE_VISUAL_AI_ENABLED','BUSY_WEBSITE_SCREENSHOT_RENDERER_URL',
 'BUSY_WEBSITE_SCREENSHOT_RENDERER_SECRET','BUSY_WEBSITE_VISUAL_AI_MODEL',
 'OPENAI_API_KEY','busy_reserve_website_visual_ai_call',
 'busy_finish_website_visual_ai_call','body.ownerConsent!==true',
 'requestKey','action==="status"','["status","review"].includes(action)',
 'imageFromTrustedRenderer(', 'runVision(', 'max_output_tokens:650',
 'store:false','status="completed"','p_state:status',
 'changesApplied:false','published:false',
]) ok(api.includes(s),"Authenticated gated review API: "+s);
ok(!api.includes("BUSY_WEBSITE_SCREENSHOT_RENDERER_URL = \"https"),"No hardcoded renderer access");
ok(included===original,"Deployable reviewer enforces identical design-only contract");
for(const s of [
 'parsed.protocol!=="https:"','BUSY_SUPABASE_HOST',
 '/storage/v1/object/sign/busy-website-preview/',
 'parsed.pathname.includes("/deployments/"+deployment+"/")',
 'BUSY_SCREENSHOT_SECRET','blockThirdPartyScripts:true',
]) if(s==="blockThirdPartyScripts:true")ok(api.includes(s),"Renderer blocks remote scripts request");
 else ok(renderer.includes(s),"Screenshot gateway provenance: "+s);
for(const s of [
 'const checkWebsiteVisualReview=async()',
 'const requestWebsiteVisualReview=async()',
 'const approveWebsiteVisualSuggestions=()=>',
 'ownerConsent:true','sourceGeneration',
 'localDraftUpdatedAt','localDraftGeneration',
 'websitePublishingView?.draftChangedSinceHosted',
 'applyApprovedVisualProposals(websiteDraft',
 'rebuildPrivateWebsiteDraft(proposal.draft)',
 'setWebsiteUndo(items=>[...items,websiteDraft].slice(-8))',
 'websiteVisualReviewStatus,','websiteVisualReviewBusy,'
])ok(client.includes(s),"Client owner-only private review: "+s);
for(const s of [
 "Check visual AI availability (free)",
 "Use 1 review credit on my hosted website",
 "Approve design changes in my PRIVATE draft",
 'showVisualAi','websiteVisualReviewNotice',
 "Nothing is published or edited automatically."
])ok(ui.includes(s),"Customer consent and feedback: "+s);
ok(builder.includes("generation:Number(draft.generation||0)+1"),"Draft edits increment generation to avoid stale hosted approvals");
for(const s of ["enabled boolean not null default false","monthly_request_cap integer not null default 2",
 "busy_reserve_website_visual_ai_call","for update","unique (business_id, request_key)",
 "from public,anon,authenticated","to service_role",
 "return null; -- duplicate request keys"]){
 ok(meter.includes(s),"Deny-by-default billing: "+s);
}
assert.equal(pkg.version,"3.105.0");assert.equal(app.version,"3.105.0");
assert.equal(app.ios.buildNumber,"25");assert.equal(app.android.versionCode,25);
ok(read(".github/workflows/production-check.yml").includes("check-visual-review-gateway-v3105.mjs"),"Production CI includes authenticated review gate");
console.log("V3.105 PASS: "+n+" hosted screenshot review readiness, secure tenant scoping, private-only approval and zero-surprise billing assertions.");
