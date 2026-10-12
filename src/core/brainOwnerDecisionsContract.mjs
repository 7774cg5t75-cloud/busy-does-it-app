/**
 * V3.176: pure validation used by the native UI before owner writes.
 * The Edge service repeats all checks and resolves authenticated membership.
 */
const ACTIONS=["fix_approved_facts","verify_customer_path",
"review_navigation_layout","clarify_service_descriptions",
"check_surface_consistency","review_business_content","inspect_real_widths"];
const GOALS=["book","enquire","services","photos","offers","rewards"];
const DECISIONS=["approved","rejected","postponed"];
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validateOwnerBrainWrite({appId="",expectedRevision=0,goal="",
 actionId="",decision="",surface="app",ownerApproved=false}={}){
 if(!UUID.test(appId)||!Number.isSafeInteger(expectedRevision)||
 expectedRevision<1||!GOALS.includes(goal)||!ACTIONS.includes(actionId)||
 !DECISIONS.includes(decision)||surface!=="app"||!ownerApproved)
 return {ok:false,reason:"Review an existing owner action on your current Business App."};
 return {ok:true,appId,expectedRevision,goal,actionId,decision,surface,
 ownerApproved:true,noExecution:true,requiresAuthenticatedEdgeWrite:true};
}
function normalizeOwnerBrainHistory({records,appId="",appRevision=0,
 businessId=""}={}){
 if(!UUID.test(appId)||!UUID.test(businessId)||
 !Number.isSafeInteger(appRevision)||appRevision<1||
 !Array.isArray(records)||records.length>80)return {ok:false,records:[]};
 const result=[];
 for(const r of records){
  if(r?.businessId!==businessId||r?.appRevision!==appRevision||
   r?.websiteRevision!==0||r?.surface!=="app"||
   !GOALS.includes(r.goal)||!ACTIONS.includes(r.actionId)||
   !DECISIONS.includes(r.decision))return {ok:false,records:[]};
  result.push({businessId,goal:r.goal,actionId:r.actionId,
   surface:"app",decision:r.decision,appRevision,websiteRevision:0});
 }
 return {ok:true,records:result,privateOnly:true,notModelTraining:true};
}
export {validateOwnerBrainWrite,normalizeOwnerBrainHistory};
