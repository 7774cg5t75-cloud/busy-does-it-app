import React from 'react';
import {Text,View} from 'react-native';
import {Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {COLLECTION_FIELDS,validPublicCollection} from '../core/appPublicCollections.mjs';
import {proposeCoordinatedAppChanges} from '../core/appCoordinatedStudio.mjs';
function AppPublicCollectionEditor({config,onPreview,onNotice,busy,suggestions=[],onDraftChange}){
 const [field,setField]=React.useState(null),[index,setIndex]=React.useState(-1);
 const [title,setTitle]=React.useState(''),[body,setBody]=React.useState(''),[permission,setPermission]=React.useState(false);
 const [pending,updatePending]=React.useState(null),pendingRef=React.useRef(null),epoch=React.useRef(0),dirty=React.useRef(false);
 const stamp=JSON.stringify([config?.publicProfile?.faqs||[],config?.publicProfile?.testimonials||[]]);
 const [source,setSource]=React.useState({config,stamp});
 const live=React.useRef(null),alive=React.useRef(true);live.current={config,busy,stamp};
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;pendingRef.current=null;};},[]);
 const current=()=>alive.current&&live.current.config===config&&!live.current.busy&&JSON.stringify([config?.publicProfile?.faqs||[],config?.publicProfile?.testimonials||[]])===stamp&&live.current.stamp===stamp;
 const setPending=value=>{pendingRef.current=value;updatePending(value);};
 const clearPreview=()=>onPreview?.(null);
 const change=setter=>value=>{if(!current())return false;epoch.current++;dirty.current=true;setter(value);setPermission(false);setPending(null);onDraftChange?.(true);clearPreview();return true;};
 const load=(nextField,nextIndex=-1,question='')=>{
  if(!current())return false;const typing=epoch.current;
  const run=()=>{
   if(!current()||typing!==epoch.current)return false;
   const row=nextIndex>=0?config.publicProfile?.[nextField]?.[nextIndex]:null;
   epoch.current++;dirty.current=false;setField(nextField);setIndex(nextIndex);setTitle(question||row?.[COLLECTION_FIELDS[nextField][0]]||'');setBody(row?.[COLLECTION_FIELDS[nextField][1]]||'');setPermission(false);setSource({config,stamp});setPending(null);onDraftChange?.(false);clearPreview();return true;
  };
  if(dirty.current){setPending({run,epoch:typing,config,stamp});return false;}return run();
 };
 const stored=field?config.publicProfile?.[field]||[]:[],valid=!!field&&validPublicCollection(field,stored),rows=valid?stored:[];
 const stale=source.config!==config||source.stamp!==stamp,captured=epoch.current;
 const prepare=value=>{
  if(!current()||stale||captured!==epoch.current||pendingRef.current||!valid){onNotice?.('The public information changed or needs review. Your wording is kept; reload the current entry deliberately.');return false;}
  const plan=proposeCoordinatedAppChanges(config,[{kind:'public_collection',field,value}]);
  const accepted=plan.ok&&onPreview?.(plan);onNotice?.(accepted?'Compare these private entries in Studio before approving.':plan.reason||'Studio cannot accept this preview yet. Review recovery and the current app.');return !!accepted;
 };
 return <View>
  {stale?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>The public information changed. Your words are kept. Deliberately reload the current entry before another preview.</Text>:null}
  {pending?<View><Text style={styles.cardBody}>Your public-information wording is not saved.</Text>
   <Button label="Keep editing public wording" onPress={()=>{if(current()&&pendingRef.current===pending)setPending(null);}}/>
   <Button label="Discard public wording and continue" onPress={()=>{if(!current()||pendingRef.current!==pending||pending.config!==config||pending.stamp!==stamp||pending.epoch!==epoch.current)return false;setPending(null);return pending.run();}}/>
  </View>:null}
  {suggestions.slice(0,3).map(suggestion=><View key={suggestion.id}>
   <Text style={styles.cardBody}>{suggestion.reason}</Text>
   <Button label={'Prepare an answer: '+suggestion.question} disabled={busy} onPress={()=>load('faqs',-1,suggestion.question)}/>
  </View>)}
  {Object.keys(COLLECTION_FIELDS).map(key=><Button key={key} label={key==='faqs'?'Edit customer questions and answers':'Edit permissioned testimonials'} disabled={busy} onPress={()=>load(key)}/>)}
  {field?<>
   <Text style={styles.cardBody}>{field==='testimonials'?'Use genuine testimonials only, with permission to display the wording and attribution. BUSY does not verify the endorsement.':'Answer common questions using your actual business policies. These entries stay private until approved and published.'}</Text>
   {!valid?<Text style={styles.cardBody}>This saved collection is unsupported or ambiguous. It was not replaced. Use a compatible version before editing it.</Text>:null}
   {rows.map((row,i)=><Button key={row.id||i} label={row[COLLECTION_FIELDS[field][0]]} disabled={busy} onPress={()=>load(field,i)}/>)}
   <Button label="Add another entry" disabled={busy} onPress={()=>load(field)}/>
   <Field editable={!busy} label={field==='faqs'?'Question':'Attribution'} value={title} onChangeText={change(setTitle)}/>
   <Field editable={!busy} label={field==='faqs'?'Answer':'Genuine testimonial wording'} value={body} onChangeText={change(setBody)}/>
   {field==='testimonials'?<Button label={(permission?'✓ ':'')+'I have permission to display this genuine testimonial'} disabled={busy} onPress={()=>{if(!current())return false;epoch.current++;setPermission(v=>!v);clearPreview();return true;}}/>:null}
   <Button label="Cancel public wording" disabled={busy} onPress={()=>{if(!current()||captured!==epoch.current)return false;epoch.current++;dirty.current=false;setTitle('');setBody('');setIndex(-1);setPermission(false);setSource({config,stamp});setPending(null);onDraftChange?.(false);clearPreview();return true;}}/>
   <Button label="Preview public information entry" disabled={busy||stale||!valid||!!pending||field==='testimonials'&&!permission} onPress={()=>{
    if(field==='testimonials'&&!permission)return false;
    const value=rows.map(row=>({...row})),keys=COLLECTION_FIELDS[field],row={...(index>=0?value[index]:{}),[keys[0]]:title,[keys[1]]:body};if(index<0)value.push(row);else value[index]=row;return prepare(value);
   }}/>
   {index>=0?<>
    <Button label="Preview removal of this entry" disabled={busy||stale||!!pending} onPress={()=>prepare(rows.filter((_,i)=>i!==index))}/>
    {[-1,1].map(delta=><Button key={delta} label={delta<0?'Preview earlier entry':'Preview later entry'} disabled={busy||stale||!!pending||index+delta<0||index+delta>=rows.length} onPress={()=>{const value=[...rows];[value[index],value[index+delta]]=[value[index+delta],value[index]];return prepare(value);}}/>) }
   </>:null}
  </>:null}
 </View>;
}
export {AppPublicCollectionEditor};
