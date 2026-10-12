/**
 * V3.177: website owner feedback requires an authenticated owner/admin
 * membership resolved in busy-website-publish, plus the EXACT latest
 * server-prepared deployment and its source draft generation and ID.
 *
 * Local-only website revisions have not been server attested and must not be
 * saved as a permanent owner preference. No model training or publication.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GOALS=new Set(["book","enquire","services","photos","offers","rewards"]);
const ACTIONS=new Set(["fix_approved_facts","verify_customer_path",
 "review_navigation_layout","clarify_service_descriptions",
 "check_surface_consistency","review_business_content","inspect_real_widths"]);
const CHOICES=new Set(["approved","rejected","postponed"]);
async function currentPreparedWebsite(supabase,websiteForBusiness,businessId,body){
 const website=await websiteForBusiness(businessId);
 if(!website||!UUID.test(website.id)||!UUID.test(body?.deploymentId)||
    typeof body?.draftId!=="string"||
    !/^[a-z0-9._:-]{1,120}$/i.test(body.draftId)||
    !Number.isSafeInteger(body?.expectedGeneration)||body.expectedGeneration<1)
  throw Error("Prepare this private website revision before saving owner preferences.");
 const result=await supabase.from("busy_website_deployments")
  .select("id,website_id,business_id,source_generation,source_draft")
  .eq("business_id",businessId).eq("website_id",website.id)
  .order("version_no",{ascending:false}).limit(1).maybeSingle();
 if(result.error)throw Error("The server-prepared website version is unavailable.");
 const current=result.data;
 if(!current||current.id!==body.deploymentId||
  Number(current.source_generation)!==body.expectedGeneration||
  current.source_draft?.id!==body.draftId||
  Number(current.source_draft?.generation)!==body.expectedGeneration)
  throw Error("The website changed. Prepare the latest revision before remembering preferences.");
 return {website,deployment:current};
}
const normal=r=>({businessId:r.business_id,goal:r.goal,
 actionId:r.action_id,surface:"website",decision:r.decision,
 websiteRevision:Number(r.website_generation),appRevision:0});
async function readWebsiteBrainHistory(supabase,websiteForBusiness,businessId,userId,body){
 const {website,deployment}=await currentPreparedWebsite(
  supabase,websiteForBusiness,businessId,body);
 const r=await supabase.from("busy_website_brain_decisions")
  .select("business_id,goal,action_id,decision,website_generation")
  .eq("business_id",businessId).eq("owner_user_id",userId)
  .eq("deployment_id",deployment.id)
  .order("created_at",{ascending:false}).order("id",{ascending:false})
  .limit(80);
 if(r.error)throw Error("Website owner preferences require the V3.177 migration.");
 return {websiteId:website.id,deploymentId:deployment.id,
  draftId:body.draftId,websiteRevision:body.expectedGeneration,
  records:(r.data||[]).reverse().map(normal),
  ownerPrivateOnly:true,notModelRetraining:true,noPublishing:true};
}
async function recordWebsiteBrainChoice(
 supabase,websiteForBusiness,businessId,userId,body,requestKey){
 if(body?.ownerApproved!==true||body?.surface!=="website"||
  !GOALS.has(body?.goal)||!ACTIONS.has(body?.actionId)||
  !CHOICES.has(body?.decision)||
  typeof requestKey!=="string"||
  !/^[a-zA-Z0-9:_-]{8,160}$/.test(requestKey))
  throw Error("Choose a current owner-reviewed website improvement.");
 const {website,deployment}=await currentPreparedWebsite(
  supabase,websiteForBusiness,businessId,body);
 const entry={business_id:businessId,website_id:website.id,
  deployment_id:deployment.id,owner_user_id:userId,draft_id:body.draftId,
  website_generation:body.expectedGeneration,goal:body.goal,
  action_id:body.actionId,surface:"website",decision:body.decision,
  request_key:requestKey};
 const inserted=await supabase.from("busy_website_brain_decisions")
  .insert(entry).select("id").single();
 if(inserted.error?.code==="23505"){
  const found=await supabase.from("busy_website_brain_decisions")
   .select("website_id,deployment_id,draft_id,website_generation,goal,action_id,surface,decision")
   .eq("business_id",businessId).eq("owner_user_id",userId)
   .eq("request_key",requestKey).maybeSingle();
  const r=found.data;
  if(found.error||!r||r.website_id!==website.id||
   r.deployment_id!==deployment.id||r.draft_id!==body.draftId||
   Number(r.website_generation)!==body.expectedGeneration||
   r.goal!==body.goal||r.action_id!==body.actionId||
   r.surface!=="website"||r.decision!==body.decision)
   throw Error("A different owner decision already used this request key.");
 }else if(inserted.error)throw Error("Website owner preference could not be stored.");
 return {saved:true,websiteId:website.id,deploymentId:deployment.id,
  websiteRevision:body.expectedGeneration,decision:body.decision,
  actionId:body.actionId,publicWebsiteUnchanged:true,
  customerNotContacted:true,ownerPrivateOnly:true};
}
async function clearWebsiteBrainHistory(
 supabase,websiteForBusiness,businessId,userId,body){
 if(body?.ownerApproved!==true)throw Error("Explicit owner confirmation is required.");
 const {website,deployment}=await currentPreparedWebsite(
  supabase,websiteForBusiness,businessId,body);
 const r=await supabase.from("busy_website_brain_decisions")
  .delete().eq("business_id",businessId).eq("owner_user_id",userId)
  .eq("website_id",website.id).select("id");
 if(r.error)throw Error("Private website owner preferences could not be cleared.");
 return {cleared:true,websiteId:website.id,deploymentId:deployment.id,
  removedCount:(r.data||[]).length,publicWebsiteUnchanged:true};
}
export {currentPreparedWebsite,readWebsiteBrainHistory,
 recordWebsiteBrainChoice,clearWebsiteBrainHistory};
