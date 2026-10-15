import React from 'react';
import {createAppStudioSession} from '../core/appStudioSession.mjs';

function usePrivateAppStudio(context,onSave){
 const [,redraw]=React.useState(0);
 const session=React.useRef(null);
 if(!session.current)session.current=createAppStudioSession();
 session.current.setContext(context);
 React.useEffect(()=>{
  const editor=session.current;
  editor.attach(()=>redraw(n=>n+1));
  return ()=>editor.detach();
 },[]);
 const editor=session.current;
 return {...editor.snapshot(),prepare:editor.prepare,setNotice:editor.setNotice,
  discard:editor.discard,removeChange:editor.removeChange,approve:()=>editor.approve(onSave),undoLast:()=>editor.undo(onSave)};
}
export {usePrivateAppStudio};
