import {reopenPrivateAppProject} from '../core/privateAppProject.mjs';
import {AppEnquiryRequestPreview} from './appEnquiryRequestPreview';
import {prepareRecordAppComposition,suggestAppRecordBlocks,appRecordReview,currentAppRecordReview,refineRecordAppChoice} from '../core/appRecordComposition.mjs';
import React from 'react';
import {Text,View} from 'react-native';
import {Card,Button,Field,Details} from '../components/ui';
import {styles} from '../theme/styles';
import {appCompositionContext,proposeLocalAppGoal,reviewAppComposition,prepareAppComposition,initialAppCompositionSelection} from '../core/appGoalComposition.mjs';
import {stableJson} from '../core/stableJson.mjs';

// Private preparation only. Existing Studio owns approval, writing, receipts,
// uncertainty and Undo. Exploring either preview never changes the saved app.
export function AppGoalCompositionEditor({ownerId,businessId,app,catalog,initialGoal='',busy=false,Surface,recordsFeed=null,onRefreshRecords,onPreview,onSaveProject,onUndoProject,onProjectObserved,onDraftChange=()=>{}}){
 const [goal,setGoal]=React.useState(initialGoal.slice(0,240)),[prepared,setPrepared]=React.useState(null),[selection,setSelection]=React.useState(null),[notice,setNotice]=React.useState(''),[side,setSide]=React.useState('proposed');
 const [blocks,setBlocks]=React.useState([]),[recordBasis,setRecordBasis]=React.useState(null),[reading,setReading]=React.useState(false),[refinement,setRefinement]=React.useState(''),[saving,setSaving]=React.useState(false),[uncertain,setUncertain]=React.useState(false);
 const epoch=React.useRef(0),live=React.useRef(null),identity=React.useRef(ownerId+':'+businessId),alive=React.useRef(true);
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const context=appCompositionContext({ownerId,businessId,app,catalog});live.current={context,goal,selection,recordsFeed,blocks};
 const stamp=stableJson(context),captured=epoch.current;
 const current=()=>alive.current&&identity.current===ownerId+':'+businessId&&stableJson(live.current.context)===stamp&&captured===epoch.current;
 if(!context.ok||identity.current!==ownerId+':'+businessId)return null;
 const stale=prepared&&prepared.stamp!==stamp;
 const preview=prepared&&!stale&&selection?(blocks.length?prepareRecordAppComposition({proposal:prepared.proposal,context:prepared.context,current:context,selection,feed:recordsFeed,choices:blocks,expected:recordBasis}):prepareAppComposition({proposal:prepared.proposal,context:prepared.context,current:context,selection})):null;
 const change=fn=>{if(!current()||busy||reading||saving)return false;epoch.current++;fn();onDraftChange(true);return true;};
 const prepare=()=>{if(!current()||busy||reading)return false;const candidate=proposeLocalAppGoal(context,goal);if(!candidate.ok){setNotice(candidate.reason);return false;}const review=reviewAppComposition(candidate.proposal,context,context);if(!review.ok){setNotice(review.reason);return false;}const choices=suggestAppRecordBlocks(goal,recordsFeed,businessId).map(c=>app.draft_config.contentLayout?.find(b=>b.kind===c.kind)||c);const basis=choices.length?appRecordReview(recordsFeed,businessId,choices.map(c=>c.kind)):null;setBlocks(choices);setRecordBasis(basis);setPrepared({proposal:candidate.proposal,context,stamp,review});setSelection(initialAppCompositionSelection(review,context));setSide('proposed');setNotice('Your idea is ready to explore. Nothing has been saved.');onDraftChange(true);return true;};
 return <Card title="Tell Busy how your app should work" body="Explore a private idea using your saved business information. Keep what works, refine the screens, then review supported changes in Studio.">
  <Field label="What would you like people to see or do?" value={goal} maxLength={240} editable={!busy&&!saving} onChangeText={v=>change(()=>{setGoal(v);setPrepared(null);setSelection(null);})}/>
  {typeof onRefreshRecords==='function'?<Button label={reading?'Loading approved listings…':'Load approved products and events'} disabled={busy||reading||saving} onPress={async()=>{if(!current()||busy||reading)return false;const token=++epoch.current;setReading(true);try{const feed=await onRefreshRecords();if(!alive.current||token!==epoch.current||stableJson(live.current.context)!==stamp)return false;setNotice(feed?.ok?'Approved listings loaded. Prepare your idea to choose their layout.':'Approved listings are unavailable. Your idea is kept.');return feed?.ok===true;}catch{if(alive.current&&token===epoch.current)setNotice('Approved listings could not be loaded. No record was created or changed.');return false;}finally{if(alive.current&&token===epoch.current)setReading(false);}}}/>:null}
  {app.private_project_spec?<Details label="Your saved private app idea">
   <Text style={styles.cardBody}>{app.private_project_spec.app?.purpose}</Text>
   <Text style={styles.cardBody}>This is a saved description, not implemented custom screens or a live app.</Text>
   <Button label="Continue my saved idea" disabled={busy||saving} onPress={()=>{if(!current()||busy||saving)return false;const opened=reopenPrivateAppProject({ownerId,businessId,app,catalog});if(!opened.ok){setNotice(opened.reason);return false;}const review=reviewAppComposition(opened.proposal,context,context);if(!review.ok){setNotice(review.reason);return false;}setGoal(opened.proposal.app.purpose);setPrepared({proposal:opened.proposal,context,stamp,review});setSelection(initialAppCompositionSelection(review,context));setBlocks([]);setRecordBasis(null);onDraftChange(true);setNotice('Saved wording reopened for a new review. No custom feature was activated.');return true;}}/>
  </Details>:null}
  {typeof onUndoProject==='function'&&app.private_project_history?.length?<Button label="Undo last saved private idea" disabled={busy||saving||uncertain} onPress={async()=>{if(!current()||busy||saving)return false;setSaving(true);try{const result=await onUndoProject({app,isCurrent:current});if(current()){if(result.uncertain)setUncertain(true);setNotice(result.ok?'Earlier private idea independently reopened. App screens are unchanged.':result.reason);if(result.status)onProjectObserved?.(result.status);}return result.ok;}finally{if(alive.current)setSaving(false);}}}/>:null}
  <Button label={stale?'Review my idea against the latest saved app':'Prepare my app idea'} disabled={busy||reading||!goal.trim()} onPress={prepare}/>
  {stale?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>Your saved app changed. Your idea is kept, but this preview cannot replace newer work. Review it again against the latest app.</Text>:null}
  {prepared&&!stale&&selection?<>
   <Text style={styles.sectionLabel}>{prepared.review.path==='composition'?'Supported private experience':prepared.review.path==='hybrid'?'A supported starting point, with more to build':'An idea that needs further development'}</Text>
   {prepared.review.rows.map(row=><Text key={row.id} style={styles.cardBody}>{row.title+' — '+(blocks.some(b=>b.kind===(row.id==='catalogue'?'product':row.id==='events'?'event':null))?'approved collection in the information screen':row.status==='private-configured'?'existing private screen':row.status==='needs-setup'?'requires original feature setup':'proposed; not built')}</Text>)}
   {prepared.proposal.app.unsupported.map((s,i)=><Text key={i} style={styles.cardBody}>{s}</Text>)}
   {blocks.length?<>
    <Text style={styles.sectionLabel}>Your approved collections</Text>
    <Text style={styles.cardBody}>Browse real approved listings, categories, prices and dates below. Layout choices do not copy or publish record facts.</Text>
    {blocks.map((block,i)=><View key={block.kind}>
     <Text style={styles.cardBody}>{block.title}</Text>
     {['cards','rows'].map(layout=><Button key={layout} label={block.title+': '+layout} selected={block.layout===layout} disabled={busy||reading||saving} onPress={()=>change(()=>setBlocks(old=>old.map(b=>b.kind===block.kind?{...b,layout}:b)))}/>)}
     <Button label={'Move '+block.title+' above other collections'} disabled={busy||reading||i===0} onPress={()=>change(()=>setBlocks(old=>[old[i],...old.filter((_,n)=>n!==i)]))}/>
    </View>)}
    {!currentAppRecordReview(recordBasis,recordsFeed,businessId)?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>Approved listings changed or expired. Load them again and prepare a fresh review. Your saved app is kept.</Text>:null}
   </>:null}
   <Field label="What would you like to refine?" value={refinement} maxLength={240} editable={!busy&&!reading} onChangeText={setRefinement}/>
   <Button label="Prepare this refinement" disabled={busy||reading||saving} onPress={()=>{const next=refineRecordAppChoice(refinement,{selection,choices:blocks,config:app.draft_config});if(!next.ok){setNotice(next.reason);return false;}if(next.alreadyConfigured){setNotice(next.nextAction);return true;}return change(()=>{setSelection(next.selection);setBlocks(next.choices);setNotice('Refinement prepared. Compare it before Studio review.');});}}/>
   <Text style={styles.sectionLabel}>Choose the supported screen order</Text>
   {selection.order.map((key,i)=><View key={key}>
    {Object.hasOwn(selection.labels,key)?<Field label={'Screen name: '+key.replaceAll('_',' ')} value={selection.labels[key]} maxLength={36} editable={!busy&&!saving} onChangeText={v=>change(()=>setSelection(old=>({...old,labels:{...old.labels,[key]:v}})))}/>:<Text style={styles.cardBody}>{key.replaceAll('_',' ')}</Text>}
    <Button label={'Move '+(selection.labels[key]||key.replaceAll('_',' '))+' earlier'} disabled={busy||i===0} onPress={()=>change(()=>setSelection(old=>{const order=[...old.order];[order[i-1],order[i]]=[order[i],order[i-1]];return {...old,order};}))}/>
   </View>)}
   <Text style={styles.cardBody}>Other saved sections and business wording are kept. These controls do not enable new features.</Text>
   {[['serviceStyle','Information layout',[['cards','Cards'],['rows','Compact rows'],['spotlight','Featured information']]],['navigationStyle','Screen navigation',[['tabs','Tabs'],['list','List']]],['layoutDensity','Spacing',[['comfortable','Comfortable'],['compact','Compact'],['airy','Spacious']]]].map(([field,title,options])=><Details key={field} label={title}>{options.map(([value,label])=><Button key={value} label={label} selected={selection.appearance[field]===value} disabled={busy||saving} onPress={()=>change(()=>setSelection(old=>({...old,appearance:{...old.appearance,[field]:value}})))}/>)}</Details>)}
   <Button label={side==='original'?'Show proposed app':'Compare with my saved app'} disabled={busy||saving} onPress={()=>setSide(side==='original'?'proposed':'original')}/>
   <Text style={styles.sectionLabel}>{side==='original'?'Saved private app':'Proposed supported private app'}</Text>
   {Surface?<Surface key={ownerId+businessId+side} config={side==='original'?app.draft_config:preview?.ok?preview.nextConfig:app.draft_config} businessContent={recordsFeed&&(!blocks.length||currentAppRecordReview(recordBasis,recordsFeed,businessId))?recordsFeed:null} interactive={false} catalogueContextKey={businessId+':'+app.id}/>:null}
   {Surface?<AppEnquiryRequestPreview key={ownerId+businessId+app.id} ownerId={ownerId} businessId={businessId} app={app} catalog={catalog} config={preview?.ok?preview.nextConfig:app.draft_config} feed={recordsFeed} Surface={Surface}/>:null}
   {!preview?.ok?<Text style={styles.cardBody}>{preview?.reason||'Choose a supported private screen to refine.'}</Text>:null}
   <Details label="What will Busy change?">
    <Text style={styles.cardBody}>{preview?.explanation?.summary||'Your saved app is unchanged. Proposed bespoke features are not included in this preview.'}</Text>
    {preview?.changes?.map((s,i)=><Text key={i} style={styles.cardBody}>{s}</Text>)}
    <Details label="View the evidence"><Text selectable style={styles.cardBody}>{'Source: saved private app, revision '+context.scope.sourceRevision+'. Checked against this current configuration. No server save, live customer task, standalone build or publication has been verified here.'}</Text></Details>
   </Details>
   {typeof onSaveProject==='function'?<Details label="Keep this private app idea">
    <Text style={styles.cardBody}>Save the proposed purpose, screens and requirements for this account. This does not build custom features or change customer-facing screens. Review first, then confirm.</Text>
    <Button label="Save this reviewed private idea" disabled={busy||saving||stale||uncertain} onPress={async()=>{if(!current()||busy||saving||stale)return false;const proposal=prepared.proposal;setSaving(true);try{const result=await onSaveProject({app,proposal,isCurrent:current});if(current()){if(result.uncertain)setUncertain(true);setNotice(result.ok?'Private idea independently saved and reopened. Custom features remain proposals.':result.reason);if(result.ok)onDraftChange(false);if(result.status)onProjectObserved?.(result.status);}return result.ok;}finally{if(alive.current)setSaving(false);}}}/>
   </Details>:null}
   <Button label="Review these supported changes in Studio" disabled={busy||!preview?.ok} onPress={()=>{if(!current()||busy||stale)return false;const fresh=blocks.length?prepareRecordAppComposition({proposal:prepared.proposal,context:prepared.context,current:live.current.context,selection:live.current.selection,feed:live.current.recordsFeed,choices:live.current.blocks,expected:recordBasis}):prepareAppComposition({proposal:prepared.proposal,context:prepared.context,current:live.current.context,selection:live.current.selection});if(!fresh.ok){setNotice(fresh.reason);return false;}const accepted=onPreview?.(fresh)===true;setNotice(accepted?'Prepared in Studio. Compare, then approve or discard there. Nothing has been saved.':'The Studio review could not be opened. Your idea is kept.');return accepted;}}/>
  </>:null}
  {prepared?<Button label="Discard this unsaved idea" disabled={busy||reading||saving} onPress={()=>{if(!current()||busy||reading||saving)return false;epoch.current++;setPrepared(null);setSelection(null);setNotice('Saved app kept. Unsaved idea discarded.');onPreview?.(null);onDraftChange(false);return true;}}/>:null}
  {uncertain?<Text style={styles.cardBody}>Save confirmation is uncertain. Your idea is kept here. Reopen the original saved app before another deliberate save; nothing will retry.</Text>:null}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  <Text style={styles.cardBody}>This preparation uses supported local goal recognition. Live AI, new custom code, customer actions and app publication remain unavailable.</Text>
 </Card>;
}
