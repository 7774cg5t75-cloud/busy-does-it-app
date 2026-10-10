/**
 * V3.115: founder-only evidence classification.
 * Never add incompatible API units, treat missing data as zero,
 * or convert usage snapshots into invoices or known total expenses.
 */
function founderUsageEvidence(report){
 if(report?.scope!=="founder_service_register"||report?.privacy!=="founder_only"||
    !Array.isArray(report.services))
  return {status:"unavailable",readOnlyRecent:null,manualRecords:null,
   historicalReadings:null,providersMissing:null,invoiceCount:null,
   actualTotalGbp:null,message:"Private provider evidence could not be verified."};
 const services=report.services;
 const has=x=>x?.latest&&x.latest.source==="provider_api_readonly";
 const recent=services.filter(x=>has(x)&&x.freshness==="within_24h").length;
 const historical=services.filter(x=>x.latest?.source==="verified_log_sample"||
  (has(x)&&x.freshness!=="within_24h")).length;
 const manual=services.filter(x=>x.latest?.source==="founder_entered").length;
 const missing=services.filter(x=>!x.latest).length;
 return {status:"available",readOnlyRecent:recent,
  manualRecords:manual,historicalReadings:historical,providersMissing:missing,
  invoiceCount:null,actualTotalGbp:null,
  message:"Recent provider API observations are not verified invoices or billable usage totals. Older or missing readings still require supplier checks."};
}
export {founderUsageEvidence};
