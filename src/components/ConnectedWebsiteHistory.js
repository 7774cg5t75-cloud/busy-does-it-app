import React from 'react';
import {Text} from 'react-native';
import {Card,Button} from './ui';
import {WorkflowStatus} from './WorkflowChrome';
import {styles} from '../theme/styles';
// Metadata only. Restoration uses the original controls and trusted server target.
export function ConnectedWebsiteHistory({s}){
 const [record,setRecord]=React.useState(null),[busy,setBusy]=React.useState(false),[notice,setNotice]=React.useState('');
 const live=React.useRef(null),alive=React.useRef(true),flight=React.useRef(false);React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,draft=s.websiteDraft;live.current={owner,business,draft};
 const current=()=>alive.current&&live.current.owner===owner&&live.current.business===business&&live.current.draft===draft;
 if(!s.connectedReadWebsiteHistory)return null;
 return <Card eyebrow="Account-backed editing" title="Your private edit history" body="Reviewed changes save together. Undo and Redo create new private revisions; your live website stays unchanged.">
  <Button label="Open saved edit history" disabled={busy||!draft} onPress={async()=>{if(flight.current||!current())return;flight.current=true;setBusy(true);try{const value=await s.connectedReadWebsiteHistory();if(current()&&value.actorId===owner&&value.businessId===business&&value.notOwnReceipt===true&&Array.isArray(value.entries)&&value.entries.length<=8){setRecord({draft,value});setNotice(value.entries.length?'Opened saved account history.':'No earlier private edit is retained yet.');}}catch{if(current())setNotice('History could not be opened. Your draft and unfinished work were kept.');}finally{flight.current=false;if(alive.current&&live.current.owner===owner&&live.current.business===business)setBusy(false);}}}/>
  {record?.draft===draft?record.value.entries.slice().reverse().map(entry=><Text key={String(entry.revision)} style={styles.cardBody}>{'Private version '+entry.generation}</Text>):null}
  {notice?<WorkflowStatus title="Saved history" body={notice}/>:null}
 </Card>;
}
