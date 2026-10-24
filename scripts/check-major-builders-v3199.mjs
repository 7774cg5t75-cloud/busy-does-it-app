import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {prepareSocialBrandHandoff,confirmSocialBrandHandoff}
 from "../src/core/socialBrandHandoffV3199.mjs";
import {suggestFirstAppNextStep}
 from "../src/core/firstAppNextStepV3199.mjs";
import {buildBusinessBrandDnaSnapshot}
 from "../src/core/businessBrandDnaV3195.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let checks=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++};
const ok=(v,m)=>{assert.ok(v,m);checks++};
const b="00000000-0000-4000-8000-000000003199";
const website={id:"example-salon-website",generation:6,businessId:b,
 businessName:"Example Salon",businessType:"hair salon",
 theme:{primary:"#667788",typography:"friendly"},
 sections:[{id:"hero",type:"hero",body:"Appointments with care"},
 {id:"about",type:"about",body:"Local appointment studio."},
 {id:"services",type:"services",enabled:true,
 items:[{id:"service-1",title:"Haircuts",body:"Cuts suited to your needs."}]}]};
const config={schemaVersion:1,surface:"busy_mini_app",
 display:{name:"Example Salon",category:"hair salon",tagline:"Appointments with care"},
 presentation:{brandPalette:"custom",brandAccent:"#667788",
  typeStyle:"friendly",serviceStyle:"cards"},
 modules:[{key:"business_profile",enabled:true},{key:"services",enabled:true},
 {key:"booking_request",enabled:true},{key:"enquiry",enabled:false}],
 navigation:["business_profile","services","booking_request"],
 publicProfile:{businessName:"Example Salon",businessType:"hair salon",
 tagline:"Appointments with care",about:"Local appointment studio.",
 services:[{name:"Haircuts",description:"Cuts suited to your needs."}],
 privateContact:"INTERNAL_DO_NOT_USE",
 assets:{gallery:[{uri:"https://example.invalid/private.jpg",approved:false}]}}};
const app={id:"owner-app",business_id:b,draft_revision:9,
 category:"hair salon",status:"draft",draft_config:config};
const dna=buildBusinessBrandDnaSnapshot({website,app,businessId:b});
ok(dna.ok,dna.reason);eq(dna.conflicts.length,0);
const conflicting={...website,sections:website.sections.map(section=>section.id==='services'?{...section,items:section.items.map(item=>({...item,body:'Different owner service copy'}))}:section)};
eq(prepareSocialBrandHandoff({website:conflicting,app,businessId:b}).ok,false,'Divergent service descriptions still require owner resolution');
const first=prepareSocialBrandHandoff({website,app,businessId:b});
ok(first.ok,first.reason);eq(first.kind,"private_social_brand_handoff_v3199");
eq(first.businessId,b);
ok(first.copy.includes("Example Salon"));
ok(first.copy.includes("Haircuts"));
ok(!first.copy.includes("INTERNAL_DO_NOT_USE"));
ok(!first.copy.includes("private.jpg"));
eq(first.noMediaAttached,true);
eq(first.neverPublishes,true);
eq(first.ownerMustReviewBeforeDraftSave,true);
eq(confirmSocialBrandHandoff({website,app,businessId:b,evidence:first}).ok,true);
for(const p of [
 {website:{...website,generation:7},app,businessId:b,evidence:first},
 {website,app:{...app,draft_revision:10},businessId:b,evidence:first},
 {website,app:{...app,business_id:"another"},businessId:b,evidence:first},
 {website,app,businessId:"other-business",evidence:first},
 {website,app,businessId:b,evidence:{...first,copy:"I sell counterfeit goods"}},
 {website,app,businessId:b,evidence:{...first,source:{...first.source,websiteId:"other"}}},
 {website,app,businessId:b,evidence:null},
 {website,app,businessId:b,evidence:{...first,brandColour:"#FFFFFF"}}
])eq(confirmSocialBrandHandoff(p).ok,false);
const changed={...website,sections:website.sections.map(s=>
 s.id==="hero"?{...s,body:"Changed owner words"}:s)};
