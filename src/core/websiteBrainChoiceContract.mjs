/** V3.177: Website Brain owner preferences require server-prepared
 * deployment, matching current local draft and authenticated Edge check.
 * On-device metadata can never grant authorisation on its own.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GOALS=["book","enquire","services","photos","offers","rewards"];
const ACTIONS=["fix_approved_facts","verify_customer_path","review_navigation_layout",
 "clarify_service_descriptions","check_surface_consistency",
 "review_business_content","inspect_real_widths"];
const DECISIONS=["approved","rejected","postponed"];
function currentPreparedWebsiteRevision({
 draft=null,hostedPreview=null,draftChangedSinceHosted=false
}={}){
 const gen=draft?.generation;
 const serverGen=Number(hostedPreview?.source_generation);
 const hasMatch=!!draft&&!!hostedPreview&&
  typeof draft.id==="string"&&/^[a-z0-9._:-]{1,120}$/i.test(draft.id)&&
  UUID.test(hostedPreview.id)&&Number.isSafeInteger(gen)&&gen>0&&
  Number.isSafeInteger(serverGen)&&serverGen===gen&&
  draftChangedSinceHosted!==true;
 return hasMatch?{ok:true,deploymentId:hostedPreview.id,draftId:draft.id,
  expectedGeneration:gen,serverStillMustValidate:true}:
  {ok:false,reason:"Prepare the latest website preview before storing preferences."};
}
function validateWebsiteBrainChoice({
 goal="",actionId="",decision="",ownerApproved=false,...revision
}={}){
 const valid=currentPreparedWebsiteRevision(revision);
 if(!valid.ok||!ownerApproved||!GOALS.includes(goal)||
   !ACTIONS.includes(actionId)||!DECISIONS.includes(decision))
  return {ok:false,reason:valid.reason||
   "Choose a valid private website improvement for owner review."};
 return {...valid,goal,actionId,decision,surface:"website",
  ownerApproved:true,noPublishing:true};
}
function normalizeWebsiteBrainHistory({
 history=null,businessId="",draft=null,hostedPreview=null
}={}){
 const meta=currentPreparedWebsiteRevision({draft,hostedPreview});
 if(!meta.ok||!UUID.test(businessId)||
   history?.deploymentId!==meta.deploymentId||
   history?.draftId!==meta.draftId||
   Number(history?.websiteRevision)!==meta.expectedGeneration||
   !Array.isArray(history.records)||history.records.length>80)
  return {ok:false,records:[]};
 const records=[];
 for(const r of history.records){
  if(r?.businessId!==businessId||r?.websiteRevision!==meta.expectedGeneration||
    r?.appRevision!==0||r?.surface!=="website"||
    !GOALS.includes(r.goal)||!ACTIONS.includes(r.actionId)||
    !DECISIONS.includes(r.decision))return {ok:false,records:[]};
  records.push({businessId,websiteRevision:meta.expectedGeneration,appRevision:0,
   surface:"website",goal:r.goal,actionId:r.actionId,decision:r.decision});
 }
 return {ok:true,records,privateOnly:true,noModelRetraining:true};
}
export {currentPreparedWebsiteRevision,validateWebsiteBrainChoice,
 normalizeWebsiteBrainHistory};
