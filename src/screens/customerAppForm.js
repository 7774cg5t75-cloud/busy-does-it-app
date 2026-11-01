import React from 'react';
import {Text} from 'react-native';
import {Card,Button} from '../components/ui';
import {styles} from '../theme/styles';
import {createCustomerFormJourney,solveCustomerFormProof} from '../core/customerFormJourney.mjs';
import {CustomerFormRehearsal} from './customerFormRehearsal';
import {stableJson} from '../core/stableJson.mjs';
export function CustomerAppForm({identity,request,integrity,isCurrent,interest=null}){
 const stamp=stableJson(identity),initial=React.useRef(stamp),live=React.useRef(null);live.current={stamp,isCurrent};const current=()=>initial.current===live.current.stamp&&live.current.isCurrent?.()===true;
 const api=React.useRef(null);if(!api.current)api.current=createCustomerFormJourney({identity,request,integrity,isCurrent:current,solve:(c,check)=>solveCustomerFormProof(c,check,integrity)});
 const [state,setState]=React.useState(api.current.state()),[busy,setBusy]=React.useState(false);const run=async fn=>{if(busy||!current())return false;setBusy(true);try{const promise=fn();if(current())setState(api.current.state());return await promise;}finally{if(current()){setState(api.current.state());setBusy(false);}}};if(!current())return null;
 return <Card title="Enquire with this business" body="An enquiry helps the business understand your needs. It is not an order, booking, payment or marketing subscription.">
 {state.phase==='unopened'?<Button label="Open the reviewed questions" disabled={busy} onPress={()=>run(()=>api.current.open())}/>:null}
 {state.projection&&!['confirmed','reconciled'].includes(state.phase)?<CustomerFormRehearsal projection={state.projection} interest={interest} isCurrent={current} customerEntry deliveryState={state.phase} locked={busy||state.uncertain} onEdit={()=>{api.current.edit();setState(api.current.state());}} review={async b=>{const r=await api.current.prepare(b.answers,b.contact,b.consent,b.interest);if(current())setState(api.current.state());const {ok,interest:_,...wire}=r;if(!ok)throw Error('Review unavailable');return wire;}}/>:null}
 {state.phase==='reviewed'&&state.submissionPermitted?<Button label="Send this reviewed enquiry" disabled={busy} onPress={()=>run(()=>api.current.submit())}/>:null}
 {state.phase==='reviewed'&&!state.submissionPermitted?<Text style={styles.cardBody}>These questions are available for review only. Sending is unavailable.</Text>:null}
 {state.uncertain?<><Text accessibilityLiveRegion="polite" style={styles.cardBody}>{state.phase==='dispatched'?'Waiting for the original request and independent verification. Do not send it again.':'The outcome is unknown. Keep this view open to inspect the exact receipt. Nothing is automatically sent again.'}</Text><Button label="Inspect this enquiry receipt" disabled={busy} onPress={()=>run(()=>api.current.inspect())}/></>:null}
 {state.receipt?<Text accessibilityLiveRegion="polite" selectable style={styles.cardBody}>{'Enquiry saved and independently verified. Reference: '+state.receipt.requestId+'. This does not confirm delivery of a message, booking or payment. Receipt access expires under the reviewed policy; that does not delete the business’s customer records.'}</Text>:null}
 {state.phase==='unavailable'?<Text style={styles.cardBody}>This form is unavailable. Nothing has been submitted.</Text>:null}
 </Card>;
}
