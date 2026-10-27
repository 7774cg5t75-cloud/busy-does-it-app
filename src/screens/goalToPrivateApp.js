import React from 'react';
import {Text} from 'react-native';
import {Card,Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {prepareGoalToPrivateApp} from '../core/goalToPrivateApp.mjs';
import {stableJson} from '../core/stableJson.mjs';
export function GoalToPrivateApp({ownerId,businessId,app,profile,catalog,initialGoal='',onCreate,onDraftChange=()=>{},busy}){
 const [goal,setGoal]=React.useState(initialGoal),[selected,setSelected]=React.useState([]),[review,setReview]=React.useState(null),[notice,setNotice]=React.useState(''),[working,setWorking]=React.useState(false),[uncertain,setUncertain]=React.useState(false);
 const live=React.useRef(null),epoch=React.useRef(0),alive=React.useRef(true),initial=React.useRef([ownerId,businessId]);React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const stamp=stableJson({ownerId,businessId,app,profile,catalog});live.current={stamp};const current=()=>alive.current&&live.current.stamp===stamp;
 if(app||!ownerId||!businessId||initial.current[0]!==ownerId||initial.current[1]!==businessId)return null;
 const captured=epoch.current;
 const edit=fn=>{if(!current()||working||uncertain)return;epoch.current++;setReview(null);fn();onDraftChange(true);};
 return <Card title="Tell Busy what your new app should do" body="Choose your approved services, then review the customer experience before creating a private app. Nothing is published.">
  <Field label="What do you want customers to do in your new app?" value={goal} maxLength={600} onChangeText={v=>edit(()=>setGoal(v))}/>
  <Text style={styles.cardBody}>Here are your approved services. Choose up to six to start; none are included without your choice.</Text>
  {(profile?.services||[]).map((r,i)=><Button key={r.id||i} label={(selected.includes(r.id)?'✓ ':'')+'Include in my new app: '+r.name} disabled={working||uncertain||!!busy} onPress={()=>edit(()=>setSelected(selected.includes(r.id)?selected.filter(id=>id!==r.id):[...selected,r.id]))}/>)}
  <Button label="Prepare my new app for review" disabled={working||uncertain||!!busy} onPress={()=>{if(!current()||captured!==epoch.current)return false;const p=prepareGoalToPrivateApp({ownerId,businessId,app,profile,catalog,goal,selectedIds:selected});setReview(p.ok?{value:p,stamp,epoch:epoch.current}:null);setNotice(p.ok?'Review the services and customer actions below.':p.reason);return p.ok;}}/>
  {review?.stamp===stamp?<>
   <Text style={styles.cardBody}>{profile.businessName+' — '+review.value.profileDraft.services.map(r=>r.name).join(', ')}</Text>
   {review.value.plan.modules.filter(r=>r.enabled).map(r=><Text key={r.key} style={styles.cardBody}>{r.reason}</Text>)}
   <Text style={styles.cardBody}>Busy creates the private app first, then applies your reviewed configuration. These are separate saves. You can refine its words and answers in the existing editor.</Text>
   <Button label="Approve and create this private app" disabled={working||uncertain||!!busy} onPress={async()=>{if(!current()||review.epoch!==epoch.current||working||uncertain)return false;setWorking(true);try{const result=await onCreate?.(review.value);if(!current())return false;setNotice(result?.ok?'Your private app was independently reopened. Review its customer preview and edit it below.':result?.reason||'The result is unknown. Inspect your current app before another request.');if(!result?.ok)setUncertain(true);else onDraftChange(false);setReview(null);return result?.ok===true;}finally{if(current())setWorking(false);}}}/>
  </>:null}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
 </Card>;
}
