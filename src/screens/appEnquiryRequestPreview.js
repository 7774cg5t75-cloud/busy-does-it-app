import React from 'react';
import {Text} from 'react-native';
import {Card,Button} from '../components/ui';
import {styles} from '../theme/styles';
import {BusinessAppCustomerRequestFields} from './businessAppCustomerRequestFields';
import {serviceEnquiryContext} from '../core/appServiceEnquiry.mjs';
import {stableJson} from '../core/stableJson.mjs';
import {emptyEnquiryRequirements,prepareCustomerEnquiry} from '../core/customerEnquiryRequirements.mjs';
import {prepareServiceQuestion,validateNativeGuestRequest} from '../../standalone/template/nativeCustomerActions.mjs';
// Owner-only inert rehearsal through original surface, fields and serializer. No send callback.
export function AppEnquiryRequestPreview({ownerId,businessId,app,catalog,config,Surface}){
 const [example,setExample]=React.useState({name:'',email:'',phone:'',service:'',message:''}),[requirements,setRequirements]=React.useState(emptyEnquiryRequirements),[selection,setSelection]=React.useState(null),[payload,setPayload]=React.useState(null),[notice,setNotice]=React.useState('');
 const live=React.useRef(null),epoch=React.useRef(0),alive=React.useRef(true),initial=React.useRef([ownerId,businessId,app?.id]);
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const target={...app,draft_config:config},context=serviceEnquiryContext({businessId,app:target,catalog}),stamp=stableJson([ownerId,businessId,context?.source,catalog]);
 live.current={ownerId,businessId,app,catalog,config,stamp};const current=()=>alive.current&&!!ownerId&&live.current.stamp===stamp&&stableJson([live.current.ownerId,live.current.businessId,serviceEnquiryContext({businessId:live.current.businessId,app:{...live.current.app,draft_config:live.current.config},catalog:live.current.catalog})?.source,live.current.catalog])===stamp;
 const captured=epoch.current,stale=selection&&selection.stamp!==stamp;
 const change=field=>value=>{if(!current())return false;epoch.current++;setPayload(null);setExample(old=>({...old,[field]:value}));return true;};
 const choose=(name,type='enquiry',topic=null)=>{if(!current()||type!=='enquiry'||context.services.filter(s=>s.name===name).length!==1)return false;const row=context.services.find(s=>s.name===name),question=topic?prepareServiceQuestion(context.services,name,topic):null;if(topic&&!question.ok)return false;epoch.current++;setPayload(null);setSelection({id:row.id,stamp});setExample(old=>({...old,service:name,message:old.message||question?.message||''}));setNotice('Selected '+name+'. Existing example wording is kept. This is not a request.');return true;};
 const prepared=prepareCustomerEnquiry({message:example.message,requirements}),ready=prepared.ok?validateNativeGuestRequest('enquiry',{...example,message:prepared.message}):prepared;
 const review=()=>{if(!current()||captured!==epoch.current||stale||!ready.ok)return false;setPayload({stamp,payload:ready.payload});return true;};
 if(!context||initial.current[0]!==ownerId||initial.current[1]!==businessId||initial.current[2]!==app?.id)return null;
 return <Card title="Try the customer service-to-enquiry journey" body="Owner-only example. Select a service in the original app surface, enter fictional details and inspect the exact supported payload. No request, identity, operation receipt or send is created.">
  {Surface?<Surface config={config} interactive={false} requestPreview={{onSelectService:choose,onNavigate:type=>{if(current()&&type==='enquiry')setNotice('Original enquiry fields are shown below. No customer route is opened.');}}} catalogueContextKey={'owner-enquiry-rehearsal:'+app.id+':'+app.draft_revision}/>:null}
  {stale?<Text style={styles.cardBody}>The proposed app changed. Your example words are kept; choose a current service again before inspecting the payload.</Text>:null}
  <BusinessAppCustomerRequestFields previewOnly s={{ownerSession:{userId:ownerId},miniAppsAction:''}} form={{enabled:new Set(['enquiry']),requestKind:'enquiry',...example,requirements,setRequirements:update=>{if(current()){epoch.current++;setPayload(null);setRequirements(update);}},setName:change('name'),setEmail:change('email'),setPhone:change('phone'),setService:change('service'),setMessage:change('message'),serviceChoices:context.services,preferredDates:[],bookingReady:{ok:false},enquiryReady:stale?{ok:false,reason:'Choose a current service again; your example words are kept.'}:ready,reviewExample:review}}/>
  <Button label="Clear only the example enquiry" onPress={()=>{if(!current())return false;epoch.current++;setExample({name:'',email:'',phone:'',service:'',message:''});setRequirements(emptyEnquiryRequirements());setSelection(null);setPayload(null);return true;}}/>
  {payload?.stamp===stamp&&!stale?<Text selectable style={styles.cardBody}>{'Example original payload — not submitted:\n'+JSON.stringify(payload.payload,null,2)}</Text>:null}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
 </Card>;
}
