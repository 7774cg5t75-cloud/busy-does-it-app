import React from 'react';
import {Pressable,Text} from 'react-native';
import {serviceButtonStyle} from './appServicePresentation.mjs';
// Appearance never owns a destination, label, service selection or permission.
// Those remain literal props from the original request rendering paths.
export function ServiceActionButton({label,title,serviceId,action,presentation,colors,onPress,disabled=false}){
 const look=serviceButtonStyle(presentation,serviceId,action,colors);
 return <Pressable accessibilityRole="button" accessibilityLabel={label||title} accessibilityState={{disabled}} disabled={disabled} onPress={disabled?undefined:onPress} style={look.container}><Text style={look.text}>{label||title}</Text></Pressable>;
}
