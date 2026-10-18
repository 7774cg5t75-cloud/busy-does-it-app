import React from 'react';
import {View,Text,Pressable} from 'react-native';
import {publicServiceDetails} from './publicServiceDetails.mjs';
// One public informational view shared by marketplace and standalone. No new
// request, storage, availability or transaction authority. Existing actions
// remain outside this component and retain their original version/review gates.
export function ServiceDetails({service,colors,bodySize=15,textStyle={},onRelatedServices}){
 const description=typeof service?.description==='string'?service.description.slice(0,2000):'';
 const details=publicServiceDetails(service),name=typeof service?.name==='string'?service.name:'this service';
 const stamp=JSON.stringify([service?.id,name,description,details]);
 const [expandedStamp,setExpandedStamp]=React.useState('');
 const live=React.useRef(stamp);live.current=stamp;
 const expanded=expandedStamp===stamp;
 const summary=description.length>160?description.slice(0,157).trimEnd()+'…':description;
 const text={color:colors.muted,fontSize:bodySize,lineHeight:bodySize+7,marginTop:8};
 return <View>
  <Text style={{...text,...textStyle}}>{(expanded?description:summary)||'Ask the business for details.'}</Text>
  {details.category?<Text style={text}>{'Category: '+details.category}</Text>:null}
  {details.priceLabel?<Text style={text}>{'Price information: '+details.priceLabel}</Text>:null}
  {details.durationLabel?<Text style={text}>{'Typical duration: '+details.durationLabel}</Text>:null}
  <Pressable accessibilityRole="button" accessibilityLabel={expanded?'Back to service summary':'View details for '+name} accessibilityState={{expanded}}
   onPress={()=>{if(live.current===stamp)setExpandedStamp(expanded?'':stamp);}}
   style={{minHeight:48,paddingVertical:12,paddingHorizontal:4,justifyContent:'center'}}>
   <Text style={{color:colors.text,fontWeight:'600',fontSize:bodySize}}>{expanded?'Back to service summary':'View service details'}</Text>
  </Pressable>
  {expanded&&details.category&&typeof onRelatedServices==='function'?<Pressable accessibilityRole="button" accessibilityLabel={'See services in '+details.category} onPress={()=>{if(live.current===stamp)onRelatedServices(details.category);}} style={{minHeight:48,padding:12,justifyContent:'center'}}><Text style={{color:colors.text,fontWeight:'600'}}>See services in {details.category}</Text></Pressable>:null}
  {expanded?<Text style={text}>These are business-provided details. Ask the business to confirm current options, price and timing. An enquiry or booking request does not confirm an appointment, order or payment.</Text>:null}
 </View>;
}
