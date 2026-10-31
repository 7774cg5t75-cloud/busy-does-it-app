import {planFunctionalBusinessApp} from './appExperiencePlanner.mjs';
import {inspectCapabilityIntent} from './universalBuilderPlanV3210.mjs';
import {supportedAppCatalogModule} from './appCatalogSupport.mjs';
import {executeAppDraftMutation} from './appDraftMutation.mjs';
import {privateAppEditSource} from './privateAppEditSession.mjs';
import {stableJson} from './stableJson.mjs';
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
// Adapts the original functional planner to the original build/apply authority.
// No new identity, database, module, form or paid planning call.
export function prepareGoalToPrivateApp({ownerId,businessId,app,profile,catalog,goal,selectedIds}={}){
 const fail=reason=>({ok:false,reason});
 if(!uuid.test(ownerId||'')||!uuid.test(businessId||'')||app)return fail('Open your signed-in business with no existing app. Existing apps stay in their original editor.');
 if(typeof goal!=='string'||!goal.trim()||goal.length>600||/[<>\u0000-\u001f]/.test(goal))return fail('Briefly describe what customers should be able to do.');
 if(!profile?.businessName||typeof profile.businessName!=='string'||!Array.isArray(profile.services)||!Array.isArray(catalog)||catalog.length>50)return fail('Review your approved business name and service information first.');
 if(new Set(catalog.map(r=>r?.module_key)).size!==catalog.length||catalog.some(r=>typeof r?.module_key!=='string'||!Number.isSafeInteger(r.module_version)||r.module_version<1))return fail('The current feature catalogue needs checking.');
 const services=profile.services;
 if(!Array.isArray(selectedIds)||!selectedIds.length||selectedIds.length>6||selectedIds.some(id=>typeof id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(id))||new Set(selectedIds).size!==selectedIds.length)return fail('Choose one to six genuine services for this first app. You can add more later.');
 const chosen=selectedIds.map(id=>services.find(r=>r.id===id));
 if(chosen.some(r=>!r||services.filter(s=>s.id===r.id).length!==1||typeof r.name!=='string'||!r.name.trim()||typeof r.description!=='string'||!r.description.trim())||new Set(chosen.map(r=>r.name.trim().toLowerCase())).size!==chosen.length)return fail('Review distinct services with approved descriptions. Ambiguous facts cannot be chosen automatically.');
 const intent=inspectCapabilityIntent(goal);
 if(!intent.valid||intent.conflicts.length||intent.requested.includes('booking_request'))return fail('This private creation journey supports service information, photos, contact and enquiries. Booking requests need their separate review.');
 const profileDraft=JSON.parse(JSON.stringify({...profile,services:chosen}));
 const experience=planFunctionalBusinessApp({businessId,businessName:profile.businessName,businessType:profile.businessType,businessGoals:goal,profile:profileDraft,catalog});
 if(experience.missingOwnerFacts.length||experience.unavailableGoalCapabilities.length||experience.needsClarification)return fail('Some requested information or features are unavailable. Review your approved services, photos and supported customer actions.');
 if(intent.requested.some(k=>!['services','enquiry','gallery','contact'].includes(k)))return fail('This first-app journey cannot safely prepare every requested action. Use the existing planner to review the broader request.');
 const allowed=new Set(['business_profile','services','contact','enquiry','gallery']);
 const modules=catalog.map(r=>({key:r.module_key,enabled:allowed.has(r.module_key)&&!!experience.suggestedModules.find(m=>m.key===r.module_key)?.suggested,reason:experience.suggestedModules.find(m=>m.key===r.module_key)?.reason||'Not included in this private app.'}));
 if(!supportedAppCatalogModule(catalog,'business_profile')||!modules.some(r=>r.key==='services'&&r.enabled))return fail('Service browsing is not currently available.');
 if(intent.requested.some(k=>['enquiry','gallery','contact'].includes(k)&&!modules.some(m=>m.key===k&&m.enabled)))return fail('A requested customer action is not available from the current catalogue.');
 const plan={summary:'Your services and supported customer actions',modules,offers:[],loyalty:{enabled:false},missingFacts:[],unsupportedRequests:[],planner:'original_functional_planner'};
 return {ok:true,version:1,ownerId,businessId,goal,selectedIds:[...selectedIds],source:stableJson({ownerId,businessId,profile,catalog}),profileDraft,plan,experience,privateOnly:true};
}
export async function executeGoalToPrivateApp({review,current,isCurrent,send}={}){
 const failed=reason=>({ok:false,reason,mayRetry:false});
 if(!review?.ok||typeof current!=='function'||typeof isCurrent!=='function'||!isCurrent())return failed('Review the current business and your request again.');
 const checked=prepareGoalToPrivateApp({...current(),goal:review.goal,selectedIds:review.selectedIds});
 if(!checked.ok||stableJson(checked)!==stableJson(review))return failed('Your business facts or selected services changed. Review again.');
 const scope={userId:review.ownerId,businessId:review.businessId,app:null};let created=null,status=null;
 const guard=()=>isCurrent()&&stableJson({ownerId:current().ownerId,businessId:current().businessId,profile:current().profile,catalog:current().catalog})===review.source;
 try{
  const before=await send('owner_status',{}, {isCurrent:guard});
  if(!guard()||before?.app) return failed('An app already exists or the workspace changed. Open the current app; nothing was replaced.');
  const built=await executeAppDraftMutation({action:'build_draft',payload:{profileDraft:review.profileDraft,expectedNoExistingApp:true},scope,isCurrent:guard,send});
  created=built.app;status=built.status;
  const independent=await send('owner_status',{}, {isCurrent:guard});
  if(!guard()||stableJson(privateAppEditSource({businessId:scope.businessId,app:independent?.app}))!==stableJson(privateAppEditSource({businessId:scope.businessId,app:created})))throw Error('The created app could not be independently checked.');
  const configured=await executeAppDraftMutation({action:'apply_app_plan',payload:{ownerRequest:review.goal,profileDraft:review.profileDraft,plan:review.plan,factAnswers:{}},scope:{...scope,app:created},isCurrent:guard,send});
  status=configured.status;
  const reopened=await send('owner_status',{}, {isCurrent:guard});
  const expected=privateAppEditSource({businessId:scope.businessId,app:configured.app}),actual=privateAppEditSource({businessId:scope.businessId,app:reopened?.app});
  if(!guard()||!expected||stableJson(expected)!==stableJson(actual))throw Error('The configured app needs independent inspection.');
  const config=reopened.app.draft_config;
  if(stableJson(config.publicProfile?.services)!==stableJson(review.profileDraft.services)||review.plan.modules.some(m=>config.modules?.filter(x=>x.key===m.key&&x.enabled===m.enabled).length!==1))throw Error('The saved service or feature selection differs from your review.');
  return {ok:true,status:reopened,app:reopened.app,created:true,configured:true,independentlyOpened:true,privateOnly:true,steps:2};
 }catch(error){
  // A read is an observation, never a reconstructed operation receipt.
  try{const observed=await send('owner_status',{}, {isCurrent:guard});if(guard()&&privateAppEditSource({businessId:scope.businessId,app:observed?.app}))status=observed;}catch{}
  return {...failed('The last step needs inspection. No creation or configuration was replayed. '+String(error?.message||'').slice(0,160)),partial:!!created,observedOnly:true,status:guard()?status:null};
 }
}
