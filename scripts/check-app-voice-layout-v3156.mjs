import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import {enabledAppKeys,proposeAppSectionMove,orderedAppModules}
 from "../src/core/appSectionOrder.mjs";
import {appRuntimeScreenSchema} from "../src/core/appRuntimeScreenSchema.mjs";
import {publicNativeMiniAppProjection}
 from "../supabase/functions/busy-mini-app-guest/publicNativeProjection.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const modules=["business_profile","services","enquiry","booking_request","contact"]
 .map(key=>({key,enabled:true,description:"owner supplied"}));
const config={modules,navigation:modules.map(x=>x.key),
  publicProfile:{businessName:"Example hair salon",phone:"01392 123123",
  services:[{name:"Haircuts",description:"Owner written services"}]},
  privateCustomerContacts:[{secret:"never share"}],
  payments:{enabled:false}};
const original=JSON.stringify(config);
const down=proposeAppSectionMove(config,{moduleKey:"services",direction:"down"});
assert.equal(down.ok,true,down.reason);
assert.deepEqual(down.after,["business_profile","enquiry","services","booking_request","contact"]);
assert.deepEqual(orderedAppModules(down.nextConfig).map(m=>m.key),down.after);
assert.deepEqual(orderedAppModules(config).map(m=>m.key),config.navigation);
assert.equal(down.publishes,false);
assert.equal(down.changesBookings,false);
assert.equal(down.changesPayments,false);
assert.equal(JSON.stringify(config),original,"Preview never mutates original");
const up=proposeAppSectionMove(down.nextConfig,{moduleKey:"services",direction:"up"});
assert.equal(up.ok,true);
assert.deepEqual(up.nextConfig.navigation,config.navigation,"One-step reverse restores order");
for(const input of [
 {moduleKey:"business_profile",direction:"up"},
 {moduleKey:"contact",direction:"down"},
 {moduleKey:"payments",direction:"up"},
 {moduleKey:"enquiry",direction:"left"},
 {moduleKey:"__proto__",direction:"up"}
])assert.equal(proposeAppSectionMove(config,input).ok,false);
assert.equal(enabledAppKeys({...config,navigation:["services","services"]}).ok,false);
assert.equal(enabledAppKeys({...config,navigation:["services","other","contact","enquiry","booking_request"]}).ok,false);
const catalog=modules.map(m=>({module_key:m.key,status:"available",title:m.key,
 capabilities:m.key==="booking_request"?{confirmation_required_by_business:true}:
 m.key==="enquiry"?{customer_action:true}:{} }));
const schema=appRuntimeScreenSchema(down.nextConfig,catalog);
assert.ok(schema.ok,schema.reason);
assert.deepEqual(schema.screens.map(s=>s.key),down.after);
assert.ok(schema.screens.find(s=>s.key==="booking_request").requiresBusinessConfirmation);
const id=x=>"00000000-0000-4000-8000-"+x;
const appId=id("000000000156"),versionId=id("000000000157");
const publicProjection=publicNativeMiniAppProjection({
 id:appId,status:"live",public_slug:"example-salon",display_name:"Example salon",
 current_live_version_id:versionId
},{
 id:versionId,config:{...down.nextConfig,display:{name:"Example salon"}},
}, {expectedAppId:appId,expectedVersionId:versionId});
assert.ok(publicProjection.ok,publicProjection.reason);
assert.deepEqual(publicProjection.moduleKeys,down.after);
assert.ok(!JSON.stringify(publicProjection).includes("never share"));
const sql=read("supabase/migrations/20261011190000_v3_156_app_voice_usage.sql");
for(const token of ["busy_app_voice_daily_usage","busy_reserve_app_voice_request",
 "enable row level security","service_role","from public.busy_business_memberships",
 "m.role in ('owner','admin')","where entry.requests<max_daily","revoke all on function"])
 assert.ok(sql.includes(token),"App voice secure usage "+token);
const command=read("supabase/functions/busy-command/index.ts");
const begin=command.indexOf('if(form.get("mode")==="app-selection-transcript-v1")');
const end=command.indexOf('if(form.get("mode")==="website-selection-transcript-v1"',begin);
assert.ok(begin>0&&end>begin);
const section=command.slice(begin,end);
for(const token of ["auth.auth.getUser(rawToken)","owner.data","current.data.draft_revision",
 "busy_reserve_app_voice_request","requiresReview:true","changesApplied:false",
 "action:null,command:null","audio.size>9_000_000"])
 assert.ok(section.includes(token),"App voice backend contract "+token);
assert.ok(section.indexOf("busy_reserve_app_voice_request")>
 section.indexOf("current.data.draft_revision"),"Do not bill before verifying app revision");
assert.ok(section.indexOf("transcribeAudio(audio)")>
 section.indexOf("busy_reserve_app_voice_request"),"App voice must reserve allowance first");
