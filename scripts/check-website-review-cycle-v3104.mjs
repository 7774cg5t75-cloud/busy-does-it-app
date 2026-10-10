import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runWebsiteDesignReviewCycle,changesAreDesignOnly,visualRisks} from "../supabase/functions/busy-website-worker/websiteReviewCycle.mjs";
import {normalizeVisualCritique} from "../supabase/functions/busy-website-worker/visualCriticContract.mjs";
let checks=0;
const yes=(value,why)=>{assert.ok(value,why);checks++;};
const equal=(a,b,why)=>{assert.deepEqual(a,b,why);checks++;};
const draft={
 id:"private-draft-abc",updatedAt:"2026-10-10T12:00:00Z",generation:3,
 businessName:"Fictional Gardening",businessType:"Gardening",sections:[{id:"hero",title:"Gardens",body:"Lawn care",enabled:true}],
 seo:{title:"Gardens"},publish:{enabled:false},theme:{heroLayout:"type-left"},html:"<html>Old</html>",
 designPlan:{signals:{approvedPhotos:0}}
};
const before=JSON.stringify(draft);
const first={mobile:Buffer.from("a"),desktop:Buffer.from("b"),
 mobileAudit:{horizontalOverflowPixels:28,headingVisible:true,navigationFits:false,heroHeadingFontPx:35},
 desktopAudit:{horizontalOverflowPixels:0,headingVisible:true,navigationFits:true,heroHeadingFontPx:44},source:"private-renderer"};
const second={mobile:Buffer.from("c"),desktop:Buffer.from("d"),
 mobileAudit:{horizontalOverflowPixels:0,headingVisible:true,navigationFits:true,heroHeadingFontPx:35},
 desktopAudit:{horizontalOverflowPixels:0,headingVisible:true,navigationFits:true,heroHeadingFontPx:44},source:"private-renderer"};
let captures=[],providerCalls=0,resembles=0;
const report=normalizeVisualCritique({reviewedScreenshots:true,summary:"Mobile service cards are cramped",
 proposals:[{path:"theme.cardLayout",value:"rows",reason:"Make service rows easier to scan"}]},{approvedPhotos:0});
const capture=async(d,opts)=>{captures.push(opts.stage);return opts.stage==="original"?first:second;};
const visionReview=async()=>{providerCalls++;return {status:"completed",source:"screenshot-ai",providerCalls:1,report,
 usage:{inputTokens:300,outputTokens:90}};};
const rebuildPrivateDraft=async(d)=>{resembles++;return {...d,html:"<html>New design with rows</html>",designPlan:{...d.designPlan}};};
const common={draft,tenantId:"tenant-a",allowedTenantId:"tenant-a",consent:true,
 captureScreenshots:capture,visionReview,rebuildPrivateDraft,allowPaidReview:true,
 creditReservation:{reservationId:"owner-reservation-id",tenantId:"tenant-a",status:"reserved",maxCalls:1}};
const wrong=await runWebsiteDesignReviewCycle({...common,allowedTenantId:"tenant-b",ownerApprovedSuggestions:true});
equal(wrong.status,"not-authorized","Cross-business request rejected");
equal(providerCalls,0,"No provider call on tenant mismatch");
const absent=await runWebsiteDesignReviewCycle({...common,consent:false,ownerApprovedSuggestions:true});
equal(absent.status,"consent-required","No silent screenshot capture");
equal(captures.length,0,"No screenshots without consent");
const audit=await runWebsiteDesignReviewCycle({...common,allowPaidReview:false});
equal(audit.status,"visual-audit-only","Offline review reports honestly");
equal(audit.calls,0,"Offline review does not spend credits");
const noCredit=await runWebsiteDesignReviewCycle({...common,creditReservation:null,ownerApprovedSuggestions:true});
equal(noCredit.status,"credit-reservation-required","Atomic credit reservation prerequisite");
equal(providerCalls,0,"Still no paid call");
const forbidden=await runWebsiteDesignReviewCycle({...common,creditReservation:{...common.creditReservation,tenantId:"tenant-b"}});
equal(forbidden.status,"credit-reservation-required","Cannot use another business's paid reservation");
const waiting=await runWebsiteDesignReviewCycle({...common,ownerApprovedSuggestions:false});
equal(waiting.status,"approval-required","Review is a suggestion, not automatic edit");
equal(providerCalls,1,"Exactly one paid call for the approved review");
equal(resembles,0,"No candidate generated without approval");
const good=await runWebsiteDesignReviewCycle({...common,ownerApprovedSuggestions:true});
equal(good.status,"candidate-ready","Owner-approved design preview created");
equal(good.calls,1,"At most one provider call per review cycle");
yes(good.comparison.improved,"Second real browser audit improves over initial");
equal(good.comparison.originalProblemCount,2,"Before problems are preserved");
equal(good.comparison.candidateProblemCount,0,"After problems measured independently");
equal(good.candidate.theme.cardLayout,"rows","Model proposal limited to theme");
equal(good.candidate.businessName,draft.businessName,"Customer details unchanged");
equal(good.published,false,"No auto publishing");
equal(JSON.stringify(draft),before,"Source website must not change");
equal(captures.slice(-2),["original","candidate"],"Fresh screenshots on both sides");
const unsafe=await runWebsiteDesignReviewCycle({...common,ownerApprovedSuggestions:true,
 rebuildPrivateDraft:async(d)=>({...d,businessName:"Not their brand",html:"fake"})});
equal(unsafe.status,"rejected-unsafe-change","Tampered candidate rejected");
yes(!changesAreDesignOnly(draft,{...draft,sections:[]}),"Customer sections immutable under AI");
yes(visualRisks({mobileAudit:first.mobileAudit,desktopAudit:first.desktopAudit}).length===2,"Measured issues cannot be invented by model");
const poor=await runWebsiteDesignReviewCycle({...common,ownerApprovedSuggestions:true,
 visionReview:async()=>({status:"completed",source:"screenshot-ai",providerCalls:2,report})});
equal(poor.status,"review-unverified","Reject multi-call violation");
const migration=readFileSync(new URL("../supabase/migrations/20261010154000_v3_104_website_visual_ai_meter.sql",import.meta.url),"utf8");
for(const marker of [
 "enabled boolean not null default false","monthly_request_cap integer not null default 2",
 "for update","busy_reserve_website_visual_ai_call","busy_finish_website_visual_ai_call",
 "from public,anon,authenticated","to service_role","return null; -- duplicate request keys",
 "unique (business_id, request_key)"
])yes(migration.includes(marker),"Future tenant-owned, no-surprise AI usage gate: "+marker);
console.log("V3.104 PASS: "+checks+" authenticated private review, charge reservation, owner consent, one AI call, safe candidate, browser recheck, no live edits.");
