import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {prepareCoordinatedGrowthDrafts} from "../src/domain/coordinatedGrowthDrafts.mjs";
import {
  createGrowthProject,validateGrowthProject,workspaceProgress,editGrowthProject,
  reviewGrowthProject,markGrowthHandedOff,reconcileGrowthProject,rebaseGrowthProject,keyOf,
} from "../src/domain/growthProjectWorkspace.mjs";
import {checkScope,projectUrl,listGrowthProjects,loadGrowthProject,saveGrowthProject} from "../src/domain/growthProjectCloud.mjs";

const U1="11111111-1111-4111-8111-111111111111";
const U2="22222222-2222-4222-8222-222222222222";
const B1="33333333-3333-4333-8333-333333333333";
const B2="44444444-4444-4444-8444-444444444444";
const approved={businessName:"Local Services",serviceArea:"Devon",email:"contact@example.com",
  services:[{name:"Carpet cleaning",description:"Professional carpet cleaning."},
    {name:"Unapproved repairs",approved:false}]};
const prepare=(data=approved,extra={})=>prepareCoordinatedGrowthDrafts({
  approved:data,focusService:"Carpet cleaning",ownerId:U1,businessId:B1,...extra,
});
const pack=prepare();
const project=createGrowthProject(pack);
assert.ok(project);
assert.deepEqual(workspaceProgress(project),{drafted:3,reviewed:0,handedOff:0,blocked:0,needsReview:0,total:3,published:0});
assert.equal(validateGrowthProject({...project,published:true}),null); // root unknown fields aren't publication authorisation
assert.equal(validateGrowthProject({...project,items:[...project.items,project.items[0]]}),null);
assert.equal(validateGrowthProject({...project,items:project.items.map(i=>({...i,status:"published"}))}),null);
assert.equal(validateGrowthProject({...project,items:project.items.map(i=>({...i,text:"x".repeat(801)}))}),null);
assert.equal(validateGrowthProject({...project,sourceKey:"x".repeat(4001)}),null);
assert.equal(keyOf(" CARPET   CLEANING "),"carpet cleaning");

assert.equal(reviewGrowthProject(project,"website",prepare({...approved,services:[]})),null);
assert.equal(markGrowthHandedOff(project,"social",pack),null); // not reviewed
const reviewed=reviewGrowthProject(project,"website",pack);
assert.equal(reviewed.items[0].status,"reviewed");
assert.equal(workspaceProgress(reviewed).reviewed,1);
const handed=markGrowthHandedOff(reviewed,"website",pack);
assert.equal(handed.items[0].status,"handed_off");
assert.equal(workspaceProgress(handed).handedOff,1);
assert.equal(workspaceProgress(handed).published,0);
assert.equal(editGrowthProject(handed,"website"," New owner wording. ").items[0].status,"draft");
assert.equal(editGrowthProject(handed,"website"," New owner wording. ").items[0].text," New owner wording. ");
assert.equal(project.items[0].status,"draft");
const changedPack=prepare({...approved,serviceArea:"Cornwall"});
const stale=reconcileGrowthProject(handed,changedPack);
assert.equal(stale.valid,true);
assert.equal(stale.stale,true);
assert.ok(stale.project.items.every(x=>x.status==="needs_review"));
assert.equal(stale.project.items[0].text,handed.items[0].text);
assert.equal(reviewGrowthProject(stale.project,"website",changedPack),null);
assert.equal(markGrowthHandedOff(stale.project,"website",changedPack),null);
const rebased=rebaseGrowthProject(stale.project,changedPack);
assert.equal(rebased.sourceKey,changedPack.sourceKey);
assert.equal(rebased.items[0].text,handed.items[0].text);
assert.equal(rebased.items[0].status,"draft");
assert.equal(reconcileGrowthProject(rebased,changedPack).stale,false);
const blockedPack=prepare({...approved,email:"",phone:"",serviceArea:""});
assert.equal(reconcileGrowthProject(handed,blockedPack).project.items[0].status,"blocked");
assert.equal(rebaseGrowthProject(handed,blockedPack).items[1].status,"blocked");
assert.equal(rebaseGrowthProject(handed,prepare({...approved,services:[]},{})),null);
assert.equal(rebaseGrowthProject(handed,prepare(approved,{ownerId:U2})),null);
assert.equal(reconcileGrowthProject(handed,prepare(approved,{businessId:B2})).stale,true);

