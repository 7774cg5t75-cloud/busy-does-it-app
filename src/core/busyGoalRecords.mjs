import {stableJson} from './stableJson.mjs';
import {createJourneyRestorer} from '../staging/connectedJourneyRestore.mjs';
// A finite adapter over existing readers only. Tickets contain no write authority.
export function createBusyGoalRecords({getCurrent,creator,request}){
 const start=getCurrent(),tickets=new WeakMap();
 const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
 const valid=()=>{const c=getCurrent();return uuid(start.ownerId)&&uuid(start.businessId)&&!!start.scope&&c.scope===start.scope&&c.ownerId===start.ownerId&&c.businessId===start.businessId&&c.role==='owner'&&c.ready===true;};
 const check=()=>{if(!valid())throw Error('Your business or access changed. Open the current account again.');};
 const scoped=r=>r&&r.businessId===start.businessId&&(r.ownerId||r.actorId)===start.ownerId&&[r.ownerId,r.actorId].every(x=>x===undefined||x===start.ownerId)&&r.notOwnReceipt===true;
 const remember=(kind,row,extra={})=>{const ticket={kind,...row};tickets.set(ticket,{stamp:stableJson(ticket),extra});return ticket;};
 const observed=(ticket,kind)=>{check();const t=ticket&&tickets.get(ticket);if(!t||ticket.kind!==kind||t.stamp!==stableJson(ticket))throw Error('Choose a freshly inspected item.');return t.extra;};
 return {
  async wording(after=null){check();const page=await creator.list(null,after);check();if(!scoped(page)||!Array.isArray(page.items)||page.items.length>20||new Set(page.items.map(x=>x.draftId)).size!==page.items.length)throw Error('Saved wording is unavailable');return {...page,items:page.items.map(x=>remember('creator',x))};},
  async readWording(ticket){observed(ticket,'creator');const r=await creator.read(ticket.draftId);observed(ticket,'creator');if(!scoped(r)||r.draftId!==ticket.draftId||r.revision!==ticket.revision||r.currentRevision!==r.revision||r.historical!==false||!['not_linked','current'].includes(r.sourceState)||r.status!=='Draft')throw Error('That wording or its source changed. Reload your saved drafts.');return r;},
  async enquiries(after=null,revision=null){check();const page=await request('journey_list',{after,expectedRevision:revision});check();if(!scoped(page)||page.nextCursor!==null&&(typeof page.nextCursor!=='string'||page.nextCursor.length>240))throw Error('Your enquiries are unavailable');createJourneyRestorer({businessId:start.businessId,ownerId:start.ownerId}).plan(page,{customers:[],inboxItems:[]});
   const ids=page.items.map(x=>x.state==='Filed'?x.record.enquiry.id:x.record.pending.id);if(new Set(ids).size!==ids.length)throw Error('Enquiry identity is ambiguous');return {...page,items:page.items.map((x,i)=>remember('enquiry',{id:ids[i],state:x.state,requestId:x.requestId||null,record:x.record},{revision:page.revision}))};},
  async readEnquiry(ticket){const info=observed(ticket,'enquiry'),r=ticket.record;const body=ticket.state==='Filed'?{expectedRevision:info.revision,customerId:r.customer.id,enquiryId:ticket.id}:{expectedRevision:info.revision,enquiryId:ticket.id};
   const fresh=await request(ticket.state==='Filed'?'filed_review':'pending_review',body);observed(ticket,'enquiry');if(fresh?.ownerId!==start.ownerId||fresh.businessId!==start.businessId||fresh.schemaVersion!==1||fresh.revision!==info.revision||!/^[a-f0-9]{64}$/.test(fresh.sourceHash||'')||ticket.state==='Filed'&&!/^[a-f0-9]{64}$/.test(fresh.customerHash||'')||stableJson(fresh)!==stableJson(r))throw Error('That enquiry changed. Reload it before continuing.');return {state:ticket.state,record:fresh,requestId:ticket.requestId,notOwnReceipt:true};}
 };
}
