import React from 'react';
import {Text} from 'react-native';
import {Button,Details} from './ui';
import {styles} from '../theme/styles';
import {appEnquiryReference,resolveAppEnquirySource} from '../core/appEnquirySource.mjs';
import {approvedCompositionFeed} from '../core/appRecordComposition.mjs';
import {contentPrice,contentEventSchedule} from '../core/businessContentRecords.mjs';
import {stableJson} from '../core/stableJson.mjs';
// Read-only evidence next to the ORIGINAL request/Work. No source association,
// customer writer, quote amount inference, snapshot restore or send authority.
export function AppEnquirySourceContext({s,source}){
 const [checked,setChecked]=React.useState(null),[busy,setBusy]=React.useState(false),[notice,setNotice]=React.useState('');
 const alive=React.useRef(true),pending=React.useRef(false),live=React.useRef(null);
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const ownerId=s.ownerSession?.userId,businessId=s.cloudWorkspace?.businessId,stamp=stableJson([ownerId,businessId,s.cloudWorkspace?.role,s.connectedRuntime?.active,source]);live.current={stamp,s};
 React.useEffect(()=>{setBusy(false);setChecked(null);setNotice('');},[stamp]);
 const current=()=>alive.current&&live.current.stamp===stamp&&(!live.current.s.connectedRuntime||live.current.s.connectedRuntime.active);
 if(!ownerId||!businessId||(s.connectedRuntime&&!s.connectedRuntime.active)||source?.businessId!==businessId||!appEnquiryReference(source.message))return null;
 const value=checked?.stamp===stamp?checked.value:null;
 return <Details label="What prompted this enquiry?">
  <Text style={styles.cardBody}>{value?.ok?value.subject:'This request contains an item reference. Its wording alone does not verify the item or displayed facts.'}</Text>
  <Button label="Check current original item context" disabled={busy||typeof s.readCurrentAppStudioDraft!=='function'} onPress={async()=>{
   if(!current()||pending.current)return false;pending.current=true;setBusy(true);setChecked(null);setNotice('');
   try{
    const packet=await s.readCurrentAppStudioDraft({appId:source.appId});
    if(!current()||packet?.ok!==true||packet.readOnly!==true||packet.ownerId!==ownerId||packet.businessId!==businessId)throw Error('Access changed');
    let feed=null;if(appEnquiryReference(source.message)?.kind==='listing'){const response=await s.businessContentRequest('content_list');if(!current())return false;feed=approvedCompositionFeed(response,businessId);}
    const result=resolveAppEnquirySource({source,app:packet.app,feed});
    if(!current())return false;setChecked({stamp,value:result,at:new Date().toISOString()});setNotice(result.ok?'Current authorised information checked. This is not submission-time proof or customer identity verification.':result.reason);return result.ok;
   }catch{if(current())setNotice('Original source context could not be confirmed. The enquiry and private work are kept.');return false;}
   finally{pending.current=false;if(current())setBusy(false);}
  }}/>
  {value?.ok?<>
   <Text style={styles.cardBody}>{'Current source: '+value.facts.kind+' · '+value.facts.name+' · revision '+value.facts.revision}</Text>
   {value.facts.amountMinor!==undefined?<Text style={styles.cardBody}>{'Current approved price: '+contentPrice(value.facts.amountMinor,value.facts.currency)+(value.facts.optionLabel?' · '+value.facts.optionLabel:'')}</Text>:null}
   {value.facts.kind==='event'?<Text style={styles.cardBody}>{contentEventSchedule(value.facts)}</Text>:null}
   <Text selectable style={styles.cardBody}>{'Customer wording and requested details (not verified):\n'+value.customerWords}</Text>
   <Details label="Source evidence"><Text selectable style={styles.cardBody}>{'Original request '+value.requestId+' · app '+value.appId+' · checked '+checked.at+'. '+value.evidence}</Text></Details>
  </>:null}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
 </Details>;
}
