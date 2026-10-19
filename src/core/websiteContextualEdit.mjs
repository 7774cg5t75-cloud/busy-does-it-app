import {textTypographySupports,textTypographyFields} from "../../supabase/functions/busy-website-worker/websiteTextTypography.mjs";
/**
 * V3.140: No-cost, context-bound "this/that" website editing.
 * Parses a deliberately SMALL grammar only after the owner taps an exact
 * visible element in the private preview. This is not an LLM nor a publisher.
 * Never guess targets, synthesize business claims or accept CSS/remote media.
 */
const clean=v=>typeof v==="string"?v.trim():"";
const list=v=>Array.isArray(v)?v:[];
const failure=reason=>({ok:false,reason});
const success=(type,change,reason)=>({ok:true,type,change,reason});
const states={headingScale:{bigger:"large",larger:"large",smaller:"compact",normal:"normal"},
 sectionSpacing:{more:"generous",less:"compact"}};
function interpretSelectedWebsiteRequest(draft,pageId,selection,instruction){
 if(!draft?.id||!Array.isArray(draft.sections)||!selection||typeof selection!=="object")
  return failure("Tap the exact part of your private website first.");
 const page=list(draft.pages).find(p=>p?.id===pageId&&p?.enabled!==false);
 const sectionId=clean(selection.sectionId),field=clean(selection.field),itemId=clean(selection.itemId);
 if(!page||!list(page.sectionIds).includes(sectionId)||
    clean(selection.pageId)!==pageId||
    Number(selection.generation)!==Number(draft.generation))
  return failure("That selection is from an older preview. Tap the website part again.");
 const matches=draft.sections.filter(s=>s?.id===sectionId&&s.enabled!==false);
 if(matches.length!==1)return failure("This website section is no longer available.");
 const section=matches[0];
 if(itemId&&(field!=="title"&&field!=="body"||
    !["services","faq","testimonials"].includes(section.type)||
    list(section.items).filter(x=>x?.id===itemId).length!==1))
  return failure("That item is no longer available to edit.");
 if(!["section","title","body","cta","ctaHref","phone","email","openingHours","photo"].includes(field))
  return failure("Tap a supported heading, text, button or photo.");
 if(field==="photo"){
  const n=selection.photoIndex;
  if(!["hero","photo-feature","gallery"].includes(section.type)||
    section.type==="gallery"&&(!Number.isSafeInteger(n)||n<0||n>=list(section.items).length||
      section.items[n]?.approved===false)||
    section.type!=="gallery"&&(!section.asset||section.asset.approved===false||n!==-1))
   return failure("That approved photograph is no longer available.");
 }
 const text=clean(instruction).replace(/\s+/g," ");
 if(!text||text.length>400)return failure("Type one short change, such as ‘make this heading bigger’.");
 // Literal user wording only: never invent content. This remains subject to
 // the existing text-field length, XSS-escaping, email and link validation.
 const spacious=text.match(/^make (this|that|the selected) section more spacious(?: on (phones?|mobile|desktop|computers?))?$/i);
 if(spacious)return interpretSelectedWebsiteRequest(draft,pageId,selection,'give '+spacious[1]+' section more space'+(spacious[2]?' on '+spacious[2]:''));
 const plainWeight=text.match(/^(?:make|set) (?:this|that|the selected) (heading|paragraph|text) (regular|medium|bold|heavy)$/i);
 if(plainWeight)return interpretSelectedWebsiteRequest(draft,pageId,selection,
  'set this '+(plainWeight[1].toLowerCase()==='heading'?'heading':'paragraph')+' weight to '+plainWeight[2].toLowerCase());
 const plainColour=text.match(/^(?:make|set|change) (?:this|that|the selected) (heading|paragraph|text) (?:colou?r )?(?:to )?(?:the )?(section foreground|brand accent)$/i);
 if(plainColour)return interpretSelectedWebsiteRequest(draft,pageId,selection,
  'set this '+(plainColour[1].toLowerCase()==='heading'?'heading':'paragraph')+' colour to '+(/accent/i.test(plainColour[2])?'accent':'ink'));
 if(/^(?:change|set) (?:this|that|the selected) (?:heading|title|text|paragraph) to (?:gold|silver|red|blue|green|yellow|orange|purple|white|black)$/i.test(text))
  return failure('That sounds like a colour request. Use the readable brand accent or section foreground controls; arbitrary colours need contrast review. To replace the actual wording, use Edit.');
 const replacement=text.match(/^(?:change|set|replace) (?:this|that|the selected) (?:heading|title|text|wording|paragraph|button(?: text)?|phone(?: number)?|email|hours) (?:to|with|as) (.+)$/i);
 if(replacement){
  const subject=text.match(/^(?:change|set|replace) (?:this|that|the selected) (heading|title|text|wording|paragraph|button(?: text)?|phone(?: number)?|email|hours) /i)?.[1]?.toLowerCase()||"";
  const valid=subject==="heading"||subject==="title"?field==="title":
    ["text","wording","paragraph"].includes(subject)?field==="body":
    subject.startsWith("button")?field==="cta":
    subject.startsWith("phone")?field==="phone":
    subject==="email"?field==="email":subject==="hours"&&field==="openingHours";
  if(!valid)return failure("That instruction doesn't match the part you tapped. Choose its exact wording instead.");
  return success("field",{sectionId,itemId:itemId||null,field,value:replacement[1]},
   "Replace only the selected wording in your private draft.");
 }
 const paragraphSize=text.match(/^set (?:this|that|the selected) paragraph size to (brand|normal|large|extra-large)(?: on (phones|desktop))?$/i);
 if(paragraphSize){
  if(field!=='body'||!itemId&&!textTypographySupports.bodySize.includes(section.type))return failure('Select a supported primary paragraph or card paragraph first.');
  const device=paragraphSize[2]?.toLowerCase();
  return success('layout',{action:itemId?'item-style':'section-style',sectionId,...(itemId?{itemId}:{}),
   field:device?(device==='phones'?'mobileBodySize':'desktopBodySize'):'bodySize',value:paragraphSize[1].toLowerCase()},
   'Resize only this paragraph'+(device?' on '+device:' across screen widths')+'. Phone and desktop overrides remain explicit.');
 }
 if(field==='cta'&&section.type==='hero'){
  const buttonSize=text.match(/^make (?:this|that|the selected) button (normal|roomier|wider)$/i);
  if(buttonSize)return success('layout',{action:'section-style',sectionId,field:'ctaSize',value:{normal:'normal',roomier:'spacious',wider:'wide'}[buttonSize[1].toLowerCase()]},
   'Adjust the responsive button preset without changing its label or destination.');
 }
 const typography=text.match(/^set (?:this|that|the selected) (heading|paragraph) (font|weight|line spacing|alignment|colour|color) to (brand|sans|serif|mono|regular|medium|bold|heavy|standard|relaxed|left|center|right|ink|accent)$/i);
 if(typography){
  const target=typography[1].toLowerCase()==='heading'?'title':'body';
  const suffix={font:'Font',weight:'Weight','line spacing':'Leading',alignment:'Align',colour:'Colour',color:'Colour'}[typography[2].toLowerCase()];
  const style=target+suffix,value=typography[3].toLowerCase();
  if(field!==target||(!itemId&&!textTypographySupports[style].includes(section.type))||!textTypographyFields[style].includes(value))
   return failure('Select a supported section heading or primary paragraph. Card text uses its existing controls.');
  return success('layout',{action:itemId?'item-style':'section-style',sectionId,...(itemId?{itemId}:{}),field:style,value},
   'Change only the selected '+(itemId?'card ':'section ')+(target==='title'?'heading':'primary paragraph')+'. Brand defaults and other content stay intact.');
 }
 const servicesLayout=text.match(/^show (?:this|that|the selected) services (?:as|in) (a directory|cards|the original layout)$/i);
 if(servicesLayout){
  if(itemId||section.type!=='services')return failure('Select the services section to change its layout.');
  return success('layout',{action:'section-style',sectionId,field:'serviceLayout',value:{'a directory':'directory',cards:'cards','the original layout':'brand'}[servicesLayout[1].toLowerCase()]},'Change only this services section. Service wording, order and destinations stay unchanged; phones use one column.');
 }
 const desktopPicture=text.match(/^(?:put|move|show) (?:this|that|the selected) (?:picture|photo|image) (?:on |to )?(?:the )?(left|right) on (?:desktop|larger screens)$/i);
 if(desktopPicture){
  if(itemId||section.type!=='photo-feature'||section.asset?.approved!==true||!section.asset?.storagePath)return failure('Select a section with its approved original picture.');
  return success('layout',{action:'section-style',sectionId,field:'desktopPhotoSide',value:desktopPicture[1].toLowerCase()},'Move this approved picture only on larger screens. Phone reading order, wording and colours stay unchanged.');
 }
 if(/^show (?:this|the selected) (?:faq|questions) as expandable questions$/i.test(text)){
  if(itemId||section.type!=='faq')return failure('Select the whole questions section first.');
  return success('layout',{action:'section-style',sectionId,field:'faqLayout',value:'questions'},'Prepare expandable questions with original answers. Preview before applying.');
 }
 const readingLayout=text.match(/^show (?:this|that|the selected) text as (an editorial layout|a reading column|the original layout)$/i);
 if(readingLayout){
  if(itemId||!['about','text'].includes(section.type))return failure('Select a supported information section first.');
  return success('layout',{action:'section-style',sectionId,field:'readingLayout',value:{'an editorial layout':'editorial','a reading column':'column','the original layout':'brand'}[readingLayout[1].toLowerCase()]},'Change this information section only. Keep original words, colours and phone reading order.');
 }
 const reading=text.match(/^make (?:this|that|the selected) (?:text|paragraph|section) (?:easier to read|more readable)(?: only)? on (phones?|mobile|desktop|computers?)$/i);
 if(reading){
  if(itemId||!(['body','section'].includes(field)||field==='photo'&&section.type==='photo-feature'))return failure('Select the whole section, its paragraph or a paired picture/text block to adjust reading size.');
  return success('layout',{action:'section-style',sectionId,field:/phone|mobile/i.test(reading[1])?'mobileBodyScale':'desktopBodyScale',value:'large'},
   'Prepare larger body text and line spacing only at this screen width. Preview before keeping it.');
 }
 if(!itemId&&field!=='photo'&&/^(?:make|give) (?:this|that|the selected) section (?:look |feel )?more premium$/i.test(text)){
  const operations=[{action:'section-style',sectionId,field:'sectionSpacing',value:'generous'},
   {action:'section-style',sectionId,field:'headingScale',value:'large'}].filter(op=>section.appearance?.[op.field]!==op.value);
  if(!operations.length)return failure('This section already uses these settings. Inspect the preview before changing it further.');
  return success('layout',{action:'style-group',operations},'Prepare stronger heading hierarchy and breathing room for the selected section; this is a visual hypothesis, not measured improvement.');
 }
 const relative=text.match(/^move (?:this|that|the selected) section (above|below|before|after) (?:the )?(.+?)(?: section| form)?$/i);
 if(relative&&!itemId){
  const name=relative[2].trim().toLocaleLowerCase('en');
  const matches=draft.sections.filter(s=>s.enabled!==false&&list(page.sectionIds).includes(s.id)&&
   (s.id.toLocaleLowerCase('en')===name||String(s.title||'').trim().toLocaleLowerCase('en')===name));
  if(matches.length!==1)return failure('Name one exact visible destination section on this page.');
  return success('layout',{action:'move-relative',sectionId,targetSectionId:matches[0].id,pageId,
   position:/above|before/i.test(relative[1])?'before':'after'},'Move only the selected section relative to the named section; owner locks remain protected.');
 }
 let m=text.match(/^(?:make|set) (?:this|that|the selected) (?:heading|title) (bigger|larger|smaller|normal)(?: (?:only )?on (phones?|mobile|desktop|computers?|wide screens?))?$/i);
 if(m){
  if(field!=="title")return failure("Tap the heading you want to resize.");
  if(itemId&&m[2])return failure("Select the whole section to change phone or desktop headings.");
  if(itemId)return success("layout",{action:"item-style",sectionId,itemId,
    field:"headingScale",value:states.headingScale[m[1].toLowerCase()]},
    "Resize only the selected item heading.");
  const device=m[2]?/phone|mobile/i.test(m[2])?"mobile":"desktop":"";
  return success("layout",{action:"section-style",sectionId,
    field:device?device+"HeadingScale":"headingScale",
    value:states.headingScale[m[1].toLowerCase()]},
    "Resize the selected section heading"+(device?" on "+device+" only":"")+".");
 }
 m=text.match(/^(?:centre|center|left.align|align) (?:this|that|the selected) (?:section|text|heading|paragraph)(?: (?:to )?(left|centre|center))?$/i);
 if(m){
  if(itemId)return failure("Use the section's appearance choices to align all its items together.");
  const alignment=/^(?:left.align)/i.test(text)||m[1]==="left"?"left":"center";
  return success("layout",{action:"section-style",sectionId,field:"textAlign",value:alignment},
   "Change the alignment of the selected section.");
 }
 if(/^set (?:this|that|the selected) section spacing to normal$/i.test(text))return success('layout',{action:'section-style',sectionId,field:'sectionSpacing',value:'normal'},'Restore normal spacing around the selected section.');
 m=text.match(/^(?:give|make) (?:this|that|the selected) section (more|less) (?:space|spacing|breathing room)(?: on (phones?|mobile|desktop|computers?))?$/i);
 if(m)return success("layout",{action:"section-style",sectionId,field:m[2]?(/phone|mobile/i.test(m[2])?"mobile":"desktop")+"SectionSpacing":"sectionSpacing",
  value:states.sectionSpacing[m[1].toLowerCase()]},"Adjust spacing around only this section.");
 if(field==="photo"){
  if(section.type==="gallery"){
   if(/^(?:show|fit) (?:this|that|the selected) (?:whole |entire )?(?:photograph|photo|image|picture)(?: (?:completely|fully|entirely))?$/i.test(text)||
      /^(?:show|fit) (?:the )?(?:whole|entire) (?:photo|image|picture|photograph)$/i.test(text))
    return success("layout",{action:"image-style",sectionId,photoIndex:selection.photoIndex,
      field:"photoFit",value:"contain"},"Show the entire selected gallery picture.");
   if(/^(?:fill|crop) (?:this|that|the selected) (?:photo|image|picture) (?:frame|tile)$/i.test(text))
    return success("layout",{action:"image-style",sectionId,photoIndex:selection.photoIndex,
      field:"photoFit",value:"cover"},"Fill the selected gallery tile.");
  }
  m=text.match(/^(?:focus|crop|show) (?:this|that|the selected) (?:photo|image|picture) (?:on |at |to )?(?:the )?(top|center|centre|bottom)$/i);
  if(m){
   const value=m[1].toLowerCase()==="centre"?"center":m[1].toLowerCase();
   if(section.type==="gallery")
    return success("layout",{action:"image-style",sectionId,photoIndex:selection.photoIndex,
      field:"photoCrop",value},"Reposition only this approved gallery photo.");
   return success("layout",{action:"section-style",sectionId,field:"photoCrop",value},
    "Reposition the selected main or feature photo.");
  }
  m=text.match(/^(?:move|put) (?:this|that|the selected) (?:photo|image|picture) (?:to |on )?(?:the )?(left|right)$/i);
  if(m){
   const direction=m[1].toLowerCase();
   if(section.type==="gallery")
    return success("layout",{action:"move-gallery-photo",sectionId:"gallery",
      photoIndex:selection.photoIndex,direction:direction==="left"?"up":"down"},
      "Move the selected gallery image one place.");
   if(section.type==="photo-feature")
    return success("layout",{action:"section-style",sectionId,field:"photoSide",value:direction},
      "Move only the selected photo/text block image on wide screens.");
   if(section.type==="hero")
    return success("layout",{action:"style",field:"heroLayout",value:direction==='left'?'image-left':'image-right'},
      "Place the approved main picture beside the introduction; phones keep a single reading column.");
   return failure("Choose a supported picture/text section.");
  }
  m=text.match(/^(?:make|show) (?:this|that|the selected) (?:photo|image|picture) (bigger|larger|smaller)(?: (?:only )?on (phones?|mobile|desktop|computers?|wide screens?))?$/i);
  if(m){
   if(section.type==="gallery")
    return success("layout",{action:"section-style",sectionId,
     field:m[2]?(/phone|mobile/i.test(m[2])?"mobileGallerySize":"desktopGallerySize"):"gallerySize",
     value:/smaller/i.test(m[1])?"compact":"large"},
     "Change the gallery tile size"+(m[2]?" only on "+m[2]:"")+".");
   if(section.type==="hero")
    return success("layout",{action:"style",field:"heroSize",
     value:/smaller/i.test(m[1])?"medium":"extra-large"},"Change the main picture area.");
  }
 }
 if(field==="cta"&&section.type==="hero"&&
   /^(?:make|give) (?:this|that|the selected) button (?:stand out|more prominent)$/i.test(text))
  return success("layout",{action:"style",field:"ctaEmphasis",value:"strong"},
   "Emphasise the approved main call-to-action.");
 return failure("I can't safely make that exact change yet. Try ‘make this heading bigger’, ‘centre this section’, or edit its wording directly.");
}
export {interpretSelectedWebsiteRequest};
