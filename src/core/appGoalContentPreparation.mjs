import {inspectServices} from './businessInfoClarity.mjs';
import {privateAppEditSource,bindPrivateAppProposal} from './privateAppEditSession.mjs';
import {proposeCoordinatedAppChanges} from './appCoordinatedStudio.mjs';
import {appEditLockReason} from './appOwnerLocks.mjs';
// Ask for missing facts only. This is a focused input to the original Studio.
function appGoalContentQuestions(config,goal){
 const questions=[],profile=config?.publicProfile||{};
 if(!['book','enquire','services','photos','offers','rewards'].includes(goal))return [];
 if(!String(profile.about||profile.description||'').trim())questions.push({id:'about',label:'What should customers know about your business?',max:1200,
  locked:!!appEditLockReason(config,{kind:'text',field:'about'})});
 if(['book','services'].includes(goal)){
  const services=profile.services;
  if((services===undefined||Array.isArray(services)&&services.length===0)&&config?.modules?.some(m=>m.key==='services'&&m.enabled===true)){
   const locked=!!appEditLockReason(config,{kind:'services'});
   questions.push({id:'first-service-name',label:'What is the first service customers can request?',max:120,locked});
   questions.push({id:'first-service-description',label:'What does this service include?',max:600,locked});
  }
  const info=inspectServices(profile.services,'app');
  for(const issue of info.issues.filter(x=>x.id==='missing_service_description').slice(0,3)){
   const index=issue.position-1,service=profile.services[index];
   questions.push({id:'service:'+index,label:'What does '+service.name+' include?',max:600,index,
    locked:!!appEditLockReason(config,{kind:'services'})});
  }
 }
 if(goal==='photos'&&config?.modules?.some(m=>m.key==='gallery'&&m.enabled===true)){
  const gallery=profile.assets?.gallery;
  if(Array.isArray(gallery))for(const [index,image]of gallery.entries()){
   if(questions.filter(q=>q.expectedUri).length>=3)break;
   if(typeof image?.uri!=='string'||!(image.approved===true||image.marketingOk===true)||String(image.alt||'').trim())continue;
   questions.push({id:'photo:'+index,label:'What should someone who cannot see photo '+(index+1)+' know?',max:160,index,expectedUri:image.uri,
    locked:!!appEditLockReason(config,{kind:'photo_description'})});
  }
 }
 return questions;
}
function prepareAppGoalContent({businessId,app,goal,answers={}}={}){
 if(!privateAppEditSource({businessId,app})||!answers||typeof answers!=='object'||Array.isArray(answers))return {ok:false,reason:'Open the current private app before preparing content.'};
 const config=app.draft_config,questions=appGoalContentQuestions(config,goal),allowed=new Map(questions.map(q=>[q.id,q]));
 const operations=[],services=Array.isArray(config.publicProfile?.services)?config.publicProfile.services.map(x=>({...x})):[];let serviceChange=false;const first={};
 for(const [id,value]of Object.entries(answers)){
  const q=allowed.get(id);if(!q||q.locked||typeof value!=='string'||value.length>q.max||/[<>\u0000-\u001f]/.test(value))return {ok:false,reason:'Only current, unlocked missing fields can be prepared.'};
  if(!value.trim())continue;
  if(id==='about')operations.push({kind:'text',field:'about',value:value.trim()});
  else if(q.expectedUri){const image=config.publicProfile.assets.gallery[q.index];operations.push({kind:'restore_photo_description',index:q.index,expectedUri:q.expectedUri,value:{alt:{present:true,value:value.trim()},caption:Object.prototype.hasOwnProperty.call(image,'caption')?{present:true,value:image.caption}:{present:false}}});}
  else if(id.startsWith('first-service-'))first[id]=value.trim();
  else{services[q.index].description=value.trim();serviceChange=true;}
 }
 if(Object.keys(first).length){
  if(!first['first-service-name'])return {ok:false,reason:'Give the service a name before preparing it.'};
  services.push({name:first['first-service-name'],...(first['first-service-description']?{description:first['first-service-description']}:{})});serviceChange=true;
 }
 if(serviceChange)operations.push({kind:'services',value:services});
 const planned=proposeCoordinatedAppChanges(config,operations);
 return planned.ok?bindPrivateAppProposal(planned,{businessId,app}):planned;
}
export {appGoalContentQuestions,prepareAppGoalContent};
