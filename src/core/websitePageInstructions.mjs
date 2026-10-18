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
  const literal=clause.match(/^(?:change|set|update) (?:the )?(.+?) (heading|text|body|button text) (?:to|with) "([^"<>]{1,2500})"$/i);
  let m,change,description,type='layout';
  if(literal){
   const section=findSection(literal[1]);if(!section)return fail('Name one exact visible section for your wording.');
   const field={heading:'title',text:'body',body:'body','button text':'cta'}[literal[2].toLowerCase()];
   change={sectionId:section.id,field,value:literal[3]};type='field';
   description='Replace only the owner-written '+field+' in '+section.title;
  }else if((m=clause.match(/^add section "([^"<>]{1,100})" text "([^"<>]{1,2500})"$/i))){
   if(pageId!=='home')return fail('Create new text sections on Home first, then use the page editor to assign them elsewhere.');
   if(list(draft.sections).some(s=>String(s.title||'').trim().toLocaleLowerCase('en')===m[1].trim().toLocaleLowerCase('en')))
    return fail('A section already uses that title. Edit its text or choose a distinct name.');
   change={action:'add-text',title:m[1],body:m[2]};description='Add your exact heading and wording before contact in the private Home page';
  }else if((m=clause.match(/^add question "([^"<>]{1,140})" answer "([^"<>]{1,1200})"$/i))){
   const sections=list(draft.sections).filter(s=>s.id==='faq'||s.type==='faq');
   if(!sections.length&&draft.designPlan?.architecture!=='focused-landing')return fail('Create the FAQ section in the content editor first, then open its page to add your question.');
   if(sections.length&&!list(page.sectionIds).includes('faq'))return fail('Open the page containing your FAQ section before adding a question.');
   if(pageId!=='home'&&(!sections.length||!list(page.sectionIds).includes('faq')))
    return fail('Add the FAQ section to this page before preparing a question.');
   if(sections.length>1||sections.length===1&&(sections[0].id!=='faq'||sections[0].type!=='faq'||sections[0].enabled===false))
    return fail('Review the current FAQ section before adding questions.');
   change={action:sections.length?'add-item':'create-collection',sectionId:'faq',title:m[1],body:m[2]};
   type='field';description='Add your exact question and answer to the private FAQ section';
  }else if(forbidden.test(clause))return fail("No changes were made. Publishing, deleting and external actions need separate approval.");
  else if((m=clause.match(/^move (?:the )?(.+?) section (above|below|before|after) (?:the )?(.+?)(?: section| form)?$/i))){
   const section=findSection(m[1]),target=findSection(m[3]);
   if(!section||!target)return fail('Name two exact visible sections on this page.');
   change={action:'move-relative',sectionId:section.id,targetSectionId:target.id,
    position:/above|before/i.test(m[2])?'before':'after',pageId};
   description='Move '+section.title+' '+m[2]+' '+target.title;
  }else if((m=clause.match(/^(?:make|set) (?:the )?(?:whole |entire )?page (?:text )?(?:easier to read|more readable)(?: only)? on (phones?|mobile|desktop|computers?)$/i))){
   change={action:'page-reading',pageId,device:/phone|mobile/i.test(m[1])?'mobile':'desktop'};
   description='Increase supported body text and line spacing only at the requested width; headings, facts and other widths are preserved';
  }else if(/^(?:make|set) (?:the )?(?:whole |entire )?(?:page|website) (?:easier to read|more readable)$/i.test(clause)){
   const operations=[{action:'style',field:'typography',value:'refined'},
    {action:'style',field:'spacing',value:'comfortable'},
    {action:'style',field:'cardLayout',value:'rows'}].filter(op=>draft.theme?.[op.field]!==op.value);
   if(!operations.length)return fail('This page already uses the supported reading settings. Check the actual preview before changing it further.');
   change={action:'style-group',operations};description='Use readable type, calm spacing and service rows across the shared website theme; business facts and colours stay unchanged';
  }else if((m=clause.match(/^(?:make|set) (?:the )?(.+?) section (?:look |feel )?more premium$/i))){
   const section=findSection(m[1]);if(!section)return fail('Name one exact visible section.');
   const operations=[{action:'section-style',sectionId:section.id,field:'sectionSpacing',value:'generous'},
    {action:'section-style',sectionId:section.id,field:'headingScale',value:'large'}]
    .filter(op=>section.appearance?.[op.field]!==op.value);
   if(!operations.length)return fail('This section already uses these supported settings.');
   change={action:'style-group',operations};description='Give '+section.title+' more breathing room and a stronger heading; preview this visual hypothesis before saving';
  }else if((m=clause.match(/^move (?:the )?(.+?) section (up|down)$/i))){
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
  const leaves=change.action==='style-group'?change.operations:[change];
  const keys=leaves.map(op=>[op.action==='move-relative'?'move':op.action,op.sectionId||"global",op.action==='add-text'?op.title.trim().toLocaleLowerCase('en'):op.field||"position"].join(":"));
  if(keys.some(key=>targets.has(key)))return fail("Two steps affect the same setting. Give one instruction for that setting.");
  keys.forEach(key=>targets.add(key));steps.push({type,change,spoken:clause,description});
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
  fieldEdit:typeof deps.fieldEdit==='function'?deps.fieldEdit:()=>({applied:false}),layoutEdit:deps.layoutEdit});
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
