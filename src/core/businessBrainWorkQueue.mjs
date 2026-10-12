/**
 * V3.175 — Business Brain prepares, NEVER executes, owner-reviewed jobs.
 *
 * A deterministic policy layer over the shared customer-journey planning.
 * Personal learning is limited to explicit current-business owner decisions;
 * a rejected action is suppressed for that revision, never inferred from
 * customer messages and never shared across businesses.
 */
import {prepareOwnerImprovementPlan} from "./ownerImprovementPlan.mjs";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_DECISIONS=["approved","rejected","postponed"];
const ALLOWED_SURFACES=["app","website","both"];
function prepareBusinessBrainWork({
 businessId="",goal="enquire",websiteDraft=null,brandBrain={},
 appConfig=null,websiteRevision=0,appRevision=0,scope=null,
 ownerDecisions=[]
}={}){
 if(!UUID.test(businessId)||!Array.isArray(ownerDecisions)||
   ownerDecisions.length>80)return {ok:false,
    reason:"Use the current authenticated business and bounded owner decisions."};
 const both=!!websiteDraft&&!!appConfig;
 if(both&&(scope?.authorizedBusinessId!==businessId||
   scope?.websiteBusinessId!==businessId||
   scope?.appBusinessId!==businessId))return {ok:false,
    reason:"Website and app drafts must belong to this authenticated workspace."};
 if(!both&&scope?.authorizedBusinessId&&
    scope.authorizedBusinessId!==businessId)return {ok:false,
     reason:"Business context does not match the current workspace."};
 const plan=prepareOwnerImprovementPlan({
  goal,websiteDraft,brandBrain,appConfig,websiteRevision,appRevision,
  scope:both?scope:null
 });
 if(!plan.ok)return plan;
 const decisions=new Map();
 for(const record of ownerDecisions){
  if(record?.businessId!==businessId||record?.goal!==goal||
   !ALLOWED_DECISIONS.includes(record?.decision)||
   typeof record?.actionId!=="string"||
   !/^[a-z_]{1,64}$/.test(record.actionId)||
   !ALLOWED_SURFACES.includes(record?.surface)||
   record?.appRevision!==appRevision||
   record?.websiteRevision!==websiteRevision)
   continue;
  // Input order comes from the trusted owner-specific store, oldest first.
  decisions.set(record.actionId,record.decision);
 }
 const suppressed=[],jobs=[];
 for(const action of plan.actions){
  const ownerDecision=decisions.get(action.id)||"not_decided";
  if(ownerDecision==="rejected"||ownerDecision==="postponed"){
   suppressed.push({id:action.id,reason:ownerDecision==="rejected"?
     "Owner rejected this proposal for the current revision.":
     "Owner postponed this proposal for the current revision."});
   continue;
  }
  jobs.push({
   id:action.id,title:action.title,
   surface:action.surface,goal,
   reason:action.reason,ownerAction:action.nextAction,
   evidence:action.evidence,
   state:ownerDecision==="approved"?"owner_agreed_not_executed":
     "awaiting_owner_review",
   nextStep:ownerDecision==="approved"?
     "Use the existing private editor to make and save the approved change; verify it afterward.":
     "Read the explanation and approve or reject this proposed action.",
   permissions:{mayEdit:false,maySpend:false,mayPublish:false,
    maySendCustomerMessages:false},
   validation:"recheck_private_draft_revision_before_any_future_action",
   executionAttempted:false
  });
 }
 return {ok:true,kind:"business_brain_owner_work_queue_v3175",
  goal,appRevision,websiteRevision,
  items:jobs.slice(0,3),suppressed,
  preparedCount:jobs.length,capacity:3,
  allActionsFromCurrentBusinessOnly:true,
  ownerDecisionRequired:true,previousOwnerChoicesHonoured:true,
  noModelWeightTraining:true,noCrossTenantLearning:true,
  approvedMeansPermissionToPrepareNotExecute:true,
  noAutomaticEdits:true,noAutomaticPublishing:true,
  noProviderCalls:true,noCharges:true,noCustomerDataRead:true};
}
/**
 * Deliberately returns a proposal for an OWNER INTERACTION, not an
 * executable instruction. A stale revision or new business fails closed.
 */
function previewBusinessBrainDecision(queue,{
 businessId="",currentBusinessId="",actionId="",appRevision=0,
 websiteRevision=0,decision="approved"
}={}){
 if(!queue?.ok||queue.kind!=="business_brain_owner_work_queue_v3175"||
   !UUID.test(businessId)||businessId!==currentBusinessId||
   !ALLOWED_DECISIONS.includes(decision)||
   queue.appRevision!==appRevision||
   queue.websiteRevision!==websiteRevision)return {
    ok:false,reason:"Choose a current, authenticated owner work item."};
 const item=queue.items.find(x=>x.id===actionId);
 if(!item)return {ok:false,reason:"This action is not in the current review queue."};
 return {ok:true,kind:"business_brain_decision_preview_v3175",
  actionId,decision,scope:"current_business_only",
  recommendedEditor:item.surface,
  approvalAppliesToCurrentRevisionOnly:true,
  persistencePerformed:false,
  businessActionExecuted:false,
  allowedToPublish:false,allowedToSpend:false,
  allowedToMessageCustomers:false,
  ownerMustConfirmInExistingEditor:true};
}
export {prepareBusinessBrainWork,previewBusinessBrainDecision};
