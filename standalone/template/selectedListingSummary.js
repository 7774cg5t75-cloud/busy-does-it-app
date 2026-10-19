import React from 'react';
import {View,Text} from 'react-native';
import {prepareBusinessContentEnquiry} from './businessContentRecords.mjs';
// Readback only. Original preparation validates tenant, record, revision and
// option. This component holds no private fields, review or submission state.
export function SelectedListingSummary({feed,businessId,selection,colors={}}){
 if(!selection)return null;
 const prepared=prepareBusinessContentEnquiry(feed,businessId,selection);
 const lines=prepared.ok?prepared.message.split('\n'):[];
 const style={color:colors.text||'#16253a',marginVertical:4};
 return <View accessibilityLiveRegion="polite" style={{backgroundColor:colors.surface||'#fff',padding:12,borderWidth:1,borderColor:colors.line||'#8b93a3',borderRadius:8}}>
  <Text style={{...style,fontWeight:'700'}}>{prepared.ok?'Attached to this enquiry':'Attached listing needs review'}</Text>
  {prepared.ok?<><Text selectable style={style}>{lines[0]}</Text><Text selectable style={style}>{lines[1]}</Text><Text style={style}>{'Approved listing revision '+selection.revision+'. This information accompanies your question when you review the enquiry.'}</Text></>:<Text style={style}>{prepared.reason+' Return to the item or remove the attachment. Your own wording and requirements can be kept.'}</Text>}
  <Text style={style}>This summary is not a saved-request receipt, order, reservation or confirmed attendance.</Text>
 </View>;
}
