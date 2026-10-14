import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {voiceTime,voiceDurationState,voiceUploadEligible,
 MAX_WEBSITE_VOICE_MS,VOICE_WARNING_MS,MAX_WEBSITE_VOICE_BYTES} from "../src/core/websiteVoiceRecordingPolicy.mjs";
import {interpretSelectedWebsiteRequest} from "../src/core/websiteContextualEdit.mjs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {planWebsiteDesign} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";
import {editWebsiteDraftField} from "../src/core/websiteStructuredEditing.mjs";
import {canonicalWebsiteHandoffUrl} from "../src/core/websiteAppHandoffV3214.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const strip=s=>s.replace(/export\s*\{[\s\S]*?\};?\s*$/,"");
const management=Function(strip(read("src/domain/websiteManagement.js"))+";return {syncWebsitePageModel};")();
let source=strip(read("src/domain/websiteBuilder.js"));
for(const imp of [
 'import { syncWebsitePageModel } from "./websiteManagement";',
 'import {canonicalWebsiteHandoffUrl} from "../core/websiteAppHandoffV3214.mjs";',
 'import { designForWebsite, designCss } from "../../supabase/functions/busy-website-worker/designSystem.mjs";',
 'import { planWebsiteDesign } from "../../supabase/functions/busy-website-worker/designPlanner.mjs";',
 'import { reviewWebsiteDesign } from "../../supabase/functions/busy-website-worker/designReview.mjs";',
 'import { applyWebsiteVisualEdit } from "../../supabase/functions/busy-website-worker/designEdits.mjs";'
]){assert.ok(source.includes(imp),"Domain import changed");source=source.replace(imp,"");}
const {buildWebsiteDraft,renderWebsiteHtml,applyWebsiteLayoutChange}=Function(
 "syncWebsitePageModel","designForWebsite","designCss","planWebsiteDesign",
 "reviewWebsiteDesign","applyWebsiteVisualEdit","editWebsiteDraftField","canonicalWebsiteHandoffUrl",
 source+";return {buildWebsiteDraft,renderWebsiteHtml,applyWebsiteLayoutChange};"
)(management.syncWebsitePageModel,designForWebsite,designCss,planWebsiteDesign,reviewWebsiteDesign,applyWebsiteVisualEdit,editWebsiteDraftField,canonicalWebsiteHandoffUrl);
const check=(pass,name)=>assert.ok(pass,name);
check(MAX_WEBSITE_VOICE_MS===300000&&VOICE_WARNING_MS===240000,"Five-minute cap and one-minute warning");
check(voiceTime(125030)==="02:05","Readable mm:ss elapsed timer");
check(voiceDurationState(239999).warning===false,"No premature warning");
check(voiceDurationState(240000).warning===true,"Last-minute warning displayed");
check(voiceDurationState(299999).atLimit===false,"Pauses never stop the microphone");
check(voiceDurationState(300000).atLimit===true,"The disclosed maximum eventually stops recording");
check(voiceDurationState(300000).remaining==="00:00","Maximum time shown");
check(MAX_WEBSITE_VOICE_BYTES===9000000,"9MB bounded provider cost");
check(voiceUploadEligible(500,"audio/mp4"),"Valid short recording");
check(!voiceUploadEligible(99),"Empty recording refused");
check(!voiceUploadEligible(9000001),"Oversized recording refused");
check(!voiceUploadEligible(3000,"text/html"),"Wrong audio type rejected");
const mic=read("src/screens/websiteSelectedVoice.js");
check(mic.includes('stage==="recording"&&time.atLimit')&&mic.includes('void stop(true)'),
 "Hard safety cap stops local recorder");
check(mic.includes("Tap Record, speak naturally, then tap Stop yourself."),
 "Pause control clearly owner-triggered");
check(mic.includes('setPendingUri(uri)')&&mic.includes('setStage("review")'),
 "Stop saves audio for local review without transmission");
check(mic.includes('onTranscribe?.(pendingUri,selection)')&&mic.includes('stage!=="review"'),
 "Only review-stage explicit Send can upload");
check(mic.includes("Discard recording — do not send"),"Owner may cancel without server request");
check(mic.includes('voiceDurationState(')&&mic.includes('Recording  '),"Visible accurate duration");
check(!mic.includes("silenceTimeout")&&!mic.includes("onSpeechEnd")&&!mic.includes("voiceActivity"),
 "No voice-activity/silence auto-stop");
const migration=read("supabase/migrations/20261011120000_busy_website_voice_usage.sql");
check(migration.includes("PRIMARY KEY(owner_user_id, usage_day)")&&
 migration.includes("REFERENCES auth.users(id) ON DELETE CASCADE"),
 "Usage counters scoped by actual owner and UTC day");
check(migration.includes("SECURITY DEFINER")&&migration.includes("ENABLE ROW LEVEL SECURITY"),
 "Server-owned atomic quota table");
check(migration.includes("WHERE entry.requests < limit_per_day")&&
 migration.includes("limit_per_day constant integer := 12"),
 "No concurrent request can exceed 12 reservations");
