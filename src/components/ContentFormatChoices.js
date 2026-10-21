import React from 'react';import {Text} from 'react-native';import {Button} from './ui';import {styles} from '../theme/styles';
export function ContentFormatChoices({pending,actions}){
 if(!pending?.evidence?.ok||!['service','business-introduction','product','event','owner-announcement'].includes(pending.purpose)||!actions?.chooseFormat)return null;
 return <><Text style={styles.cardBody}>Choose wording for a social post, poster or advert. This prepares editable text only: no graphic, advertising campaign or publication.</Text>
  {[['social','Social post wording'],['poster','Poster wording'],['advert','Advert wording'],...(pending.purpose==='owner-announcement'?[['newsletter','Newsletter wording']]:[])].map(([value,label])=><Button key={value} label={((pending.evidence.channel||'social')===value?'✓ ':'')+label} onPress={()=>actions.chooseFormat(pending,value)}/>)}</>;
}
