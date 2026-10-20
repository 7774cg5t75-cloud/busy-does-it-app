// Transient guards around original client operations; no scheduler, ledger or provider authority.
export function beginSocialContentAction({scope,scopeRef,operationRef,actions,record,ownSave=false,view}){
 if(!scope||scopeRef.current!==scope||operationRef.current?.scope===scope||!record?.id)return null;
 const ticket=actions.capture(),stamp=JSON.stringify(record);
 if(!actions.fresh(ticket)||ticket.text!==view.text||ticket.photos!==view.photos||ticket.selectedId!==view.selectedId||ticket.records!==view.records)return null;
 if(!ownSave&&(ticket.selectedId!==record.id||!ticket.records?.includes(record)||ticket.text.trim()!==record.text))return null;
 const token={scope};operationRef.current=token;
 const scoped=()=>scopeRef.current===scope&&operationRef.current===token;
 const current=()=>scoped()&&JSON.stringify(record)===stamp&&(ownSave?actions.freshSave(ticket,record):actions.fresh(ticket)&&actions.capture().records?.includes(record));
 return {current,scoped,matches:(post,statuses)=>current()&&post?.client_draft_id===record.id&&statuses.includes(post.status)&&(!ownSave||post.caption===record.text&&Array.isArray(post.channels)&&JSON.stringify([...post.channels].sort())===JSON.stringify([...(record.channels||[])].sort())),finish:()=>{
  if(operationRef.current!==token)return false;operationRef.current=null;return scopeRef.current===scope;
 }};
}
