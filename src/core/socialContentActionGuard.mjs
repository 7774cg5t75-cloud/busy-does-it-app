// Transient guards around original client operations; no scheduler, ledger or provider authority.
export function beginSocialContentAction({scope,scopeRef,operationRef,actions,record,ownSave=false,view}){
 if(actions.isRenderCurrent?.()===false)return null;
 if(!scope||scopeRef.current!==scope||operationRef.current?.scope===scope||!record?.id)return null;
 const ticket=actions.capture(),stamp=JSON.stringify(record);
 if(!actions.fresh(ticket)||ticket.text!==view.text||ticket.photos!==view.photos||ticket.selectedId!==view.selectedId||ticket.records!==view.records)return null;
 if(!ownSave&&(ticket.selectedId!==record.id||!ticket.records?.includes(record)||ticket.text.trim()!==record.text))return null;
 const token={scope};operationRef.current=token;
 const scoped=()=>scopeRef.current===scope&&operationRef.current===token;
 const current=()=>scoped()&&JSON.stringify(record)===stamp&&(ownSave?actions.freshSave(ticket,record):actions.fresh(ticket)&&actions.capture().records?.includes(record));
 return {current,scoped,matches:(post,statuses)=>current()&&matchesSocialContentPost(post,record,statuses,{ownSave}),finish:()=>{
  if(operationRef.current!==token)return false;operationRef.current=null;return scopeRef.current===scope;
 }};
}

export function matchesSocialContentPost(post,record,statuses,{ownSave=false}={}){
 const mediaMatch=!Array.isArray(record?.photos)||Array.isArray(post?.media)&&JSON.stringify(post.media.map(item=>item.id))===JSON.stringify(record.photos.map((item,index)=>item.id||'photo-'+(index+1)));
 return !!record?.id&&post?.client_draft_id===record.id&&statuses.includes(post.status)&&(!ownSave||post.caption===record.text&&mediaMatch&&Array.isArray(post.channels)&&JSON.stringify([...post.channels].sort())===JSON.stringify([...(record.channels||[])].sort()));
}
