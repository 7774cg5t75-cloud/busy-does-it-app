import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {VERDICTS,CONTEXTS,SOURCES,validateDesignFeedback,
 normalizeDesignHistory,rankDesignSuggestions}
 from "../src/core/appDesignLearning.mjs";
import {proposeCoordinatedAppChanges} from "../src/core/appCoordinatedStudio.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const appId="00000000-0000-4000-8000-000000000166";
const businessId="00000000-0000-4000-8000-000000000167";
const base={appId,expectedRevision:8,field:"galleryLayout",value:"stack",
 verdict:"better",context:"preview",source:"measured",ownerApproved:true,
 baselineWarnings:3,proposedWarnings:1};
assert.deepEqual(VERDICTS,["better","worse","not_quite_right"]);
assert.deepEqual(CONTEXTS,["preview","saved_revision"]);
assert.deepEqual(SOURCES,["measured","ai","responsive","manual"]);
const result=validateDesignFeedback(base);
assert.equal(result.ok,true,result.reason);
assert.equal(result.canChangeAIWeights,false);
assert.equal(result.noScreenshot,true);
assert.equal(result.doesNotProveImprovement,true);
assert.equal(result.interpretation,"owner_preference_not_applied");
assert.equal(validateDesignFeedback({...base,context:"saved_revision",expectedRevision:2}).ok,true);
assert.equal(validateDesignFeedback({...base,context:"saved_revision",expectedRevision:1}).ok,false);
for(const change of [
 {ownerApproved:false},{appId:"other"},{expectedRevision:0},
 {field:"customerData"},{value:"upload"},{verdict:"publish"},
 {context:"verified_website"},{source:"other-business"},
 {baselineWarnings:65},{proposedWarnings:-1}
])assert.equal(validateDesignFeedback({...base,...change}).ok,false,JSON.stringify(change));
const row=(field,value,verdict,context="preview",rev=8)=>({
 app_id:appId,draft_revision:rev,field,value,verdict,
 feedback_context:context,evidence_source:"measured",
 baseline_warnings:null,proposed_warnings:null
});
const history=normalizeDesignHistory([
 row("galleryLayout","stack","worse"),
 {...row("galleryLayout","stack","better"),app_id:"00000000-0000-4000-8000-000000000999"},
 row("navigationStyle","list","better"),
 {...row("imageCorners","rounded","better"),privateCustomerEmail:"secret@hidden.test"}
],appId);
assert.equal(history.ok,true);
assert.equal(history.records.length,3);
assert.equal(JSON.stringify(history).includes("secret@hidden.test"),false);
assert.equal(JSON.stringify(history).includes(businessId),false);
assert.equal(history.noAIModelRetrainingPerformed,undefined);
const config={
 modules:["business_profile","gallery","services","contact"].map(key=>({key,enabled:true})),
 navigation:["business_profile","gallery","services","contact"],
 presentation:{headerStyle:"refined",navigationStyle:"tabs",
  galleryLayout:"grid",layoutDensity:"compact",imageCorners:"rounded"},
 publicProfile:{services:[{name:"Service",description:"Safe"}]},
 secretCustomerRecords:[{email:"secret@hidden.test"}],payments:{enabled:false}
};
const before=JSON.stringify(config);
const ranked=rankDesignSuggestions(config,{
 history:history.records,
 measured:[
  {field:"galleryLayout",value:"stack"},
  {field:"navigationStyle",value:"list"},
  {field:"layoutDensity",value:"airy"}],
 ai:[{field:"headerStyle",value:"bold"}],
 responsive:[{field:"imageCorners",value:"square"}]
});
assert.equal(ranked.ok,true,ranked.reason);
assert.equal(ranked.suppressedCount,1);
assert.equal(ranked.ranked.some(x=>x.field==="galleryLayout"&&x.suppressed),true);
assert.deepEqual(ranked.recommended.map(x=>x.field),
 ["navigationStyle","layoutDensity","headerStyle"]);
assert.equal(ranked.preview.ok,true);
assert.equal(ranked.preview.operations.length,3);
assert.equal(ranked.preview.publishes,false);
assert.equal(ranked.ownerApprovalRequired,true);
assert.equal(ranked.automaticAITraining,false);
assert.equal(ranked.noCrossBusinessLearning,true);
assert.equal(JSON.stringify(config),before);
assert.deepEqual(ranked.preview.nextConfig.secretCustomerRecords,config.secretCustomerRecords);
assert.equal(proposeCoordinatedAppChanges(
 ranked.preview.nextConfig,ranked.preview.undoOperations).ok,true);