eq(confirmSocialBrandHandoff({website:changed,app,businessId:b,evidence:first}).ok,false);
const wrongTenant={...app,business_id:"other-business"};
eq(prepareSocialBrandHandoff({website,app:wrongTenant,businessId:b}).ok,false);
const conflict={...app,draft_config:{...config,
 publicProfile:{...config.publicProfile,tagline:"Different app words"}}};
eq(prepareSocialBrandHandoff({website,app:conflict,businessId:b}).ok,false);
const next=suggestFirstAppNextStep({website,app,businessId:b});
eq(next.show,true);eq(next.stage,"test_customer_action");
eq(next.industry,"appointment");
ok(next.why.includes("not an accepted appointment"));
eq(next.neverPublishes,true);eq(next.doesNotActivateModules,true);
eq(next.noLiveCustomerOutcomeVerified,true);
eq(suggestFirstAppNextStep({website,app:{...app,draft_config:{...config,presentation:{}}},businessId:b}).stage,"review_brand");
eq(suggestFirstAppNextStep({website,app:{...app,draft_config:{...config,
 modules:[{key:"business_profile",enabled:true}] }},businessId:b}).stage,"configure_action");
eq(suggestFirstAppNextStep({website,app:wrongTenant,businessId:b}).show,false);
eq(suggestFirstAppNextStep({website,app:{...app,draft_revision:"9"},businessId:b}).show,false);
const db=read("supabase/migrations/20261013081000_v3199_atomic_first_private_app.sql");
for(const token of [
 "busy_create_first_mini_app_draft_v3199",
 "security definer set search_path = ''",
 "m.role in ('owner','admin')",
 "from public.busy_businesses where id=p_business_id for update",
 "and app_key='main' for update",
 "unique", // note: UNIQUE is enforced by V3.39, referenced in comment
 "return jsonb_build_object('created',false",
 "insert into public.busy_mini_apps",
 "draft_revision,draft_profile_revision",
 "'draft',false,2",
 "revoke all on function",
 "grant execute on function",
 "to service_role"
])ok(db.toLowerCase().includes(token.toLowerCase()),"Missing transactional SQL guard: "+token);
ok(!db.includes("grant execute on function public.busy_create_first_mini_app_draft_v3199("+
 "uuid"),"No grant should appear without its proper formatted argument list");
const edge=read("supabase/functions/busy-mini-apps/index.ts");
for(const token of [
 'if(body?.expectedNoExistingApp===true)',
 'supabase.rpc("busy_create_first_mini_app_draft_v3199"',
 'const firstConfig=buildConfig(profile,catalog,revision,null)',
 'if(created?.created!==true)',
 'return {app,source:"atomic_first_private_app_v3199"',
 'const app = await ensureApp(businessId, userId, profile);'
])ok(edge.includes(token),"Missing first-app RPC integration: "+token);
const social=read("src/screens/social.js");
for(const token of [
 "prepareSocialBrandHandoff({...currentBrandInput(),serviceName})",
 "confirmSocialBrandHandoff({...currentBrandInput()",
 'Alert.alert("Replace your caption?"',
 'onPress={s.saveGeneratedSocialDraft}',
 'disabled={!s.socialDraftText.trim()||analysing}',
 "s.setSocialDraftText(fresh.copy)",
 "setBrandReview(null);setBrandedCaptionAccepted(false)"
])ok(social.includes(token),"Missing social owner-review wiring: "+token);
ok(read("src/screens/miniApps.js").includes("suggestFirstAppNextStep({"));
console.log("V3.199 "+checks+
 " transactional-first-app, tenant-bound brand handoff, owner approval, industry next-steps and zero-publish contracts PASS.");
