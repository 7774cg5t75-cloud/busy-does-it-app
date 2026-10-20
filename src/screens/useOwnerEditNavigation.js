import React from 'react';
const same=(a,b)=>a?.source===b?.source&&a?.projectId===b?.projectId&&a?.revision===b?.revision&&a?.ownerId===b?.ownerId&&a?.businessId===b?.businessId;
// Dirty metadata only; the original editor continues to own all wording.
export function useOwnerEditNavigation(s,identity,onDiscard){
 const token=React.useRef({}),dirty=React.useRef(false),live=React.useRef(null);
 const bound={...identity,ownerId:s.ownerSession?.userId,businessId:s.cloudWorkspace?.businessId};live.current=bound;
 const previous=React.useRef(bound);if(previous.current.ownerId!==bound.ownerId||previous.current.businessId!==bound.businessId||previous.current.projectId!==bound.projectId)dirty.current=false;previous.current=bound;
 const current=()=>same(live.current,bound)&&s.ownerSession?.userId===bound.ownerId&&s.cloudWorkspace?.businessId===bound.businessId;
 const report=value=>{if(!current())return;dirty.current=!!value;s.setOwnerEditDirty?.({token:token.current,identity:bound,dirty:!!value,onDiscard:()=>{if(!current()||onDiscard?.()===false)return false;dirty.current=false;return true;}});};
 React.useEffect(()=>()=>s.releaseOwnerEdit?.(token.current),[]);
 React.useEffect(()=>{s.releaseOwnerEdit?.(token.current);if(dirty.current)report(true);},[identity.source,identity.projectId,identity.revision,bound.ownerId,bound.businessId]);
 report.commit=operation=>{
  if(!current())return false;
  return s.withOwnerEditCommit?s.withOwnerEditCommit(token.current,bound,operation):operation();
 };
 return report;
}
