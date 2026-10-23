import React from 'react';
import {Text,View} from 'react-native';
import {Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {proposeCoordinatedAppChanges} from '../core/appCoordinatedStudio.mjs';
import {bindPrivateAppProposal} from '../core/privateAppEditSession.mjs';
function AppContactEditor({businessId,app,onPreview,onNotice,busy,onDraftChange}){
 const [open,setOpen]=React.useState(false),[field,setField]=React.useState('phone'),[value,setValue]=React.useState('');
 const [pending,setPending]=React.useState(null);
 const live=React.useRef(null),alive=React.useRef(true),dirty=React.useRef(false),epoch=React.useRef(0),inputSession=React.useRef(0),pendingRef=React.useRef(null);
 live.current={businessId,app,busy};
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;pendingRef.current=null;};},[]);
 const current=()=>alive.current&&live.current.businessId===businessId&&live.current.app===app&&!live.current.busy;
 const cancelPending=()=>{pendingRef.current=null;setPending(null);};
 const transition=run=>{
  if(!current())return;
  const ticket={epoch:epoch.current,run};
  if(dirty.current){pendingRef.current=ticket;setPending(ticket);return;}
  inputSession.current++;epoch.current++;run();
 };
 const choose=key=>{setField(key);setValue(app.draft_config.publicProfile?.contact?.[key]||'');};
 const capturedInput=inputSession.current;
 return <View>
  <Button label={open?'Hide public contact editor':'Edit public contact details'} disabled={busy}
   onPress={()=>transition(()=>{setOpen(x=>!x);choose('phone');})}/>
  {open?<View style={styles.inspectorGroup}>
   <Text accessibilityRole="header" style={styles.inspectorHeading}>Public contact details</Text>
   <Text style={styles.cardBody}>Change only the selected public detail. Review and approve in Studio; the live app stays unchanged.</Text>
   {pending?<View style={styles.recordRow}>
    <Text accessibilityLiveRegion="polite" style={styles.cardBody}>Your contact wording is not saved. Keep editing or deliberately discard it before switching.</Text>
    <Button label="Keep editing contact wording" onPress={()=>{if(current()&&pendingRef.current===pending)cancelPending();}}/>
    <Button label="Discard contact wording and continue" onPress={()=>{
     if(!current()||pendingRef.current!==pending||epoch.current!==pending.epoch)return;
     cancelPending();dirty.current=false;onDraftChange?.(false);onPreview?.(null);inputSession.current++;epoch.current++;pending.run();
    }}/>
   </View>:null}
   <View style={styles.choiceGrid}>
   {['phone','email','openingHours'].map(key=><View key={key} style={styles.choiceCell}><Button compact selected={field===key}
     label={'Edit public '+key} disabled={busy}
     onPress={()=>transition(()=>choose(key))}/></View>)}
   </View>
   <Text style={styles.workspaceMeta}>{'Editing: '+({phone:'phone number',email:'email address',openingHours:'opening hours'}[field])+' · '+(dirty.current?'unsaved wording':'loaded public detail')}</Text>
   <Field label={'Public '+field} value={value} editable={!busy} multiline={field==='openingHours'}
    keyboardType={field==='email'?'email-address':field==='phone'?'phone-pad':'default'}
    autoCapitalize={field==='openingHours'?'sentences':'none'}
    onChangeText={next=>{
     if(!current()||capturedInput!==inputSession.current)return;
     epoch.current++;dirty.current=true;cancelPending();setValue(next);onDraftChange?.(true);onPreview?.(null);
    }}/>
   <Button primary label="Preview public contact change" disabled={busy||!!pending} onPress={()=>{
    if(!current()||capturedInput!==inputSession.current||pendingRef.current){onNotice?.('The app changed. Review its current contact details.');return;}
    const plan=proposeCoordinatedAppChanges(app.draft_config,[{kind:'contact',field,value}]);
    const bound=plan.ok?bindPrivateAppProposal(plan,{businessId,app}):plan;
    if(bound?.ok&&onPreview?.(bound))onNotice?.('Contact change prepared in Studio. Compare before approving.');else onNotice?.(bound?.reason||'Review the current contact details.');
   }}/>
  </View>:null}
 </View>;
}
export {AppContactEditor};
