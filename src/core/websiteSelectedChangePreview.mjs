import {reviewWebsiteEditingQuality} from "../../supabase/functions/busy-website-worker/websiteEditingQuality.mjs";
/**
 * V3.148 — Private, on-demand, exact-element design preview.
 *
 * Uses V3.147's one-Undo all-or-nothing planner and existing website domain
 * edits. NEVER saves, publishes, invokes paid AI or changes original draft.
 * The controller re-plans from current state when Apply is eventually tapped.
 */
import {planSelectedWebsiteChanges,prepareSelectedWebsiteTransaction} from "./websiteContextPlan.mjs";
import {selectedWebsiteVoiceContextIsCurrent} from "./websiteSelectedVoiceContext.mjs";
const fail=reason=>({ok:false,reason});
function previewSelectedWebsiteInstruction(draft,{selection,instruction}={},deps={}){
 if(selection?.field!=="photo"&&selection?.photoIndex!==-1&&selection?.photoIndex!=null)
  return fail("That selection is inconsistent. Tap the website part again.");
 if(!selectedWebsiteVoiceContextIsCurrent(draft,selection))
  return fail("Your website changed. Tap the part you want to edit again.");
 if(typeof instruction!=="string"||!instruction.trim()||instruction.length>400)
  return fail("Ask for one to three short changes.");
 if(typeof deps.fieldEdit!=="function"||typeof deps.layoutEdit!=="function"||
    typeof deps.renderPage!=="function")return fail("The preview is not ready.");
 const plan=planSelectedWebsiteChanges(draft,selection.pageId,selection,instruction);
 if(!plan.ok)return fail(plan.reason);
 const result=prepareSelectedWebsiteTransaction(draft,plan,{
  fieldEdit:deps.fieldEdit,layoutEdit:deps.layoutEdit
 });
 if(!result.applied)return fail(result.reason||"The requested changes could not be previewed.");
 let originalHtml="",candidateHtml="";
 try{
  originalHtml=deps.renderPage(draft,selection.pageId);
  candidateHtml=deps.renderPage(result.draft,selection.pageId);
 }catch{return fail("This page could not be previewed. Your original website is unchanged.");}
 if(typeof originalHtml!=="string"||typeof candidateHtml!=="string"||
    originalHtml.length>500000||candidateHtml.length>500000||
    !originalHtml.startsWith("<!doctype html>")||!candidateHtml.startsWith("<!doctype html>")||
    /<script\b|data-busy-edit-section|busy.contextual-action.v1/i.test(originalHtml+candidateHtml))
  return fail("The safe, static preview could not be prepared.");
 return {ok:true,quality:reviewWebsiteEditingQuality(result.draft),draftId:draft.id,pageId:selection.pageId,
  generation:draft.generation,originalHtml,candidateHtml,
  steps:plan.steps.map(x=>({spoken:x.spoken,description:x.description})),
  summary:"Preview only — "+result.steps+
   (result.steps===1?" change":" changes")+
   ". The original stays untouched until you choose Apply."};
}
export {previewSelectedWebsiteInstruction};
