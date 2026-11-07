import React from 'react';
import {Text,View,Alert} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
import {growthOpportunityInput} from '../domain/growthOpportunities.mjs';
import {reviewGrowthWebsiteServices} from '../domain/growthWebsiteServices.mjs';
export function GrowthServicesReview({s}){
 const live=React.useRef(s);live.current=s;const alive=React.useRef(true),review=React.useRef(null);React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;review.current=null;};},[]);
 const [notice,setNotice]=React.useState(''),scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId;
 const source=reviewGrowthWebsiteServices(growthOpportunityInput(s));if(!source||!scope)return null;
 const current=()=>alive.current&&live.current.ownerWorkspaceScope===scope&&live.current.ownerSession?.userId===owner&&live.current.cloudWorkspace?.businessId===business&&reviewGrowthWebsiteServices(growthOpportunityInput(live.current))?.stamp===source.stamp;
 const prepare=entry=>{
  if(!current()||!entry.patch||typeof s.applyWebsiteFieldChange!=='function')return false;const token={};review.current=token;let used=false;
  Alert.alert('Compare this private service description',entry.title+'\n\nCurrent website words:\n'+entry.originalBody+'\n\nCurrent approved business words:\n'+entry.proposedBody+'\n\nChange only this exact item description through Website Builder? Its locks, unsaved-edit guard and Undo still apply. No publishing or search benefit is claimed.',[
   {text:'Keep website wording',style:'cancel',onPress:()=>{used=true;}},
   {text:'Use reviewed approved wording',onPress:()=>{if(used||review.current!==token||!current())return false;used=true;review.current=null;const ok=live.current.applyWebsiteFieldChange(entry.patch)===true;setNotice(ok?'Private description updated. Rechecking the current source below; original Website Builder Undo restores the earlier draft.':'The original builder did not apply the edit. Your current wording is kept; review source and locks.');return ok;}}
  ]);return true;
 };
 const labels={ambiguous:'Duplicate service name — review in the original editor',missing_description:'Description is empty',approved_copy_differs:'Website wording differs from approved business copy',no_supported_change:'No supported copy replacement proposed'};
 return <Card eyebrow="Private website source review" title="Review the whole Services section" body="Compare current private entries with approved business information. A difference is a review suggestion, not proof that your chosen wording is wrong or that search rankings will improve.">
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  <Text style={styles.cardBody}>{source.entries.length+' entries in the current Services section · website generation '+source.generation}</Text>
  {source.entries.map(entry=><View key={entry.id} style={styles.recordRow}>
   <Text accessibilityRole="header" style={styles.workspacePanelTitle}>{entry.title}</Text><Text style={styles.cardBody}>{labels[entry.state]}</Text>
   {entry.patch?<Button label={'Compare approved wording: '+entry.title} disabled={typeof s.applyWebsiteFieldChange!=='function'} onPress={()=>prepare(entry)}/>:null}
  </View>)}
  <Button label="Open original Website Builder controls" disabled={typeof s.openWebsiteBuilder!=='function'} onPress={()=>current()&&live.current.openWebsiteBuilder()}/>
 </Card>;
}
