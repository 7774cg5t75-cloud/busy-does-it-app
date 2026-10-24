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
 let clauses=splitSelectedWebsiteInstruction(instruction);
 // Expand one bounded goal into existing width-specific operations, never global styling.
 if(clauses)clauses=clauses.flatMap(clause=>/^improve (?:the )?phone layout (?:but )?(?:leave|keep) (?:the )?desktop (?:arrangement |layout )?(?:alone|unchanged)$/i.test(clause)?['make the page easier to read on phones','give the page more space on phones']:clause);
 if(clauses&&clauses.length>5)return fail('Use up to five supported changes, including the two phone-layout adjustments.');
 if(!clauses)return fail("Ask for up to five clear changes separated by 'and then' or semicolons.");
 const steps=[],targets=new Set();let previousSection=null,preserveWording=false;
 const findSection=phrase=>{
  const name=String(phrase||"").trim().toLowerCase();
  const matches=list(draft.sections).filter(s=>s?.enabled!==false&&
   list(page.sectionIds).includes(s.id)&&
   (String(s.id).toLowerCase()===name||String(s.title||"").trim().toLowerCase()===name));
  return matches.length===1?matches[0]:null;
 };
 for(let i=0;i<clauses.length;i++){
  let clause=clauses[i];
  if(/^keep (?:my |the )?(?:original |existing )?wording$/i.test(clause)){preserveWording=true;continue;}
  // Only an exact preceding named section can resolve these bounded references.
  const headingReference=/^((?:make|set) )(?:its|the) heading\b/i,sectionReference=/^((?:give|make) )(?:this|the) section\b/i;
  if(headingReference.test(clause)||sectionReference.test(clause)){
   if(!previousSection)return fail('Name a visible section before referring to its heading or this section.');
   // Resolve command subjects only; never replace words inside quoted copy.
   clause=clause.replace(headingReference,(_,verb)=>verb+previousSection.id+' heading').replace(sectionReference,(_,verb)=>verb+previousSection.id+' section');
  }
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
  }else if((m=clause.match(/^(?:put|move) (?:the )?(.+?) picture (?:on )?(?:the )?(left|right) on desktop$/i))){
   const section=findSection(m[1]);
   if(!section||section.type!=='photo-feature'||section.asset?.approved!==true||!section.asset?.storagePath)return fail('Name one visible section with its approved original picture.');
   change={action:'section-style',sectionId:section.id,field:'desktopPhotoSide',value:m[2].toLowerCase()};
   description='Move only the approved picture in '+section.title+' on larger screens. Phone reading order, words and colours stay unchanged';
  }else if((m=clause.match(/^show (?:the )?(.+?) testimonials with a featured quotation$/i))){
   const section=findSection(m[1]);if(!section||section.type!=='testimonials')return fail('Name one visible supplied-testimonials section.');
   change={action:'section-style',sectionId:section.id,field:'testimonialsLayout',value:'spotlight'};
   description='Compare the first existing quotation with supporting cards, without verifying reviews or changing words and order';
  }else if((m=clause.match(/^show (?:the )?(.+?) text as (an editorial layout|a reading column|two reading columns|the original layout)$/i))){
   const section=findSection(m[1]);if(!section||!['about','text'].includes(section.type))return fail('Name one visible information section.');
   change={action:'section-style',sectionId:section.id,field:'readingLayout',value:{'an editorial layout':'editorial','a reading column':'column','two reading columns':'columns','the original layout':'brand'}[m[2].toLowerCase()]};
   description='Compare only '+section.title+' reading layout without changing its words, colours or phone source order';
  }else if((m=clause.match(/^(?:show|display) (?:the )?services as (a directory|cards|the original layout)$/i))){
   const section=findSection('services');
   if(!section||section.type!=='services')return fail('Open the current page containing the services section first.');
   change={action:'section-style',sectionId:section.id,field:'serviceLayout',value:{'a directory':'directory',cards:'cards','the original layout':'brand'}[m[1].toLowerCase()]};
   description='Change only the services layout; preserve names, descriptions, order, branding and destinations. Phones keep one reading column';
  }else if((m=clause.match(/^(?:show|display) (products|events) as (cards|rows)$/i))){
   const section=findSection(m[1].toLowerCase());
   if(!section||section.contentSource!=='business_records_v1')return fail('Open the current page containing the approved-record section first.');
   change={action:'content-section',sectionId:section.id,title:section.title,layout:m[2].toLowerCase(),featuredId:section.featuredId||''};
   type='field';description='Change only the record presentation; keep this destination heading, featured item, styling and approved-record source';
  }else if((m=clause.match(/^(?:make|set) (?:the )?hero (left aligned|centred|centered|right aligned|a poster)$/i))){
   if(!findSection('hero'))return fail('Open the page containing the current hero before changing its composition.');
   change={action:'style',field:'heroLayout',value:{'left aligned':'type-left',centred:'type-center',centered:'type-center','right aligned':'type-right','a poster':'type-poster'}[m[1].toLowerCase()]};
   description='Use a distinct typographic hero composition; preserve wording, branding and content. An existing hero photo is never removed by this instruction';
  }else if((m=clause.match(/^(?:move|place|show) (?:the )?hero photo (?:on the )?(left|right|in a frame|as the main feature)$/i))){
   if(!findSection('hero'))return fail('Open the page containing the current hero before changing its composition.');
   change={action:'style',field:'heroLayout',value:{left:'image-left',right:'image-right','in a frame':'image-frame','as the main feature':'image-feature'}[m[1].toLowerCase()]};
   description='Recompose the approved hero image and introduction using the existing responsive renderer; no image or words replaced';
  }else if(/^(?:make|set) (?:the )?(?:homepage|whole page|page|website) (?:feel |look )?more modern (?:without changing (?:the |my )?wording|but keep (?:the |my )?(?:existing )?colou?rs)$/i.test(clause)){
   const operations=[{action:'style',field:'typography',value:'confident'},{action:'style',field:'cardLayout',value:'outlines'},{action:'style',field:'spacing',value:'comfortable'},{action:'style',field:'navStyle',value:'quiet'}].filter(op=>draft.theme?.[op.field]!==op.value);
   if(!operations.length)return fail('These supported settings are already present. Keep the current design unless the preview shows a specific issue.');
   change={action:'style-group',operations};description='Compare confident typography, outlined cards, calm navigation and comfortable spacing across the shared website theme. Colours, owner wording, images, customer destinations and section order stay unchanged. This is a proposal, not verified aesthetic improvement';
  }else if(forbidden.test(clause))return fail("No changes were made. Publishing, deleting and external actions need separate approval.");
  else if((m=clause.match(/^(?:give|make) (?:the )?(?:whole |entire )?page (more|less) (?:space|spacing|breathing room) on (phones?|mobile|desktop|computers?)$/i))){
   change={action:'page-spacing',pageId,device:/phone|mobile/i.test(m[2])?'mobile':'desktop',value:m[1].toLowerCase()==='more'?'generous':'compact'};
   description='Adjust existing section spacing only at the requested width. Shared sections change on other pages too; wording, branding and other widths stay unchanged';
  }else if((m=clause.match(/^move (?:(?:the|my|our) )?(.+?)(?: section)? (above|below|before|after) (?:the )?(.+?)(?: section| form)?$/i))){
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
  }else if((m=clause.match(/^(?:make|set) (?:the )?(.+?) heading (bigger|larger|smaller|normal|more prominent)(?: (?:only )?on (phones?|mobile|desktop|computers?|wide screens?))?$/i))){
   const section=findSection(m[1]);if(!section)return fail("Name one visible heading section: "+m[1]);
   const device=m[3]?/phone|mobile/i.test(m[3])?"mobile":"desktop":"";
   change={action:"section-style",sectionId:section.id,
    field:device?device+"HeadingScale":"headingScale",
    value:/bigger|larger|more prominent/i.test(m[2])?"large":/smaller/i.test(m[2])?"compact":"normal"};
   description="Resize "+section.title+" heading"+(device?" on "+device:"");
  }else if((m=clause.match(/^(?:make|show) (?:the )?gallery (?:photos|pictures|images) (bigger|larger|smaller|normal)(?: (?:only )?on (phones?|mobile|desktop|computers?|wide screens?))?$/i))){
   const section=findSection("gallery");if(!section||section.type!=="gallery")return fail("The gallery is not on this page.");
   const device=m[2]?/phone|mobile/i.test(m[2])?"mobile":"desktop":"";
   change={action:"section-style",sectionId:section.id,
    field:device?device+"GallerySize":"gallerySize",
    value:/bigger|larger/i.test(m[1])?"large":/smaller/i.test(m[1])?"compact":"comfortable"};
   description="Resize gallery images"+(device?" on "+device:"");
  }else if((m=clause.match(/^(?:give|make) (?:the )?(.+?) section (more|less) (?:space|spacing|breathing room)(?: on (phones?|mobile|desktop|computers?))?$/i))){
   const section=findSection(m[1]);if(!section)return fail("Name one visible section: "+m[1]);
   change={action:"section-style",sectionId:section.id,field:m[3]?(/phone|mobile/i.test(m[3])?"mobile":"desktop")+"SectionSpacing":"sectionSpacing",
    value:m[2].toLowerCase()==="more"?"generous":"compact"};
   description="Adjust spacing in "+section.title;
  }else if(/^(?:make|give) (?:the )?(?:main|hero|contact) button (?:stand out|more prominent)$/i.test(clause)){
   change={action:"style",field:"ctaEmphasis",value:"strong"};
   description="Emphasise the existing approved website button";
  }else return fail("No changes were made. Step "+(i+1)+" is not a supported, exact instruction. Try 'move the services section up' or 'make the hero heading smaller on phones'.");
  const leaves=change.action==='style-group'?change.operations:[change];
  const keys=leaves.map(op=>[op.action==='move-relative'?'move':op.action,op.sectionId||"global",op.action==='add-text'?op.title.trim().toLocaleLowerCase('en'):op.field||op.device||"position"].join(":"));
  if(keys.some(key=>targets.has(key)))return fail("Two steps affect the same setting. Give one instruction for that setting.");
  if(change.sectionId)previousSection=list(draft.sections).find(s=>s.id===change.sectionId)||null;
  keys.forEach(key=>targets.add(key));steps.push({type,change,spoken:clause,description});
 }
 if(!steps.length)return fail('Choose a supported edit; preserving wording alone makes no change.');
 if(preserveWording){const safe=op=>op.action==='style-group'?op.operations.every(safe):['style','section-style','move','move-relative','page-reading','page-spacing'].includes(op.action);if(steps.some(step=>step.type!=='layout'||!safe(step.change)))return fail('No changes were made. Wording edits or new content contradict keeping the original wording.');}
 return {ok:true,draftId,pageId,generation,steps,preservesWording:preserveWording,requiresExplicitApproval:true,
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
