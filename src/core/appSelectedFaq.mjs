import {proposeCoordinatedAppChanges} from './appCoordinatedStudio.mjs';
import {validPublicCollection} from './appPublicCollections.mjs';
function selectedAppFaq(config,selection){
 const rows=config?.publicProfile?.faqs;
 if(selection?.part!=='faq'||!Number.isInteger(selection.index)||selection.index<0||
  !validPublicCollection('faqs',rows)||!config?.modules?.some(m=>m.key==='business_profile'&&m.enabled===true))return null;
 const row=rows[selection.index];
 return row&&JSON.stringify(row)===selection.expectedFaq?row:null;
}
function selectedAppFaqOperation(config,selection,change={}){
 const row=selectedAppFaq(config,selection);
 if(!row)return {ok:false,reason:'Select a current owner-written question and answer again.'};
 const value=config.publicProfile.faqs.map(row=>({...row}));
 if(change.kind==='wording'){
  if(!change.value||Object.keys(change.value).some(key=>!['question','answer'].includes(key))||typeof change.value.question!=='string'||typeof change.value.answer!=='string')
   return {ok:false,reason:'Edit only this question and its owner-written answer.'};
  value[selection.index]={...row,...change.value};
 }else if(change.kind==='move'&&['earlier','later'].includes(change.direction)){
  const to=selection.index+(change.direction==='earlier'?-1:1);
  if(to<0||to>=value.length)return {ok:false,reason:'This answer is already at that end of the list.'};
  const [moved]=value.splice(selection.index,1);value.splice(to,0,moved);
 }else return {ok:false,reason:'Choose supported FAQ wording or a relative move.'};
 const operation={kind:'public_collection',field:'faqs',value},proposal=proposeCoordinatedAppChanges(config,[operation]);
 return proposal.ok?{ok:true,operation,proposal}:proposal;
}
export {selectedAppFaq,selectedAppFaqOperation};
