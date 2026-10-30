import {planWebsitePageInstructions} from './websitePageInstructions.mjs';
import {prepareSelectedWebsiteTransaction} from './websiteContextPlan.mjs';
import {WEBSITE_ATOMIC_CHANGES,WEBSITE_ATOMIC_CHARACTERS,WEBSITE_REQUEST_CHANGES,WEBSITE_REQUEST_CHARACTERS} from './websiteEditingLimits.mjs';
import {stableJson} from './stableJson.mjs';
const fail=reason=>({ok:false,reason});
// Comparison is recovery evidence, NEVER a write permission or own-write receipt.
// Exact revision/CAS and current membership are independently enforced at save.
function websiteRequestContent(draft){
 if(!draft||typeof draft!=='object')return '';
 const {html,updatedAt,generation,...content}=draft;return stableJson(content);
}
function prepareWebsiteRequest(draft,request,deps={}){
 const plan=planWebsitePageInstructions(draft,request,{request:true});if(!plan.ok)return plan;
 if(websiteRequestContent(draft).length>250000)return fail('This website needs a smaller supported account draft before grouped editing.');
 if(plan.steps.length>WEBSITE_REQUEST_CHANGES||request.instruction.length>WEBSITE_REQUEST_CHARACTERS||typeof deps.renderPage!=='function'||typeof deps.rebuild!=='function')return fail('This request needs a smaller review. Your website is unchanged.');
 const groups=[];let pending=[];
 for(const step of plan.steps){
  const next=[...pending,step],words=next.map(x=>x.spoken).join('; ');
  if(words.length>WEBSITE_ATOMIC_CHARACTERS||next.length>WEBSITE_ATOMIC_CHANGES){
   if(!pending.length)return fail('One wording change is too long for a safe save. Shorten that change before previewing.');
   groups.push(pending);pending=[];
  }
  if(step.spoken.length>WEBSITE_ATOMIC_CHARACTERS)return fail('Shorten the long wording change before previewing.');
  pending.push(step);
 }
 if(pending.length)groups.push(pending);
 if(groups.length>6)return fail('Prepare a smaller part of this request first. Nothing was changed.');
 let working=draft;const prepared=[],boundaries=[websiteRequestContent(draft)];
 for(const steps of groups){
  const instruction=steps.map(x=>x.spoken).join('; ');
  // Re-parse each actual wire request, including resolved section references.
  const checked=planWebsitePageInstructions(working,{draftId:working.id,pageId:plan.pageId,generation:working.generation,instruction});
  if(!checked.ok)return fail(checked.reason);
  const outcome=prepareSelectedWebsiteTransaction(working,checked,deps);
  if(!outcome.applied)return fail(outcome.reason);
  const next=deps.rebuild({...outcome.draft,generation:working.generation});
  if(next.id!==draft.id||next.generation!==working.generation+1)return fail('The private revision could not be prepared safely.');
  prepared.push({instruction,steps:steps.map(x=>x.spoken),before:websiteRequestContent(working),after:websiteRequestContent(next)});
  working=next;boundaries.push(websiteRequestContent(working));
  if(boundaries.reduce((n,x)=>n+x.length,0)>2000000)return fail('This request is too large to compare safely. Review a smaller part first.');
 }
 let originalHtml,candidateHtml;
 try{originalHtml=deps.renderPage(draft,plan.pageId);candidateHtml=deps.renderPage(working,plan.pageId);}catch{return fail('This request cannot be previewed safely.');}
 if([originalHtml,candidateHtml].some(h=>typeof h!=='string'||h.length>500000||!h.startsWith('<!doctype html>')||/<script\b|data-busy-edit-section|busy.contextual-action.v1/i.test(h)))return fail('Only a safe static preview can be compared.');
 return {ok:true,kind:'reviewed_website_request',draftId:draft.id,businessId:draft.businessId,pageId:plan.pageId,generation:draft.generation,instruction:request.instruction,groups:prepared,boundaries,originalHtml,candidateHtml,steps:plan.steps.map(x=>x.spoken),neverPublishes:true,providerCalls:0,summary:prepared.length===1?'Review your proposed website changes.':'Review the complete result below. Each part needs its own approval and save; earlier saved parts remain if you stop.'};
}
function locateWebsiteRequest(request,draft){
 if(!request?.ok||request.kind!=='reviewed_website_request'||draft?.id!==request.draftId||draft?.businessId!==request.businessId||!Number.isSafeInteger(draft?.generation))return fail('Choose the original business website before continuing.');
 const completed=draft.generation-request.generation;
 if(completed<0||completed>request.groups.length||request.boundaries[completed]!==websiteRequestContent(draft))return fail('The website changed outside this plan. Keep the request and preview the remaining work again. Nothing will be replayed.');
 return {ok:true,completed,done:completed===request.groups.length,next:request.groups[completed]||null,notOwnReceipt:true};
}
export {prepareWebsiteRequest,locateWebsiteRequest,websiteRequestContent};
