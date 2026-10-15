import React from 'react';
function useOwnerDesignMemory(context,load){
 const [memory,setMemory]=React.useState(null),[busy,setBusy]=React.useState(false);
 const [notice,setNotice]=React.useState('');
 const live=React.useRef(''),alive=React.useRef(true),flight=React.useRef(null);
 const key=[context.ownerId,context.businessId,context.appId,context.revision].join(':');
 live.current=key;
 React.useEffect(()=>{alive.current=true;return ()=>{alive.current=false;};},[]);
 React.useEffect(()=>{setMemory(null);setNotice('');setBusy(false);},[key]);
 const refresh=async()=>{
  if(flight.current?.key===key||!context.ownerId||typeof load!=='function')return;
  const marker={key};flight.current=marker;
  const scope=live.current;setBusy(true);
  try{
   const result=await load({appId:context.appId,expectedRevision:context.revision});
   if(!alive.current||live.current!==scope)return;
   if(result?.ok){setMemory(result);setNotice('Your saved choices can guide this private recommendation. They are preferences, not measured improvement.');}
   else{setMemory(null);setNotice(result?.reason||'Saved design choices are unavailable. Existing draft stays unchanged.');}
  }catch{if(alive.current&&live.current===scope){setMemory(null);setNotice('Saved choices could not be loaded. Existing draft stays unchanged.');}}
  finally{if(flight.current===marker){flight.current=null;if(alive.current&&live.current===scope)setBusy(false);}}
 };
 return {memory,busy,notice,refresh};
}
export {useOwnerDesignMemory};
