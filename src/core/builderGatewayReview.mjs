import {validateBuilderProposal,prepareGovernedBuilderReview,prepareGovernedAppPreview} from './governedBuilderProposal.mjs';
// Response is an untrusted suggestion. Fresh local account projection and the
// existing review/writer own authority; this adapter never saves or publishes.
export function prepareBuilderGatewayReview({response,context,current,appGoal='services'}={},deps={}){
 if(response?.ok!==true||response.simulation!==true||response.mayExecute!==false||response.requiresOwnerReview!==true)return {ok:false,reason:'No supported private suggestion was confirmed. Keep your original work.',mayExecute:false};
 const checked=validateBuilderProposal(response.proposal,context);if(!checked.ok)return checked;
 return context.scope.surface==='app'?prepareGovernedAppPreview(checked.proposal,context,current,appGoal):prepareGovernedBuilderReview(checked.proposal,context,current,deps);
}
