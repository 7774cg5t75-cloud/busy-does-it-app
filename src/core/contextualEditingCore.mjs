/**
 * Universal selected-element action policy. V3.146 begins with the website
 * builder but this pure module has no React, DOM, business or website state.
 * Future app/page editors may supply their own permitted selection schema.
 */
const ACTION_CHANNEL="busy.contextual-action.v1";
const ACTIONS=Object.freeze(["edit","voice","more"]);
const TYPES=Object.freeze({section:"section",photo:"picture",title:"heading",body:"text",
 cta:"button",ctaHref:"button",phone:"text",email:"text",openingHours:"text"});
const PRIMARY_LABELS=Object.freeze(Object.fromEntries(
 Object.entries(TYPES).map(([field,kind])=>
   [field,kind==="picture"?"Replace":kind==="section"?"Adjust":"Edit"])));
function contextualToolbarPolicy(type){
 const kind=TYPES[type]||null;
 if(!kind)return null;
 return Object.freeze({kind,primary:PRIMARY_LABELS[type],
  voiceLabel:"Talk to Busy about this "+kind,
  otherLabel:"More options for this "+kind,actions:ACTIONS});
}
/**
 * Finite free-to-run instruction examples, not a model-generated promise.
 * Page/business feedback is passed as a simple local preference by callers;
 * this generic policy has no access to another tenant's history.
 */
function contextualEditExamples({field,sectionType,hasItem=false,compactHeadingPreference=null}={}){
 if(field==="section")return ["Centre this section","Give this section more space"];
 if(field==="title"){
  const bigger="Make this heading bigger",smaller="Make this heading smaller";
  if(sectionType==="hero"&&compactHeadingPreference==="disliked")return [bigger];
  return sectionType==="hero"&&compactHeadingPreference==="liked"
   ?[smaller,bigger]:[bigger,smaller];
 }
 if(field==="photo"){
  if(sectionType==="gallery")return ["Move this photo to the right","Show this whole photograph"];
  if(sectionType==="photo-feature")return ["Move this photo to the right","Crop this photo to the top"];
  return ["Crop this photo to the top","Make this photo bigger"];
 }
 if(field==="cta"&&sectionType==="hero")return ["Make this button stand out"];
 if(field==="body"&&!hasItem)return ["Centre this section","Give this section more space"];
 return [];
}
function resolveContextualToolbarAction(message,resolveSelection){
 if(!message||typeof message!=="object"||Array.isArray(message)||
   typeof resolveSelection!=="function"||message.actionChannel!==ACTION_CHANNEL||
   !ACTIONS.includes(message.action)||JSON.stringify(message).length>800)return null;
 const selection=resolveSelection(message);
 if(!selection||!contextualToolbarPolicy(selection.field))return null;
 return {selection,action:message.action,policy:contextualToolbarPolicy(selection.field)};
}
export {ACTION_CHANNEL,ACTIONS,TYPES,PRIMARY_LABELS,contextualToolbarPolicy,contextualEditExamples,resolveContextualToolbarAction};
