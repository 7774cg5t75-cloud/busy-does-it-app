import React from 'react';
import {Text,View} from 'react-native';
import {Button} from './ui';
import {styles} from '../theme/styles';
export function QuotePrivateSaveStatus({s,record,dirty,check}){
 const receipt=s.privateQuoteSave,exact=receipt?.record===record&&receipt.customerId===s.selectedReplyCustomer?.id&&receipt.stamp===JSON.stringify(record);
 const message=dirty?'Your current form has unrecorded changes. A saved copy of an earlier record does not include them.':
  exact&&receipt.status==='confirmed'?'This exact quote record was read back from the private device copy. Account/cloud saving and customer delivery are not confirmed.':
  exact&&['saving','checking'].includes(receipt.status)?'Checking the private device copy. Keep your quote until confirmation.':
  exact&&receipt.status==='failed'?'The device save did not start. Your quote remains in this workspace.':
  exact&&receipt.status==='unknown'?'Could not confirm this quote in the private device copy. Keep your information; no write was repeated.':
  'This quote is in the current workspace. Device recovery has not been confirmed for this record.';
 return <View style={styles.workspacePanel}><Text accessibilityRole="header" style={styles.workspacePanelTitle}>Device copy evidence</Text><Text accessibilityLiveRegion="polite" style={styles.cardBody}>{message}</Text>
  {check&&!(exact&&['saving','checking'].includes(receipt.status))?<Button label="Check quote device copy" onPress={check}/>:null}
 </View>;
}
