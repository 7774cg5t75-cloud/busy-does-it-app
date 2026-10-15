import {splitBuilderInstructionClauses} from './builderInstructionClauses.mjs';
/**
 * V3.147: an intentionally bounded multi-step contextual website instruction.
 *
 * The selected element is the ONLY referent. No arbitrary model-produced
 * actions, HTML or cross-business changes can enter this pathway.
 * Every instruction is parsed against the current private draft before a
 * single immutable transaction is prepared.
 */
import {interpretSelectedWebsiteRequest} from "./websiteContextualEdit.mjs";
const MAX_STEPS=5;
const MAX_CHARACTERS=400;
const list=x=>Array.isArray(x)?x:[];
const error=reason=>({ok:false,reason,steps:[]});
function splitSelectedWebsiteInstruction(text){
 if(typeof text!=="string"||!text.trim()||text.length>MAX_CHARACTERS)return null;
 return splitBuilderInstructionClauses(text,{website:true,max:MAX_STEPS});
}
function planSelectedWebsiteChanges(draft,pageId,selection,instruction){
 const clauses=splitSelectedWebsiteInstruction(instruction);
 if(!clauses)return error("Ask for up to five short changes. Separate them with 'and then' or a semicolon.");
 const steps=[];
 const changed=new Set();
 for(let i=0;i<clauses.length;i++){
  const result=interpretSelectedWebsiteRequest(draft,pageId,selection,clauses[i]);
  if(!result.ok)return error("No changes were made. Step "+(i+1)+": "+result.reason);
  const c=result.change||{};
  const target=[
   result.type,
   c.action||"field",
   c.sectionId||"",
   c.itemId||"",
   c.field||"",
   c.action==="image-style"||c.action==="move-gallery-photo"?c.photoIndex:"",
  ].join(":");
  if(changed.has(target))
   return error("Two instructions would change the same setting. Choose one change for that setting.");
  changed.add(target);
  steps.push({type:result.type,change:{...c},description:result.reason,spoken:clauses[i]});
 }
 return {ok:true,steps,requiresExplicitApproval:true,
  summary:steps.length===1?"One change to the selected part":
   steps.length+" changes to the selected part, all saved together with one Undo"};
}
/**
 * Apply an already verified plan to a candidate only. The caller MUST plan
 * from the current draft and exact selected element, never accept operations
 * directly from the WebView, a transcription provider or user-supplied JSON.
 */
function prepareSelectedWebsiteTransaction(draft,plan,{fieldEdit,layoutEdit}={}){
 if(!draft?.id||!plan?.ok||!list(plan.steps).length||
   list(plan.steps).length>MAX_STEPS||
   typeof fieldEdit!=="function"||typeof layoutEdit!=="function")
  return {applied:false,draft,reason:"The selected website instructions need review."};
 let working=draft;
 const messages=[];
 for(let i=0;i<plan.steps.length;i++){
  const step=plan.steps[i];
  if(!step||!["field","layout"].includes(step.type)||
    !step.change||typeof step.change!=="object")
   return {applied:false,draft,reason:"The instructions contain an unsupported change."};
  const outcome=(step.type==="field"?fieldEdit:layoutEdit)(working,step.change);
  if(!outcome?.applied||!outcome?.draft||
    outcome.draft.id!==draft.id||
    Number(outcome.draft.generation)<=Number(working.generation))
   return {applied:false,draft,
    reason:"Nothing was changed. Step "+(i+1)+" could not be completed safely. "+
      String(outcome?.reason||"Try a smaller request.").slice(0,160)};
  working=outcome.draft;
  messages.push(String(outcome.reason||step.description||"Change prepared").slice(0,140));
 }
 return {applied:true,draft:working,steps:plan.steps.length,
  reason:"Saved "+plan.steps.length+" selected changes in one private edit. Undo restores all of them.",
  messages};
}
export {MAX_STEPS,MAX_CHARACTERS,splitSelectedWebsiteInstruction,
 planSelectedWebsiteChanges,prepareSelectedWebsiteTransaction};
