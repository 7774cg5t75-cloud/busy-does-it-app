import React from 'react';
import {View,Text} from 'react-native';
import {Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {validatePrivateAppServices} from '../core/appServiceCollection.mjs';
import {proposeCoordinatedAppChanges} from '../core/appCoordinatedStudio.mjs';
// Owns unsaved form presentation only. Original Studio owns review/save/Undo.
function AppServiceEditor({config,revision,busy=false,onPreview,onNotice,onDraftChange}){
 const epoch=React.useRef(0),dirty=React.useRef(false),alive=React.useRef(true);
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const [pending,updatePending]=React.useState(null),pendingRef=React.useRef(null);
 const setPending=value=>{pendingRef.current=value;updatePending(value);};
 const rows=config?.publicProfile?.services||[];
 const stamp=JSON.stringify([revision,rows]);
 const live=React.useRef(null);live.current={stamp,config,rows,busy};
 const [source,setSource]=React.useState(stamp),[selected,setSelected]=React.useState(null);
 const [name,setName]=React.useState(''),[description,setDescription]=React.useState('');
 const [category,setCategory]=React.useState(''),[price,setPrice]=React.useState(''),[duration,setDuration]=React.useState('');
 const [query,setQuery]=React.useState('');
 const valid=validatePrivateAppServices(rows),stale=source!==stamp;
 const clearPreview=()=>onPreview?.(null);
 const current=()=>alive.current&&live.current.config===config&&!live.current.busy&&JSON.stringify([revision,config?.publicProfile?.services||[]])===stamp&&live.current.stamp===stamp;
 const change=setter=>value=>{if(!current())return;epoch.current++;dirty.current=true;onDraftChange?.(true);setter(value);setPending(null);clearPreview();};
 const pick=(row=null,discard=false)=>{
  if(!current())return;
  if(dirty.current&&!discard){setPending({row,rowStamp:JSON.stringify(row),epoch:epoch.current,config,stamp});return;}
  epoch.current++;dirty.current=false;onDraftChange?.(false);setPending(null);
  setSource(live.current.stamp);setSelected(row?{id:row.id||'',name:row.name}:null);
  setName(row?.name||'');setDescription(row?.description||'');setCategory(row?.category||'');setPrice(row?.priceLabel||'');setDuration(row?.durationLabel||'');clearPreview();
 };
 const locate=()=>{
  if(!selected)return -1;
  const matches=live.current.rows.map((row,index)=>(selected.id?row.id===selected.id:row.name===selected.name)?index:-1).filter(index=>index>=0);
  return matches.length===1?matches[0]:-2;
 };
 const captured=epoch.current;
 const submit=kind=>{
  if(captured!==epoch.current||!current()||pendingRef.current)return;
  if(live.current.busy||source!==live.current.stamp){onNotice?.('The service list changed. Review the current version before preparing this edit.');return;}
  const index=locate();if(index===-2){onNotice?.('This service was removed or became ambiguous. Choose a current service.');return;}
  let value=live.current.rows.map(row=>({...row}));
  if(kind==='save'){
   let id=index<0?'owner_service_'+Date.now().toString(36):value[index].id;
   if(index<0){const stem=id;let n=2;while(value.some(row=>row.id===id))id=stem+'_'+n++;}
   const row={...(id?{id}:{}),name,description,...category.trim()?{category}:{},...price.trim()?{priceLabel:price}:{},...duration.trim()?{durationLabel:duration}:{}};
   if(index<0)value.push(row);else value[index]=row;
  }else if(index<0)return;
  else if(kind==='remove')value.splice(index,1);
  else{
   const to=index+(kind==='up'?-1:1);if(to<0||to>=value.length){onNotice?.('The service is already at that end of the list.');return;}
   [value[index],value[to]]=[value[to],value[index]];
  }
  const plan=proposeCoordinatedAppChanges(live.current.config,[{kind:'services',value}]);
  onPreview?.(plan.ok?plan:null);onNotice?.(plan.ok?'Review the complete private service list before saving. Your live app is unchanged.':plan.reason);
 };
 const rebase=()=>{
  if(!current())return;
  const index=locate();if(index===-2){onNotice?.('The selected service is no longer available. Choose a current service or add a new one.');return;}
  epoch.current++;setPending(null);setSource(live.current.stamp);clearPreview();onNotice?.('Current service list reviewed. Your typed wording is retained for a fresh preview.');
 };
 if(!valid.ok)return <Text accessibilityLiveRegion="polite" style={styles.cardBody}>{valid.reason}</Text>;
 return <View style={styles.inspectorGroup}>
  <Text style={styles.sectionLabel}>Edit individual services</Text>
  <Text style={styles.cardBody}>Prepare changes to the private service list, then review and approve in Studio. Nothing is published here.</Text>
  {stale?<View>
   <Text accessibilityLiveRegion="polite" style={styles.cardBody}>The service list changed. Your typed text is kept. Compare the current services below before continuing.</Text>
   {selected&&locate()>=0?<Text style={styles.cardBody}>{'Current saved service: '+[rows[locate()].name,rows[locate()].description,rows[locate()].category,rows[locate()].priceLabel,rows[locate()].durationLabel].filter(Boolean).join(' • ')}</Text>:null}
   <Button label="I reviewed current services — keep my text" disabled={busy} onPress={rebase}/>
  </View>:null}
  {rows.length>4?<Field label="Find a service to edit" value={query} onChangeText={setQuery}/>:null}
  {pending?<View>
   <Text style={styles.cardBody}>Your service wording is not saved.</Text>
   <Button label="Keep editing service wording" onPress={()=>{if(current()&&pendingRef.current===pending)setPending(null);}}/>
   <Button label="Discard service wording and continue" onPress={()=>{if(current()&&pendingRef.current===pending&&pending.config===live.current.config&&pending.stamp===stamp&&pending.epoch===epoch.current&&JSON.stringify(pending.row)===pending.rowStamp&&(!pending.row||live.current.rows.includes(pending.row))){setPending(null);pick(pending.row,true);}}}/>
  </View>:null}
  <Button label="Cancel service wording" disabled={busy} onPress={()=>{if(captured===epoch.current&&live.current.config===config)pick(null,true);}}/>
  <Button label="Add a new service" disabled={busy} onPress={()=>pick()}/>
  <View style={styles.choiceGrid}>
  {rows.filter(row=>(row.name+' '+(row.category||'')).toLocaleLowerCase('en').includes(query.trim().toLocaleLowerCase('en'))).map((row,index)=><View key={row.id||row.name||index} style={styles.choiceCell}><Button compact selected={!!selected&&(selected.id?selected.id===row.id:selected.name===row.name)}
   label={'Edit '+row.name} disabled={busy} onPress={()=>pick(row)}/></View>)}
  </View>
  <Field editable={!busy} label="Service name" value={name} onChangeText={change(setName)}/>
  <Field multiline editable={!busy} label="Service description" value={description} onChangeText={change(setDescription)}/>
  <Field editable={!busy} label="Service category (optional)" value={category} onChangeText={change(setCategory)}/>
  <Field editable={!busy} label="Owner-approved price wording (optional)" value={price} onChangeText={change(setPrice)}/>
  <Field editable={!busy} label="Typical duration wording (optional)" value={duration} onChangeText={change(setDuration)}/>
  <Text style={styles.cardBody}>These are public information labels, not payment, reserved appointments or promised availability.</Text>
  <Button primary label={selected?'Preview edited service':'Preview new service'} disabled={busy||stale||!name.trim()} onPress={()=>submit('save')}/>
  {selected?<View>
   <Button label="Preview: Move this service earlier" disabled={busy||stale} onPress={()=>submit('up')}/>
   <Button label="Preview: Move this service later" disabled={busy||stale} onPress={()=>submit('down')}/>
   <Button label="Preview removal of this service" disabled={busy||stale} onPress={()=>submit('remove')}/>
  </View>:null}
 </View>;
}
export {AppServiceEditor};
