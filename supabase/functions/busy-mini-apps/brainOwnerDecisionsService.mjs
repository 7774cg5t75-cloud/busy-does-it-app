/**
 * V3.176 — real private owner-decision persistence behind the existing
 * authenticated busy-mini-apps Edge boundary. Service-role only DB table;
 * ONLY call these after membership(...,requireWrite=true) succeeds.
 * The businessId comes from resolved membership, not caller body.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GOALS=new Set(["book","enquire","services","photos","offers","rewards"]);
const DECISIONS=new Set(["approved","rejected","postponed"]);
const ACTIONS=new Set(["fix_approved_facts","verify_customer_path",
 "review_navigation_layout","clarify_service_descriptions",
 "check_surface_consistency","review_business_content","inspect_real_widths"]);
const MAX=80;
const allowedKey=x=>typeof x==="string"&&/^[a-zA-Z0-9:_-]{8,160}$/.test(x);
function normalizeAppBrainRecord(row){
 return {businessId:row.business_id,goal:row.goal,actionId:row.action_id,
  surface:"app",decision:row.decision,appRevision:Number(row.app_revision),
  websiteRevision:0};
}
async function currentApp(supabase,appForBusiness,businessId,body){
 const app=await appForBusiness(businessId);
 if(!app||!UUID.test(app.id)||app.id!==body?.appId||
  !Number.isSafeInteger(Number(body?.expectedRevision))||
  Number(body.expectedRevision)<=0||
  Number(app.draft_revision)!==Number(body.expectedRevision))
  throw Error("The Business App has changed. Reopen its latest private draft.");
 return app;
}
async function readOwnerBrainDecisions(
 supabase,appForBusiness,businessId,userId,body){
 const app=await currentApp(supabase,appForBusiness,businessId,body);
 const response=await supabase.from("busy_brain_owner_decisions")
  .select("business_id,goal,action_id,decision,app_revision,website_revision")
  .eq("business_id",businessId).eq("owner_user_id",userId)
  .eq("app_id",app.id).eq("app_revision",app.draft_revision)
  .order("created_at",{ascending:false}).order("id",{ascending:false})
  .limit(MAX);
 if(response.error)throw Error("Owner decisions are unavailable until the V3.176 database migration is deployed.");
 // The policy layer consumes chronological history so the latest decision
 // for an action takes precedence. Limit output to same current revision.
 const records=(response.data||[]).reverse().map(normalizeAppBrainRecord);
 return {appId:app.id,draftRevision:Number(app.draft_revision),
  records,ownerPrivateOnly:true,limitedTo:MAX,
  noCustomerRecordsRead:true,noModelRetraining:true,
  noAutomaticEdits:true,noPublishing:true};
}
async function recordOwnerBrainDecision(
 supabase,appForBusiness,businessId,userId,body,requestKey){
 if(body?.ownerApproved!==true||body?.surface!=="app"||
  !GOALS.has(body?.goal)||!DECISIONS.has(body?.decision)||
  !ACTIONS.has(body?.actionId)||!allowedKey(requestKey))
  throw Error("Review a supported private owner action before saving a decision.");
 const app=await currentApp(supabase,appForBusiness,businessId,body);
 const entry={business_id:businessId,owner_user_id:userId,app_id:app.id,
  app_revision:Number(app.draft_revision),website_revision:0,
  surface:"app",goal:body.goal,action_id:body.actionId,
  decision:body.decision,request_key:requestKey};
 let saved=await supabase.from("busy_brain_owner_decisions")
  .insert(entry).select("id").single();
 if(saved.error?.code==="23505"){
  const existing=await supabase.from("busy_brain_owner_decisions")
   .select("app_id,app_revision,goal,action_id,decision,surface")
   .eq("business_id",businessId).eq("owner_user_id",userId)
   .eq("request_key",requestKey).maybeSingle();
  if(existing.error||!existing.data||
   existing.data.app_id!==entry.app_id||
   Number(existing.data.app_revision)!==entry.app_revision||
   existing.data.goal!==entry.goal||
   existing.data.action_id!==entry.action_id||
   existing.data.decision!==entry.decision||
   existing.data.surface!=="app")
   throw Error("This request key was already used for a different decision.");
 }else if(saved.error)throw Error("Owner decision could not be saved.");
 return {ownerDecisionRecorded:true,appId:app.id,
  draftRevision:Number(app.draft_revision),
  decision:entry.decision,actionId:entry.action_id,
  ownerPrivateOnly:true,noCustomerContact:true,
  workItemNotExecuted:true,publishedAppUnchanged:true};
}
async function clearOwnerBrainDecisions(
 supabase,appForBusiness,businessId,userId,body){
 if(body?.ownerApproved!==true)throw Error("Confirm before clearing private owner decisions.");
 const app=await currentApp(supabase,appForBusiness,businessId,body);
 const removed=await supabase.from("busy_brain_owner_decisions")
  .delete().eq("business_id",businessId)
  .eq("owner_user_id",userId).eq("app_id",app.id)
  .select("id");
 if(removed.error)throw Error("Private decision history could not be cleared.");
 return {cleared:true,appId:app.id,removedCount:(removed.data||[]).length,
  publishedAppUnchanged:true,noCustomerContact:true};
}
export {readOwnerBrainDecisions,recordOwnerBrainDecision,
 clearOwnerBrainDecisions};
