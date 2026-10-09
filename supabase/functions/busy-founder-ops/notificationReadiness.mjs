/**
 * V3.73 founder push readiness. A token existing in a registry is NOT proof
 * of successful delivery. External alerts stay disabled without opt-in,
 * trusted destination, quiet hours, rate limits and delivery receipts.
 */
const safe=n=>Number.isSafeInteger(n)&&n>=0?n:null;
function notificationReadiness({devices=null,optedIn=false,verifiedDelivery=false,quietHoursConfigured=false,cooldownConfigured=false}={}){
  const count=safe(devices);
  const ready=count!==null&&count>0&&optedIn===true&&
    verifiedDelivery===true&&quietHoursConfigured===true&&cooldownConfigured===true;
  return {
    status:count===null?"unknown":count===0?"no_registered_device":ready?"eligible":"pending_verification",
    registeredFounderDevices:count,
    userOptIn:optedIn===true,
    verifiedDelivery:verifiedDelivery===true,
    quietHoursConfigured:quietHoursConfigured===true,
    cooldownConfigured:cooldownConfigured===true,
    externalAlertsEnabled:false, // requires separate delivery worker activation
    action:count===0?"Register and test the founder's own native push device from Production Bridge."
      :count===null?"Device inventory could not be verified."
      :"Before activation, verify an opted-in device, provider receipts, quiet hours and per-class delivery cooldowns.",
    note:"No SMS, email or automatic push is sent by this readiness report."
  };
}
export {notificationReadiness};
