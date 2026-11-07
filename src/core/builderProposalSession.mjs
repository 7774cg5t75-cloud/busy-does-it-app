import {builderInterpretationEnvelope,validateBuilderProposal,prepareGovernedBuilderReview} from './governedBuilderProposal.mjs';
import {stableJson} from './stableJson.mjs';
// One local review lifecycle, not an executor, background agent or budget ledger.
// getCurrent must rebuild the current verified scoped projection; server writes
// still independently recheck current membership/revisions on original routes.
export function createBuilderProposalSession({getCurrent,interpretOffline,deps={}}={}){
 if(typeof getCurrent!=='function'||typeof interpretOffline!=='function')throw Error('Current project and offline interpretation are required.');
 let epoch=0,state='idle',review=null,pending=false;
 const no=reason=>({ok:false,reason,mayExecute:false});
 const currentEquals=anchor=>{try{return stableJson(getCurrent())===stableJson(anchor);}catch{return false;}};
 return {
  get status(){return state;},
  cancel(){epoch++;state='idle';review=null;},
  async prepare(goal){
   if(pending)return no('Finish or cancel the current idea first.');
   const source=getCurrent(),envelope=builderInterpretationEnvelope(source,goal);if(envelope.ok===false)return envelope;
   const token=++epoch;pending=true;state='interpreting';review=null;
   try{
    const response=await interpretOffline(envelope);
    if(token!==epoch||!currentEquals(source)){if(token===epoch)state='stale';return no('Your request or project changed. Prepare a fresh idea.');}
    const checked=validateBuilderProposal(response,source);if(!checked.ok){state='unavailable';return checked;}
    const prepared=prepareGovernedBuilderReview(checked.proposal,source,getCurrent(),deps);if(!prepared.ok){state='unavailable';return prepared;}
    // Store exact proposal and source privately; never trust a mutable UI result.
    review={source,proposal:checked.proposal,goal};state='review';return prepared;
   }catch{if(token===epoch)state='unavailable';return no('The idea could not be prepared. Your original work is unchanged.');}
   finally{pending=false;}
  },
  reviewAgain(){if(!review||state!=='review'||!currentEquals(review.source))return no('Prepare a fresh review of the current project.');return prepareGovernedBuilderReview(review.proposal,review.source,getCurrent(),deps);},
  correction(words){
   if(!review||state!=='review'||!currentEquals(review.source))return no('Open the current idea before correcting it.');
   // Task-only corrections; durable facts still use original approved profile API.
   if(typeof words!=='string'||words.length>240)return no('Describe the part you would like to keep or change.');
   const value=words.trim().toLowerCase();
   if(/keep (?:the )?(?:words|wording).*change (?:the )?design/.test(value)&&review.proposal.kind==='website-design')return {ok:true,taskOnly:true,keepsWording:true,review:this.reviewAgain(),mayExecute:false};
   if(/field staff rather than customers/.test(value)&&review.proposal.kind==='app-requirements'){
    const previous=review;epoch++;review=null;state='idle';return {ok:true,taskOnly:true,originalGoal:previous.goal,previousRequirements:previous.proposal.app,nextGoal:'Prepare the app for field staff. Review which screens and private information they need; do not grant customer or owner permissions.',requiresNewInterpretation:true,mayExecute:false};
   }
   if(/offer.*saved/.test(value))return {ok:true,taskOnly:true,contextKind:'saved-content',requiresExactSelection:true,nextAction:'Choose the saved wording in the original content review.',mayExecute:false};
   return {ok:false,taskOnly:true,reason:'Which part should I change? Your current idea and original work are kept.',mayExecute:false};
  }
 };
}
