/**
 * Universal selected-element action policy. V3.146 begins with the website
 * builder but this pure module has no React, DOM, business or website state.
 * Future app/page editors may supply their own permitted selection schema.
 */
const ACTION_CHANNEL="busy.contextual-action.v1";
const ACTIONS=Object.freeze(["edit","voice","more"]);
const TYPES=Object.freeze({photo:"picture",title:"heading",body:"text",
 cta:"button",ctaHref:"button",phone:"text",email:"text",openingHours:"text"});
function contextualToolbarPolicy(type){
 const kind=TYPES[type]||null;
 if(!kind)return null;
 return Object.freeze({kind,primary:kind==="picture"?"Replace":"Edit",
  voiceLabel:"Talk to Busy about this "+kind,
  otherLabel:"More options for this "+kind,actions:ACTIONS});
}
function resolveContextualToolbarAction(message,resolveSelection){
 if(!message||typeof message!=="object"||Array.isArray(message)||
   typeof resolveSelection!=="function"||message.actionChannel!==ACTION_CHANNEL||
   !ACTIONS.includes(message.action)||JSON.stringify(message).length>800)return null;
 const selection=resolveSelection(message);
 if(!selection||!contextualToolbarPolicy(selection.field))return null;
 return {selection,action:message.action,policy:contextualToolbarPolicy(selection.field)};
}
export {ACTION_CHANNEL,ACTIONS,TYPES,contextualToolbarPolicy,resolveContextualToolbarAction};
