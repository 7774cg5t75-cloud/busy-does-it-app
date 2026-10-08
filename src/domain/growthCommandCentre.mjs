/**
 * V3.65 - deterministic, read-only command centre for saved growth projects.
 * Review/handoff state is not a receipt from a public website, app or social provider.
 * Never mutate a project or publish from conversational commands.
 */
import { prepareCoordinatedGrowthDrafts } from "./coordinatedGrowthDrafts.mjs";
import { keyOf, validateGrowthProject, reconcileGrowthProject, workspaceProgress } from "./growthProjectWorkspace.mjs";

const safeText = (v,n=160) => typeof v === "string" ? v.trim().slice(0,n) : "";
const LABELS = Object.freeze({website:"Website",business_app:"Customer Business App",social:"Social media"});
const PRIORITY = Object.freeze({blocked:0,needs_review:1,draft:2,reviewed:3,handed_off:4});
const STATUS_HELP = Object.freeze({
  blocked:"A confirmed business detail is missing. Check the source facts before editing.",
  needs_review:"Business facts have changed. Compare the wording and acknowledge changes in the project.",
  draft:"Wording is prepared but has not yet been reviewed by its owner.",
  reviewed:"The private wording has been reviewed. Handoff to the appropriate editor is next.",
  handed_off:"Wording was handed to a private editor. This is not proof of publication.",
});

