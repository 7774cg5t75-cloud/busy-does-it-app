/** Private preview gestures. Coordinates choose a finite insertion; none are saved. */
import {applyWebsiteLayoutOperation} from '../../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs';
const list=x=>Array.isArray(x)?x:[];
const channel='busy.website.section-move.v1';
function websiteMovementOptions(draft,pageId,sourceKey,editableHtml){
 // Secondary pages have their own sectionIds render order. Do not pretend a
 // global theme-order operation moves their sections.
 if(pageId!=='home'||!sourceKey||!draft?.id)return null;
 if(typeof editableHtml!=='string'||editableHtml.length>500000)return null;
 // Only actual rendered section roots are drop targets, never empty/hidden
 // source sections or product/event content without supported editor markers.
 const visible=new Set([...editableHtml.matchAll(/<section\b[^>]*\bdata-busy-edit-section="([a-zA-Z0-9_-]+)"/g)].map(m=>m[1]));
 const page=list(draft.pages).find(p=>p.id===pageId&&p.enabled!==false);
 const order=[...new Set([...list(draft.designPlan?.sectionOrder),...list(draft.sections).map(s=>s.id)])]
  .filter(id=>visible.has(id)&&list(page?.sectionIds).includes(id)&&list(draft.sections).some(s=>s.id===id&&s.enabled!==false));
 if(order.length>30)return null;
 const moves=[];
 for(const sectionId of order)for(const targetSectionId of order)for(const position of ['before','after']){
  const operation={action:'move-relative',sectionId,targetSectionId,position,pageId};
  if(applyWebsiteLayoutOperation(draft,operation).applied)moves.push({sectionId,targetSectionId,position});
 }
 return {channel,sourceKey,order,moves};
}
function resolveWebsiteMovement(draft,pageId,sourceKey,message,editableHtml){
 if(!message||typeof message!=='object'||Array.isArray(message)||JSON.stringify(message).length>1200||
  message.channel!==channel||message.sourceKey!==sourceKey||
  Object.keys(message).some(k=>!['channel','sourceKey','sectionId','targetSectionId','position'].includes(k)))return null;
 const options=websiteMovementOptions(draft,pageId,sourceKey,editableHtml);
 if(!options?.moves.some(m=>m.sectionId===message.sectionId&&m.targetSectionId===message.targetSectionId&&m.position===message.position))return null;
 // The original selected-instruction controller rechecks the live revision,
 // tenant, locks and all-or-nothing commit; one Undo restores the whole draft.
 return {selection:{draftId:draft.id,generation:draft.generation,pageId,sectionId:message.sectionId,field:'section',itemId:null},
  instruction:'move this section '+message.position+' '+message.targetSectionId};
}
// Serialized only from this checked-in function, with app-generated bounded
// options. No business text, arbitrary script, credentials or network access.
function installWebsiteMovement(options){
 if(!options)return;
 var drag=null,marked=null,pending=false;
 var status=document.createElement('div');
 status.className='busy-move-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 document.body.appendChild(status);
 function valid(id,target,position){return options.moves.some(function(m){return m.sectionId===id&&m.targetSectionId===target&&m.position===position;});}
 function clear(){if(marked){marked.removeAttribute('data-busy-drop');marked=null;}}
 function cancel(){clear();drag=null;}
 function send(id,target,position){
  if(pending||!valid(id,target,position))return;
  if(window.ReactNativeWebView&&typeof window.ReactNativeWebView.postMessage==='function'){
   pending=true;status.textContent='Applying private section move. Use Undo to restore it.';
   window.ReactNativeWebView.postMessage(JSON.stringify({channel:options.channel,sourceKey:options.sourceKey,sectionId:id,targetSectionId:target,position:position}));
  }
 }
 options.order.forEach(function(id){
  if(!options.moves.some(function(m){return m.sectionId===id;}))return;
  var section=document.getElementById(id);if(!section)return;
  var handle=document.createElement('button');handle.type='button';handle.className='busy-section-move';
  handle.textContent='↕ Move section';handle.setAttribute('aria-label','Move '+id+' section. Drag, or use up and down arrow keys.');
  handle.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();});
  handle.addEventListener('keydown',function(e){
   if(e.key==='Escape'){cancel();status.textContent='Movement cancelled.';return;}
   if(e.key!=='ArrowUp'&&e.key!=='ArrowDown')return;
   e.preventDefault();e.stopPropagation();
   var at=options.order.indexOf(id),step=e.key==='ArrowUp'?-1:1,position=step<0?'before':'after';
   for(var i=at+step;i>=0&&i<options.order.length;i+=step){
    if(valid(id,options.order[i],position)){send(id,options.order[i],position);return;}
   }
   status.textContent='No permitted position in that direction. Owner locks and the main hero stay protected.';
  });
  handle.addEventListener('pointerdown',function(e){
   if(pending||e.isPrimary===false||e.button!==0)return;
   e.preventDefault();e.stopPropagation();
   drag={id:id,pointer:e.pointerId,x:e.clientX,y:e.clientY,target:null,position:null};
   if(handle.setPointerCapture)handle.setPointerCapture(e.pointerId);
   status.textContent='Drag to a section edge. Release on a highlighted location to save privately. Escape cancels.';
  });
  handle.addEventListener('lostpointercapture',cancel);
  section.insertBefore(handle,section.firstChild);
 });
 document.addEventListener('pointermove',function(e){
  if(!drag||e.pointerId!==drag.pointer)return;
  e.preventDefault();clear();drag.target=null;
  if(Math.abs(e.clientY-drag.y)+Math.abs(e.clientX-drag.x)<8)return;
  var hit=document.elementFromPoint(e.clientX,e.clientY),section=hit&&hit.closest&&hit.closest('section[id]');
  if(!section)return;
  var rect=section.getBoundingClientRect(),position=e.clientY<rect.top+rect.height/2?'before':'after';
  if(!valid(drag.id,section.id,position))return;
  drag.target=section.id;drag.position=position;marked=section;marked.setAttribute('data-busy-drop',position);
  status.textContent='Move '+drag.id+' '+position+' '+section.id+'.';
 },{passive:false});
 document.addEventListener('pointerup',function(e){
  if(!drag||e.pointerId!==drag.pointer)return;
  var finished=drag;cancel();
  if(finished.target)send(finished.id,finished.target,finished.position);
  else status.textContent='No valid drop selected. Website unchanged.';
 });
 document.addEventListener('pointercancel',cancel);
 document.addEventListener('keydown',function(e){if(e.key==='Escape'){cancel();status.textContent='Movement cancelled.';}});
 window.addEventListener('blur',cancel);window.addEventListener('pagehide',cancel);
}
export {websiteMovementOptions,resolveWebsiteMovement,installWebsiteMovement};
