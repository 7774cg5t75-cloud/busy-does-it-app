import React from 'react';
// Public filter/return metadata only; original parent state and requests remain authoritative.
export function useServiceBrowseReturn({services,contextKey='',query,category,setQuery,setCategory}){
 const source=JSON.stringify([contextKey,services]),epoch=React.useRef(0),previousSource=React.useRef(source),saved=React.useRef(null),live=React.useRef(null);
 const [,redraw]=React.useState(0);
 const changed=previousSource.current!==source;
 if(changed){previousSource.current=source;epoch.current++;saved.current=null;setQuery('');setCategory('');}
 const visibleQuery=changed?'':query,visibleCategory=changed?'':category,captured=epoch.current;
 live.current={source,query:visibleQuery,category:visibleCategory};
 const current=()=>live.current.source===source&&epoch.current===captured;
 const edit=(field,value)=>{if(!current())return;epoch.current++;saved.current=null;(field==='query'?setQuery:setCategory)(value);redraw(n=>n+1);};
 return {query:visibleQuery,category:visibleCategory,
  onQuery:value=>edit('query',value),onCategory:value=>edit('category',value),
  clear:()=>{if(!current())return;epoch.current++;saved.current=null;setQuery('');setCategory('');redraw(n=>n+1);},
  related:value=>{if(!current()||!services.some(service=>service?.category===value))return;
   saved.current={source,query:visibleQuery,category:visibleCategory};epoch.current++;setQuery('');setCategory(value);redraw(n=>n+1);
  },
  canReturn:!!saved.current&&saved.current.source===source,
  back:()=>{if(!current()||saved.current?.source!==source)return;const point=saved.current;epoch.current++;saved.current=null;setQuery(point.query);setCategory(point.category);redraw(n=>n+1);}
 };
}
