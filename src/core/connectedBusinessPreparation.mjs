import {connectedBuilderObservation} from './connectedBuilderObservation.mjs';
import {stableJson} from './stableJson.mjs';
import {prepareSocialBrandHandoff} from './socialBrandHandoffV3199.mjs';
import {planUniversalBuilderRequest} from './universalBuilderPlanV3210.mjs';
import {planBusyGoal} from './busyGoalPlan.mjs';
import {websiteDraftHasScope} from './websiteDraftScope.mjs';
// Read-only handoffs into original domain planners. This is not shared storage,
// a writer, a task executor or a receipt. Each destination still owns approval.
export function prepareConnectedBusinessWork({basis,ownerId,businessId,website,app=null,catalog=[]}){
 if(!connectedBuilderObservation(basis,{ownerId,businessId},'profile')||!websiteDraftHasScope(website,businessId)||stableJson(basis.websiteDraft)!==stableJson(website)||app&&app.business_id!==businessId)return {ok:false,reason:'Reopen the exact current account website and approved business information.'};
 const p=basis.profile,profile={...p,businessId,fingerprint:basis.profileHash,email:p.contact?.email||'',phone:p.contact?.phone||'',theme:{primary:website.theme?.primary}};
 const content=prepareSocialBrandHandoff({businessId,approvedProfile:profile,sourceMode:'approved-profile',purpose:'business-introduction',treatment:'detailed'});
 const appPlan=planUniversalBuilderRequest({businessId,businessType:p.businessType||'',website,app,catalog,request:'Show business information, services and contact information. Let customers enquire.'});
 const growth=planBusyGoal({request:'I need more customers',profile,website,businessId});
 if(!content.ok||!appPlan.ok||!growth.recognised)return {ok:false,reason:'Current approved facts do not support all three private preparations yet.'};
 return {ok:true,kind:'connected_business_private_preparation',ownerId,businessId,source:{profileRevision:basis.profileRevision,profileHash:basis.profileHash,websiteId:website.id,websiteGeneration:website.generation,websiteHash:basis.websiteDraftHash,appId:app?.id||null,appRevision:app?.draft_revision||null},sourceStamp:stableJson([basis.profile,basis.profileRevision,basis.profileHash,website,app,catalog]),app:{plan:appPlan,businessName:p.businessName,description:p.description||'',services:p.services||[],contact:p.contact||{}},content,growth,privateOnly:true,requiresSeparateReview:true,noWritePerformed:true,noMediaAttached:true,mediaPermission:'Original private media review is required in each destination; website display approval alone is not marketing permission',noProviderCalls:true};
}
export function currentConnectedBusinessWork(review,input){const next=prepareConnectedBusinessWork(input);return next.ok&&next.ownerId===review?.ownerId&&next.businessId===review.businessId&&next.sourceStamp===review.sourceStamp;}
