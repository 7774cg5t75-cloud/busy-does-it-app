/**
 * V3.67 read-only snapshots from existing authenticated Functions.
 * No project mutations, publication actions or newly privileged credentials.
 */
import {checkScope} from "./growthProjectCloud.mjs";
const PROVIDERS={
 website:{slug:"busy-website-publish",action:"status"},
 business_app:{slug:"busy-mini-apps",action:"owner_status"},
 social:{slug:"busy-social-publish",action:"status"},
};
async function readOne(args,key){
  const p=PROVIDERS[key];
  const url=args.supabaseUrl+"/functions/v1/"+p.slug;
  const response=await (args.fetchImpl||fetch)(url,{
    method:"POST",
    headers:{
      apikey:args.publishableKey,
      Authorization:"Bearer "+args.accessToken,
      "Content-Type":"application/json",
    },
    body:JSON.stringify({action:p.action,businessId:args.businessId}),
  });
  if(!response?.ok)throw Error("Reporting endpoint unavailable ("+(response?.status||"network")+").");
  const payload=await response.json();
  if(!payload||typeof payload!=="object"||payload.error)throw Error("Reporting endpoint returned invalid data.");
  const data=payload.status && typeof payload.status==="object"?payload.status:payload;
  // Never use a mismatched snapshot even if a server returned HTTP 200.
  const reported=[
    data?.owner?.businessId,data?.owner?.business_id,data?.businessId,
    key==="website"?data.website?.business_id:null,
    key==="business_app"?data.app?.business_id:null,
  ].filter(Boolean);
  if(reported.some(id=>id!==args.businessId))throw Error("Reporting response belongs to another business.");
  return data;
}
async function loadVerifiedActivity(args,{onSource=null}={}){
  checkScope(args);
  const results={};
  await Promise.all(Object.keys(PROVIDERS).map(async key=>{
    try{
      const data=await readOne(args,key);
      results[key]={ok:true,data};
    }catch(error){
      results[key]={ok:false,error:String(error?.message||"Unable to check.")};
    }
    if(typeof onSource==="function")onSource(key,results[key].ok);
  }));
  return results;
}
export {PROVIDERS,readOne,loadVerifiedActivity};
