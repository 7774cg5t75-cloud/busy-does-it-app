import {WEBSITE_ATOMIC_CHARACTERS} from './websiteEditingLimits.mjs';
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
 if(typeof instruction!=="string"||!instruction.trim()||instruction.length>WEBSITE_ATOMIC_CHARACTERS)
  return fail("Describe the changes you want to preview.");
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

// Amend only a finite suggestion through the original selected instruction
// planner. No draft writes, publication, raw operations or independent Undo.
function amendSelectedWebsiteQualityInstruction(draft,{selection,instruction,repair}={}){
 if(!selectedWebsiteVoiceContextIsCurrent(draft,selection))return fail('This selection changed. Tap the current website part again.');
 const wording={headingScale:'make this heading normal',sectionSpacing:'set this section spacing to normal'};
 if(selection.itemId||repair?.action!=='section-style'||repair.sectionId!==selection.sectionId||
    repair.value!=='normal'||!Object.hasOwn(wording,repair.field)||
    repair.field==='headingScale'&&selection.field!=='title')
  return fail('Use the section controls for this adjustment. Your current proposal is unchanged.');
 const plan=planSelectedWebsiteChanges(draft,selection.pageId,selection,instruction);if(!plan.ok)return fail(plan.reason);
 const same=change=>change?.action==='section-style'&&change.sectionId===repair.sectionId&&change.field===repair.field;
 if(plan.steps.some(step=>step.change?.action==='style-group'&&step.change.operations.some(same)))
  return fail('This setting is part of a coordinated style. Review its section controls instead; no changes were made.');
 let replaced=false;
 const clauses=plan.steps.map(step=>{if(same(step.change)){replaced=true;return wording[repair.field];}return step.spoken;});
 if(!replaced)clauses.push(wording[repair.field]);
 const revised=clauses.join('; '),checked=planSelectedWebsiteChanges(draft,selection.pageId,selection,revised);
 return checked.ok?{ok:true,instruction:revised,plan:checked}:fail(checked.reason);
}
export {amendSelectedWebsiteQualityInstruction};
