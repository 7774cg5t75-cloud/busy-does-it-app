import {serviceEnquiryContext} from './appServiceEnquiry.mjs';
import {mergeMissingPublicCollection} from './appPublicCollections.mjs';
import {prepareServiceQuestion,SERVICE_QUESTION_TOPICS} from '../../standalone/template/nativeCustomerActions.mjs';
import {proposeCoordinatedAppChanges} from './appCoordinatedStudio.mjs';
import {bindPrivateAppProposal} from './privateAppEditSession.mjs';
// Reuse exact existing service questions and the original public FAQ operation.
// Answers are owner-written public facts, never inferred price/availability.
export function prepareAppServiceAnswers({businessId,app,catalog,rows}={}){
 const context=serviceEnquiryContext({businessId,app,catalog});
 if(!context||!Array.isArray(rows)||!rows.length||rows.length>6)return {ok:false,reason:'Review up to six service answers.'};
 const seen=new Set(),answers=[];
 for(const row of rows){
  if(!row||Object.keys(row).sort().join('|')!=='answer|serviceId|topic'||seen.has(row.serviceId+':'+row.topic)||typeof row.answer!=='string'||!row.answer.trim())return {ok:false,reason:'Choose distinct current service questions and write complete owner-reviewed answers.'};
  seen.add(row.serviceId+':'+row.topic);
  const service=context.services.filter(s=>s.id===row.serviceId);
  if(service.length!==1||!SERVICE_QUESTION_TOPICS.some(t=>t.key===row.topic))return {ok:false,reason:'The original selected service or question is unavailable.'};
  const question=prepareServiceQuestion(context.services,service[0].name,row.topic);
  if(!question.ok)return question;
  answers.push({question:question.message,answer:row.answer});
 }
 const merged=mergeMissingPublicCollection('faqs',context.config.publicProfile?.faqs||[],answers);
 if(!merged.ok)return merged;
 if(merged.conflicts.length)return {ok:false,reason:'An existing answer differs. Open that original FAQ to review a correction; nothing is overwritten.'};
 if(!merged.added.length)return {ok:false,reason:'These exact service answers are already saved.'};
 const plan=proposeCoordinatedAppChanges(context.config,[{kind:'public_collection',field:'faqs',value:merged.value}]);
 return plan.ok?bindPrivateAppProposal(plan,{businessId,app}):plan;
}
