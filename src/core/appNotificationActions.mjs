// Device permission/token work uses the existing authenticated account scope.
// Registering a device is not evidence that any notification was delivered.
function createAppNotificationActions(getContext){
 let active=null;
 async function run(enable){
  const c=getContext();if(!c.ownerScope?.userId||active?.ownerScope===c.ownerScope)return false;
  if(c.runtime.expoGoPreview||!c.runtime.easProjectId){
   c.setStatus(old=>({...old,state:c.runtime.expoGoPreview?'needs_development_build':'needs_eas_project',message:'Request notifications require the configured native development build.'}));return false;
  }
  const ticket={ownerScope:c.ownerScope};active=ticket;
  const current=()=>active===ticket&&getContext().ownerScope===ticket.ownerScope;
  c.setAction(enable?'enable':'disable');
  try{
   let token=enable?'':c.status.token||'';
   if(!token){
    let permission=(await c.notifications.getPermissionsAsync())?.status;if(!current())return false;
    if(enable&&permission!=='granted'){permission=(await c.notifications.requestPermissionsAsync())?.status;if(!current())return false;}
    if(permission!=='granted')throw Error('Notification permission is not granted.');
    token=(await c.notifications.getExpoPushTokenAsync({projectId:c.runtime.easProjectId}))?.data;if(!current())return false;
   }
   if(typeof token!=='string'||!token)throw Error('This device token could not be verified.');
   const data=await c.request(enable?'register_notification_device':'disable_notification_device',
    enable?{expoPushToken:token,platform:c.platform,appVersion:c.appVersion,deviceLabel:`${c.platform} BUSY Apps device`}:{expoPushToken:token},
    {includeBusiness:false,isCurrent:current});
   if(!current())return false;
   const count=data?.notification?.activeDeviceCount;
   if(!Number.isSafeInteger(count)||count<0)throw Error('The notification registration response is not verified.');
   c.setStatus({state:count>0?'enabled':'disabled',activeDeviceCount:count,token:enable?token:'',message:enable?
    'Device registration was checked. Notification delivery remains unverified.':count>0?
    `Notifications remain registered on ${count} other device${count===1?'':'s'}.`:'Request notifications are off on this device.'});
   return enable?count>0:true;
  }catch(error){if(current())c.setStatus(old=>({...old,state:'error',message:error?.message||'Notification settings could not be confirmed.'}));return false;}
  finally{if(active===ticket){if(current())c.setAction('');active=null;}}
 }
 return {enableMiniAppNotifications:()=>run(true),disableMiniAppNotifications:()=>run(false)};
}
export {createAppNotificationActions};
