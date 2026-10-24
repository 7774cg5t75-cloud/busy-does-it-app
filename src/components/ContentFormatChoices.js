import {CONTENT_FORMAT_CHOICES} from '../core/contentTextFormats.mjs';
import React from 'react';import {Text,View} from 'react-native';import {Button} from './ui';import {styles} from '../theme/styles';
export function ContentFormatChoices({pending,actions}){
 if(!pending?.evidence?.ok||!['service','business-introduction','product','event','owner-announcement'].includes(pending.purpose)||!actions?.chooseFormat)return null;
 return <><Text style={styles.cardBody}>Choose social, poster, advert or private newsletter wording. This prepares editable text only: no graphic, advertising campaign or publication.</Text>
  <View style={styles.choiceGrid}>{CONTENT_FORMAT_CHOICES.map(([value,label])=><View key={value} style={styles.choiceCell}><Button compact selected={(pending.evidence.channel||'social')===value} label={((pending.evidence.channel||'social')===value?'✓ ':'')+label} onPress={()=>actions.chooseFormat(pending,value)}/></View>)}</View></>;
}
