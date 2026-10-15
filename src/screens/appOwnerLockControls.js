import React from 'react';
import {View,Text} from 'react-native';
import {Button} from '../components/ui';
import {styles} from '../theme/styles';
import {APP_LOCK_CHOICES} from '../core/appOwnerLockEditing.mjs';
import {appOwnerLocks} from '../core/appOwnerLocks.mjs';
import {proposeCoordinatedAppChanges} from '../core/appCoordinatedStudio.mjs';
function AppOwnerLockControls({config,onPreview,onNotice,busy}){
 const current=appOwnerLocks(config),[open,setOpen]=React.useState(false);
 const [chosen,setChosen]=React.useState(()=>current.locks);
 const choices=[...APP_LOCK_CHOICES,...current.locks.filter(id=>!APP_LOCK_CHOICES.some(x=>x.id===id)).map(id=>({id,label:id}))];
 return <View>
  <Button label={open?'Close editing protection':`Protect my choices (${current.locks.length} lock(s))`} onPress={()=>setOpen(x=>!x)}/>
  {open?<>
   <Text style={styles.cardBody}>Locks tell Busy which choices to keep. Review lock changes separately; changing a lock does not edit content or publish anything.</Text>
   {!current.ok?<Text style={styles.cardBody}>{current.reason}</Text>:choices.map(choice=><Button key={choice.id}
    label={(chosen.includes(choice.id)?'✓ Keep: ':'Protect: ')+choice.label} disabled={busy}
    onPress={()=>setChosen(items=>items.includes(choice.id)?items.filter(x=>x!==choice.id):[...items,choice.id])}/>)}
   <Button label="Preview these lock changes" disabled={busy||!current.ok||JSON.stringify(chosen)===JSON.stringify(current.locks)}
    onPress={()=>{const proposal=proposeCoordinatedAppChanges(config,[{kind:'owner_locks',value:chosen}]);
     if(proposal.ok&&onPreview(proposal))onNotice('Owner lock changes are in Studio. Review and approve this separate private revision.');else onNotice(proposal.reason||'The private draft changed. Review its current locks.');}}/>
  </>:null}
 </View>;
}
export {AppOwnerLockControls};
