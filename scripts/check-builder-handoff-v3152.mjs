import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {privateBuilderRevisionMatches,privateBuilderVisualIntegrity} from "../src/core/privateBuilderBoundary.mjs";
import {businessAppPreviewProof} from "../src/core/businessAppPreviewProof.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const businessId="00000000-0000-4000-8000-000000000001";
const appId="00000000-0000-4000-8000-000000000002";
const app={id:appId,workspaceId:businessId,generation:6,
 modules:[{id:"booking_request",enabled:true,ownerConfirmed:true}],
 publicProfile:{businessName:"Jenny's Hairdresser",
  phone:"01392 000000",services:[{id:"cut",title:"Haircuts"}]},
 theme:{typography:"confident",spacing:"comfortable"},
 status:"draft"};
assert.equal(privateBuilderRevisionMatches(app,{draftId:appId,generation:6}),true);
assert.equal(privateBuilderRevisionMatches(app,{draftId:appId,generation:7}),false);
const visual={...app,generation:7,theme:{...app.theme,typography:"refined"}};
assert.equal(privateBuilderVisualIntegrity(app,visual).ok,true);
assert.equal(privateBuilderVisualIntegrity(app,{...visual,
 modules:[{id:"payments",enabled:true}]}).ok,false,
 "Visual design may not add sensitive or chargeable App Builder modules");
assert.equal(privateBuilderVisualIntegrity(app,{...visual,
 publicProfile:{...app.publicProfile,phone:"0900 000000"}}).ok,false,
 "Visual AI must not rewrite public customer details");
assert.equal(privateBuilderVisualIntegrity(app,{...visual,
 workspaceId:"other-tenant"}).ok,false);
const proof=businessAppPreviewProof({app:{draft_revision:6},preview:{
 id:appId,version_no:2,source_draft_revision:6}});
assert.equal(proof.matches,true);
assert.equal(proof.canPublishAutomatically,false);
assert.equal(businessAppPreviewProof({app:{draft_revision:7},preview:{
 id:appId,version_no:2,source_draft_revision:6}}).matches,false);
const miniApps=read("src/domain/miniApps.js");
const server=read("supabase/functions/busy-mini-apps/index.ts");
assert.ok(miniApps.includes("buildMiniAppProfileDraft"));
assert.ok(miniApps.includes("businessCreationIntelligence"));
assert.ok(server.includes("supabase")||server.includes("createClient"));
console.log("V3.152 APP HANDOVER PASS: reusable visual-only guard works on bounded mini-app drafts; version and exact-owner publishing remain separately gated.");
