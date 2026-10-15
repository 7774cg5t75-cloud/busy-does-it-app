import React from 'react';
import {createWebsiteDraftHistory} from '../core/websiteDraftHistory.mjs';
function useWebsiteDraftHistory(scope){
 const history=React.useRef(null),[,redraw]=React.useState(0);
 if(!history.current)history.current=createWebsiteDraftHistory();
 const editor=history.current,key=editor.setScope(scope);
 const set=field=>value=>{if(editor.update(field,value,key))redraw(n=>n+1);};
 const state=editor.snapshot();
 return {websiteUndo:state.undo,websiteRedo:state.redo,websiteRecoveryPoint:state.point,
  websiteHistoryIsCurrent:()=>editor.isCurrent(key),setWebsiteUndo:set('undo'),setWebsiteRedo:set('redo'),setWebsiteRecoveryPoint:set('point')};
}
export {useWebsiteDraftHistory};
