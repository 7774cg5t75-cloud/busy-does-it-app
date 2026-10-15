import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const backend=read("supabase/functions/busy-command/index.ts");
const ctl=read("src/app/AppController.js")+read("src/core/websiteVoiceActions.mjs");
const screen=read("src/screens/websiteBuilder.js");
const microphone=read("src/screens/websiteSelectedVoice.js");
for(const s of ['form.get("mode")==="website-page-transcript-v1"',
  'busy_reserve_website_voice_request','auth.auth.getUser(rawToken)',
  'mode:requestedWebsiteTranscriptMode','requiresReview:true',
  'command:null','action:null','await transcribeAudio(audio)'])
 assert.ok(backend.includes(s),"Existing authenticated transcription + page mode "+s);
const begin=backend.indexOf('if(form.get("mode")==="website-selection-transcript-v1"');
const end=backend.indexOf('const rawContext = cleanText(form.get("context")',begin);
const route=backend.slice(begin,end);
assert.ok(begin>=0&&end>begin);
assert.ok(route.indexOf('auth.auth.getUser(rawToken)')<route.indexOf('await transcribeAudio(audio)'));
assert.ok(route.indexOf('auth.rpc("busy_reserve_website_voice_request"')<route.indexOf('await transcribeAudio(audio)'));
assert.ok(!route.includes("routeOperator("),"Voice audio may only be transcribed");
assert.ok(ctl.includes('form.append("mode","website-page-transcript-v1")'));
assert.ok(ctl.includes("now.generation===scope?.generation"));
assert.ok(ctl.includes("if(!isCurrent())return"));
assert.ok(screen.includes('onTranscribe={s.transcribeWebsitePageAudio}'));
assert.ok(screen.includes('setPageInstruction(String(words||"").slice(0,400))'));
assert.ok(screen.includes("Please read the transcript, then preview the proposed edits"));
assert.ok(microphone.includes('contextLabel==="page"'));
const from=backend.indexOf("async function interpretWebsitePageLanguage(");
const stop=backend.indexOf("Deno.serve(async (request: Request)",from);
const intent=backend.slice(from,stop);
for(const x of ["BUSY_WEBSITE_PAGE_INTENT_ENABLED",
 "body?.ownerConsent!==true","busy_business_memberships",
 "auth.auth.getUser(token)","busy_reserve_website_voice_request",
 "max_output_tokens:450","store:false","command:null","changesApplied:false"])
 assert.ok(intent.includes(x),"Optional metered AI interpreter "+x);
assert.ok(intent.indexOf("busy_reserve_website_voice_request")<intent.indexOf("await fetch(OPENAI_RESPONSES_URL"));
assert.ok(!intent.includes("routeOperator("));
for(const x of ["planWebsitePageInstructions(current","data.action!==null",
  "data.command!==null","data.changesApplied!==false",
  "stillCurrent()","ownerConsent:true",
  "Ask BUSY to understand my words (uses 1 daily AI request)"])
 assert.ok(ctl.includes(x)||screen.includes(x),"Client interpretation scope "+x);
assert.ok(screen.includes("Preview changes — do not save"));
console.log("V3.150 VOICE/LANGUAGE PASS: page microphone uses quota and review-only transcription; AI intent disabled by default and validated locally before preview.");
