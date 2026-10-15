import {appEditLockReason} from "./appOwnerLocks.mjs";
/**
 * V3.158 owner-authored public service editing. Pure and private.
 * Replace a finite service list atomically without accepting executable
 * components, customer records, prices, arbitrary properties or URLs.
 */
const allowed=new Set(["id","name","description"]);
const validText=(s,max,required=false)=>typeof s==="string"&&s.length<=max&&
 !/[<>\u0000-\u001f]/.test(s)&&(!required||s.trim().length>0);
function reviewPrivateAppServices(config,services){
 const locked=appEditLockReason(config,{kind:"services"});
 if(locked)return {ok:false,reason:locked};
 if(!config||!Array.isArray(config.modules)||!config.modules.some(x=>x.key==="services"&&x.enabled===true))
  return {ok:false,reason:"Enable a supported Services section before editing its content."};
 if(!Array.isArray(services)||services.length>30)
  return {ok:false,reason:"Up to 30 owner-approved services can be edited."};
 const usedIds=new Set(),usedNames=new Set();
 for(const row of services){
  if(!row||typeof row!=="object"||Array.isArray(row)||
   Object.keys(row).some(k=>!allowed.has(k))||
   !validText(row.name,120,true)||!validText(row.description??"",600)||
   !(row.id===undefined||
     (typeof row.id==="string"&&row.id.length<=80&&
      (!row.id||/^[a-zA-Z0-9_-]{1,80}$/.test(row.id)))))
   return {ok:false,reason:"Service details must be owner-written names and descriptions only."};
  const id=row.id||"",name=row.name.trim().toLocaleLowerCase("en");
  if(usedNames.has(name)||(id&&usedIds.has(id)))
   return {ok:false,reason:"Each service needs its own name and identifier."};
  usedNames.add(name);if(id)usedIds.add(id);
 }
 const before=Array.isArray(config.publicProfile?.services)?config.publicProfile.services:[];
 if(JSON.stringify(before)===JSON.stringify(services))
  return {ok:false,reason:"The service list is already up to date."};
 return {ok:true,nextConfig:{...config,publicProfile:{...config.publicProfile,
  services:services.map(x=>({...x.id?{id:x.id}:{},name:x.name,
   description:x.description??""}))}},
  previous:before,description:"Updated "+services.length+" owner-approved services",
  publicUntilApproved:false};
}
export {reviewPrivateAppServices};
