import {prepareSocialBrandHandoff} from './socialBrandHandoffV3199.mjs';
import {currentConnectedBusinessWork} from './connectedBusinessPreparation.mjs';
// A handoff selects an original editor. It is never a save or an execution receipt.
export async function continueConnectedBusinessEditor({review,destination,serviceId='',getState,isCurrent=()=>true}){
 const s=getState(),owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,scope=s.ownerWorkspaceScope;
 const current=()=>isCurrent()&&getState().ownerSession?.userId===owner&&getState().cloudWorkspace?.businessId===business&&getState().ownerWorkspaceScope===scope&&getState().cloudWorkspace?.role==='owner';
 if(!current()||!['app','content','growth'].includes(destination)||!s.connectedReadProfile)return {ok:false,reason:'Open your current business and review this starting point.'};
 const basis=await s.connectedReadProfile();if(!current())return {ok:false,reason:'Your account changed. Existing work was kept.'};
 const now=getState(),input={basis,ownerId:owner,businessId:business,website:now.websiteDraft,app:now.miniAppsStatus?.app||null,catalog:now.miniAppsStatus?.catalog||[]};
 if(!currentConnectedBusinessWork(review,input))return {ok:false,reason:'Approved facts or a source changed. Prepare a fresh starting point; existing work was kept.'};
 if(destination==='app'){
  const goal='Show business information, services and contact information. Let customers enquire.';
  if(typeof now.setMiniAppBuildBrief!=='function'||typeof now.go!=='function'||now.miniAppBuildBrief&&now.miniAppBuildBrief!==goal)return {ok:false,reason:'Your unfinished App goal was kept. Continue it in the App Builder before replacing it.'};
  now.setMiniAppBuildBrief(goal);now.go('miniAppBuilder');
 }else if(destination==='content'){
  const local=prepareSocialBrandHandoff({website:now.websiteDraft,app:now.miniAppsStatus?.app,businessId:business,approvedProfile:now.businessCreationIntelligence?.sharedProfile,sourceMode:'approved-profile',purpose:'business-introduction',treatment:'detailed'});
  if(!local.ok||local.copy!==review.content.copy)return {ok:false,reason:'Creator’s current approved facts differ. Review Business Identity before continuing.'};
  if(!now.socialContentActions?.prepare)return {ok:false,reason:'The original Content Creator is unavailable.'};
  // prepare creates the original pending idea. Its own Use/Keep review protects
  // current words/photos. No media-use permission is inferred from a website.
  if(now.socialContentActions.prepare('','','approved-profile','business-introduction','','detailed',false,'social')!==true)return {ok:false,reason:'Creator kept your current work. Reopen its source review.'};
 }else{
  const service=basis.profile.services?.find(x=>x.id===serviceId);
  if(!service||!service.name||basis.profile.services.filter(x=>x.name===service.name).length!==1||!now.businessCreationIntelligence?.sharedProfile?.services?.some(x=>x.id===service.id&&x.name===service.name)||typeof now.setGrowthProjectFocus!=='function'||typeof now.go!=='function')return {ok:false,reason:'Choose one current approved service for your private growth preparation.'};
  if(now.growthProjectFocus&&now.growthProjectFocus!==service.name)return {ok:false,reason:'Your existing Growth preparation was kept. Continue it before choosing another service.'};
  now.setGrowthProjectFocus(service.name);now.go('businessCreationJourney');
 }
 return {ok:true,destination,privateOnly:true,saved:false,published:false,mediaAttached:false};
}
