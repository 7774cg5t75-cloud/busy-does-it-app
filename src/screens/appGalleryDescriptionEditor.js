import React from 'react';
import {Text,View} from 'react-native';
import {Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {proposeCoordinatedAppChanges} from '../core/appCoordinatedStudio.mjs';

// Local wording only; the original Studio remains the review/save authority.
export function AppGalleryDescriptionEditor({config,revision,busy,onDraftChange,onPreview,onNotice}){
 const [number,setNumber]=React.useState('1'),[alt,setAlt]=React.useState(''),[caption,setCaption]=React.useState('');
 const [pending,setPending]=React.useState(null);
 const [source,setSource]=React.useState(config),[selected,setSelected]=React.useState(null);
 const live=React.useRef(null),epoch=React.useRef(0),dirty=React.useRef(false);
 live.current={config,revision,number,alt,caption,busy};
 const current=()=>live.current.config===config&&live.current.revision===revision&&!live.current.busy;
 const change=setter=>value=>{if(!current())return;epoch.current++;dirty.current=true;setter(value);onDraftChange?.(true);onPreview?.(null);};
 const resolve=action=>{if(!current())return;const captured=epoch.current;
  const run=()=>{if(!current()||captured!==epoch.current)return false;action();return true;};
  if(dirty.current)setPending({run,epoch:captured});else run();
 };
 const load=()=>resolve(()=>{
  const index=Number(live.current.number)-1,item=config?.publicProfile?.assets?.gallery?.[index];
  if(!item||!(item.approved===true||item.marketingOk===true)){onNotice?.('Choose an existing approved gallery photo.');return;}
  epoch.current++;dirty.current=false;setSource(config);setSelected({index,uri:item.uri});setAlt(String(item.alt||''));setCaption(String(item.caption||''));onDraftChange?.(false);onPreview?.(null);
 });
 const captured=epoch.current;
 const stale=source!==config;
 if(!config?.publicProfile?.assets?.gallery?.length)return null;
 return <View>
  <Text style={styles.sectionLabel}>Make gallery photos accessible</Text>
  <Text style={styles.cardBody}>Load an approved photo, then describe it. The picture stays unchanged. Preview and approval are required to save.</Text>
  {stale?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>The app changed. Your wording is kept; cancel it and load the current photo before preparing another preview.</Text>:null}
  {pending?<View><Text style={styles.cardBody}>Your photo wording is not saved.</Text>
   <Button label="Keep editing photo wording" onPress={()=>{if(current())setPending(null);}}/>
   <Button label="Discard photo wording and continue" onPress={()=>{
    if(!current()||pending.epoch!==epoch.current)return;
    dirty.current=false;setAlt('');setCaption('');setSelected(null);onDraftChange?.(false);setPending(null);pending.run();
   }}/></View>:null}
  <Field label="Gallery photo number (1 is first)" value={number} onChangeText={value=>resolve(()=>setNumber(value))}/>
  <Button label="Load this photo's existing descriptions" disabled={busy} onPress={load}/>
  <Field label="Image description for screen readers" value={alt} onChangeText={change(setAlt)}/>
  <Field label="Optional public caption" value={caption} onChangeText={change(setCaption)}/>
  <Button label="Cancel photo description wording" disabled={busy} onPress={()=>{
   if(!current()||captured!==epoch.current)return;epoch.current++;dirty.current=false;setAlt('');setCaption('');setSelected(null);setSource(config);onDraftChange?.(false);onPreview?.(null);
  }}/>
  <Button label="Preview photo description changes" disabled={busy||stale||!selected||!!pending} onPress={()=>{
   if(!current()||captured!==epoch.current||source!==config||!selected)return;
   const item=config.publicProfile?.assets?.gallery?.[selected.index];
   if(item?.uri!==selected.uri)return;
   const plan=proposeCoordinatedAppChanges(config,[{kind:'photo_description',index:selected.index,expectedUri:selected.uri,value:{alt,caption}}]);
   onPreview?.(plan.ok?plan:null);onNotice?.(plan.ok?'Review the exact photo descriptions before approving.':plan.reason);
  }}/>
 </View>;
}
