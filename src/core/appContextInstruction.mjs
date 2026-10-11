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
 let value=null;
 if(field==="headerStyle"){
  if(/\b(bold|strong|stand out)\b/.test(raw))value="bold";
  else if(/\b(quiet|subtle|simple)\b/.test(raw))value="quiet";
  else if(/\b(refined|elegant|classic)\b/.test(raw))value="refined";
 }else if(field==="layoutDensity"){
  if(/\b(airy|more space|roomy|spacious)\b/.test(raw))value="airy";
  else if(/\b(compact|tight|less space|smaller gaps)\b/.test(raw))value="compact";
  else if(/\b(comfortable|normal|balanced)\b/.test(raw))value="comfortable";
 }else if(field==="navigationStyle"){
  if(/\b(list|vertical)\b/.test(raw))value="list";
  else if(/\b(tab|horizontal)\b/.test(raw))value="tabs";
 }
 if(!value)return {ok:false,reason:"Try describing a header as bold or subtle, spacing as roomy or compact, or navigation as tabs or a list."};
 const proof=previewPrivateAppAppearance(config,{field,value});
 return proof.ok?{...proof,selected,originalInstruction:raw,
  requiresPreview:true,noLiveChanges:true}:proof;
}
export {fields,interpretSelectedAppAppearance};
