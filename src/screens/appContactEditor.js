import React from 'react';
import {Text,View} from 'react-native';
import {Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {proposeCoordinatedAppChanges} from '../core/appCoordinatedStudio.mjs';
import {bindPrivateAppProposal} from '../core/privateAppEditSession.mjs';
function AppContactEditor({businessId,app,onPreview,onNotice,busy}){
 const [open,setOpen]=React.useState(false),[field,setField]=React.useState('phone'),[value,setValue]=React.useState('');
 const live=React.useRef(null),alive=React.useRef(true);live.current={businessId,app};
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 return <View>
  <Button label={open?'Hide public contact editor':'Edit public contact details'} onPress={()=>{setOpen(x=>!x);setField('phone');setValue(app.draft_config.publicProfile?.contact?.phone||'');}}/>
  {open?<>
   <Text style={styles.cardBody}>Change only the selected public detail. Review and approve in Studio; the live app stays unchanged.</Text>
   {['phone','email','openingHours'].map(key=><Button key={key} label={'Edit public '+key} disabled={busy}
     onPress={()=>{setField(key);setValue(app.draft_config.publicProfile?.contact?.[key]||'');}}/>)}
   <Field label={'Public '+field} value={value} onChangeText={setValue}/>
   <Button label="Preview public contact change" disabled={busy} onPress={()=>{
    if(!alive.current||live.current.app!==app||live.current.businessId!==businessId){onNotice('The app changed. Review its current contact details.');return;}
    const plan=proposeCoordinatedAppChanges(app.draft_config,[{kind:'contact',field,value}]);
    const bound=plan.ok?bindPrivateAppProposal(plan,{businessId,app}):plan;
    if(bound.ok&&onPreview(bound))onNotice('Contact change prepared in Studio. Compare before approving.');else onNotice(bound.reason||'Review the current contact details.');
   }}/>
  </>:null}
 </View>;
}
export {AppContactEditor};
