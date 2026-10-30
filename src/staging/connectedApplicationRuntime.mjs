import {createCreatorDraftAccount} from '../core/creatorDraftAccount.mjs';
import {createGrowthOpportunityAccount} from '../core/growthOpportunityAccount.mjs';
import {privateWebsiteDesignScope} from './privateWebsiteDesignScope.mjs';
import {createCanonicalWorkSession} from '../core/canonicalWorkSession.mjs';
import {createJourneyRestorer} from './connectedJourneyRestore.mjs';
import {createConnectedBuilderSession} from './connectedBuilderSession.mjs';
import {stableJson} from '../core/stableJson.mjs';
import {restrictLegacyTransport} from '../core/connectedTransportBoundary.mjs';
export {connectedTransportRestricted} from '../core/connectedTransportBoundary.mjs';
const capabilities=new WeakSet();
export const isConnectedApplicationRuntime=value=>!!value&&capabilities.has(value)&&value.active;
// Local capability only: all authorisation remains in the original server calls.
// No bearer token, device cache or editable metadata is put into AppController.
export function createConnectedApplicationRuntime({environment,inspector,basis,appStatus,onExit}){
 if(environment!=='isolated-staging'||!inspector?.configured||!inspector.signedIn||!basis?.actorId||!basis.businessId||!basis.profile?.businessName)throw Error('Verify your staging business before opening Busy');
 restrictLegacyTransport(environment);let active=true,pending=false,packet=basis,status=appStatus,live=null;
 const sessionVersion=inspector.sessionVersion;
 const scope=JSON.stringify([basis.actorId,basis.businessId]);
 const current=()=>active&&inspector.signedIn&&inspector.sessionVersion===sessionVersion&&JSON.stringify([packet.actorId,packet.businessId])===scope;
 const session=createConnectedBuilderSession({request:(a,p)=>inspector.requestConnected(a,p)});
 const check=()=>{if(!current())throw Error('Business access changed');};
 const request=async(a,p={})=>{check();const r=await inspector.requestConnected(a,{...p,businessId:basis.businessId,expectedProfileRevision:packet.profileRevision});check();return r;};
 const perform=async fn=>{check();if(pending)throw Error('Finish the current review first');pending=true;try{return await fn();}finally{pending=false;}};
 const workScope={},restorer=createJourneyRestorer({businessId:basis.businessId,ownerId:basis.actorId});
 const canonical=createCanonicalWorkSession().bind({enabled:true,getCurrent:()=>({scope:workScope,ready:current(),ownerId:basis.actorId,businessId:basis.businessId,role:'owner',revision:live?.cloudRevision??packet.revision}),authenticatedRequest:(name,body)=>request('work_'+name,body),evidence:'isolated-staging; server activation required'});
 const contentScope={},contentCurrent=()=>({scope:contentScope,ready:current(),ownerId:basis.actorId,businessId:basis.businessId,role:'owner'});
 const creator=createCreatorDraftAccount({enabled:true,getCurrent:contentCurrent,authenticatedRequest:(name,body,before)=>{check();if(!before())throw Error('Review changed');return request('creator_'+name,body);}});
 const growth=createGrowthOpportunityAccount({enabled:true,getCurrent:contentCurrent,authenticatedRequest:(name,body,before)=>{check();if(!before())throw Error('Review changed');return request('growth_'+name,body);}});
 const api={get active(){return current();},ownerId:basis.actorId,businessId:basis.businessId,get profile(){return packet.profile;},get profileRevision(){return packet.profileRevision;},get websiteDraft(){return packet.websiteDraft;},appStatus,
  async requestApp(action,payload,options={}){if(!['owner_status','build_draft','apply_app_plan','apply_coordinated_edits','set_module','move_section','set_appearance'].includes(action)||options.includeBusiness===false||options.isCurrent&&!options.isCurrent())throw Error('This action is not connected in staging');const result=await request(action,payload);if(options.isCurrent&&!options.isCurrent())throw Error('Your app changed during the request');return result;},
  async verify(){check();const r=await request('builder_read');if(r.actorId!==basis.actorId)throw Error('Owner changed');return r;},
  dispose(){active=false;session.clear();live=null;},
  project(s){check();live=s;const notice=text=>{if(current())s.setWebsiteBuilderNotice?.(text);};
   const saveWebsite=(action,patch)=>{const reviewed=s.websiteDraft;return perform(async()=>{const now=session.scope?await session.read():await session.open(basis.businessId);if(live?.websiteDraft!==reviewed||stableJson(now.websiteDraft)!==stableJson(reviewed))throw Error('Your website changed. Keep your work and inspect its account version.');const result=await session.website({basis:now,action,patch,ownerApproved:true});if(!current())return {ok:false,stale:true};if(result.ok&&live?.websiteDraft===reviewed){packet=result.observed;s.setWebsiteDraft?.(packet.websiteDraft);notice(result.receipt.historyHash?'Private website and history saved and independently reopened.':'Private website saved and independently reopened. Account history is unavailable for this server version.');return result;}notice(result.reason||'Save not confirmed. Keep your work and inspect the account before another review.');return {...result,ok:false};}).catch(error=>{notice(error.message);return {ok:false,reason:error.message};});};
   const notConnected=()=>{s.setBusinessCreationError?.('Review and save approved account facts in Business Identity. This shortcut is not account-backed.');return false;};
   return {answerBusinessCreationQuestion:notConnected,confirmConversationFact:notConnected,propagateBusinessCreationChanges:notConnected,creatorDraftAccount:creator,growthOpportunityAccount:growth,canonicalWork:canonical,connectedRuntime:api,connectedEnvironment:'Isolated staging — private drafts',
    signOutOwner:async()=>{api.dispose();await inspector.signOut();onExit?.();},
    connectedReturnToInspector:()=>{api.dispose();onExit?.();},
    refreshMiniAppsStatus:async()=>perform(async()=>{status=await request('owner_status');s.setMiniAppsStatus?.({...status,loaded:true});return true;}),
    buildWebsiteFromBrandBrain:async()=>perform(async()=>{if(s.websiteDraft){notice('Your existing private draft was kept. Use its original editor.');return false;}const now=await session.open(basis.businessId);if(!current())return false;const r=await session.website({basis:now,action:'create',sourceRevision:now.profileRevision,ownerApproved:true});if(r.ok){packet=r.observed;s.setWebsiteDraft?.(packet.websiteDraft);notice('Private website saved and independently reopened.');s.go('websiteBuilder');return true;}notice(r.reason);return false;}),
    applyWebsiteFieldChange:patch=>{saveWebsite('edit_text',patch);return false;},
    applyWebsiteLayoutAction:(operation,options={})=>{if(!privateWebsiteDesignScope(s.websiteDraft,basis.businessId,options)){notice('Review the current website design. This target changed or the requested feedback is not connected yet.');return false;}saveWebsite('edit_design',operation);return false;},
    restoreWebsiteRecoveryPoint:()=>{notice('Device recovery points cannot replace an account draft yet. Use saved account Undo and Redo.');return false;},
    canUndoWebsite:(packet.websiteUndoCount||0)>0,canRedoWebsite:(packet.websiteRedoCount||0)>0,
    undoWebsiteChange:()=>saveWebsite('undo'),redoWebsiteChange:()=>saveWebsite('redo'),
    applyWebsitePageInstruction:async operation=>{const result=await saveWebsite('edit_instruction',operation);return {applied:result.ok===true,reason:result.ok?'Reviewed page changes saved together as one private revision.':result.reason||'Save outcome needs account inspection. Your wording was kept.'};},
    applyWebsitePageAction:operation=>{saveWebsite('edit_page',operation);return false;},
    connectedReadWebsiteHistory:()=>perform(async()=>{const now=await request('builder_read');if(stableJson(s.websiteDraft)!==stableJson(now.websiteDraft))throw Error('Inspect the current saved website before its history.');return request('website_history',{p_expected_revision:now.revision,p_expected_hash:now.websiteDraftHash,p_direction:null});}),
    connectedReadProfile:async()=>{if(!session.scope)return session.open(basis.businessId);return (await session.reconcile()).observed;},
    connectedSaveProfile:({basis:reviewed,profile})=>perform(async()=>{if(!session.scope)await session.open(basis.businessId);const r=await session.profile({basis:reviewed,profile,ownerApproved:true});if(r.ok){check();packet=r.observed;s.setBusinessName?.(profile.businessName);s.setTrade?.(profile.businessType||'');s.setServices?.(old=>(profile.services||[]).map(row=>({...old.find(x=>x.id===row.id),...row})));s.setBrandProfile?.(old=>({...old,tagline:profile.tagline||'',publicDescription:profile.description||'',serviceAreaText:profile.serviceArea||'',phone:profile.contact?.phone||'',email:profile.contact?.email||'',serviceDescriptions:Object.fromEntries((profile.services||[]).map(x=>[x.id,x.description||'']))}));}return r;}),
    connectedAccountRead:()=>perform(async()=>{if(s.websiteDraft&&stableJson(s.websiteDraft)!==stableJson(packet.websiteDraft))throw Error('Keep or discard your unfinished website before opening its account version.');const now=session.scope?(await session.reconcile()).observed:await session.open(basis.businessId);packet=now;s.setWebsiteDraft?.(packet.websiteDraft);return true;}),
    connectedRestoreJourneys:async(after=null,revision=null)=>perform(async()=>{const customers=live.customers,inboxItems=live.inboxItems,stamp=stableJson([customers,inboxItems]);const page=await request('journey_list',{after,expectedRevision:revision});if(live.customers!==customers||live.inboxItems!==inboxItems||stableJson([customers,inboxItems])!==stamp)throw Error('Newer local work was kept');const plan=restorer.plan(page,{customers,inboxItems});check();plan.commit();live.setCustomers(plan.customers);live.setInboxItems(plan.inboxItems);live.setCloudRevision(plan.revision);return page;}),
    connectedInstallEnquiry:record=>{check();try{const plan=restorer.plan({businessId:basis.businessId,ownerId:basis.actorId,revision:record.revision,items:[{state:'Filed',record}],notOwnReceipt:true},live);plan.commit();live.setCustomers(plan.customers);live.setInboxItems(plan.inboxItems);live.setCloudRevision(plan.revision);return true;}catch{return false;}},
    connectedRequest:request};
  }
 };
 capabilities.add(api);return api;
}
