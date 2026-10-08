/**
 * V3.64 opt-in owner-only REST checkpoint transport.
 * Explicit Load/Save; optimistic revision filter prevents lost writes.
 * Authenticated session and RLS must be enforced server-side.
 */
import {keyOf,validateGrowthProject} from "./growthProjectWorkspace.mjs";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function checkScope({businessId,userId,accessToken,publishableKey,supabaseUrl}={}){
  if(!UUID.test(businessId||"") || !UUID.test(userId||"") ||
     !accessToken || !publishableKey || !/^https:\/\/[^/]+$/.test(supabaseUrl||""))
     throw new Error("Sign in and select a valid business before cloud project operations.");
}
const root=args=>args.supabaseUrl+"/rest/v1/busy_growth_projects";
function projectUrl(args,service){
  const key=keyOf(service);
  if(!key)throw new Error("Select a confirmed service.");
  return root(args)+"?business_id=eq."+encodeURIComponent(args.businessId)+
    "&user_id=eq."+encodeURIComponent(args.userId)+
    "&service_key=eq."+encodeURIComponent(key);
}
async function request(args,url,method="GET",body,headers={}){
  const response=await (args.fetchImpl||fetch)(url,{
    method,headers:{
      apikey:args.publishableKey,
      Authorization:"Bearer "+args.accessToken,
      "Content-Type":"application/json",
      ...headers,
    },
    ...(body===undefined?{}:{body:JSON.stringify(body)}),
  });
  if(!response.ok){
    const err=new Error("Private project request failed ("+response.status+").");
    err.status=response.status;
    throw err;
  }
  return response.status===204?[]:response.json();
}
async function listGrowthProjects(args){
  checkScope(args);
  const url=root(args)+"?business_id=eq."+encodeURIComponent(args.businessId)+
    "&user_id=eq."+encodeURIComponent(args.userId)+
    "&select=service_name,service_key,revision,updated_at,draft_data&order=updated_at.desc&limit=25";
  const rows=await request(args,url);
  return Array.isArray(rows)?rows:[];
}
async function loadGrowthProject(args,service){
  checkScope(args);
  const rows=await request(args,projectUrl(args,service)+
    "&select=service_name,draft_data,revision,updated_at&limit=1");
  if(!Array.isArray(rows)||!rows.length)return null;
  const row=rows[0];
  const project=validateGrowthProject(row.draft_data);
  if(!project || keyOf(project.serviceName)!==keyOf(service))throw new Error("Stored project failed validation.");
  return {project,revision:row.revision,updatedAt:row.updated_at};
}
async function saveGrowthProject(args,project,revision=null){
  checkScope(args);
  const p=validateGrowthProject(project);
  if(!p)throw new Error("Invalid growth project. No cloud changes made.");
  const key=keyOf(p.serviceName);
  if(revision===null){
    try{
      const rows=await request(args,root(args)+"?select=revision,updated_at","POST",{
        business_id:args.businessId,user_id:args.userId,service_key:key,service_name:p.serviceName,draft_data:p,
      },{Prefer:"return=representation"});
      if(!Array.isArray(rows)||rows.length!==1)throw new Error("Private project create response invalid.");
      return {saved:true,revision:rows[0].revision,updatedAt:rows[0].updated_at};
    }catch(e){
      if(e.status===409)return {saved:false,conflict:true,reason:"Another device already saved this project. Load its version before editing."};
      throw e;
    }
  }
  if(!Number.isSafeInteger(revision)||revision<1)throw new Error("Invalid project revision.");
  const rows=await request(args,projectUrl(args,p.serviceName)+
    "&revision=eq."+revision+"&select=revision,updated_at","PATCH",
    {draft_data:p,revision:revision+1,updated_at:new Date().toISOString()},
    {Prefer:"return=representation"});
  if(!Array.isArray(rows)||rows.length!==1)return {
    saved:false,conflict:true,reason:"Another device changed this project. Load the latest saved version before continuing.",
  };
  return {saved:true,revision:rows[0].revision,updatedAt:rows[0].updated_at};
}
export {checkScope,projectUrl,listGrowthProjects,loadGrowthProject,saveGrowthProject};
