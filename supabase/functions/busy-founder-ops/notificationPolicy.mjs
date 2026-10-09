/**
 * V3.73 notification decision policy ONLY. It never sends a push.
 * The dispatch service must independently authenticate the founder, claim a
 * durable idempotency key and record genuine provider receipts before use.
 */
const MINUTE=60000, DAY=24*60*MINUTE;
const validClock=s=>typeof s==="string"&&/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(s);
const toMinute=s=>Number(s.slice(0,2))*60+Number(s.slice(3));
function inQuietHours(date,quietStart,quietEnd){
  if(!validClock(quietStart)||!validClock(quietEnd))return null;
  const parts=new Intl.DateTimeFormat("en-GB",{
    timeZone:"Europe/London",hour:"2-digit",minute:"2-digit",hourCycle:"h23"
  }).formatToParts(date);
  const hour=Number(parts.find(x=>x.type==="hour")?.value);
  const minute=Number(parts.find(x=>x.type==="minute")?.value);
  if(!Number.isInteger(hour)||!Number.isInteger(minute))return null;
  const current=hour*60+minute,start=toMinute(quietStart),end=toMinute(quietEnd);
  if(start===end)return true; // fail closed rather than infer quiet hours disabled
  return start<end?current>=start&&current<end:current>=start||current<end;
}
function notificationEligibility({
  verifiedFounder=false,explicitOptIn=false,verifiedDestination=false,
  deliveryEnabled=false,sourceVerified=false,level="unverified",
  incidentAcknowledged=false,nowISO="",lastDeliveryISO="",
  quietStart="21:00",quietEnd="08:00",cooldownHours=24
}={}){
  const no=reason=>({eligible:false,reason});
  if(!verifiedFounder)return no("founder_not_verified");
  if(!explicitOptIn)return no("not_opted_in");
  if(!verifiedDestination)return no("destination_unverified");
  if(!deliveryEnabled)return no("delivery_disabled");
  if(!sourceVerified||!["persistent","urgent"].includes(level))return no("not_escalated");
  if(incidentAcknowledged)return no("already_acknowledged");
  const now=Date.parse(nowISO);
  if(!Number.isFinite(now))return no("clock_unverified");
  if(!Number.isSafeInteger(cooldownHours)||cooldownHours<24||cooldownHours>168)
    return no("invalid_cooldown");
  const quiet=inQuietHours(new Date(now),quietStart,quietEnd);
  if(quiet===null||quiet)return no("quiet_hours");
  if(lastDeliveryISO){
    const prev=Date.parse(lastDeliveryISO);
    if(!Number.isFinite(prev)||now<prev)return no("receipt_unverified");
    if(now-prev<cooldownHours*60*MINUTE)return no("cooldown");
  }
  return {eligible:true,reason:"safe_candidate_only"};
}
export {notificationEligibility,inQuietHours};
