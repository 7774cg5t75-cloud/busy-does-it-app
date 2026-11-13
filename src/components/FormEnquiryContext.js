import React from 'react';
import {Text} from 'react-native';
import {Details} from './ui';
import {styles} from '../theme/styles';
import {formEnquiryRows} from '../core/privateFormEnquiry.mjs';
export function FormEnquiryContext({source,ownerId,businessId}){
 const f=source?.formContext;if(!f||f.ownerId!==ownerId||f.businessId!==businessId||f.appId!==source.appId||f.requestId!==source.requestId||f.requestHash!==source.requestHash)return null;
 const rows=formEnquiryRows(f);if(!rows.length)return null;
 return <Details label="The customer's reviewed form answers"><Text style={styles.sectionLabel}>{f.title}</Text><Text style={styles.cardBody}>{f.sourceCurrent?'Exact original form and private placement are currently eligible.':'Historical form answers: the form or private placement has changed or is unavailable. These original questions have not been replaced.'}</Text>{rows.map(r=><Text selectable key={r.id} style={styles.cardBody}>{r.label+': '+r.value+(r.unit?' '+r.unit:'')}</Text>)}{f.outputs?<Text style={styles.cardBody}>{'Indicative calculated values, not customer assertions: '+JSON.stringify(f.outputs)}</Text>:null}<Text style={styles.cardBody}>Synthetic/private preparation context. Customer identity, submission-time display, orders, bookings and payments are not verified.</Text></Details>;
}
