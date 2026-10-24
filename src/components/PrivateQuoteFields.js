import React from 'react';
import {Text,TextInput,View} from 'react-native';
import {Field} from './ui';
import {styles} from '../theme/styles';
import {C} from '../core/runtime';
// Pure, hook-free original quote inputs, also callable in the existing parent.
// Shared with bounded engagement review; no save authority or state ownership.
export function PrivateQuoteFields({s,review,customerId,status}){
 return <View style={styles.workspacePanel}>
  <Text accessibilityRole="header" style={styles.workspacePanelTitle}>Edit this private quote</Text>
  <Text style={styles.workspaceMeta}>{'Customer reference: '+customerId+' · Current record: '+status+'. Fields below are your working copy, not a delivery receipt.'}</Text>
  <Field editable={!review.conflict} label="Quote amount" value={s.actionQuoteAmount} onChangeText={value=>review.edit('actionQuoteAmount',value)} keyboardType="number-pad" prefix="£"/>
  <Text style={styles.fieldLabel}>Draft reply</Text>
  <TextInput multiline accessibilityLabel="Private quote wording" editable={!review.conflict} accessibilityState={{disabled:review.conflict}} value={s.actionQuoteMessage} onChangeText={value=>review.edit('actionQuoteMessage',value)} placeholder="Your exact private quote wording" placeholderTextColor={C.muted} textAlignVertical="top" style={[styles.messageInput,styles.replyEditor]}/>
 </View>;
}
