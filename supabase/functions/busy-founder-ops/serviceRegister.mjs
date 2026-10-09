/** V3.81 founder-only vendor inventory and labelled usage snapshots.
 * Deliberately no provider API credentials, invoices, silent cost estimates,
 * customer account IDs or automatic payment/cancellation actions.
 */
const SERVICES=Object.freeze([
 {key:"supabase",name:"Supabase",purpose:"Database, Auth, Edge Functions and website storage",
  unit:"Edge Function invocations",scope:"Shared Free organisation (BUSY + Slow Roast)",
  dashboard:"https://supabase.com/dashboard",
  caveat:"500,000 invocations is an organisation-level Free allowance. Saved logs are sampled and are NOT the current billing meter."},
 {key:"cloudflare",name:"Cloudflare",purpose:"Domains, DNS, SSL, website routes and Workers",
  unit:"Worker requests",scope:"BUSY website infrastructure",dashboard:"https://dash.cloudflare.com",
  caveat:"Worker usage, Cloudflare for SaaS plan and account invoices are not yet connected."},
 {key:"github",name:"GitHub",purpose:"Source control, code history and build checks",
  unit:"Actions minutes",scope:"BUSY source repository",dashboard:"https://github.com/settings/billing",
  caveat:"Actual billed Actions minutes and subscription status require a provider report."},
 {key:"expo",name:"Expo",purpose:"Mobile builds, preview and app updates",
  unit:"builds",scope:"BUSY Expo project",dashboard:"https://expo.dev/accounts",
  caveat:"Expo Snack previews are not the same as paid EAS builds or App Store release."},
 {key:"apple",name:"Apple Developer",purpose:"iOS signing and App Store distribution",
  unit:"submissions",scope:"Developer programme",dashboard:"https://developer.apple.com/account",
  caveat:"Membership, renewal and publishing approval have not been verified."},
 {key:"meta",name:"Meta",purpose:"Facebook and Instagram permissions and posting",
  unit:"API requests",scope:"Connected channels",dashboard:"https://developers.facebook.com/apps/",
  caveat:"Channel delivery is not a verified Meta invoice or account billing feed."},
 {key:"google",name:"Google",purpose:"Business Profile and calendar integrations",
  unit:"API requests",scope:"Google Cloud APIs",dashboard:"https://console.cloud.google.com/billing",
  caveat:"Approval status and Google Cloud charges are not automatically measured."},
 {key:"ai",name:"AI provider",purpose:"AI processing, voice, media and optional app generation",
  unit:"credits used",scope:"Paid AI supplier account",dashboard:"",
  caveat:"BUSY request counters are not provider tokens, billable credits or settled AI costs."},
 {key:"email",name:"Email delivery",purpose:"Transactional messages and notification delivery",
  unit:"emails sent",scope:"Transactional delivery supplier",dashboard:"",
  caveat:"Sender, plan, delivered count and renewal must be verified separately."},
 {key:"payments",name:"Payment processor",purpose:"Subscriptions, renewals and credit top-ups",
  unit:"transactions",scope:"BUSY subscriptions",dashboard:"",
  caveat:"No confirmed live billing ledger or payment collection has been verified."}
]);
const VALID=new Set(SERVICES.map(x=>x.key));
const VALUES_STATUS=new Set(["unknown","free","trial","paid","inactive"]);
const CADENCE=new Set(["unknown","monthly","annual","usage_based","none"]);
const REQUEST=/^[a-zA-Z0-9_.:-]{12,128}$/;
const TEXT=v=>typeof v==="string"?v.trim():"";
const INTEGER=(n)=>Number.isSafeInteger(n)&&n>=0&&n<=1000000000000;
function validateServiceSnapshot(data){
 if(!data||typeof data!=="object"||Array.isArray(data))
  return {ok:false,error:"invalid_service_snapshot"};
 const accepted=["serviceKey","requestKey","planName","billingStatus","billingCadence",
    "usageValue","allowanceValue","amountGbpPence","renewalOn","note"];
 if(Object.keys(data).some(k=>!accepted.includes(k)))
  return {ok:false,error:"unrecognised_service_field"};
 const serviceKey=TEXT(data.serviceKey),requestKey=TEXT(data.requestKey);
 const plan=TEXT(data.planName),note=TEXT(data.note),renewal=TEXT(data.renewalOn);
 if(!VALID.has(serviceKey)||!REQUEST.test(requestKey)||plan.length>80||note.length>500)
  return {ok:false,error:"invalid_service_details"};
 if(!VALUES_STATUS.has(data.billingStatus)||!CADENCE.has(data.billingCadence))
  return {ok:false,error:"invalid_billing_state"};
 const usage=data.usageValue==null?null:data.usageValue;
 const allowance=data.allowanceValue==null?null:data.allowanceValue;
 const pence=data.amountGbpPence==null?null:data.amountGbpPence;
 if((usage!==null&&!INTEGER(usage))||(allowance!==null&&!INTEGER(allowance))||
    (pence!==null&&(!Number.isSafeInteger(pence)||pence<0||pence>100000000)))
   return {ok:false,error:"invalid_usage_or_cost"};
 if(allowance!==null&&usage===null)return {ok:false,error:"usage_required_for_allowance"};
 if(renewal&&!/^20[2-9][0-9]-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(renewal))
  return {ok:false,error:"invalid_renewal_date"};
 if(renewal&&new Date(renewal+"T00:00:00.000Z").toISOString().slice(0,10)!==renewal)
  return {ok:false,error:"invalid_renewal_date"};
 const service=SERVICES.find(x=>x.key===serviceKey);
 return {ok:true,record:{
    service_key:serviceKey,request_key:requestKey,source:"founder_entered",
    plan_name:plan,billing_status:data.billingStatus,
    billing_cadence:data.billingCadence,usage_value:usage,
    allowance_value:allowance,usage_unit:service.unit,amount_gbp_pence:pence,
    renewal_on:renewal||null,note
 }};
}
function formatSnapshot(row){
 if(!row||typeof row!=="object"||!VALID.has(row.service_key))return null;
 const usage=INTEGER(row.usage_value)?row.usage_value:null;
 const allowance=INTEGER(row.allowance_value)?row.allowance_value:null;
 const price=Number.isSafeInteger(row.amount_gbp_pence)&&row.amount_gbp_pence>=0?
  row.amount_gbp_pence:null;
 const validDate=Number.isFinite(Date.parse(row.observed_at||""));
 return {serviceKey:row.service_key,source:row.source==="verified_log_sample"?
    "verified_log_sample":"founder_entered",
    planName:TEXT(row.plan_name),billingStatus:VALUES_STATUS.has(row.billing_status)?
    row.billing_status:"unknown",
    billingCadence:CADENCE.has(row.billing_cadence)?row.billing_cadence:"unknown",
    usageValue:usage,allowanceValue:allowance,usageUnit:TEXT(row.usage_unit),
    amountGbpPence:price,renewalOn:row.renewal_on||null,
    observedAt:validDate?row.observed_at:null,note:TEXT(row.note),
    percentOfAllowance:allowance>0&&usage!==null?Math.round(1000*usage/allowance)/10:null,
    measurementType:row.source==="verified_log_sample"?
       "One-off verified request logs":"Founder-entered snapshot",
    liveBilling:false,invoiceVerified:false};
}
function buildServiceInventory(rows,{checkedAt=new Date().toISOString()}={}){
 const valid=Array.isArray(rows)?rows.map(formatSnapshot).filter(Boolean):[];
 const result=SERVICES.map(service=>{
   const history=valid.filter(x=>x.serviceKey===service.key).slice(0,5);
   const latest=history[0]||null;
   const age=latest?.observedAt?Date.parse(checkedAt)-Date.parse(latest.observedAt):NaN;
   const freshness=Number.isFinite(age)&&age>=0&&age<86400000?
     "within_24h":latest?"historical":"not_measured";
   return {...service,status:latest?"snapshot_available":"not_measured",
     latest,historyCount:history.length,freshness,
     alert:latest?.percentOfAllowance>=80?
       "Review the source and billing period; this snapshot shows high allowance usage.":""
   };
 });
 return {scope:"founder_service_register",privacy:"founder_only",checkedAt,
   sources:"Manual entries and individually labelled log samples, never provider billing APIs.",
   services:result,
   billsVerified:false,totalCostGbp:null,remainingCreditGbp:null,
   note:"Every vendor has its own plan, billing period and limits. An empty provider is NOT free or disconnected. No secrets, customer information or automatic payments are stored."};
}
export {SERVICES,validateServiceSnapshot,formatSnapshot,buildServiceInventory};
