/** V3.82 automatic first-party operational activity (NOT vendor billing). */
const METRICS=Object.freeze([
 {key:"ai_requests_30d",name:"AI request records (30 days)",unit:"requests",detail:"Count of BUSY conversation AI request records. Not tokens, costs or Supabase billable invocations."},
 {key:"website_requests_30d",name:"BUSY website request records (30 days)",unit:"requests",detail:"BUSY internal hosted-website request records, not Cloudflare billed traffic."},
 {key:"websites_prepared_total",name:"Hosted website previews prepared",unit:"versions",detail:"Database versions with prepared_at set; not proof of an externally reachable website."},
 {key:"websites_live_records_total",name:"Website publication records",unit:"websites",detail:"Approved live deployment references, not verified HTTPS uptime or paying subscribers."},
 {key:"workspaces_total",name:"Business workspaces",unit:"workspaces",detail:"BUSY workspace records; not paying subscribers."},
 {key:"incident_scans_24h",name:"Internal incident checks (24 hours)",unit:"runs",detail:"Completed internal monitor entries, not provider invoices or outside uptime checks."}
]);
const KEYS=new Set(METRICS.map(m=>m.key));
function positiveInteger(n){return Number.isSafeInteger(n)&&n>=0&&n<=1000000000000;}
function digestAutomaticTelemetry(rows,{checkedAt=new Date().toISOString()}={}){
  const sorted=Array.isArray(rows)?rows.slice().sort((a,b)=>
    Date.parse(b.observed_at||"")-Date.parse(a.observed_at||"")):[];
  const metrics=METRICS.map(m=>{
    const row=sorted.find(x=>x.metric_key===m.key&&x.source==="busy_internal_database"&&
       positiveInteger(Number(x.value))&&Number.isFinite(Date.parse(x.observed_at||"")));
    const age=row?Date.parse(checkedAt)-Date.parse(row.observed_at):NaN;
    const recent=Number.isFinite(age)&&age>=0&&age<=2*3600*1000;
    return {...m,value:row?Number(row.value):null,observedAt:row?.observed_at||null,
      status:row?(recent?"recent":"stale"):"not_measured",source:"BUSY's own database",
      notProviderBilling:true};
  });
  return {scope:"founder_auto_telemetry",checkedAt,metrics,
    scheduledInterval:"hourly",registeredBillingIntegrations:0,
    note:"Automatic private first-party counts; supplier quotas, Stripe revenue, Cloudflare usage, GitHub billing, Supabase Edge Function invocations and credit balances require separate authorised provider APIs."};
}
function usageReview(percent,{fresh=false,source=""}={}){
  // No real-time alerts from stale founder-entered estimates or sampled logs.
  if(!fresh||source!=="official_provider_api"||
     typeof percent!=="number"||!Number.isFinite(percent))return null;
  return percent>=90?"critical":percent>=75?"high":percent>=50?"notice":null;
}
export {METRICS,digestAutomaticTelemetry,usageReview};
