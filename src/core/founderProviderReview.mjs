/**
 * Safe operating checklist from the founder's verified private inventory.
 * Never predicts charges or submits provider account changes.
 */
function founderProviderReview(report,{maxItems=6}={}){
 if(report?.scope!=="founder_service_register"||
    report?.privacy!=="founder_only"||!Array.isArray(report.services))
  return {status:"unavailable",items:[],count:null,autonomousCharges:false};
 const priorities={not_measured:0,historical:1,within_24h:2};
 const results=report.services.map(service=>{
   const latest=service?.latest,source=latest?.source;
   const key=String(service?.key||"").slice(0,40);
   const name=String(service?.name||key).slice(0,60);
   let message="";
   if(!latest)message="No recorded reading. Check the supplier dashboard before assuming usage or costs.";
   else if(source==="founder_entered")message="Founder-entered details only. Verify the real supplier bill and renewal date.";
   else if(source==="verified_log_sample")message="Historical request-log sample, not an official supplier invoice.";
   else if(source==="provider_api_readonly"&&service?.freshness==="within_24h")
     message="Recent read-only supplier observation. Usage does not establish billed cost.";
   else message="Older or unverified supplier reading. Refresh using an authorised read-only connection.";
   return {key,name,source:source||"unmeasured",
    freshness:service?.freshness||"not_measured",
    priority:priorities[service?.freshness]??0,
    message,invoiceVerified:false};
 }).filter(x=>x.key).sort((a,b)=>a.priority-b.priority||a.key.localeCompare(b.key));
 return {status:"available",items:results.slice(0,
  Number.isSafeInteger(maxItems)&&maxItems>0?Math.min(maxItems,10):6),
  count:results.length,autonomousCharges:false,
  message:"These are review reminders, not live billing alerts. No payment or subscription changes occur."};
}
export {founderProviderReview};