function buildGrowthCommandCentre({
  records=[],approved={},ownerId="",businessId="",readFailed=false,
}={}){
  if(!safeText(ownerId)||!safeText(businessId))
    return {state:"signed_out",projects:[],next:null,counts:{projects:0,attention:0},notice:"Sign in and select your business to see private growth projects."};
  if(readFailed)
    return {state:"unavailable",projects:[],next:null,counts:{projects:0,attention:0},notice:"Could not load cloud progress. No project has been changed, and no publish state can be assumed."};
  const projects=[];
  const unique=new Set();
  const items=Array.isArray(records)?records.slice(0,25):[];
  for(const record of items){
    const saved=validateGrowthProject(record?.draft_data);
    if(!saved)continue;
    const serviceKey=keyOf(saved.serviceName);
    if(!serviceKey || unique.has(serviceKey) || (record.service_key && serviceKey!==keyOf(record.service_key)))continue;
    let sourceScope;
    try { sourceScope=JSON.parse(saved.sourceKey); } catch { continue; }
    // Defence in depth, on top of Supabase RLS. Never show a mismatched checkpoint.
    if(!Array.isArray(sourceScope) || sourceScope[0]!==ownerId || sourceScope[1]!==businessId)continue;
    unique.add(serviceKey);
    const current=prepareCoordinatedGrowthDrafts({
      approved,ownerId,businessId,focusService:saved.serviceName,
    });
    const compare=reconcileGrowthProject(saved,current);
    // The previous owner's private data is never treated as a current project.
    if(!compare.valid || (compare.stale && compare.needsNewSelection && current.valid))continue;
    const stale=compare.stale;
    const preview=compare.project||saved;
    const tasks=preview.items.map(item=>({
      target:item.target,
      label:LABELS[item.target]||"Channel",
      status:item.status,
      description:STATUS_HELP[item.status]||"Review in its editor.",
      isPublished:false,
    }));
    const ranked=[...tasks].sort((a,b)=>(PRIORITY[a.status]??9)-(PRIORITY[b.status]??9) ||
      ["website","business_app","social"].indexOf(a.target)-["website","business_app","social"].indexOf(b.target));
    const next= !current.valid ? {
      target:null,status:"needs_confirmation",label:"Confirm the service",
      description:"The saved service is no longer confirmed in this business profile. Review its approval before continuing.",
      action:"review_service",
    } : stale ? {
      target:null,status:"needs_review",label:"Review changed business facts",
      description:"The approved business profile changed. Reopen the project, inspect the old wording, and explicitly acknowledge current facts.",
      action:"review_facts",
    } : ranked[0] ? {
      ...ranked[0],
      action:ranked[0].status==="handed_off"?"verify_in_editor":ranked[0].status==="blocked"?"confirm_facts":"continue_project",
    } : null;
    const progress=workspaceProgress(preview);
    projects.push({
      serviceName:saved.serviceName,
      serviceKey,
      revision:Number.isSafeInteger(record?.revision)?record.revision:null,
      updatedAt:safeText(record?.updated_at,40),
      stale,
      confirmed:current.valid,
      next,
      tasks,
      progress,
      // True public status can only be obtained from respective trusted publication APIs.
      publicationVerified:false,
      publicationNotice:"No public publication verification was performed.",
    });
  }
  projects.sort((a,b)=>{
    const aRank=a.next?.status==="needs_confirmation"?0:a.stale?1:(PRIORITY[a.next?.status]??9);
    const bRank=b.next?.status==="needs_confirmation"?0:b.stale?1:(PRIORITY[b.next?.status]??9);
    return aRank-bRank || b.updatedAt.localeCompare(a.updatedAt) || a.serviceName.localeCompare(b.serviceName);
  });
  return {
    state:"ready",
    projects,
    next:projects[0]?.next?{...projects[0].next,serviceName:projects[0].serviceName}:null,
    counts:{
      projects:projects.length,
      attention:projects.filter(p=>p.next && p.next.status!=="handed_off").length,
      awaitingOwnerReview:projects.filter(p=>p.tasks.some(t=>["draft","needs_review"].includes(t.status))||p.stale).length,
    },
    notice:projects.length?
      "Private checkpoints only. Public website, Business App and social publication are verified separately.":
      "No saved growth projects for this business yet. Start one in Build my business with BUSY.",
  };
}
const COMMAND_INTENTS=Object.freeze({
  review:/\b(approval|approve|approved|approving|review|reviews|reviewed|sign.?off|needs? my approval)\b/i,
  resume:/\b(continue|resume|carry on|pick up|open|go back|finish)\b/i,
  summary:/\b(where are we|what'?s left|what is left|status|progress|update|what next|what needs doing|show projects|what'?s next)\b/i,
});
function resolveGrowthCommand(text,centre){
  const utterance=safeText(text,320);
  if(!utterance)return {kind:"help",message:"Ask 'What's left to do?' or 'Continue my carpet cleaning project'."};
  if(/\b(publish|go live|launch now|post now|send out|delete|remove)\b/i.test(utterance))
    return {kind:"not_supported",message:"This command centre cannot publish or delete. Open the relevant editor and use its separate confirmed approval process."};
  const projects=Array.isArray(centre?.projects)?centre.projects:[];
  if(centre?.state!=="ready")return {kind:"unavailable",message:centre?.notice||"Load saved projects while signed in."};
  const matches=projects.filter(p=>utterance.toLocaleLowerCase("en-GB").includes(keyOf(p.serviceName)));
  if(matches.length>1)return {kind:"ambiguous",message:"More than one saved service matches. Choose a project below instead."};
  const matching=matches[0]||null;
  const intent=Object.keys(COMMAND_INTENTS).find(k=>COMMAND_INTENTS[k].test(utterance));
  if(!intent)return {kind:"help",message:"I can show saved project progress, review needs, or take you to a project. Nothing will be published."};
  if(!projects.length)return {kind:"empty",message:"There aren't any saved projects yet. Create one in Build my business with BUSY."};
  const selected=matching||centre.projects[0];
  if(intent==="review"){
    const waiting=projects.flatMap(p=>p.tasks.filter(t=>["draft","needs_review"].includes(t.status)).map(t=>({serviceName:p.serviceName,...t})));
    if(!waiting.length)return {kind:"summary",message:"No unreviewed private wording appears in the saved checkpoints. This is not a public publishing confirmation."};
    return {kind:"review",serviceName:matching?.serviceName||selected.serviceName,
      message:waiting.length+" private draft channel"+(waiting.length===1?" needs":"s need")+" review across your saved projects. Select a project to review the wording."};
  }
  if(intent==="resume")return {kind:"open_project",serviceName:selected.serviceName,
    message:"Open the private project for "+selected.serviceName+". Review the latest saved wording before acting."};
  const p=selected, progress=p.progress;
  return {kind:"summary",serviceName:p.serviceName,
    message:p.serviceName+": "+progress.reviewed+" of "+progress.total+" private drafts reviewed. "+
      (p.next?.description||"There is no additional private-draft step recorded.")+
      " Public publication has not been verified."};
}
export { buildGrowthCommandCentre, resolveGrowthCommand, LABELS };