// Simulated Supabase PostgREST: atomic compare-and-swap and immutable tenant scope.
const rows=new Map();
let observed=[];
function response(status,items=[]){return {ok:status>=200&&status<300,status,json:async()=>items};}
async function fetchMock(url,opts={}){
  const parsed=new URL(url), method=opts.method||"GET";
  observed.push({url,method,headers:opts.headers});
  if(!opts.headers?.Authorization?.startsWith("Bearer "))return response(401);
  const filter=key=>parsed.searchParams.get(key)?.replace(/^eq\./,"");
  const owner=filter("user_id"),business=filter("business_id"),service=filter("service_key");
  const target=(owner||opts.body&&JSON.parse(opts.body).user_id)+":"+
    (business||opts.body&&JSON.parse(opts.body).business_id)+":"+
    (service||opts.body&&JSON.parse(opts.body).service_key);
  const entries=[...rows.entries()].filter(([k])=>k.startsWith((owner||"")+":"+(business||"")+":"));
  if(method==="POST"){
    const body=JSON.parse(opts.body);
    const key=body.user_id+":"+body.business_id+":"+body.service_key;
    if(rows.has(key))return response(409);
    rows.set(key,{...body,revision:1,updated_at:"2026-10-08T10:00:00Z"});
    return response(201,[rows.get(key)]);
  }
  if(method==="PATCH"){
    const body=JSON.parse(opts.body),old=rows.get(target);
    if(!old||old.revision!==Number(filter("revision")))return response(200,[]);
    rows.set(target,{...old,...body});
    return response(200,[rows.get(target)]);
  }
  if(method==="GET"){
    const selected=service ? [rows.get(target)].filter(Boolean):entries.map(([,x])=>x).slice(0,25);
    return response(200,selected);
  }
  return response(405);
}
const cloud={businessId:B1,userId:U1,accessToken:"test-jwt",publishableKey:"public-key",
  supabaseUrl:"https://example.supabase.co",fetchImpl:fetchMock};
assert.throws(()=>checkScope({...cloud,userId:"not-a-uuid"}));
assert.throws(()=>checkScope({...cloud,accessToken:""}));
assert.ok(projectUrl(cloud,"Carpet cleaning").includes("service_key=eq.carpet%20cleaning"));
const created=await saveGrowthProject(cloud,project,null);
assert.equal(created.saved,true);
assert.equal(created.revision,1);
assert.equal((await listGrowthProjects(cloud)).length,1);
const loaded=await loadGrowthProject(cloud,"Carpet cleaning");
assert.equal(loaded.revision,1);
assert.deepEqual(loaded.project,project);
const duplicate=await saveGrowthProject(cloud,project,null);
assert.equal(duplicate.conflict,true);
const updated=await saveGrowthProject(cloud,handed,1);
assert.equal(updated.revision,2);
const staleUpdate=await saveGrowthProject(cloud,project,1);
assert.equal(staleUpdate.conflict,true);
assert.equal((await loadGrowthProject(cloud,"Carpet cleaning")).project.items[0].status,"handed_off");
assert.equal(await loadGrowthProject({...cloud,userId:U2},"Carpet cleaning"),null);
assert.equal(await loadGrowthProject({...cloud,businessId:B2},"Carpet cleaning"),null);
assert.ok(observed.every(x=>x.headers.apikey==="public-key" && x.headers.Authorization==="Bearer test-jwt"));
assert.ok(!observed.some(x=>x.method==="DELETE"));

const screen=readFileSync(new URL("../src/screens/businessCreationJourney.js",import.meta.url),"utf8");
const controller=readFileSync(new URL("../src/app/AppController.js",import.meta.url),"utf8");
const sql=readFileSync(new URL("../docs/V3_64_GROWTH_PROJECT_SCHEMA.sql",import.meta.url),"utf8");
for(const needle of ["growthProjectCloudArgs","saveGrowthProject(args,activeProject,growthCloudRevision)",
  "loadGrowthProject(args,growthServiceFocus)","setGrowthCloudRevision(result.revision)",
  "rebaseGrowthProject(activeProject,candidateDraftPack)","markWorkspaceReviewed(item.target)",
  "projectStale","Mark this wording reviewed"])
  assert.ok(screen.includes(needle) || controller.includes(needle),needle);
assert.ok(controller.includes("growthProjectCloudArgs: conversationCloudArgs"));
assert.ok(sql.includes("enable row level security"));
assert.ok(sql.includes("revoke all on public.busy_growth_projects from anon, authenticated"));
assert.ok(sql.includes("created_by=(select auth.uid())"));
assert.ok(sql.includes("primary key (business_id, user_id, service_key)"));
assert.ok(!sql.toLowerCase().includes("security definer"));
console.log("V3.64 growth workspace and cloud conflict regression tests passed");
