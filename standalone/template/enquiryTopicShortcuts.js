import React from 'react';
import {View,Text,Pressable} from 'react-native';
import {validEnquiryRequirements} from './customerEnquiryRequirements.mjs';
const TOPICS=['Price and options','Preferred timing','Quantity or group size','Location','Accessibility needs'];
export function EnquiryTopicShortcuts({requirements,onChoose,disabled=false,colors={text:'#16253a',line:'#8b93a3'}}){
 const live=React.useRef(null);live.current={requirements,onChoose,disabled};
 if(!validEnquiryRequirements(requirements)||typeof onChoose!=='function')return null;
 const blocked=disabled||!!requirements.topic.trim();
 return <View><Text style={{color:colors.text}}>Choose a question to start, then edit the details. Nothing is sent.</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{TOPICS.map(topic=><Pressable key={topic} accessibilityRole="button" accessibilityLabel={'Ask about '+topic.toLowerCase()} accessibilityState={{disabled:blocked}} disabled={blocked} onPress={()=>{const current=live.current;if(!blocked&&current.requirements===requirements&&current.onChoose===onChoose&&!current.disabled)onChoose({...requirements,topic});}} style={{minHeight:48,padding:12,borderWidth:1,borderColor:colors.line,borderRadius:8}}><Text style={{color:colors.text}}>{topic}</Text></Pressable>)}</View></View>;
}
