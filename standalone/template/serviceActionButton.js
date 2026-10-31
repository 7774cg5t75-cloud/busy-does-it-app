import React from 'react';
import {Pressable,Text} from 'react-native';
import {serviceButtonStyle,serviceButtonLabel} from './appServicePresentation.mjs';
// Bounded display wording never owns a destination, service selection or permission.
export function ServiceActionButton({label,title,serviceId,action,presentation,colors,onPress,disabled=false}){
 const look=serviceButtonStyle(presentation,serviceId,action,colors),displayLabel=serviceButtonLabel(presentation,serviceId,action,label||title);
 return <Pressable accessibilityRole="button" accessibilityLabel={displayLabel} accessibilityState={{disabled}} disabled={disabled} onPress={disabled?undefined:onPress} style={look.container}><Text style={look.text}>{displayLabel}</Text></Pressable>;
}
