import React from 'react';
import {Text,View} from 'react-native';
import {Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {COLLECTION_FIELDS,validPublicCollection} from '../core/appPublicCollections.mjs';
import {proposeCoordinatedAppChanges} from '../core/appCoordinatedStudio.mjs';
function AppPublicCollectionEditor({config,onPreview,onNotice,busy,suggestions=[]}){
 const [field,setField]=React.useState(null),[index,setIndex]=React.useState(-1);
 const [title,setTitle]=React.useState(''),[body,setBody]=React.useState(''),[permission,setPermission]=React.useState(false);
 const live=React.useRef(config),alive=React.useRef(true);live.current=config;
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const stored=field?config.publicProfile?.[field]||[]:[];
 const rows=field&&validPublicCollection(field,stored)?stored:[];
 const prepare=value=>{
  if(!alive.current||live.current!==config){onNotice('The app changed. Reopen the current public information.');return;}
  const plan=proposeCoordinatedAppChanges(config,[{kind:'public_collection',field,value}]);
  const accepted=plan.ok&&onPreview(plan);onNotice(accepted?'Compare these private entries in Studio before approving.':plan.reason||'Studio cannot accept this preview yet. Review recovery and the current app.');
 };
 return <View>
  {suggestions.slice(0,3).map(suggestion=><View key={suggestion.id}>
   <Text style={styles.cardBody}>{suggestion.reason}</Text>
   <Button label={'Prepare an answer: '+suggestion.question} disabled={busy} onPress={()=>{
    if(!alive.current||live.current!==config){onNotice('The app changed. Review the current information first.');return;}
    setField('faqs');setIndex(-1);setTitle(suggestion.question);setBody('');setPermission(false);
   }}/>
  </View>)}
  {Object.keys(COLLECTION_FIELDS).map(key=><Button key={key} label={key==='faqs'?'Edit customer questions and answers':'Edit permissioned testimonials'} disabled={busy}
   onPress={()=>{setField(key);setIndex(-1);setTitle('');setBody('');setPermission(false);}}/>)}
  {field?<>
   <Text style={styles.cardBody}>{field==='testimonials'?'Use genuine testimonials only, with permission to display the wording and attribution. BUSY does not verify the endorsement.':'Answer common questions using your actual business policies. These entries stay private until approved and published.'}</Text>
   {rows.map((row,i)=><Button key={row.id||i} label={row[COLLECTION_FIELDS[field][0]]} onPress={()=>{setIndex(i);setTitle(row[COLLECTION_FIELDS[field][0]]);setBody(row[COLLECTION_FIELDS[field][1]]);setPermission(false);}}/>)}
   <Button label="Add another entry" onPress={()=>{setIndex(-1);setTitle('');setBody('');setPermission(false);}}/>
   <Field label={field==='faqs'?'Question':'Attribution'} value={title} onChangeText={v=>{setTitle(v);setPermission(false);}}/>
   <Field label={field==='faqs'?'Answer':'Genuine testimonial wording'} value={body} onChangeText={v=>{setBody(v);setPermission(false);}}/>
   {field==='testimonials'?<Button label={(permission?'✓ ':'')+'I have permission to display this genuine testimonial'} onPress={()=>setPermission(v=>!v)}/>:null}
   <Button label="Preview public information entry" disabled={busy||field==='testimonials'&&!permission} onPress={()=>{
    const value=rows.map(row=>({...row})),keys=COLLECTION_FIELDS[field];
    const row={...(index>=0?value[index]:{}),[keys[0]]:title,[keys[1]]:body};if(index<0)value.push(row);else value[index]=row;prepare(value);
   }}/>
   {index>=0?<>
    <Button label="Preview removal of this entry" disabled={busy} onPress={()=>prepare(rows.filter((_,i)=>i!==index))}/>
    {[-1,1].map(delta=><Button key={delta} label={delta<0?'Preview earlier entry':'Preview later entry'} disabled={busy||index+delta<0||index+delta>=rows.length} onPress={()=>{const value=[...rows];[value[index],value[index+delta]]=[value[index+delta],value[index]];prepare(value);}}/>)}
   </>:null}
  </>:null}
 </View>;
}
export {AppPublicCollectionEditor};
