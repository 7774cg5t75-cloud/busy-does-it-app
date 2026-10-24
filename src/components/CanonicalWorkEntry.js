import {stableJson} from '../core/stableJson.mjs';
import React from 'react';
import {Card,Button} from './ui';
import {CanonicalWorkPanel} from './CanonicalWorkPanel';

// Selection only. Original customer records and the canonical panel retain authority.
export function CanonicalWorkEntry({s}){
 const [selected,setSelected]=React.useState(null),live=React.useRef(null);
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId;
 live.current=s;
 if(!s.canonicalWork?.enabled||s.cloudWorkspace?.role!=='owner')return null;
 const rows=(s.customers||[]).filter(c=>c&&typeof c.id==='string'&&![c.businessId,c.business_id].some(id=>id&&id!==business)&&(s.customers||[]).filter(x=>x?.id===c.id).length===1);
 const chosen=selected?.scope===scope?rows.find(c=>c===selected.customer):null;
 return <Card eyebrow="Work & Get Paid · private preparation" title="Continue a separate engagement" body="Choose an existing customer, then inspect their authorised account quotes. Legacy Work remains separate. No quote is issued and no payment is taken.">
  {rows.map(customer=>{const stamp=stableJson(customer);return <Button key={customer.id} label={'Engagements for '+customer.name} selected={chosen===customer} onPress={()=>{
   const isCurrent=()=>stableJson(customer)===stamp&&live.current.ownerWorkspaceScope===scope&&live.current.ownerSession?.userId===owner&&live.current.cloudWorkspace?.businessId===business&&live.current.cloudWorkspace?.role==='owner'&&live.current.customers?.includes(customer)&&(live.current.customers||[]).filter(x=>x?.id===customer.id).length===1;
   if(!isCurrent()||!s.requestOwnerEditTransition)return false;
   return s.requestOwnerEditTransition(()=>{if(isCurrent())setSelected({scope,customer});},{isCurrent});
  }}/>;}) }
  {chosen?<CanonicalWorkPanel key={owner+':'+business+':'+chosen.id} s={s} customer={chosen}/>:null}
 </Card>;
}
