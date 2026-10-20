import React from 'react';
import {Text} from 'react-native';
import {Button} from './ui';
import {styles} from '../theme/styles';
export function ContentWordingChoices({pending,actions}){
 if(!pending?.evidence?.ok||!['service','business-introduction','product','event','owner-announcement'].includes(pending.purpose))return null;
 return <><Text style={styles.cardBody}>Choose how this idea reads. Your current draft stays until you use the idea; no paid generation is involved.</Text>
  {[['standard','Original wording'],['welcoming','Friendly and welcoming'],...pending.purpose==='owner-announcement'?[]:[['concise','Short and clear']],['detailed','More explanatory'],...pending.evidence.ownerChosenTone?[['brand','Use my approved brand voice']]:[]].map(([value,label])=><Button key={value} label={(pending.evidence.treatment===value?'✓ ':'')+label} onPress={()=>actions?.chooseTreatment(pending,value)}/>)}
 </>;
}
