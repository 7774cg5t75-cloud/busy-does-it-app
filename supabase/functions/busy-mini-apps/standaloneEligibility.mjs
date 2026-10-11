/**
 * V3.154: server-owned standalone eligibility decision.
 *
 * This is a future billing-provider integration boundary, not a billing
 * connector. Never infer entitlement from a package name, user claims or a
 * mobile app parameter. Only service-role-read rows created by a separately
 * validated provider webhook can become eligible.
 */
function decideStandaloneEligibility(record,{businessId,nowISO}={}){
 const now=Date.parse(nowISO||"");
 const id=typeof businessId==="string"?businessId:"";
 const fields=record||{};
 const active=Number.isFinite(now)&&!!id&&
   fields.business_id===id&&fields.status==="active"&&
   fields.provider_verified===true&&
   fields.source==="verified_provider_webhook"&&
   typeof fields.external_subscription_id==="string"&&
   fields.external_subscription_id.length>=8&&
   Number.isSafeInteger(fields.allowance)&&fields.allowance>0&&
   Number.isSafeInteger(fields.used)&&fields.used>=0&&
   fields.used<=fields.allowance&&
   Number.isFinite(Date.parse(fields.period_end))&&Date.parse(fields.period_end)>now;
 const remaining=active?Math.max(0,fields.allowance-fields.used):0;
 return {verified:!!active,eligible:!!active&&remaining>0,
  remaining,allowance:active?fields.allowance:0,
  status:!active?"not_verified":remaining>0?"eligible":"allowance_used",
  reason:!active?"No current provider-verified standalone benefit exists for this business.":
    remaining>0?"A verified, time-bounded standalone creation allowance is available.":
    "This period's verified standalone creation allowance has been used.",
  doesNotCharge:true,doesNotIncludeStoreFees:true,
  doesNotAuthorizePackaging:true,doesNotAuthorizeSubmission:true};
}
export {decideStandaloneEligibility};
