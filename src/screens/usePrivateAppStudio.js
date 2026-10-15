import React from 'react';
import * as SecureStore from 'expo-secure-store';
import {createAppStudioSession} from '../core/appStudioSession.mjs';
import {appStudioCheckpointKey,createAppStudioCheckpoint} from '../core/appStudioCheckpoint.mjs';

function usePrivateAppStudio(context,onSave){
 const [,redraw]=React.useState(0);
 const session=React.useRef(null);
 const key=appStudioCheckpointKey(context);
 if(!session.current||session.current.key!==key){
  session.current={key,editor:createAppStudioSession({checkpoint:key?
   createAppStudioCheckpoint(SecureStore,context):null})};
 }
 const editor=session.current.editor;
 editor.setContext(context);
 React.useEffect(()=>{
  editor.attach(()=>redraw(n=>n+1));
  editor.restore();
  return ()=>editor.detach();
 },[editor]);
 return {...editor.snapshot(),prepare:editor.prepare,setNotice:editor.setNotice,
  discard:editor.discard,removeChange:editor.removeChange,approve:()=>editor.approve(onSave),undoLast:()=>editor.undo(onSave)};
}
export {usePrivateAppStudio};
