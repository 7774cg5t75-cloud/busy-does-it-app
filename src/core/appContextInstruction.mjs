/**
 * Finite contextual owner-text editing for app appearance. Language is a
 * convenience, not authority: only the current selected private appearance
 * control may be changed. No arbitrary actions or auto-publishing.
 */
import {previewPrivateAppAppearance} from "./appAppearanceEditing.mjs";
const fields=Object.freeze({header:"headerStyle",spacing:"layoutDensity",navigation:"navigationStyle"});
function interpretSelectedAppAppearance(config,{selected,text}={}){
 const field=fields[selected],raw=typeof text==="string"?text.trim().toLowerCase():"";
 if(!field||!raw||raw.length>180)return {ok:false,reason:"Select an app appearance element and describe one change."};
 if(/\b(pay|payment|purchase|publish|delete|book|confirm|customer data|api|script|code)\b/.test(raw))
  return {ok:false,reason:"This editor only changes the selected visual element."};
 // Multiple positive styles are ambiguous; explicit exclusions are not choices.
 const choices={headerStyle:{bold:/\b(bold|strong|stand out)\b/g,quiet:/\b(quiet|subtle|simple)\b/g,refined:/\b(refined|elegant|classic)\b/g},
  layoutDensity:{airy:/\b(airy|more space|roomy|roomier|spacious)\b/g,compact:/\b(compact|tight|less space|smaller gaps)\b/g,comfortable:/\b(comfortable|normal|balanced)\b/g},
  navigationStyle:{list:/\b(list|vertical)\b/g,tabs:/\b(tabs?|horizontal)\b/g}};
 const selectedParts={header:/\b(spacing|navigation|menu)\b/,spacing:/\b(header|heading|navigation|menu)\b/,navigation:/\b(header|heading|spacing)\b/};
 if(selectedParts[selected].test(raw))return {ok:false,needsClarification:true,reason:'Describe only the selected app part, or select the other part first.'};
 if(/\b(rather than|instead of|not only|not just)\b/.test(raw))return {ok:false,needsClarification:true,reason:'Name the one style you want to keep for this part.'};
 const positive=new Set();
 for(const [choice,pattern]of Object.entries(choices[field]))for(const match of raw.matchAll(pattern)){
  const clause=raw.slice(0,match.index).split(/[,;]|\b(?:but|instead|rather than)\b/).pop();
  if(!/\b(not|never|avoid|without|no|less|do not|don't|don’t)\b/.test(clause))positive.add(choice);
 }
 if(positive.size!==1)return {ok:false,needsClarification:true,reason:'Choose one clear style for the selected part. Busy will keep the current design until you do.'};
 const value=[...positive][0];
 const proof=previewPrivateAppAppearance(config,{field,value});
 return proof.ok?{...proof,selected,originalInstruction:raw,
  requiresPreview:true,noLiveChanges:true}:proof;
}
export {fields,interpretSelectedAppAppearance};
