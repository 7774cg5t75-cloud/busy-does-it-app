/**
 * TEST ONLY. An offline fake registrar. Never use in deployed backend.
 * No network, real registry, payment or DNS operations.
 */
const cases={
 "devon-gardens.co.uk":{availability:"available",registerMinor:1199,renewMinor:1699,premium:false},
 "devon-gardens.com":{availability:"unavailable"},
 "special-premium.uk":{availability:"available",registerMinor:42000,renewMinor:2999,premium:true},
 "missing-renewal.uk":{availability:"available",registerMinor:999,renewMinor:null,premium:false}
};
function makeSandboxRegistrar({now=Date.parse("2026-10-10T16:00:00Z"),outcome="success"}={}){
 const id="ci-sandbox-only",calls=[];
 return {id,liveEnabled:true,calls,async lookup({domain,businessId}){
  calls.push({domain,businessId});
  if(outcome==="failure")throw Error("Simulated timeout");
  const info=cases[domain];
  if(!info)return {live:false,domain,businessId,provider:id,availability:"unknown"};
  const shared={live:true,domain,businessId,provider:id,
   availability:info.availability,checkedAt:new Date(now-15000).toISOString()};
  if(info.availability!=="available")return shared;
  return {...shared,pricing:{
   quoteId:"ci_quote_"+domain.replace(/[^a-z0-9]/gi,"").slice(0,40),
   currency:"GBP",registrationMinor:info.registerMinor,
   renewalMinor:info.renewMinor,taxMinor:0,totalMinor:info.registerMinor,
   years:1,premium:info.premium,taxIncluded:false,
   issuedAt:new Date(now-15000).toISOString(),
   expiresAt:new Date(now+120000).toISOString(),
   termsUrl:"https://registrar-sandbox.invalid/terms"
  }};
 }};
}
export {makeSandboxRegistrar};
