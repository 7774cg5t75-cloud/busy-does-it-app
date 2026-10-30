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
 const api={get active(){return current();},ownerId:basis.actorId,businessId:basis.businessId,get profile(){return packet.profile;},get websiteDraft(){return packet.websiteDraft;},appStatus,
  async requestApp(action,payload,options={}){if(!['owner_status','build_draft','apply_app_plan','apply_coordinated_edits','set_module','move_section','set_appearance'].includes(action)||options.includeBusiness===false||options.isCurrent&&!options.isCurrent())throw Error('This action is not connected in staging');const result=await request(action,payload);if(options.isCurrent&&!options.isCurrent())throw Error('Your app changed during the request');return result;},
  async verify(){check();const r=await request('builder_read');if(r.actorId!==basis.actorId)throw Error('Owner changed');return r;},
  dispose(){active=false;session.clear();live=null;},
  project(s){check();live=s;const notice=text=>s.setWebsiteBuilderNotice?.(text);
   const notConnected=()=>{s.setBusinessCreationError?.('Review and save approved account facts in Business Identity. This shortcut is not account-backed.');return false;};
   return {answerBusinessCreationQuestion:notConnected,confirmConversationFact:notConnected,propagateBusinessCreationChanges:notConnected,creatorDraftAccount:creator,growthOpportunityAccount:growth,canonicalWork:canonical,connectedRuntime:api,connectedEnvironment:'Isolated staging — private drafts',
    signOutOwner:async()=>{api.dispose();await inspector.signOut();onExit?.();},
    connectedReturnToInspector:()=>{api.dispose();onExit?.();},
    refreshMiniAppsStatus:async()=>perform(async()=>{status=await request('owner_status');s.setMiniAppsStatus?.({...status,loaded:true});return true;}),
    buildWebsiteFromBrandBrain:async()=>perform(async()=>{if(s.websiteDraft){notice('Your existing private draft was kept. Use its original editor.');return false;}const now=await session.open(basis.businessId);if(!current())return false;const r=await session.website({basis:now,action:'create',sourceRevision:now.profileRevision,ownerApproved:true});if(r.ok){packet=r.observed;s.setWebsiteDraft?.(packet.websiteDraft);notice('Private website saved and independently reopened.');s.go('websiteBuilder');return true;}notice(r.reason);return false;}),
    applyWebsiteFieldChange:patch=>{const reviewed=s.websiteDraft;perform(async()=>{const now=await session.open(basis.businessId);if(live?.websiteDraft!==reviewed||stableJson(now.websiteDraft)!==stableJson(reviewed))throw Error('Your private website changed. Keep your wording and reopen the account version.');const r=await session.website({basis:now,action:'edit_text',patch,ownerApproved:true});if(!current())return false;if(r.ok&&live?.websiteDraft===reviewed){packet=r.observed;s.setWebsiteDraft?.(packet.websiteDraft);notice('Reviewed wording saved and independently reopened.');return true;}notice(r.reason||'The earlier wording was saved; newer local work was kept.');return false;}).catch(e=>notice(e.message));return false;},
    applyWebsiteLayoutAction:(operation,options={})=>{const reviewed=s.websiteDraft;if(!privateWebsiteDesignScope(reviewed,basis.businessId,options)){notice('Review the current website design. This target changed or the requested feedback is not connected yet.');return false;}perform(async()=>{const now=await session.open(basis.businessId);if(live?.websiteDraft!==reviewed||stableJson(now.websiteDraft)!==stableJson(reviewed))throw Error('Your website changed. Keep your current design and reopen the saved version.');const r=await session.website({basis:now,action:'edit_design',patch:operation,ownerApproved:true});if(!current())return false;if(r.ok&&live?.websiteDraft===reviewed){packet=r.observed;s.setWebsiteDraft?.(packet.websiteDraft);notice('Private design saved and independently reopened.');return true;}notice(r.reason||'Newer local work was kept.');return false;}).catch(e=>notice(e.message));return false;},
    canUndoWebsite:false,
    undoWebsiteChange:()=>{notice('Website Undo is not account-backed yet. Your saved draft was kept.');return false;},
    applyWebsitePageInstruction:()=>{const reason='Combined page instructions are not account-backed yet. Use the wording, page and design controls to save supported changes.';notice(reason);return {applied:false,reason};},
    applyWebsitePageAction:operation=>{const reviewed=s.websiteDraft;perform(async()=>{const now=await session.open(basis.businessId);if(live?.websiteDraft!==reviewed||stableJson(now.websiteDraft)!==stableJson(reviewed))throw Error('Your private website changed. Keep your page wording and inspect its account version.');const r=await session.website({basis:now,action:'edit_page',patch:operation,ownerApproved:true});if(!current())return false;if(r.ok&&live?.websiteDraft===reviewed){packet=r.observed;s.setWebsiteDraft?.(packet.websiteDraft);notice('Private page change saved and independently reopened. Your page editor words remain until you review the new revision.');return true;}notice('Page save not confirmed. Your words are kept; no request was replayed.');return false;}).catch(e=>notice(e.message));return false;},
    connectedReadProfile:async()=>{if(!session.scope)return session.open(basis.businessId);return (await session.reconcile()).observed;},
    connectedSaveProfile:({basis:reviewed,profile})=>perform(async()=>{if(!session.scope)await session.open(basis.businessId);const r=await session.profile({basis:reviewed,profile,ownerApproved:true});if(r.ok){check();packet=r.observed;s.setBusinessName?.(profile.businessName);s.setTrade?.(profile.businessType||'');s.setServices?.(old=>(profile.services||[]).map(row=>({...old.find(x=>x.id===row.id),...row})));s.setBrandProfile?.(old=>({...old,tagline:profile.tagline||'',publicDescription:profile.description||'',serviceAreaText:profile.serviceArea||'',phone:profile.contact?.phone||'',email:profile.contact?.email||'',serviceDescriptions:Object.fromEntries((profile.services||[]).map(x=>[x.id,x.description||'']))}));}return r;}),
    connectedAccountRead:()=>perform(async()=>{const now=await request('builder_read');if(s.websiteDraft&&stableJson(s.websiteDraft)!==stableJson(packet.websiteDraft))throw Error('Keep or discard your unfinished website before opening its account version.');packet=now;s.setWebsiteDraft?.(packet.websiteDraft);return true;}),
    connectedRestoreJourneys:async(after=null,revision=null)=>perform(async()=>{const customers=live.customers,inboxItems=live.inboxItems,stamp=stableJson([customers,inboxItems]);const page=await request('journey_list',{after,expectedRevision:revision});if(live.customers!==customers||live.inboxItems!==inboxItems||stableJson([customers,inboxItems])!==stamp)throw Error('Newer local work was kept');const plan=restorer.plan(page,{customers,inboxItems});check();plan.commit();live.setCustomers(plan.customers);live.setInboxItems(plan.inboxItems);live.setCloudRevision(plan.revision);return page;}),
    connectedInstallEnquiry:record=>{check();try{const plan=restorer.plan({businessId:basis.businessId,ownerId:basis.actorId,revision:record.revision,items:[{state:'Filed',record}],notOwnReceipt:true},live);plan.commit();live.setCustomers(plan.customers);live.setInboxItems(plan.inboxItems);live.setCloudRevision(plan.revision);return true;}catch{return false;}},
    connectedRequest:request};
  }
 };
 capabilities.add(api);return api;
}