const updated=rankDesignSuggestions(config,{
 history:[{field:"galleryLayout",value:"stack",verdict:"better"},
          {field:"galleryLayout",value:"stack",verdict:"worse"}],
 measured:[{field:"galleryLayout",value:"stack"}]});
assert.equal(updated.ok,true);
assert.equal(updated.suppressedCount,0,"Most recent owner preference should win");
assert.equal(updated.recommended[0].field,"galleryLayout");
assert.equal(updated.recommended[0].score,47);
assert.equal(rankDesignSuggestions(config,{history:Array(81).fill({})}).ok,false);
assert.equal(rankDesignSuggestions(config,{measured:Array(13).fill({})}).ok,false);
assert.equal(read("src/core/appDesignLearning.mjs"),
 read("supabase/functions/busy-mini-apps/appDesignLearning.mjs"));
const edge=read("supabase/functions/busy-mini-apps/index.ts");
const handler=read("supabase/functions/busy-mini-apps/appDesignLearningService.mjs");
for(const needle of [
 '"design_learning_status"','"record_design_feedback"','"clear_design_feedback"',
 'const member = await membership','writeActions.has(action)',
 'resolvedBusinessId,user.id,body,requestId',
 'ownerDesignHistory(supabase,appForBusiness,resolvedBusinessId)',
 'eraseDesignHistory(supabase,appForBusiness'
])assert.ok(edge.includes(needle),"Missing secure owner backend: "+needle);
for(const needle of ['validateDesignFeedback(body)',
 '.eq("business_id",businessId).eq("app_id",app.id)',
 'Number(app.draft_revision)!==validated.expectedRevision',
 'validated.context==="saved_revision"',
 'app.draft_config?.presentation?.[validated.field]!==validated.value',
 'body?.ownerApproved!==true',
 '.order("created_at",{ascending:false})',
 '.limit(80)','request_key:requestKey'
])assert.ok(handler.includes(needle),"Missing tenant/revision feedback guard: "+needle);
const migration=read("supabase/migrations/20261011214500_v3_166_app_design_feedback.sql");
for(const needle of ['enable row level security',
 'revoke all on public.busy_app_design_feedback from public,anon,authenticated',
 'grant select,insert,delete on public.busy_app_design_feedback to service_role',
 'unique (business_id,request_key)','owner_user_id uuid not null',
 "feedback_context in ('preview','saved_revision')"])
 assert.ok(migration.includes(needle),"Missing privacy migration: "+needle);
const ctrl=read("src/app/AppController.js");
for(const needle of ['getAppDesignLearningStatus=async',
 'recordAppDesignPreference=async','clearAppDesignLearning=async',
 '.record(payload,miniAppsRequest','.clear(payload,miniAppsRequest','data.history.records'])
 assert.ok(ctrl.includes(needle),"Missing owner feedback client: "+needle);
const actions=read("src/core/appDesignFeedbackActions.mjs");
for(const needle of ["'record_design_feedback'","'clear_design_feedback'",'validateDesignFeedback(body)',
 'response.publishedAppUnchanged!==true','isCurrent:current'])
 assert.ok(actions.includes(needle),"Missing extracted owner feedback guard: "+needle);
const ui=read("src/screens/miniApps.js");
for(const needle of ['rankDesignSuggestions(config,',
 'designMemory?.ok?designMemory.records:[]',
 'recordDesignChoice("better","preview")',
 'recordDesignChoice("worse","preview")',
 'recordDesignChoice("not_quite_right","preview")',
 'recordDesignChoice("better","saved_revision")',
 'recordDesignChoice("worse","saved_revision")',
 'recordDesignChoice("not_quite_right","saved_revision")',
 'Clear this business','Why is Busy recommending these designs?',
 's.recordAppDesignPreference?.(','s.clearAppDesignLearning?.('])
 assert.ok(ui.includes(needle),"Missing owner-feedback UI: "+needle);
console.log("V3.166 PASS: strict private per-business design memory, evidence ranking, rejected-choice suppression, pre-save vs saved feedback separation, owner reset, tenant isolation and reversible owner-only previews.");
