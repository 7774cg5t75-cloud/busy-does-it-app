import {stableJson} from '../core/stableJson.mjs';
// Finite source projections only. This never restores a business snapshot or
// merges people by contact details; an ID collision with local work is refused.
export function createJourneyRestorer({businessId,ownerId}){
 const installed={customers:new Map(),inboxItems:new Map()};
 return {plan(page,current){
  if(page?.businessId!==businessId||page.ownerId!==ownerId||!Number.isSafeInteger(page.revision)||page.revision<1||!Array.isArray(page.items)||page.items.length>50||page.notOwnReceipt!==true)throw Error('Saved enquiries unavailable');
  const next={customers:[...current.customers],inboxItems:[...current.inboxItems]},updates=[];
  const add=(kind,item)=>{if(!item||typeof item.id!=='string')throw Error('Source identity missing');const rows=next[kind].filter(x=>x.id===item.id);if(rows.length>1||rows.length===1&&stableJson(rows[0])!==stableJson(item)&&installed[kind].get(item.id)!==stableJson(rows[0]))throw Error('Keep local customer work before reopening the account record');if(rows.length)next[kind]=next[kind].map(x=>x.id===item.id?item:x);else next[kind].push(item);updates.push([kind,item]);};
  for(const item of page.items){const r=item.record;if(r?.businessId!==businessId||r.ownerId!==ownerId||r.revision!==page.revision)throw Error('Source scope changed');
   if(item.state==='Filed'){if(r.customer?.id!==r.enquiry?.filedCustomerId||r.enquiry?.status!=='Filed')throw Error('Filed identity changed');add('customers',r.customer);add('inboxItems',r.enquiry);}
   else if(item.state==='Pending')add('inboxItems',{...r.pending,status:'Pending'});
   else throw Error('Unsupported enquiry state');
  }
  let committed=false;return {...next,revision:page.revision,commit(){if(committed)throw Error('Observation already installed');committed=true;for(const [k,v]of updates)installed[k].set(v.id,stableJson(v));}};
 }};
}
