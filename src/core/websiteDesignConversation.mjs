/** Reusable private, owner-scoped conversation context. No edits or publishing. */
const tidy=v=>typeof v==="string"?v.trim().replace(/[\u0000-\u001f]/g," ").slice(0,400):"";
const same=(a,b)=>!!a&&!!b&&a.draftId===b.draftId&&a.pageId===b.pageId&&
 a.generation===b.generation&&a.workspaceId===b.workspaceId;
function beginWebsiteConversation(scope={}){
 if(!scope.draftId||!scope.pageId||!scope.workspaceId||
    !Number.isSafeInteger(scope.generation))return {ok:false,reason:"Select a current website page."};
 return {ok:true,scope:{draftId:scope.draftId,pageId:scope.pageId,
  generation:scope.generation,workspaceId:scope.workspaceId},turns:[],
  keepColours:false,keepPhotos:false,requiresOwnerApproval:true};
}
function addWebsiteConversationTurn(state,scope,{role,text}={}){
 if(!state?.ok||!same(state.scope,scope)||!["owner","busy"].includes(role)||!tidy(text))
  return {ok:false,reason:"The website page changed. Start this conversation again."};
 const value=tidy(text);
 const preserve=role==="owner"&&/\b(?:don't|do not|never|keep|retain|preserve)\b/i.test(value);
 return {...state,turns:[...state.turns,{role,text:value}].slice(-6),
   keepColours:state.keepColours||
    !!(preserve&&/colou?r|palette|branding/i.test(value)),
   keepPhotos:state.keepPhotos||
    !!(preserve&&/photos?|images?|pictures?/i.test(value))};
}
function websiteConversationContext(state,scope){
 if(!state?.ok||!same(state.scope,scope))
  return {ok:false,reason:"Conversation no longer matches this private draft."};
 return {ok:true,history:state.turns.slice(-5).map(x=>({role:x.role,text:x.text})),
  keepColours:state.keepColours===true,keepPhotos:state.keepPhotos===true};
}
export {beginWebsiteConversation,addWebsiteConversationTurn,websiteConversationContext};
