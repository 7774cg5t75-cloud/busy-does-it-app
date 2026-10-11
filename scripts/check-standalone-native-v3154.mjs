import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";
import {decideStandaloneEligibility} from "../supabase/functions/busy-mini-apps/standaloneEligibility.mjs";
import {nativeShellDescriptor} from "../src/core/standaloneNativePackage.mjs";
import {buildAppDistributionPlan,buildStandalonePrivateHandoff} from "../src/core/appDistributionChoices.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const biz="00000000-0000-4000-8000-000000000321",version="00000000-0000-4000-8000-000000000322";
const row={business_id:biz,source:"verified_provider_webhook",provider_verified:true,
 external_subscription_id:"subscription-verified-1",status:"active",allowance:2,used:1,period_end:"2026-11-11T00:00:00Z"};
const scope={businessId:biz,nowISO:"2026-10-11T17:00:00Z"};
assert.equal(decideStandaloneEligibility(row,scope).remaining,1);
for(const [bad,context] of [
 [{...row,source:"client_claim"},scope],[{...row,provider_verified:false},scope],
 [{...row,external_subscription_id:""},scope],[{...row,status:"revoked"},scope],
 [{...row,used:2},scope],[row,{...scope,businessId:"other"}],
 [row,{...scope,nowISO:"2026-11-12T00:00:00Z"}],[null,scope]])
 assert.equal(decideStandaloneEligibility(bad,context).eligible,false);
const catalog=["business_profile","services","booking_request","enquiry"].map(key=>({
 module_key:key,title:key,status:"available",
 capabilities:key==="booking_request"?{confirmation_required_by_business:true}:
  key==="enquiry"?{customer_action:true}:{} }));
const app={id:biz,draft_revision:2,display_name:"Example Salon"};
const preview={id:version,version_no:1,source_draft_revision:2,
 config:{display:{name:"Example Salon"},modules:catalog.map(x=>({key:x.module_key,enabled:true}))}};
const plan=buildAppDistributionPlan({mode:"standalone",app,preview,
 acknowledgements:{externalFees:true,externalAccounts:true,storeApproval:true,ongoingCosts:true},
 requestedPlatforms:["ios","android"]});
const handoff=buildStandalonePrivateHandoff({app,preview,plan,catalog,ownerConfirmed:true});
assert.equal(handoff.ok,true,handoff.reason);
const d=nativeShellDescriptor(handoff);
assert.equal(d.ok,true,d.reason);
assert.equal(d.signingConfigured,false);
assert.equal(d.appStoreSubmitEnabled,false);
assert.equal(d.buildIsProductionReady,false);
assert.ok(d.iosBundleIdentifier.includes("prototype"));
assert.equal(d.screenSchema.screens.find(x=>x.key==="booking_request").nativeActionEnabled,false);
assert.equal(d.screenSchema.screens.find(x=>x.key==="booking_request").requiresBusinessConfirmation,true);
for(const bad of [
 {...handoff,packageProduced:true},{...handoff,ownerAppId:"invalid-id"},
 {...handoff,modules:[...handoff.modules,"payments"]},
 {...handoff,platformTargets:["ios","ios"]},
 {...handoff,appName:"<script>"}
])assert.equal(nativeShellDescriptor(bad).ok,false);
const appShell=read("standalone/template/App.js");
assert.ok(parse(appShell,{sourceType:"module",plugins:["jsx"]}).program.body.length>4);
assert.ok(appShell.includes("SafeAreaView")&&appShell.includes("Pressable"));
assert.ok(!appShell.includes("WebView")&&!appShell.includes("fetch("));
assert.ok(!appShell.includes("makePayment")&&!appShell.includes("sendBooking"));
assert.ok(parse(read("standalone/template/app.config.js"),{sourceType:"unambiguous"}).program.body.length>0);
const api=read("supabase/functions/busy-mini-apps/index.ts");
for(const item of [
 'if (action === "standalone_eligibility_status")',
 '.from("busy_standalone_entitlements")','decideStandaloneEligibility(record.data',
 'const member = await membership('
])assert.ok(api.includes(item));
const migration=read("supabase/migrations/20261011180700_v3_154_standalone_entitlements.sql");
for(const item of ["enable row level security","revoke all","service_role",
 "source='verified_provider_webhook'","provider_verified","used<=allowance"])
 assert.ok(migration.includes(item));
const screen=read("src/screens/miniApps.js"),ctrl=read("src/app/AppController.js");
assert.ok(screen.includes("Check my standalone subscription benefit"));
assert.ok(screen.includes("standaloneEligibility?.businessId===s.cloudWorkspace?.businessId"));
assert.ok(ctrl.includes('miniAppsRequest("standalone_eligibility_status")'));
console.log("V3.154 NATIVE ELIGIBILITY PASS: server evidence, native schema, no false bookings, no billing or store submission.");