import React from 'react';
import {Text} from 'react-native';
import {Button} from './ui';
import {styles} from '../theme/styles';
export function ContentRecordChoices({pending,actions}){
 if(!pending||!['product','event'].includes(pending.purpose))return null;
 return <>
  {!pending.loading?<Button label="Refresh approved items" onPress={()=>actions?.refreshRecords(pending)}/>:null}
  {!pending.loading&&!pending.records?.length?<Text style={styles.cardBody}>No eligible approved items were found. Private edits, archived items and cancelled or past events are not promoted.</Text>:null}
  {(pending.records||[]).map(row=><React.Fragment key={row.id}>
   <Button label={'Use '+row.kind+': '+row.data.name} onPress={()=>actions?.selectRecord(pending,{recordId:row.id,revision:row.revision})}/>
   {(row.data.variants||[]).map(option=><Button key={option.id} label={row.data.name+' — '+option.label} onPress={()=>actions?.selectRecord(pending,{recordId:row.id,revision:row.revision,variantId:option.id})}/>)}
  </React.Fragment>)}
 </>;
}
