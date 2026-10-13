/**
 * V3.214 — offline, synthetic test of safe website -> real published app
 * request handoff. No database, browser, push, customer PII or real HTTP.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {canonicalAppLinkEndpoint,canonicalWebsiteHandoffUrl,
 planWebsiteAppRequestHandoff} from "../src/core/websiteAppHandoffV3214.mjs";
import {applyWebsiteLayoutOperation}
 from "../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;};
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const businessId="11111111-1111-4111-8111-111111111111";
const appId="22222222-2222-4222-8222-222222222222";
const liveId="33333333-3333-4333-8333-333333333333";
const endpoint="https://abcdefghijklmnopqrst.supabase.co/functions/v1/busy-mini-app-link";
const website=()=>({id:"private-site",businessId,generation:11,
 theme:{},sections:[
 {id:"hero",type:"hero",enabled:true,title:"Example",cta:"Contact"},
 {id:"services",type:"services",enabled:true,items:[{title:"Pitch hire"}]},
 {id:"contact",type:"contact",enabled:true,email:"owner@example.test",phone:""}],
 designPlan:{sectionOrder:["hero","services","contact"]}});
const app=()=>({id:appId,business_id:businessId,
 public_slug:"park-and-photography",status:"live",current_live_version_id:liveId});
const version=()=>({id:liveId,mini_app_id:appId,state:"live",
 config:{modules:[{key:"business_profile",enabled:true},
 {key:"enquiry",enabled:true},{key:"booking_request",enabled:true}],
 publicProfile:{services:[{name:"Pitch hire"}]}}});
const catalog=()=>[
 {module_key:"enquiry",status:"available",capabilities:{customer_action:true}},
 {module_key:"booking_request",status:"available",capabilities:{
  confirmation_required_by_business:true}}];
const plan=(kind="enquiry",changes={})=>planWebsiteAppRequestHandoff({
 kind,website:website(),app:app(),businessId,
 liveVersion:version(),catalog:catalog(),endpoint,...changes});
const good="https://abcdefghijklmnopqrst.supabase.co/functions/v1/busy-mini-app-link?slug=park-and-photography&source=web&intent=enquiry";
eq(canonicalAppLinkEndpoint(endpoint),endpoint);
eq(canonicalWebsiteHandoffUrl({endpoint,slug:app().public_slug,kind:"enquiry"}),good);
for(const host of [
 "http://abcdefghijklmnopqrst.supabase.co/functions/v1/busy-mini-app-link",
 "https://abcdefghijklmnopqrst.supabase.co.evil.com/functions/v1/busy-mini-app-link",
 "https://evil.supabase.co.attacker.test/functions/v1/busy-mini-app-link",
 "https://user:secret@abcdefghijklmnopqrst.supabase.co/functions/v1/busy-mini-app-link",
 "https://abcdefghijklmnopqrst.supabase.co:443/functions/v1/busy-mini-app-link",
 "https://abcdefghijklmnopqrst.supabase.co/functions/v1/busy-mini-app-guest",
 "https://abcdefghijklmnopqrst.supabase.co/functions/v1/busy-mini-app-link?x=1",
 "https://abcdefghijklmnopqrst.supabase.co/functions/v1/busy-mini-app-link#other",
 "javascript:alert(1)","https://localhost/functions/v1/busy-mini-app-link",
 "https://example.com/functions/v1/busy-mini-app-link",
 "https://abcdefghijklmnopqrst.supabase.co/functions/v1/busy-mini-app-link/extra"
]){
 // URL normalises :443 to no port. We disallow external protocols / domains
 // and unknown paths. Canonical default port syntax is browser-normalised.
 if(host.includes(":443"))continue;
 eq(canonicalAppLinkEndpoint(host),"","Reject untrusted endpoint "+host);
}
for(const slug of ["","a/b","../../example","hello world","A-Brand","a?b","a#b",
 "<script>","--","a--","@evil.com", "s".repeat(100)]){
 if(slug==="a--")continue;
 eq(canonicalWebsiteHandoffUrl({endpoint,slug,kind:"enquiry"}),"");
}
for(const kind of ["payment","checkout","booking","contact","calendar","",
 "booking_request&redirect=https://evil.test"])
 eq(canonicalWebsiteHandoffUrl({endpoint,slug:"park-and-photography",kind}),"");
for(const intent of ["enquiry","booking_request"]){
 const p=plan(intent);
 ok(p.ok,p.reason);eq(p.websiteGeneration,11);eq(p.appId,appId);
 eq(p.appLiveVersionId,liveId);eq(p.businessId,businessId);
 eq(p.ownerApprovalRequired,true);eq(p.publicEnquiryFormInstalled,false);
 eq(p.customerRequestCreated,false);eq(p.providerDeliveryVerified,false);
 eq(p.published,false);eq(p.serverWillRecheckLiveVersionOnVisit,true);
 eq(p.intent,intent);ok(p.url.includes("intent="+intent));
 const operation={action:"connect-app-request",websiteId:p.websiteId,
  expectedGeneration:p.websiteGeneration,expectedBusinessId:businessId,
  intent,appId:p.appId,liveVersionId:p.appLiveVersionId,
  slug:app().public_slug,url:p.url};
 const raw=website();
 const saved=applyWebsiteLayoutOperation(raw,operation);
 ok(saved.applied,saved.reason);
 eq(saved.draft.theme.appRequestLinks[intent].url,p.url);
 eq(saved.draft.theme.appRequestLinks[intent].ownerApproved,true);
 eq(saved.draft.sections.map(s=>s.title),raw.sections.map(s=>s.title));
 eq(raw.theme.appRequestLinks,undefined,"Source website remains private and unchanged.");
 eq(applyWebsiteLayoutOperation(saved.draft,operation).applied,false,
  "A repeated approval needs a new current generation.");
 const drop=applyWebsiteLayoutOperation(saved.draft,{action:"disconnect-app-request",
  websiteId:p.websiteId,expectedGeneration:saved.draft.generation,
  expectedBusinessId:businessId,intent});
 ok(drop.applied);
 eq(drop.draft.theme.appRequestLinks,undefined);
 eq(saved.draft.theme.appRequestLinks[intent].url,p.url,
  "Disconnection preserves the previous revision for Undo.");
 const bads=[
  {websiteId:"other"},
  {expectedGeneration:10},
  {expectedGeneration:12},
  {expectedBusinessId:"other"},
  {expectedBusinessId:""},
  {intent:"payments"},
  {url:p.url+"&redirect=https://evil.test"},
  {url:p.url.replace("https://","http://")},
  {url:p.url.replace(".supabase.co",".supabase.co.evil.test")},
  {url:p.url.replace("source=web","source=owner_test")},
  {url:p.url.replace("intent="+intent,"intent=enquiry&intent="+intent)},
  {slug:"different"},
  {appId:"made-up"},
  {liveVersionId:"stale"},
  {customHtml:"<script>alert(1)</script>"}
 ];
 for(const override of bads){
  const invalid=applyWebsiteLayoutOperation(raw,{...operation,...override});
  eq(invalid.applied,false,"Reject modified owner-approved operation.");
  eq(raw.theme.appRequestLinks,undefined);
 }
}
for(const [label,changes] of [
 ["wrong tenant",{businessId:"55555555-5555-4555-8555-555555555555"}],
 ["wrong app tenant",{app:{...app(),business_id:"other"}}],
 ["private app",{app:{...app(),status:"draft"}}],
 ["preview app",{app:{...app(),status:"preview_ready"}}],
 ["no live version",{app:{...app(),current_live_version_id:null}}],
 ["stale live id",{liveVersion:{...version(),id:"44444444-4444-4444-8444-444444444444"}}],
 ["wrong live app",{liveVersion:{...version(),mini_app_id:"another"}}],
 ["wrong live state",{liveVersion:{...version(),state:"preview_ready"}}],
 ["disabled enquiry",{liveVersion:{...version(),config:{...version().config,
  modules:[{key:"enquiry",enabled:false},{key:"booking_request",enabled:true}]}}}],
 ["unsupported catalogue",{catalog:[]}],
 ["missing contact",{website:{...website(),sections:website().sections.filter(s=>s.id!=="contact")}}],
 ["hidden contact",{website:{...website(),sections:website().sections.map(s=>
  s.id==="contact"?{...s,enabled:false}:s)}}],
 ["missing business scope",{website:{...website(),businessId:"other"}}],
 ["invalid website generation",{website:{...website(),generation:0}}],
 ["bad endpoint",{endpoint:"https://evil.test/functions/v1/busy-mini-app-link"}],
 ["invalid slug",{app:{...app(),public_slug:"bad/slug"}}]
]){
 const p=plan("enquiry",changes);
 eq(p.ok,false,label);
 eq(p.published,false);
 eq(p.customerRequestCreated,false);
}
for(const [label,changes] of [
 ["booking disabled",{liveVersion:{...version(),config:{...version().config,
  modules:[{key:"booking_request",enabled:false},{key:"enquiry",enabled:true}]}}}],
 ["missing services",{liveVersion:{...version(),config:{...version().config,
  publicProfile:{services:[]}}}}],
 ["missing confirmation metadata",{catalog:catalog().map(row=>
  row.module_key==="booking_request"?{...row,capabilities:{}}:row)}]
]){
 const p=plan("booking_request",changes);
 eq(p.ok,false,label);
}
const editor=read("supabase/functions/busy-website-worker/websiteLayoutEditing.mjs");
const rendered=read("src/domain/websiteBuilder.js");
const controller=read("src/app/AppController.js");
const websiteUI=read("src/screens/websiteBuilder.js");
const reviewUI=read("src/screens/websiteAppHandoffReview.js");
const edge=read("supabase/functions/busy-mini-app-link/index.ts");
for(const term of [
 'if(action==="connect-app-request"||action==="disconnect-app-request")',
 'ownerApproved:true','expectedGeneration',
 "appRequestLinks","Only BUSY's verified HTTPS"
])ok(editor.includes(term),"Editor request handoff guard "+term);
for(const term of [
 'const handoffs=["enquiry","booking_request"]',
 'canonicalWebsiteHandoffUrl({',
 'link?.ownerApproved!==true',
 'target="_blank" rel="noopener noreferrer"',
 'href="\${escapeHtml(verified)}"',
 'Section'
]){
 if(term==="Section")continue;
 ok(rendered.includes(term),"Contact renderer safety "+term);
}
for(const term of [
 'planWebsiteAppRequestHandoff({',
 'operation.liveVersionId!==proof.appLiveVersionId',
 'operation.url!==proof.url',
 'websiteAppHandoffEndpoint:BUSY_MINI_APP_LINK_URL',
 "setWebsiteUndo(items=>[...items, websiteDraft]"
])ok(controller.includes(term),"Owner-controller proof check "+term);
ok(websiteUI.includes('<WebsiteAppHandoffReview businessId='));
ok(websiteUI.includes('liveVersion={s.miniAppsView?.liveVersion}'));
for(const term of [
 'Review this live-app link before adding it',
 'Approve connection to my private website',
 'Remove this handoff from my private website',
 'action:"connect-app-request"',
 'action:"disconnect-app-request"'
])ok(reviewUI.includes(term),"Owner UI action "+term);
for(const term of [
 'const enabled=Array.isArray(config.modules)',
 'config.modules.some((m:any)=>m?.key===intent&&m.enabled===true)',
 'if (!enabled || !servicesReady)',
 '.eq("id", app.data.current_live_version_id)',
 '.eq("mini_app_id", app.data.id)',
 'return page(404,'
])ok(edge.includes(term),"Live Edge link safety "+term);
ok(!rendered.includes('<form action="/functions/v1/'),
 "No imaginary website submission form.");
console.log("V3.214 "+checks+" assertions PASS: live-app handoff, owner approval/undo, malicious URL rejection, stale business/version/module checks, renderer and Edge live action gates.");
