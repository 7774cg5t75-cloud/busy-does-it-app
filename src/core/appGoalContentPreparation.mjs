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
  const info=inspectServices(profile.services,'app');
  for(const issue of info.issues.filter(x=>x.id==='missing_service_description').slice(0,3)){
   const index=issue.position-1,service=profile.services[index];
   questions.push({id:'service:'+index,label:'What does '+service.name+' include?',max:600,index,
    locked:!!appEditLockReason(config,{kind:'services'})});
  }
 }
 return questions;
}
function prepareAppGoalContent({businessId,app,goal,answers={}}={}){
 if(!privateAppEditSource({businessId,app})||!answers||typeof answers!=='object'||Array.isArray(answers))return {ok:false,reason:'Open the current private app before preparing content.'};
 const config=app.draft_config,questions=appGoalContentQuestions(config,goal),allowed=new Map(questions.map(q=>[q.id,q]));
 const operations=[],services=(config.publicProfile?.services||[]).map(x=>({...x}));let serviceChange=false;
 for(const [id,value]of Object.entries(answers)){
  const q=allowed.get(id);if(!q||q.locked||typeof value!=='string'||value.length>q.max||/[<>\u0000-\u001f]/.test(value))return {ok:false,reason:'Only current, unlocked missing fields can be prepared.'};
  if(!value.trim())continue;
  if(id==='about')operations.push({kind:'text',field:'about',value:value.trim()});
  else{services[q.index].description=value.trim();serviceChange=true;}
 }
 if(serviceChange)operations.push({kind:'services',value:services});
 const planned=proposeCoordinatedAppChanges(config,operations);
 return planned.ok?bindPrivateAppProposal(planned,{businessId,app}):planned;
}
export {appGoalContentQuestions,prepareAppGoalContent};
