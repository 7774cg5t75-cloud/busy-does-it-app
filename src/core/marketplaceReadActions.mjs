// Lifecycle adapter for the existing authenticated marketplace endpoints.
// Owner identity comes from the controller's existing authenticated scope token.
// Latest-result lanes hold no customer payload and never repeat a mutation.
function createMarketplaceReadActions(getContext){
 const lanes=new Map();
 const begin=lane=>{const c=getContext();if(!c?.ownerScope?.userId)return null;const ticket={lane,ownerScope:c.ownerScope};lanes.set(lane,ticket);return ticket;};
 const current=t=>!!t&&getContext()?.ownerScope===t.ownerScope&&lanes.get(t.lane)===t;
 const finish=t=>{if(lanes.get(t?.lane)===t)lanes.delete(t.lane);};
 async function loadMyBusyApps({quiet=false}={}){
  const t=begin('my-apps');if(!t)return false;const c=getContext();
  if(!quiet)c.setMyBusyAppsLoading(true);
  try{
   const data=await c.request('my_apps',{}, {includeBusiness:false,isCurrent:()=>current(t)});
   if(!current(t))return false;
   c.setMyBusyApps(Array.isArray(data?.apps)?data.apps:[]);
   c.setMyBusyAppRequests(Array.isArray(data?.requests)?data.requests:[]);
   const activeDeviceCount=Number(data?.notification?.activeDeviceCount||0);
   c.setMiniAppsNotificationStatus(old=>({...old,state:activeDeviceCount>0?'enabled':'disabled',activeDeviceCount,
    message:activeDeviceCount>0?`Request notifications are active on ${activeDeviceCount} device${activeDeviceCount===1?'':'s'}.`:old.message||'Request notifications are not enabled on a device yet.'}));
   return true;
  }catch(error){if(current(t))c.setMiniAppsError(error?.message||'BUSY could not load My BUSY Apps.');return false;}
  finally{if(current(t))c.setMyBusyAppsLoading(false);finish(t);}
 }
 async function searchBusyApps(query=''){
  const t=begin('search');if(!t)return false;const c=getContext();c.setBusyAppsSearching(true);c.setMiniAppsError('');
  try{
   const data=await c.request('directory_search',{query:String(query||'').trim()},{includeBusiness:false,isCurrent:()=>current(t)});
   if(!current(t))return false;c.setBusyAppsResults(Array.isArray(data?.apps)?data.apps:[]);return true;
  }catch(error){if(current(t))c.setMiniAppsError(error?.message||'BUSY could not search the app marketplace.');return false;}
  finally{if(current(t))c.setBusyAppsSearching(false);finish(t);}
 }
 async function openBusyAppDetail(slug,source='marketplace',intent=''){
  if(!slug)return false;const t=begin('detail');if(!t)return false;const c=getContext();c.setMiniAppsAction(`open:${slug}`);c.setMiniAppsError('');
  try{
   const data=await c.request('app_detail',{slug,source},{includeBusiness:false,isCurrent:()=>current(t)});
   if(!current(t))return false;
   if(data?.app?.slug!==slug||!data?.app?.id||!data?.version?.id)throw Error('The returned Business App did not match the selected app.');
   c.setSelectedBusyAppDetail({...data,entryIntent:['enquiry','booking_request'].includes(String(intent||''))?String(intent):''});
   c.go('busyAppDetail');
   // Defer the optional read using the same owner token; never refresh a later account.
   c.schedule(()=>{if(current(t))void loadMyBusyApps({quiet:true});},80);
   return true;
  }catch(error){if(current(t))c.setMiniAppsError(error?.message||'BUSY could not open that Business App.');return false;}
  finally{if(current(t))c.setMiniAppsAction('');/* retain latest detail ticket for its scheduled read */}
 }
 return {loadMyBusyApps,searchBusyApps,openBusyAppDetail};
}
export {createMarketplaceReadActions};
