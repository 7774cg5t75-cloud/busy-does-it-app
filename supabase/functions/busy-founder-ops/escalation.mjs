/**
 * V3.73 conservative escalation of aggregate incident observations.
 * Never conflates an old failed row with a public outage, and never authorises
 * a repost, external retry, destructive repair or notification by itself.
 */
const KEYS=new Set(["website_failed","website_stalled","social_failed","app_failed"]);
const sourceTime=value=>{
  if(typeof value!=="string"||!value.trim())return null;
  const parsed=Date.parse(value);
  return Number.isFinite(parsed)?parsed:null;
};
function classifyEscalation({incident=null,run=null,nowISO=""}={}){
  const key=incident?.key;
  if(!KEYS.has(key))return {level:"unverified",ageMinutes:null,sourceVerified:false,automaticRecoveryAllowed:false};
  const now=sourceTime(nowISO);
  const scan=sourceTime(run?.checked_at);
  const opened=sourceTime(incident?.firstDetectedAt||incident?.openedAt);
  const lastSeen=sourceTime(incident?.lastObservedAt||incident?.lastSeenAt);
  const good=now!==null&&scan!==null&&now>=scan&&now-scan<=45*60000&&
    run?.coverage?.[key]==="checked"&&opened!==null&&lastSeen!==null&&
    opened<=now&&lastSeen<=now&&run?.status==="complete";
  const age=good?Math.floor((now-opened)/60000):null;
  if(!good)return {level:"unverified",ageMinutes:null,sourceVerified:false,automaticRecoveryAllowed:false};
  if(incident.status==="resolved")
    return {level:"resolved",ageMinutes:age,sourceVerified:true,automaticRecoveryAllowed:false};
  if(incident.status!=="open")
    return {level:"unverified",ageMinutes:null,sourceVerified:false,automaticRecoveryAllowed:false};
  // More aggressive attention for expired website processing leases, but still
  // only aggregate triage: historic provider failures do not prove an outage.
  const urgent=age>=240 || (key==="website_stalled"&&age>=60);
  const persistent=age>=60 || (key==="website_stalled"&&age>=30);
  return {
    level:urgent?"urgent":persistent?"persistent":"watch",
    ageMinutes:age,
    sourceVerified:true,
    automaticRecoveryAllowed:false
  };
}
export {classifyEscalation};
