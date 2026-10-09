// V3.71 commercial lifecycle decision helper (NOT wired to billing or hosting).
// Fail open to review, not a false claim that an unverified account is unpaid.
const DAY_MS=86400000;
function subscriptionServiceState({billingVerified=false,paidThrough="",nowISO="",graceDays=7}={}){
  if(!billingVerified)return {status:"unverified",automaticSuspensionAllowed:false};
  const paid=Date.parse(paidThrough),now=Date.parse(nowISO);
  if(!Number.isFinite(paid)||!Number.isFinite(now)||!Number.isSafeInteger(graceDays)||
     graceDays<0||graceDays>30)return {status:"unverified",automaticSuspensionAllowed:false};
  if(now<=paid)return {status:"paid",automaticSuspensionAllowed:false};
  if(now<=paid+graceDays*DAY_MS)return {status:"grace",automaticSuspensionAllowed:false};
  return {status:"past_grace",automaticSuspensionAllowed:false};
}
function assessMeteredUsage({sourceVerified=false,events=null,softLimit=null,hardLimit=null}={}){
  if(!sourceVerified||!Number.isSafeInteger(events)||events<0||
     !Number.isSafeInteger(softLimit)||softLimit<1||
     !Number.isSafeInteger(hardLimit)||hardLimit<=softLimit)
    return {status:"unverified",automaticHardStopAllowed:false};
  return {status:events>=hardLimit?"hard_limit_review":
      events>=softLimit?"approaching_limit":"within_allowance",
    automaticHardStopAllowed:false};
}
export {subscriptionServiceState,assessMeteredUsage};
