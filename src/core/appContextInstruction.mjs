/**
 * Finite contextual owner-text editing for app appearance. Language is a
 * convenience, not authority: only the current selected private appearance
 * control may be changed. No arbitrary actions or auto-publishing.
 */
import {previewPrivateAppAppearance} from "./appAppearanceEditing.mjs";
import {proposeCoordinatedAppChanges} from "./appCoordinatedStudio.mjs";
import {selectedAppImage,selectedAppImageOperation} from "./appSelectedImage.mjs";
import {PROFILE_TEXT_LIMITS} from "./appProfileFieldUndo.mjs";
import {selectedAppService,selectedAppServiceOperation} from './appSelectedService.mjs';
const fields=Object.freeze({header:"headerStyle",spacing:"layoutDensity",navigation:"navigationStyle",services:"serviceStyle",gallery:"galleryLayout",images:"imageScale",corners:"imageCorners",typography:"typeStyle"});
function interpretSelectedAppAppearance(config,{selected,text}={}){
 const field=typeof selected==='string'&&Object.hasOwn(fields,selected)?fields[selected]:null,raw=typeof text==="string"?text.trim().toLowerCase():"";
 if(!field||!raw||raw.length>180)return {ok:false,reason:"Select an app appearance element and describe one change."};
 if(/\b(pay|payment|purchase|publish|delete|book|confirm|customer data|api|script|code)\b/.test(raw))
  return {ok:false,reason:"This editor only changes the selected visual element."};
 // Multiple positive styles are ambiguous; explicit exclusions are not choices.
 const choices={headerStyle:{bold:/\b(bold|strong|stand out)\b/g,quiet:/\b(quiet|subtle|simple)\b/g,refined:/\b(refined|elegant|classic)\b/g},
  layoutDensity:{airy:/\b(airy|more space|roomy|roomier|spacious)\b/g,compact:/\b(compact|tight|less space|smaller gaps)\b/g,comfortable:/\b(comfortable|normal|balanced)\b/g},
  navigationStyle:{list:/\b(list|vertical)\b/g,tabs:/\b(tabs?|horizontal)\b/g},
  serviceStyle:{cards:/\b(cards|tiles)\b/g,rows:/\b(rows|list)\b/g,spotlight:/\b(spotlight|featured)\b/g},
  galleryLayout:{grid:/\b(grid|side.by.side)\b/g,stack:/\b(stack|stacked|one column|full.width)\b/g},
  imageScale:{regular:/\b(regular|normal|smaller)\b/g,large:/\b(larger|large|bigger)\b/g},
  imageCorners:{rounded:/\b(rounded|round|soft)\b/g,square:/\b(square|sharp)\b/g},
  typeStyle:{balanced:/\b(balanced)\b/g,editorial:/\b(editorial)\b/g,impact:/\b(impact)\b/g,friendly:/\b(friendly)\b/g}};
 const selectedParts={header:/\b(spacing|navigation|menu)\b/,spacing:/\b(header|heading|navigation|menu)\b/,navigation:/\b(header|heading|spacing)\b/,
  services:/\b(header|heading|spacing|navigation|gallery|photos?|images?|typography|font)\b/,
  gallery:/\b(header|heading|spacing|navigation|services?|typography|font|corners?)\b/,
  images:/\b(header|heading|spacing|navigation|services?|typography|font|corners?|rounded|square)\b/,
  corners:/\b(header|heading|spacing|navigation|services?|typography|font|larger|smaller|size)\b/,
  typography:/\b(spacing|navigation|services?|gallery|photos?|images?|corners?)\b/};
 if(selectedParts[selected]?.test(raw))return {ok:false,needsClarification:true,reason:'Describe only the selected app part, or select the other part first.'};
 if(/\b(rather than|instead of|not only|not just)\b/.test(raw))return {ok:false,needsClarification:true,reason:'Name the one style you want to keep for this part.'};
 const positive=new Set();
 for(const [choice,pattern]of Object.entries(choices[field]))for(const match of raw.matchAll(pattern)){
  const clause=raw.slice(0,match.index).split(/[,;]|\b(?:but|instead|rather than)\b/).pop();
  if(!/\b(not|never|avoid|without|no|less|do not|don't|don’t)\b/.test(clause))positive.add(choice);
 }
 if(positive.size!==1)return {ok:false,needsClarification:true,reason:'Choose one clear style for the selected part. Busy will keep the current design until you do.'};
 if(/\b(colou?r|gold|silver|red|blue|green|border|background|hex|pixels?|px|html|css)\b/.test(raw))return {ok:false,needsClarification:true,reason:'Use the existing palette or size controls for that request. Describe one supported style here; no partial change was prepared.'};
 const value=[...positive][0];
 const proof=previewPrivateAppAppearance(config,{field,value});
 return proof.ok?{...proof,selected,originalInstruction:raw,
  requiresPreview:true,noLiveChanges:true}:proof;
}
export {fields,interpretSelectedAppAppearance};

// Selected-context adapter to the original appearance/Studio operations. This
// never saves, transcribes or creates an independent instruction engine.
function proposeSelectedAppInstruction(config,{selection,text}={}){
 const fail=reason=>({ok:false,reason});
 if(typeof text!=='string'||!text.trim()||text.length>180)return fail('Use one short instruction for the selected app part.');
 const phrase=text.trim(),part=selection?.part;
 if(part==='service'){
  const row=selectedAppService(config,selection);if(!row)return fail('Select the current owner-written service again.');
  const move=/^move this service (earlier|later)$/i.exec(phrase);
  const copy=/^set this service (name|description) to "([^"<>]{1,160})"$/i.exec(phrase);
  const result=move?selectedAppServiceOperation(config,selection,{kind:'move',direction:move[1].toLowerCase()}):copy?
   selectedAppServiceOperation(config,selection,{kind:'wording',value:{name:copy[1].toLowerCase()==='name'?copy[2]:row.name,description:copy[1].toLowerCase()==='description'?copy[2]:row.description||''}}):null;
  return result?(result.ok?result.proposal:result):fail('Use “move this service earlier/later” or set this service name/description to quoted owner wording. No change was prepared.');
 }
 const wording=/^set this text to "([^"<>]{1,160})"$/i.exec(phrase);
 if(wording&&(part==='header'||part==='wording')){
  const field=part==='header'?'tagline':selection.field;
  return Object.hasOwn(PROFILE_TEXT_LIMITS,field||'')?proposeCoordinatedAppChanges(config,[{kind:'text',field,value:wording[1]}]):fail('Select supported app wording.');
 }
 if(part==='image'){
  const image=selectedAppImage(config,selection);if(!image)return fail('Select the current approved image again.');
  const move=/^move this (?:photo|image) (earlier|later)$/i.exec(phrase);
  if(move){const result=selectedAppImageOperation(config,selection,{kind:'move',direction:move[1].toLowerCase()});return result.ok?result.proposal:result;}
  const copy=/^set this (?:photo|image) (description|caption) to "([^"<>]{1,160})"$/i.exec(phrase);
  if(copy){const result=selectedAppImageOperation(config,selection,{kind:'description',alt:copy[1].toLowerCase()==='description'?copy[2]:image.alt??null,caption:copy[1].toLowerCase()==='caption'?copy[2]:image.caption??null});return result.ok?result.proposal:result;}
 }
 if(/\b(and|then)\b|[,;]/i.test(phrase))return fail('Describe one selected change. Use the existing whole-app composer for coordinated instructions.');
 let selected=part;
 if(part==='image')selected=/corner/i.test(phrase)?'corners':/size|larger|smaller|bigger/i.test(phrase)?'images':'gallery';
 if(part==='header'&&/typography|font/i.test(phrase))selected='typography';
 const result=interpretSelectedAppAppearance(config,{selected,text:phrase});if(!result.ok)return result;
 const proposal=proposeCoordinatedAppChanges(config,[{kind:'appearance',field:result.field,value:result.value}]);
 return {...proposal,explanation:['imageScale','imageCorners','galleryLayout'].includes(result.field)?'This appearance setting applies to the whole gallery; the image content and actions stay unchanged.':result.field==='typeStyle'?'Typography uses the existing app-wide scale. Review all screens before approval.':'Only the supported selected appearance setting is proposed.'};
}
export {proposeSelectedAppInstruction};
