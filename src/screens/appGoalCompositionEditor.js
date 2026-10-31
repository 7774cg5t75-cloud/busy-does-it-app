import React from 'react';
import {Text,View} from 'react-native';
import {Card,Button,Field,Details} from '../components/ui';
import {styles} from '../theme/styles';
import {appCompositionContext,proposeLocalAppGoal,reviewAppComposition,prepareAppComposition,initialAppCompositionSelection} from '../core/appGoalComposition.mjs';
import {stableJson} from '../core/stableJson.mjs';

// Private preparation only. Existing Studio owns approval, writing, receipts,
// uncertainty and Undo. Exploring either preview never changes the saved app.
export function AppGoalCompositionEditor({ownerId,businessId,app,catalog,initialGoal='',busy=false,Surface,onPreview,onDraftChange=()=>{}}){
 const [goal,setGoal]=React.useState(initialGoal.slice(0,240)),[prepared,setPrepared]=React.useState(null),[selection,setSelection]=React.useState(null),[notice,setNotice]=React.useState(''),[side,setSide]=React.useState('proposed');
 const epoch=React.useRef(0),live=React.useRef(null),identity=React.useRef(ownerId+':'+businessId),alive=React.useRef(true);
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const context=appCompositionContext({ownerId,businessId,app,catalog});live.current={context,goal,selection};
 const stamp=stableJson(context),captured=epoch.current;
 const current=()=>alive.current&&identity.current===ownerId+':'+businessId&&stableJson(live.current.context)===stamp&&captured===epoch.current;
 if(!context.ok||identity.current!==ownerId+':'+businessId)return null;
 const stale=prepared&&prepared.stamp!==stamp;
 const preview=prepared&&!stale&&selection?prepareAppComposition({proposal:prepared.proposal,context:prepared.context,current:context,selection}):null;
 const change=fn=>{if(!current()||busy)return false;epoch.current++;fn();onDraftChange(true);return true;};
 const prepare=()=>{if(!current()||busy)return false;const candidate=proposeLocalAppGoal(context,goal);if(!candidate.ok){setNotice(candidate.reason);return false;}const review=reviewAppComposition(candidate.proposal,context,context);if(!review.ok){setNotice(review.reason);return false;}setPrepared({proposal:candidate.proposal,context,stamp,review});setSelection(initialAppCompositionSelection(review,context));setSide('proposed');setNotice('Your idea is ready to explore. Nothing has been saved.');onDraftChange(true);return true;};
 return <Card title="Tell Busy how your app should work" body="Explore a private idea using your saved business information. Keep what works, refine the screens, then review supported changes in Studio.">
  <Field label="What would you like people to see or do?" value={goal} maxLength={240} editable={!busy} onChangeText={v=>change(()=>{setGoal(v);setPrepared(null);setSelection(null);})}/>
  <Button label={stale?'Review my idea against the latest saved app':'Prepare my app idea'} disabled={busy||!goal.trim()} onPress={prepare}/>
  {stale?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>Your saved app changed. Your idea is kept, but this preview cannot replace newer work. Review it again against the latest app.</Text>:null}
  {prepared&&!stale&&selection?<>
   <Text style={styles.sectionLabel}>{prepared.review.path==='composition'?'Supported private experience':prepared.review.path==='hybrid'?'A supported starting point, with more to build':'An idea that needs further development'}</Text>
   {prepared.review.rows.map(row=><Text key={row.id} style={styles.cardBody}>{row.title+' — '+(row.status==='private-configured'?'existing private screen':row.status==='needs-setup'?'requires original feature setup':'proposed; not built')}</Text>)}
   {prepared.proposal.app.unsupported.map((s,i)=><Text key={i} style={styles.cardBody}>{s}</Text>)}
   <Text style={styles.sectionLabel}>Choose the supported screen order</Text>
   {selection.order.map((key,i)=><View key={key}>
    {Object.hasOwn(selection.labels,key)?<Field label={'Screen name: '+key.replaceAll('_',' ')} value={selection.labels[key]} maxLength={36} editable={!busy} onChangeText={v=>change(()=>setSelection(old=>({...old,labels:{...old.labels,[key]:v}})))}/>:<Text style={styles.cardBody}>{key.replaceAll('_',' ')}</Text>}
    <Button label={'Move '+(selection.labels[key]||key.replaceAll('_',' '))+' earlier'} disabled={busy||i===0} onPress={()=>change(()=>setSelection(old=>{const order=[...old.order];[order[i-1],order[i]]=[order[i],order[i-1]];return {...old,order};}))}/>
   </View>)}
   <Text style={styles.cardBody}>Other saved sections and business wording are kept. These controls do not enable new features.</Text>
   {[['serviceStyle','Information layout',[['cards','Cards'],['rows','Compact rows'],['spotlight','Featured information']]],['navigationStyle','Screen navigation',[['tabs','Tabs'],['list','List']]],['layoutDensity','Spacing',[['comfortable','Comfortable'],['compact','Compact'],['airy','Spacious']]]].map(([field,title,options])=><Details key={field} label={title}>{options.map(([value,label])=><Button key={value} label={label} selected={selection.appearance[field]===value} disabled={busy} onPress={()=>change(()=>setSelection(old=>({...old,appearance:{...old.appearance,[field]:value}})))}/>)}</Details>)}
   <Button label={side==='original'?'Show proposed app':'Compare with my saved app'} disabled={busy} onPress={()=>setSide(side==='original'?'proposed':'original')}/>
   <Text style={styles.sectionLabel}>{side==='original'?'Saved private app':'Proposed supported private app'}</Text>
   {Surface?<Surface key={ownerId+businessId+side} config={side==='original'?app.draft_config:preview?.ok?preview.nextConfig:app.draft_config} interactive={false} catalogueContextKey={businessId+':'+app.id}/>:null}
   {!preview?.ok?<Text style={styles.cardBody}>{preview?.reason||'Choose a supported private screen to refine.'}</Text>:null}
   <Details label="What will Busy change?">
    <Text style={styles.cardBody}>{preview?.explanation?.summary||'Your saved app is unchanged. Proposed bespoke features are not included in this preview.'}</Text>
    {preview?.changes?.map((s,i)=><Text key={i} style={styles.cardBody}>{s}</Text>)}
    <Details label="View the evidence"><Text selectable style={styles.cardBody}>{'Source: saved private app, revision '+context.scope.sourceRevision+'. Checked against this current configuration. No server save, live customer task, standalone build or publication has been verified here.'}</Text></Details>
   </Details>
   <Button label="Review these supported changes in Studio" disabled={busy||!preview?.ok} onPress={()=>{if(!current()||busy||stale)return false;const fresh=prepareAppComposition({proposal:prepared.proposal,context:prepared.context,current:live.current.context,selection:live.current.selection});if(!fresh.ok){setNotice(fresh.reason);return false;}const accepted=onPreview?.(fresh)===true;setNotice(accepted?'Prepared in Studio. Compare, then approve or discard there. Nothing has been saved.':'The Studio review could not be opened. Your idea is kept.');return accepted;}}/>
  </>:null}
  {prepared?<Button label="Discard this unsaved idea" disabled={busy} onPress={()=>{if(!current()||busy)return false;epoch.current++;setPrepared(null);setSelection(null);setNotice('Saved app kept. Unsaved idea discarded.');onDraftChange(false);return true;}}/>:null}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  <Text style={styles.cardBody}>This preparation uses supported local goal recognition. Live AI, new custom code, customer actions and app publication remain unavailable.</Text>
 </Card>;
}
