/**
 * V3.149 finite multi-section website conversation.
 * A page, owner and draft generation must be named explicitly. No LLM
 * guesses a target or supplies unreviewed operations. All steps share the
 * existing immutable layout transaction and exactly one Undo on approval.
 */
import {splitSelectedWebsiteInstruction,prepareSelectedWebsiteTransaction} from "./websiteContextPlan.mjs";
import {privateBuilderRevisionMatches} from "./privateBuilderBoundary.mjs";
const list=x=>Array.isArray(x)?x:[];
const fail=reason=>({ok:false,reason,steps:[]});
const forbidden=/\b(publish|delete|remove|transfer|export|upload|send|buy|purchase)\b/i;
function planWebsitePageInstructions(draft,{draftId,pageId,generation,instruction}={}){
 if(!privateBuilderRevisionMatches(draft,{draftId,generation,pageId}))
  return fail("The website or selected page changed. Review the current draft again.");
 const page=list(draft.pages).find(p=>p.id===pageId&&p.enabled!==false);
 if(!page)return fail("Choose a current website page.");
 const clauses=splitSelectedWebsiteInstruction(instruction);
 if(!clauses)return fail("Ask for up to five clear changes separated by 'and then' or semicolons.");
 const steps=[],targets=new Set();
 const findSection=phrase=>{
  const name=String(phrase||"").trim().toLowerCase();
  const matches=list(draft.sections).filter(s=>s?.enabled!==false&&
   list(page.sectionIds).includes(s.id)&&
   (String(s.id).toLowerCase()===name||String(s.title||"").trim().toLowerCase()===name));
  return matches.length===1?matches[0]:null;
 };
 for(let i=0;i<clauses.length;i++){
  const clause=clauses[i];
  if(forbidden.test(clause))return fail("No changes were made. Publishing, deleting and external actions need separate approval.");
  let m,change,description;
  if((m=clause.match(/^move (?:the )?(.+?) section (up|down)$/i))){
   const section=findSection(m[1]);if(!section)return fail("Name one visible section on this page: "+m[1]);
   change={action:"move",sectionId:section.id,direction:m[2].toLowerCase()};
   description="Move "+section.title+" "+m[2].toLowerCase();
  }else if((m=clause.match(/^(?:make|set) (?:the )?(.+?) heading (bigger|larger|smaller|normal)(?: (?:only )?on (phones?|mobile|desktop|computers?|wide screens?))?$/i))){
   const section=findSection(m[1]);if(!section)return fail("Name one visible heading section: "+m[1]);
   const device=m[3]?/phone|mobile/i.test(m[3])?"mobile":"desktop":"";
   change={action:"section-style",sectionId:section.id,
    field:device?device+"HeadingScale":"headingScale",
    value:/bigger|larger/i.test(m[2])?"large":/smaller/i.test(m[2])?"compact":"normal"};
   description="Resize "+section.title+" heading"+(device?" on "+device:"");
  }else if((m=clause.match(/^(?:make|show) (?:the )?gallery (?:photos|pictures|images) (bigger|larger|smaller|normal)(?: (?:only )?on (phones?|mobile|desktop|computers?|wide screens?))?$/i))){
   const section=findSection("gallery");if(!section||section.type!=="gallery")return fail("The gallery is not on this page.");
   const device=m[2]?/phone|mobile/i.test(m[2])?"mobile":"desktop":"";
   change={action:"section-style",sectionId:section.id,
    field:device?device+"GallerySize":"gallerySize",
    value:/bigger|larger/i.test(m[1])?"large":/smaller/i.test(m[1])?"compact":"comfortable"};
   description="Resize gallery images"+(device?" on "+device:"");
  }else if((m=clause.match(/^(?:give|make) (?:the )?(.+?) section (more|less) (?:space|spacing|breathing room)$/i))){
   const section=findSection(m[1]);if(!section)return fail("Name one visible section: "+m[1]);
   change={action:"section-style",sectionId:section.id,field:"sectionSpacing",
    value:m[2].toLowerCase()==="more"?"generous":"compact"};
   description="Adjust spacing in "+section.title;
  }else if(/^(?:make|give) (?:the )?(?:main|hero|contact) button (?:stand out|more prominent)$/i.test(clause)){
   change={action:"style",field:"ctaEmphasis",value:"strong"};
   description="Emphasise the existing approved website button";
  }else return fail("No changes were made. Step "+(i+1)+" is not a supported, exact instruction. Try 'move the services section up' or 'make the hero heading smaller on phones'.");
  const key=[change.action,change.sectionId||"global",change.field||"position"].join(":");
  if(targets.has(key))return fail("Two steps affect the same setting. Give one instruction for that setting.");
  targets.add(key);steps.push({type:"layout",change,spoken:clause,description});
 }
 return {ok:true,draftId,pageId,generation,steps,requiresExplicitApproval:true,
  summary:steps.length+" named page change"+(steps.length===1?"":"s")+" ready for private preview"};
}
function prepareWebsitePageInstructionPreview(draft,request={},deps={}){
 const plan=planWebsitePageInstructions(draft,request);
 if(!plan.ok)return plan;
 if(typeof deps.layoutEdit!=="function"||typeof deps.renderPage!=="function")
  return fail("Website preview is unavailable.");
 const prepared=prepareSelectedWebsiteTransaction(draft,plan,{
  fieldEdit:()=>({applied:false}),layoutEdit:deps.layoutEdit});
 if(!prepared.applied)return fail(prepared.reason);
 let originalHtml,candidateHtml;
 try{
  originalHtml=deps.renderPage(draft,plan.pageId);
  candidateHtml=deps.renderPage(prepared.draft,plan.pageId);
 }catch{return fail("The preview could not be rendered. Your website is unchanged.");}
 if([originalHtml,candidateHtml].some(html=>typeof html!=="string"||
   html.length>500000||!html.startsWith("<!doctype html>")||
   /<script\b|data-busy-edit-section|busy.contextual-action.v1/i.test(html)))
  return fail("Only safe static website pages may be compared.");
 return {ok:true,draftId:plan.draftId,pageId:plan.pageId,generation:plan.generation,
  originalHtml,candidateHtml,steps:plan.steps.map(x=>x.spoken),summary:plan.summary,
  neverPublishes:true};
}
export {planWebsitePageInstructions,prepareWebsitePageInstructionPreview};
