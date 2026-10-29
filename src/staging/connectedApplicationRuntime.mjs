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
 const api={get active(){return current();},ownerId:basis.actorId,businessId:basis.businessId,profile:basis.profile,websiteDraft:basis.websiteDraft,appStatus,
  async requestApp(action,payload,options={}){if(!['owner_status','build_draft','apply_app_plan','apply_coordinated_edits','set_module','move_section','set_appearance'].includes(action)||options.includeBusiness===false||options.isCurrent&&!options.isCurrent())throw Error('This action is not connected in staging');const result=await request(action,payload);if(options.isCurrent&&!options.isCurrent())throw Error('Your app changed during the request');return result;},
  async verify(){check();const r=await request('builder_read');if(r.actorId!==basis.actorId)throw Error('Owner changed');return r;},
  dispose(){active=false;session.clear();live=null;},
  project(s){check();live=s;const notice=text=>s.setWebsiteBuilderNotice?.(text);
   return {connectedRuntime:api,connectedEnvironment:'Isolated staging — private drafts',
    signOutOwner:async()=>{api.dispose();await inspector.signOut();onExit?.();},
    connectedReturnToInspector:()=>{api.dispose();onExit?.();},
    refreshMiniAppsStatus:async()=>perform(async()=>{status=await request('owner_status');s.setMiniAppsStatus?.({...status,loaded:true});return true;}),
    buildWebsiteFromBrandBrain:async()=>perform(async()=>{if(s.websiteDraft){notice('Your existing private draft was kept. Use its original editor.');return false;}const now=await session.open(basis.businessId);if(!current())return false;const r=await session.website({basis:now,action:'create',sourceRevision:now.profileRevision,ownerApproved:true});if(r.ok){packet=r.observed;s.setWebsiteDraft?.(packet.websiteDraft);notice('Private website saved and independently reopened.');s.go('websiteBuilder');return true;}notice(r.reason);return false;}),
    applyWebsiteFieldChange:patch=>{const reviewed=s.websiteDraft;perform(async()=>{const now=await session.open(basis.businessId);if(live?.websiteDraft!==reviewed||stableJson(now.websiteDraft)!==stableJson(reviewed))throw Error('Your private website changed. Keep your wording and reopen the account version.');const r=await session.website({basis:now,action:'edit_text',patch,ownerApproved:true});if(!current())return false;if(r.ok&&live?.websiteDraft===reviewed){packet=r.observed;s.setWebsiteDraft?.(packet.websiteDraft);notice('Reviewed wording saved and independently reopened.');return true;}notice(r.reason||'The earlier wording was saved; newer local work was kept.');return false;}).catch(e=>notice(e.message));return false;},
    connectedAccountRead:()=>perform(async()=>{const now=await request('builder_read');if(s.websiteDraft&&stableJson(s.websiteDraft)!==stableJson(packet.websiteDraft))throw Error('Keep or discard your unfinished website before opening its account version.');packet=now;s.setWebsiteDraft?.(packet.websiteDraft);return true;}),
    connectedInstallEnquiry:record=>{check();if(record?.businessId!==basis.businessId||record.ownerId!==basis.actorId||record.customer?.id!==record.enquiry?.filedCustomerId||!Number.isSafeInteger(record.revision)||s.customers.length)return false;s.setCustomers([record.customer]);s.setInboxItems([record.enquiry]);s.setCloudRevision(record.revision);return true;},
    connectedRequest:request};
  }
 };
 capabilities.add(api);return api;
}
