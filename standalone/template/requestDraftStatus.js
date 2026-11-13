import React from 'react';
import {View,Text} from 'react-native';
// Readback only. The original form owns review identity and uncertain outcomes.
export function RequestDraftStatus({busy=false,reviewed=false,result=null,colors={}}){
 const text=busy?'Sending this reviewed request. Please wait; do not send it again.':result?.mayHaveBeenReceived?'Outcome unconfirmed. Keep the original request reference and check it before retrying.':result?.ok?'The original request was saved. This does not confirm an appointment, order or payment.':reviewed?'Reviewed, not sent. Confirm only after checking these exact details.':'Private request draft — not sent. Review your details before confirming.';
 return <View style={{padding:12,backgroundColor:colors.surface||'#FFFFFF',borderRadius:8}}><Text accessibilityLiveRegion="polite" style={{color:colors.text||'#16253a'}}>{text}</Text></View>;
}
