import React from 'react';
// Registers only dirty metadata around the original editor's own text state.
export function useOwnerEditNavigation(s,identity){
 const token=React.useRef({}),dirty=React.useRef(false),live=React.useRef(null);live.current=identity;
 const report=value=>{if(live.current!==identity)return;dirty.current=!!value;s.setOwnerEditDirty?.({token:token.current,identity,dirty:!!value});};
 React.useEffect(()=>{if(dirty.current)report(true);return ()=>s.setOwnerEditDirty?.({token:token.current,identity,dirty:false});},[identity.source,identity.projectId,identity.revision,s.ownerSession?.userId,s.cloudWorkspace?.businessId]);
 return report;
}
