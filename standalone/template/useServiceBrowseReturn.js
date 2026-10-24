import React from 'react';
// Public filter/return metadata only; original parent state and requests remain authoritative.
export function useServiceBrowseReturn({services,contextKey='',query,category,setQuery,setCategory,savedBrowseState,onSaveBrowseState}){
 const source=JSON.stringify([contextKey,services]);
 const initial=React.useRef(false),active=React.useRef(true);
 React.useEffect(()=>{active.current=true;return ()=>{active.current=false;};},[]);
 const restore=!initial.current&&savedBrowseState?.source===source&&typeof savedBrowseState.query==='string'&&typeof savedBrowseState.category==='string'&&(!savedBrowseState.category||services.some(service=>service?.category===savedBrowseState.category));
 if(!initial.current){initial.current=true;if(restore){setQuery(savedBrowseState.query);setCategory(savedBrowseState.category);}}
 const epoch=React.useRef(0),previousSource=React.useRef(source),saved=React.useRef(null),live=React.useRef(null);
 const [,redraw]=React.useState(0);
 const changed=previousSource.current!==source;
 if(changed){previousSource.current=source;epoch.current++;saved.current=null;setQuery('');setCategory('');}
 const visibleQuery=changed?'':restore?savedBrowseState.query:query,visibleCategory=changed?'':restore?savedBrowseState.category:category,captured=epoch.current;
 live.current={source,query:visibleQuery,category:visibleCategory};
 const current=()=>active.current&&live.current.source===source&&epoch.current===captured;
 const remember=(nextQuery,nextCategory)=>onSaveBrowseState?.({source,query:nextQuery,category:nextCategory});
 const edit=(field,value)=>{if(!current())return;epoch.current++;saved.current=null;(field==='query'?setQuery:setCategory)(value);remember(field==='query'?value:visibleQuery,field==='category'?value:visibleCategory);redraw(n=>n+1);};
 return {query:visibleQuery,category:visibleCategory,
  onQuery:value=>edit('query',value),onCategory:value=>edit('category',value),
  clear:()=>{if(!current())return;epoch.current++;saved.current=null;setQuery('');setCategory('');remember('','');redraw(n=>n+1);},
  related:value=>{if(!current()||!services.some(service=>service?.category===value))return;
   saved.current={source,query:visibleQuery,category:visibleCategory};epoch.current++;setQuery('');setCategory(value);remember('',value);redraw(n=>n+1);
  },
  canReturn:!!saved.current&&saved.current.source===source,
  back:()=>{if(!current()||saved.current?.source!==source)return;const point=saved.current;epoch.current++;saved.current=null;setQuery(point.query);setCategory(point.category);remember(point.query,point.category);redraw(n=>n+1);}
 };
}
