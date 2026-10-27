import {prepareAppEnquiryJourney,serviceEnquiryContext} from './appServiceEnquiry.mjs';
import {prepareAppServiceAnswers} from './appServiceAnswers.mjs';
import {proposeCoordinatedAppChanges} from './appCoordinatedStudio.mjs';
import {bindPrivateAppProposal} from './privateAppEditSession.mjs';
import {SERVICE_QUESTION_TOPICS} from '../../standalone/template/nativeCustomerActions.mjs';
// Compose existing finite operations, never add form fields or a request writer.
export function prepareCompleteAppEnquiry(input){
 if(!serviceEnquiryContext(input)||!Array.isArray(input.rows))return {ok:false,reason:'Choose current Services and Enquiry modules.'};
 const answers=[],rows=[];
 for(const row of input.rows){
  if(!row||Object.keys(row).some(k=>!['id','fields','label','importApproved','answers'].includes(k))||row.answers!==undefined&&(!row.answers||typeof row.answers!=='object'||Array.isArray(row.answers)||Object.keys(row.answers).some(k=>!SERVICE_QUESTION_TOPICS.some(t=>t.key===k))))return {ok:false,reason:'Use only the original service questions and owner-written answers.'};
  const {answers:values,...service}=row;rows.push(service);
  for(const [topic,answer]of Object.entries(values||{})){if(typeof answer!=='string')return {ok:false,reason:'Write exact public answers.'};if(answer.trim())answers.push({serviceId:row.id,topic,answer});}
 }
 const first=prepareAppEnquiryJourney({...input,rows});
 if(!first.ok&&first.reason!=='The reviewed service journey already matches the app.')return first;
 const operations=first.ok?[...first.operations]:[],app=first.ok?{...input.app,draft_config:first.nextConfig}:input.app;
 if(answers.length){
  const second=prepareAppServiceAnswers({...input,app,rows:answers});
  if(!second.ok&&second.reason!=='These exact service answers are already saved.')return second;
  if(second.ok)operations.push(...second.operations);
 }
 if(!operations.length)return {ok:false,reason:'The reviewed enquiry journey and answers already match the app.'};
 const plan=proposeCoordinatedAppChanges(input.app.draft_config,operations);
 return plan.ok?bindPrivateAppProposal(plan,{businessId:input.businessId,app:input.app}):plan;
}
