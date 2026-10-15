import React from 'react';
import {Text,View} from 'react-native';
import {Button} from '../components/ui';
import {styles} from '../theme/styles';
import {reviewAppBusinessFactRefresh,currentAppBusinessFactReview} from '../core/appBusinessFactRefresh.mjs';
function AppBusinessFactRefresh({businessId,app,profileRecord,onPreview,onNotice,busy}){
 const [selected,setSelected]=React.useState(null),live=React.useRef(null),alive=React.useRef(true);
 const context={businessId,app,profileRecord};live.current=context;
 React.useEffect(()=>{alive.current=true;return ()=>{alive.current=false;};},[]);
 const review=reviewAppBusinessFactRefresh({...context,selected});
 return <View>
  <Text style={styles.sectionLabel}>Compare saved business facts</Text>
  <Text style={styles.cardBody}>Keep your app’s custom wording. New saved facts can be reviewed in the same Studio, with approval and undo. No services or images are removed.</Text>
  {!review.ok?<Text style={styles.cardBody}>{review.reason}</Text>:<>
   {review.rows.map(row=><View key={row.id}>
    <Text style={styles.sectionLabel}>{row.label+(row.conflict?' — keep app wording unless selected':' — missing from app')}</Text>
    {row.before?<Text style={styles.cardBody}>{'App: '+row.before}</Text>:null}
    <Text style={styles.cardBody}>{'Saved profile: '+row.after}</Text>
    {!row.allowed?<Text style={styles.cardBody}>{row.reason}</Text>:<Button
     label={(review.selected.includes(row.id)?'✓ Selected: ':'Use saved: ')+row.label}
     disabled={busy} onPress={()=>{
      if(!alive.current||!currentAppBusinessFactReview(review,live.current))return;
      setSelected(review.selected.includes(row.id)?review.selected.filter(id=>id!==row.id):[...review.selected,row.id]);
     }}/>}
   </View>)}
   <Text style={styles.cardBody}>{review.reason}</Text>
   <Button label="Preview selected fact updates in Studio" disabled={busy||!review.preview}
    onPress={()=>{
     if(!alive.current||!currentAppBusinessFactReview(review,live.current)){onNotice('The app or saved facts changed. Review the latest comparison.');return;}
     if(onPreview(review.preview))onNotice('Selected facts are in the Studio preview. Compare, then approve or discard. Nothing has been saved.');
    }}/>
  </>}
 </View>;
}
export {AppBusinessFactRefresh};
