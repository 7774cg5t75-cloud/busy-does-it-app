/** V3.82 optional READ-ONLY provider adapters.
 * These do nothing until an administrator separately supplies appropriate
 * provider read scopes as secure server environment variables.
 * No credentials or arbitrary URLs ever pass from the mobile app.
 * Never treat Cloudflare's sampled Worker analytics as provider invoices.
 */
const USERNAME=/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const CF_ACCOUNT=/^[a-f0-9]{32}$/i;
const WORKER=/^[a-zA-Z0-9_-]{1,80}$/;
const nonNegative=n=>typeof n==="number"&&Number.isSafeInteger(n)&&n>=0&&n<=1000000000000;
function readConfiguredProviders(env={}){
  return {
    github:!!env.GITHUB_BILLING_READ_TOKEN&&USERNAME.test(env.GITHUB_BILLING_ACCOUNT||""),
    cloudflare:!!env.CLOUDFLARE_ANALYTICS_READ_TOKEN&&
      CF_ACCOUNT.test(env.CLOUDFLARE_ACCOUNT_TAG||"")&&
      WORKER.test(env.CLOUDFLARE_WORKER_SCRIPT||"")
  };
}
function parseGitHubActionsUsage(body){
  if(!body||!Array.isArray(body.usageItems)||body.usageItems.length>2000)return null;
  const matches=body.usageItems.filter(x=>typeof x?.product==="string"&&
    x.product.toLowerCase()==="actions"&&x.unitType==="minutes");
  if(matches.some(x=>!nonNegative(x.grossQuantity)))return null;
  const value=matches.reduce((v,x)=>v+x.grossQuantity,0);
  return nonNegative(value)?value:null;
}
function parseCloudflareSample(body){
  if(body?.errors?.length||!Array.isArray(body?.data?.viewer?.accounts)||
     body.data.viewer.accounts.length!==1)return null;
  const rows=body.data.viewer.accounts[0]?.workersInvocationsAdaptive;
  if(!Array.isArray(rows)||rows.length>=100)return null; // prevent truncated estimates
  if(rows.some(x=>!nonNegative(x?.sum?.requests)))return null;
  const value=rows.reduce((v,x)=>v+x.sum.requests,0);
  return nonNegative(value)?value:null;
}
async function fetchJson(url,options,fetcher=fetch){
  const response=await fetcher(url,{...options,
    signal:AbortSignal.timeout(6500),redirect:"error"});
  if(!response.ok)return null;
  return response.json().catch(()=>null);
}
async function readGitHubUsage(env,fetcher=fetch,now=new Date()){
  const state=readConfiguredProviders(env);
  if(!state.github)return {serviceKey:"github",status:"not_connected"};
  const username=env.GITHUB_BILLING_ACCOUNT;
  const year=now.getUTCFullYear(),month=now.getUTCMonth()+1;
  const scope=env.GITHUB_BILLING_SCOPE==="organization"?"organizations":"users";
  const url="https://api.github.com/"+scope+"/"+encodeURIComponent(username)+
    "/settings/billing/usage/summary?year="+year+"&month="+month;
  try{
    const data=await fetchJson(url,{headers:{
      Accept:"application/vnd.github+json",
      Authorization:"Bearer "+env.GITHUB_BILLING_READ_TOKEN,
      "X-GitHub-Api-Version":"2026-03-10"
    }},fetcher);
    const count=parseGitHubActionsUsage(data);
    if(count===null)return {serviceKey:"github",status:"not_verified"};
    return {serviceKey:"github",status:"read_success",usageValue:count,
      usageUnit:"Actions minutes (month)",period:"UTC calendar month",
      note:"GitHub read-only billing usage API ("+scope+"); account-scoped Actions minutes. Not a GBP invoice or rate-limit allowance.",
      observedAt:now.toISOString()};
  }catch{return {serviceKey:"github",status:"not_verified"};}
}
async function readCloudflareTraffic(env,fetcher=fetch,now=new Date()){
  const state=readConfiguredProviders(env);
  if(!state.cloudflare)return {serviceKey:"cloudflare",status:"not_connected"};
  // One hour prevents truncation for quiet accounts, but reject datasets that
  // reach the documented 100-row page limit rather than claiming full coverage.
  const start=new Date(now.getTime()-3600000).toISOString();
  const query=`query GetWorkersAnalytics($accountTag: string, $datetimeStart: string, $datetimeEnd: string, $scriptName: string){
    viewer{accounts(filter:{accountTag:$accountTag}){
      workersInvocationsAdaptive(limit:100,filter:{scriptName:$scriptName,datetime_geq:$datetimeStart,datetime_leq:$datetimeEnd}){
        sum{requests}
      }
    }}
  }`;
  try{
    const data=await fetchJson("https://api.cloudflare.com/client/v4/graphql",{
      method:"POST",headers:{"Content-Type":"application/json",
        Accept:"application/json",
        Authorization:"Bearer "+env.CLOUDFLARE_ANALYTICS_READ_TOKEN},
      body:JSON.stringify({query,variables:{
        accountTag:env.CLOUDFLARE_ACCOUNT_TAG,
        scriptName:env.CLOUDFLARE_WORKER_SCRIPT,
        datetimeStart:start,datetimeEnd:now.toISOString()
      }})
    },fetcher);
    const count=parseCloudflareSample(data);
    if(count===null)return {serviceKey:"cloudflare",status:"not_verified"};
    return {serviceKey:"cloudflare",status:"read_success",usageValue:count,
      usageUnit:"Worker requests sampled (1h)",period:"Previous hour",
      note:"Cloudflare Workers GraphQL analytics for one configured script and one hour. Sample-derived operational observations, NOT billable requests or invoice usage.",
      observedAt:now.toISOString()};
  }catch{return {serviceKey:"cloudflare",status:"not_verified"};}
}
export {readConfiguredProviders,parseGitHubActionsUsage,parseCloudflareSample,
 readGitHubUsage,readCloudflareTraffic};