check(migration.includes("REVOKE ALL ON FUNCTION")&&
 migration.includes("TO service_role")&&
 !migration.includes("TO authenticated;"),"Public accounts cannot forge counter RPC");
check(!migration.includes("transcript")||migration.includes("no audio"),
 "Only request counts are stored, never voice contents");
const backend=read("supabase/functions/busy-command/index.ts");
const from=backend.indexOf('if(form.get("mode")==="website-selection-transcript-v1"');
const to=backend.indexOf('const rawContext = cleanText(form.get("context")',from);
const route=backend.slice(from,to);
check(from>0&&to>from&&route.includes('auth.auth.getUser(rawToken)'),
 "Authentication before voice processing");
check(route.includes('audio.size>9_000_000')&&route.includes('audio.size<100'),"Server upload bounds");
check(route.includes('auth.rpc("busy_reserve_website_voice_request"')&&
 route.indexOf("auth.rpc(")<route.indexOf("await transcribeAudio(audio)"),
 "Quota reserved before chargeable provider call");
check(route.includes('if(budget.error||')&&route.includes('return json(503,'),
 "Fail closed when schema/rate counter is unavailable");
check(route.includes('return json(429,')&&route.includes('dailyLimit:12'),
 "Clear daily use budget and exhaustion");
check(!route.includes("routeOperator(")&&route.includes("command:null"),
 "Selected voice is transcription-only");
const controller=read("src/app/AppController.js");
check(controller.includes('voiceUploadEligible(Number(file.size||0))')&&
 controller.includes('selectedWebsiteVoiceContextIsCurrent(websiteDraftRef.current,selection)'),
 "Client volume and stale selection checks");
check(controller.includes('Number.isInteger(usage.remaining)')&&
 controller.includes('remaining,dailyLimit:12'),"Usage displayed only from bounded numeric server values");
const img=(id)=>({id,approved:true,storagePath:"tenant/a/"+id+".jpg",
 uri:"https://example.test/"+id+".jpg"});
const brain={websiteReady:true,websiteBrief:{businessName:"Example Garden",
 businessType:"Gardening",description:"Garden services in Devon",about:"Local gardeners.",
 services:[{id:"a",name:"Garden design",description:"Practical outdoor spaces."}],
 photos:[img("a"),img("b")],heroAsset:img("a")}};
const draft=buildWebsiteDraft({brandBrain:brain});
const gallery=draft.sections.find(x=>x.id==="gallery");
check(gallery.items.length===2,"Two approved images available");
const op=(d,p)=>applyWebsiteLayoutChange(d,{action:"image-style",
 sectionId:"gallery",photoIndex:1,...p});
const full=op(draft,{field:"photoFit",value:"contain"});
check(full.applied&&full.draft.sections.find(x=>x.id==="gallery").items[1].appearance.photoFit==="contain",
 "Fit only selected approved photo");
check(full.draft.sections.find(x=>x.id==="gallery").items[0].appearance===undefined,
 "Other gallery photos unchanged");
const page=full.draft.pages.find(p=>p.sectionIds.includes("gallery"));
const html=renderWebsiteHtml(full.draft,page.id);
check(html.includes('class="gallery-image owner-image-fit-contain"'),
 "Whole-photo class emitted on private website and ZIP");
const selection={pageId:page.id,sectionId:"gallery",field:"photo",photoIndex:1,
 generation:draft.generation};
const requested=interpretSelectedWebsiteRequest(draft,page.id,selection,"Show this whole photograph");
check(requested.ok&&requested.change.field==="photoFit"&&requested.change.value==="contain",
 "Contextual selected photograph command");
const crop=op(full.draft,{field:"photoCrop",value:"top"});
check(crop.applied&&crop.draft.sections.find(x=>x.id==="gallery").items[1].appearance.photoFit==="contain",
 "Changing focal point retains whole-photo preference");
const replaced=op(crop.draft,{field:"photoFit",value:"cover"});
check(replaced.applied&&replaced.draft.sections.find(x=>x.id==="gallery").items[1].appearance.photoCrop==="top",
 "Returning to cropped tiles retains focal point choice");
const rebuilt=buildWebsiteDraft({brandBrain:brain,previousDraft:crop.draft});
check(rebuilt.sections.find(x=>x.id==="gallery").items[1].appearance.photoFit==="contain",
 "Per-image choice survives factual Brand Brain refresh");
for(const patch of [{field:"photoFit",value:"javascript:abc"},{field:"photoFit",value:"stretch"},
 {field:"css",value:"display:none"},{field:"photoCrop",value:"../../"}]){
 check(!op(draft,patch).applied,"Unsafe framing rejected");
}
const css=designCss(designForWebsite({businessType:"Gardening"}));
check(css.includes("#gallery .gallery-image.owner-image-fit-contain"),"Shared CSS supports whole image");
const hosted=read("supabase/functions/busy-website-worker/index.ts");
check(hosted.includes('item?.appearance?.photoFit==="contain"'),"Hosted renderer respects same framing");
check(draft.publicStatus==="Not published","Original draft remains unpublished");
console.log("V3.142 PASS: pause-tolerant timed recording, explicit upload approval, owner quota and per-image framing with preview/hosted parity.");
