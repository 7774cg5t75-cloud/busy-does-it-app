import {proposeCoordinatedAppChanges} from './appCoordinatedStudio.mjs';
// Adapter to the existing atomic service-list edit. Selection is bound to the
// raw private row, not a filtered position or a possibly duplicated name.
function selectedAppService(config,selection){
 const rows=config?.publicProfile?.services;
 if(selection?.part!=='service'||!Number.isInteger(selection.index)||selection.index<0||
  !Array.isArray(rows)||!config?.modules?.some(m=>m.key==='services'&&m.enabled===true))return null;
 const row=rows[selection.index];
 return row&&JSON.stringify(row)===selection.expectedService?row:null;
}
function selectedAppServiceOperation(config,selection,change={}){
 const row=selectedAppService(config,selection);
 if(!row)return {ok:false,reason:'Select the current owner-written service again.'};
 const rows=config.publicProfile.services.map(value=>({...value}));
 if(change.kind==='wording'){
  if(!change.value||Object.keys(change.value).some(key=>!['name','description'].includes(key))||
   typeof change.value.name!=='string'||typeof change.value.description!=='string')
   return {ok:false,reason:'Edit only this service’s owner-written name and description.'};
  rows[selection.index]={...row,...change.value};
 }else if(change.kind==='move'&&['earlier','later'].includes(change.direction)){
  const to=selection.index+(change.direction==='earlier'?-1:1);
  if(to<0||to>=rows.length)return {ok:false,reason:'This service is already at that end of the list.'};
  const [moved]=rows.splice(selection.index,1);rows.splice(to,0,moved);
 }else return {ok:false,reason:'Choose supported wording or a relative service move.'};
 const operation={kind:'services',value:rows},proposal=proposeCoordinatedAppChanges(config,[operation]);
 if(!proposal.ok)return proposal;
 // A selected edit must never silently clean up other legacy rows. Those need
 // the existing whole-collection review rather than an element-only control.
 if(JSON.stringify(proposal.nextConfig.publicProfile.services)!==JSON.stringify(rows))
  return {ok:false,reason:'Review this legacy service collection in the full service editor first.'};
 return {ok:true,operation,proposal};
}
export {selectedAppService,selectedAppServiceOperation};
