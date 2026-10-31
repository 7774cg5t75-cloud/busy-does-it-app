import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {previewPrivateAppAppearance,OPTIONS} from "../src/core/appAppearanceEditing.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const source={schemaVersion:3,modules:[
 {key:"business_profile",enabled:true},{key:"booking_request",enabled:true}
],navigation:["business_profile","booking_request"],
 publicProfile:{businessName:"Owner Salon",contactPhone:"01234 567890"},
 presentation:{headerStyle:"refined",layoutDensity:"comfortable",navigationStyle:"tabs"},
 payments:{enabled:false},status:"private"};
const original=JSON.stringify(source);
const edit=previewPrivateAppAppearance(source,{field:"headerStyle",value:"bold"});
assert.ok(edit.ok,edit.reason);
assert.equal(edit.privateOnly,true);
assert.equal(edit.changesBooking,false);
assert.equal(edit.changesPayments,false);
assert.equal(edit.nextConfig.presentation.headerStyle,"bold");
assert.equal(edit.nextConfig.publicProfile.contactPhone,"01234 567890");
assert.equal(edit.nextConfig.modules[1].key,"booking_request");
assert.equal(JSON.stringify(source),original,"Never mutate original");
const undo=previewPrivateAppAppearance(edit.nextConfig,{field:"headerStyle",value:edit.previous});
assert.equal(undo.ok,true,undo.reason);
assert.deepEqual(undo.nextConfig.presentation,source.presentation);
for(const bad of [{field:"headerStyle",value:"<script>"},{field:"content",value:"paid"},
 {field:"payments",value:"enabled"},{field:"navigationStyle",value:"unsafe-url"},
 {field:"layoutDensity",value:"font-size:200px"}])
 assert.equal(previewPrivateAppAppearance(source,bad).ok,false);
assert.equal(previewPrivateAppAppearance(source,{field:"headerStyle",value:"refined"}).ok,false);
assert.equal(OPTIONS.headerStyle.length,3);
const api=read("supabase/functions/busy-mini-apps/index.ts");
for(const token of ['if (action === "set_appearance")',
 'await setPrivateAppAppearance(resolvedBusinessId,body,SUPABASE_URL==="https://pnjdlogwegnqbsfpcofw.supabase.co"?user.id:undefined)',
 'const expected=Number(body?.expectedRevision)',
 'expected!==Number(app.draft_revision)',
 '.eq("draft_revision",expected).select("*").maybeSingle()',
 'status:app.current_live_version_id?"update_pending":"draft"',
 'return {app:update.data,privateOnly:true',
 '"set_appearance",'])
 assert.ok(api.includes(token),"Server private design and no stale overwrites: "+token);
const start=api.indexOf("async function setPrivateAppAppearance(");
const finish=api.indexOf("async function preparePreview(",start);
assert.ok(start>0&&finish>start);
assert.ok(!api.slice(start,finish).includes('busy_mini_app_versions'));
assert.ok(!api.slice(start,finish).includes('publish'));
assert.ok(api.includes("async function setPrivateAppAppearance("));
const controller=read("src/app/AppController.js");
assert.ok(controller.includes('mutateCurrentAppDraft("set_appearance"') && controller.includes('send:miniAppsRequest') && controller.includes('executeAppDraftMutation({action,payload'));
assert.ok(controller.includes('data.app.draft_revision!==expectedRevision+1'));
const ui=read("src/screens/miniApps.js");
assert.ok(ui.includes("function MiniAppBuilder({ s })"));
assert.ok(ui.includes("Keep this appearance in my PRIVATE app"));
assert.ok(ui.includes("Discard appearance changes"));
assert.ok(ui.includes('previewPrivateAppAppearance(view.draftConfig,pendingAppearance)'));
console.log("V3.154 APPEARANCE PASS: preview, rollback planning, server optimistic revisions, no customer-data or payment changes.");
