/**
 * V3.64 private Growth Project workspace (pure, portable business logic).
 * 'Reviewed' is only a sign-off for a private draft; never publication approval.
 */
import { isCurrentGrowthDraftPack } from "./coordinatedGrowthDrafts.mjs";
const TARGETS = ["website","business_app","social"];
const safe = (value,max=800) => typeof value==="string" ? value.trim().slice(0,max) : "";
const validStatus = new Set(["draft","reviewed","handed_off","blocked","needs_review"]);
const keyOf = serviceName => safe(serviceName,120).toLocaleLowerCase("en-GB").replace(/\s+/g," ");
function createGrowthProject(pack) {
  if (!pack?.valid || !safe(pack.sourceKey,4000) || !keyOf(pack.serviceName)) return null;
  return {
    schema:1,
    serviceName:safe(pack.serviceName,120),
    sourceKey:pack.sourceKey,
    items:TARGETS.map(target=>{
      const draft=pack.items.find(item=>item.target===target);
      return {
        target,
        text:safe(draft?.text),
        status:draft?.status==="blocked" ? "blocked":"draft",
        blockedBy:Array.isArray(draft?.blockedBy) ? draft.blockedBy.slice(0,3):[],
      };
    }),
  };
}
function validateGrowthProject(input) {
  if (!input || input.schema!==1 || !keyOf(input.serviceName) ||
      typeof input.sourceKey!=="string" || input.sourceKey.length>4000 ||
      !Array.isArray(input.items) || input.items.length!==3) return null;
  const targets=new Set();
  const items=[];
  for(const item of input.items){
    if (!TARGETS.includes(item?.target) || targets.has(item.target) ||
        typeof item.text!=="string" || item.text.length>800 ||
        !validStatus.has(item.status) || item.published===true ||
        !Array.isArray(item.blockedBy) || item.blockedBy.some(x=>typeof x!=="string" || x.length>40)) return null;
    targets.add(item.target);
    items.push({target:item.target,text:item.text,status:item.status,blockedBy:item.blockedBy.slice(0,3)});
  }
  if(TARGETS.some(x=>!targets.has(x)))return null;
  return {schema:1,serviceName:safe(input.serviceName,120),sourceKey:input.sourceKey,
    items:TARGETS.map(target=>items.find(item=>item.target===target))};
}
function workspaceProgress(project) {
  const items=project?.items || [];
  return {
    drafted:items.filter(i=>["draft","reviewed","handed_off"].includes(i.status)).length,
    reviewed:items.filter(i=>["reviewed","handed_off"].includes(i.status)).length,
    handedOff:items.filter(i=>i.status==="handed_off").length,
    blocked:items.filter(i=>i.status==="blocked").length,
    needsReview:items.filter(i=>i.status==="needs_review").length,
    total:TARGETS.length,
    published:0, // Never claim channel published without a verified provider receipt.
  };
}
function editGrowthProject(project,target,text){
  const p=validateGrowthProject(project);
  if(!p||!TARGETS.includes(target)||typeof text!=="string")return null;
  return {...p,items:p.items.map(item=>item.target!==target ? item : item.status==="blocked"
    ? item : {...item,text:text.slice(0,800),status:"draft"})};
}
function reviewGrowthProject(project,target,currentPack) {
  const p=validateGrowthProject(project);
  if(!p || !isCurrentGrowthDraftPack({...p,valid:true},currentPack))return null;
  const current=currentPack.items.find(item=>item.target===target);
  const item=p.items.find(item=>item.target===target);
  if(!item || !current || current.status==="blocked" || !safe(item.text) ||
     !["draft","reviewed","handed_off"].includes(item.status))return null;
  return {...p,items:p.items.map(i=>i.target===target?{...i,status:"reviewed",blockedBy:[]}:i)};
}
function markGrowthHandedOff(project,target,currentPack){
  const p=validateGrowthProject(project);
  if(!p || !isCurrentGrowthDraftPack({...p,valid:true},currentPack))return null;
  const item=p.items.find(i=>i.target===target);
  if(!item || item.status!=="reviewed" || currentPack.items.find(i=>i.target===target)?.status==="blocked")return null;
  return {...p,items:p.items.map(i=>i.target===target?{...i,status:"handed_off"}:i)};
}
/** Never silently replace edited wording when approved facts change. */
function reconcileGrowthProject(project,currentPack){
  const p=validateGrowthProject(project);
  if(!p)return {valid:false,reason:"Invalid saved project"};
  const same=!!currentPack?.valid && p.sourceKey===currentPack.sourceKey &&
    keyOf(p.serviceName)===keyOf(currentPack.serviceName);
  if(same)return {valid:true,stale:false,project:p};
  if(!currentPack?.valid || keyOf(p.serviceName)!==keyOf(currentPack.serviceName))
    return {valid:true,stale:true,needsNewSelection:true,project:p};
  return {
    valid:true,stale:true,needsNewSelection:false,
    project:{...p,items:p.items.map(item=>{
      const current=currentPack.items.find(i=>i.target===item.target);
      return {...item,status:current?.status==="blocked"?"blocked":"needs_review",
        blockedBy:current?.blockedBy||[]};
    })},
  };
}
/** Explicitly rebase to latest confirmed facts without overwriting user copy. */
function rebaseGrowthProject(project,currentPack) {
  const p=validateGrowthProject(project);
  if(!p || !currentPack?.valid || keyOf(p.serviceName)!==keyOf(currentPack.serviceName))return null;
  return {...p,sourceKey:currentPack.sourceKey,items:p.items.map(item=>{
    const current=currentPack.items.find(i=>i.target===item.target);
    return {...item,status:current?.status==="blocked"?"blocked":"draft",
      blockedBy:current?.blockedBy||[]};
  })};
}
export {TARGETS,keyOf,createGrowthProject,validateGrowthProject,workspaceProgress,
  editGrowthProject,reviewGrowthProject,markGrowthHandedOff,reconcileGrowthProject,rebaseGrowthProject};