const appScreen=read("src/screens/miniApps.js");
const marketplace=appScreen.slice(appScreen.indexOf("function BusyAppsMarketplace({ s })"),
 appScreen.indexOf("function MiniAppBuilder({ s })"));
const builder=appScreen.slice(appScreen.indexOf("function MiniAppBuilder({ s })"),
 appScreen.indexOf("function MiniAppPreview({ s })"));
assert.ok(!marketplace.includes("pendingMove")&&!marketplace.includes("showAppVoice"));
for(const token of ["<WebsiteSelectedVoice key=", 'editorKind="app"',
 "transcribeSelectedAppAudio?.(uri,scope)",
 "movePrivateAppSection?.({",
 "Keep new order in PRIVATE app"])
 assert.ok(builder.includes(token),"App builder "+token);
// The old literal JSX assertion predates the original comparison extraction.
// Execute that comparison and original renderer instead of matching spelling.
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
const runtime=createRuntime(),{AppStudioComparison}=runtime.load('src/screens/appStudioComparison.js'),{MiniAppSurface}=runtime.load('src/screens/miniApps.js');
const seen=[],comparisonProps={original:config,proposed:down.nextConfig,renderSurface:value=>{seen.push(value);return {type:MiniAppSurface,props:{config:value}};}};
const walk=node=>Array.isArray(node)?node.flatMap(walk):node&&typeof node==='object'?[node,...walk(node.props?.children)]:[];
let comparisonTree=runtime.render(AppStudioComparison,comparisonProps);assert.equal(seen.at(-1),down.nextConfig);
let rendered=walk(comparisonTree).find(node=>node.type===MiniAppSurface);assert.ok(rendered);assert.match(JSON.stringify(runtime.render(MiniAppSurface,rendered.props)),/Owner written services/);
walk(comparisonTree).find(node=>node.props?.label==='Show original design').props.onPress();comparisonTree=runtime.render(AppStudioComparison,comparisonProps);assert.equal(seen.at(-1),config);
assert.ok(read("src/screens/websiteSelectedVoice.js").includes('const forApp=editorKind==="app"'));
const controller=read("src/app/AppController.js");
for(const token of ['form.append("mode","app-selection-transcript-v1")',
 'miniAppVoiceScopeRef.current','data.changesApplied!==false',
 'Number(data.app.draft_revision)!==Number(expectedRevision)+1'])
 assert.ok(controller.includes(token),"App controller "+token);
// Execute the original move adapter through its current shared mutation gate.
const ast=createRequire(import.meta.url)('@babel/parser').parse(controller,{sourceType:'module',plugins:['jsx']});let moveNode;
function visit(node){if(!node||typeof node!=='object')return;if(node.type==='VariableDeclarator'&&node.id?.name==='movePrivateAppSection'){assert.equal(moveNode,undefined);moveNode=node.init;}for(const value of Object.values(node))if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}
visit(ast);assert.ok(moveNode);let mutationCalls=0,applied=0;const notices=[],view={app:{id:'fixture-app',draft_revision:4}};
let receipt={ok:true,privateOnly:true,neverPublishes:true,movedModule:'services',app:{id:'fixture-app',draft_revision:5},status:{}};
const moveAdapter=Function('miniAppsView','setMiniAppsError','setMiniAppsAction','mutateCurrentAppDraft','applyMiniAppsStatus','setMiniAppsNotice','return ('+controller.slice(moveNode.start,moveNode.end)+');')(view,()=>{},()=>{},async(action,payload)=>{assert.equal(action,'move_section');assert.equal(payload.expectedRevision,4);mutationCalls++;return receipt;},()=>applied++,message=>notices.push(message));
assert.equal(await moveAdapter({moduleKey:'services',direction:'down',appId:'fixture-app',expectedRevision:3}),false);assert.equal(mutationCalls,0);
assert.equal(await moveAdapter({moduleKey:'services',direction:'down',appId:'fixture-app',expectedRevision:4}),true);assert.equal(applied,1);
receipt={...receipt,app:{id:'fixture-app',draft_revision:4}};assert.equal(await moveAdapter({moduleKey:'services',direction:'down',appId:'fixture-app',expectedRevision:4}),false);assert.equal(applied,1);
const server=read("supabase/functions/busy-mini-apps/index.ts");
for(const token of ['if (action === "move_section")',
 'await movePrivateAppModule(resolvedBusinessId,body)',
 '.eq("draft_revision",expected).select("*").maybeSingle()',
 'neverPublishes:true','"move_section"'])
 assert.ok(server.includes(token),"Server move permission "+token);
console.log("V3.156 APP VOICE/ORDER PASS: owner scope + finite 12/day voice allowance; one-step reversible section reorder shared by native and marketplace, never live.");
