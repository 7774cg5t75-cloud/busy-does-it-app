import React from 'react';
import {Text} from 'react-native';
import {Card,Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {serviceEnquiryContext} from '../core/appServiceEnquiry.mjs';
import {prepareAppServiceAnswers} from '../core/appServiceAnswers.mjs';
import {SERVICE_QUESTION_TOPICS,prepareServiceQuestion} from '../../standalone/template/nativeCustomerActions.mjs';
import {stableJson} from '../core/stableJson.mjs';
export function AppServiceAnswersEditor({ownerId,businessId,app,catalog,busy=false,onPreview,onDraftChange,Surface}){
 const [rows,setRows]=React.useState([]),[baseline,setBaseline]=React.useState(null);
 const live=React.useRef(null),epoch=React.useRef(0),initial=React.useRef([ownerId,businessId,app?.id]),alive=React.useRef(true);
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const context=serviceEnquiryContext({businessId,app,catalog}),stamp=stableJson([ownerId,businessId,context?.source,catalog]);
 live.current={stamp,busy,ownerId,businessId,app,catalog};
 const current=()=>alive.current&&live.current.stamp===stamp&&!live.current.busy&&stamp===stableJson([live.current.ownerId,live.current.businessId,serviceEnquiryContext(live.current)?.source,live.current.catalog]);
 if(!ownerId||!context||stableJson(initial.current)!==stableJson([ownerId,businessId,app?.id]))return null;
 const stale=baseline!==null&&baseline!==stamp,captured=epoch.current;
 const change=fn=>{if(!current()||stale||captured!==epoch.current)return false;epoch.current++;onPreview?.(null);onDraftChange?.(true);setBaseline(stamp);fn();return true;};
 const plan=rows.length&&!stale?prepareAppServiceAnswers({businessId,app,catalog,rows}):null;
 return <Card title="Answer service questions before customers enquire" body="Prepare useful public answers to the original service questions. Write only facts you approve; prices and timing are not inferred. Existing answers are kept. Review one original Studio change before saving.">
  {context.services.map(service=><React.Fragment key={service.id}>
   <Text style={styles.cardBody}>{service.name+' — '+service.description}</Text>
   {SERVICE_QUESTION_TOPICS.map(topic=>{const row=rows.find(r=>r.serviceId===service.id&&r.topic===topic.key),question=prepareServiceQuestion(context.services,service.name,topic.key);return question.ok?<React.Fragment key={topic.key}>
    {row?<Field label={question.message} value={row.answer} maxLength={1200} multiline editable={!busy&&!stale} onChangeText={answer=>change(()=>setRows(old=>old.map(r=>r===row?{...r,answer}:r)))}/>:<Button label={'Prepare '+topic.label+' answer: '+service.name} disabled={busy||stale||rows.length>=6} onPress={()=>change(()=>setRows(old=>[...old,{serviceId:service.id,topic:topic.key,answer:''}]))}/>}
   </React.Fragment>:null;})}
  </React.Fragment>)}
  {stale?<Text style={styles.cardBody}>The service source changed. Your answers are kept; saved app content was not changed.</Text>:null}
  {plan?.reason?<Text style={styles.cardBody}>{plan.reason}</Text>:null}
  {plan?.ok&&Surface?<Surface config={plan.nextConfig} interactive={false} catalogueContextKey={'service-answers:'+app.id+':'+app.draft_revision}/>:null}
  <Button label="Review service answers in Studio" disabled={busy||stale||!plan?.ok} onPress={()=>current()&&captured===epoch.current&&!stale&&plan?.ok?onPreview?.(plan)!==false:false}/>
  {rows.length?<Button label="Clear unsaved service answers" disabled={busy} onPress={()=>{if(!current())return false;epoch.current++;setRows([]);setBaseline(null);onPreview?.(null);onDraftChange?.(false);return true;}}/>:null}
 </Card>;
}
