import {stableJson} from './stableJson.mjs';
export const validOperationalSource=x=>x&&typeof x==='object'&&!Array.isArray(x)&&typeof x.customerId==='string'&&x.customerId.length>0&&x.customerId.length<=240&&(x.targetKind==='filed_enquiry'?Object.keys(x).sort().join(',')==='customerId,enquiryId,targetKind'&&typeof x.enquiryId==='string'&&x.enquiryId.length>0&&x.enquiryId.length<=240:x.targetKind==='prepared_quote'&&Object.keys(x).sort().join(',')==='customerId,engagementId,quoteRevision,targetKind'&&uuid(x.engagementId)&&Number.isSafeInteger(x.quoteRevision)&&x.quoteRevision>0);
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(x);
// Finite recognition only; never picks a similarly named source or performs writes.
export function operationalOverviewIntent(words,rows){
 if(typeof words!=='string'||words.length>500)return {ok:false,reason:'Choose a preparation below.'};
 if(/^(show me (the )?preparations i.ve started|show all preparations)[.!]?$/i.test(words))return {ok:true,rows};
 const m=/^(?:which|show me) (.+?) tasks are outstanding[?!]?$/i.exec(words);
 if(m){const term=m[1].toLowerCase();return {ok:true,rows:rows.filter(r=>r.remaining?.some(i=>(i.text+' '+i.stage).toLowerCase().includes(term))),taskFilter:term};}
 return {ok:false,reason:'Choose the exact enquiry below. Changes are reviewed in its original Work preparation.'};
}
export function createOperationalScreenSession({scope,getCurrent,request,integrity}){
 scope=JSON.parse(stableJson(scope));const stamp=stableJson(scope),observations=new WeakMap(),rows=new WeakMap(),tickets=new WeakMap();let pending=false,uncertain=false;
 const current=()=>getCurrent()?.ready===true&&stableJson(getCurrent().identity)===stamp;
 const call=async(payload)=>{if(!current())throw Error('Owner App context changed');const r=await request({action:'private_work_preparation',...payload});if(!current()||r?.ok!==true||r.privateOnly!==true||r.businessId!==scope.businessId||r.ownerId!==scope.ownerId)throw Error('Exact private scope unavailable');return r;};
 const read=async()=>{const r=await call({targetKind:'operational_app',operation:'read',app:scope.app});if(r.appId!==scope.app.id||r.appRevision!==scope.app.revision||!Number.isSafeInteger(r.revision)||r.revision<0||r.binding&&!validOperationalSource(r.binding.source))throw Error('Malformed original App placement');const o=JSON.parse(stableJson(r));observations.set(o,stableJson(o));return o;};
 const overview=async(after=null)=>{const r=await call({targetKind:'preparation_overview',operation:'read',...(after?{after}:{})});if(!Array.isArray(r.rows)||r.rows.length>20||r.rows.some(x=>!validOperationalSource(x.source)))throw Error('Malformed private overview');for(const x of r.rows)rows.set(x,stableJson(x));return r;};
 return {read,overview,status:()=>uncertain?'unknown':pending?'pending':'ready',cancel:t=>tickets.delete(t),
 review(observed,row=null,screenId='contact'){if(!current()||pending||uncertain||observations.get(observed)!==stableJson(observed)||row&&(rows.get(row)!==stableJson(row)||row.status!=='current')||!['contact','services','business_profile'].includes(screenId))return null;const t=Object.freeze({});tickets.set(t,{revision:observed.revision,row:row?JSON.parse(stableJson(row)):null,screenId});return t;},
 async commit(ticket,{ownerApproved=false}={}){const t=tickets.get(ticket);tickets.delete(ticket);if(!t||!ownerApproved||!current()||pending||uncertain)return {ok:false,uncertain};let key;try{key=integrity.randomUUID();}catch{return {ok:false};}let sent=false;pending=true;
 try{const payload={targetKind:'operational_app',operation:t.row?'save':'remove',app:scope.app,expectedRevision:t.revision,ownerApproved:true,requestKey:key,...(t.row?{source:t.row.source,screenId:t.screenId,workRevision:t.row.workRevision,snapshotRevision:t.row.snapshotRevision}:{})};if(!current())throw Error();sent=true;const receipt=await call(payload);if(receipt.ownOperationReceipt!==true||receipt.requestKey!==key||receipt.revision!==t.revision+1||receipt.appId!==scope.app.id||receipt.appRevision!==scope.app.revision)throw Error();const observed=await read();if(observed.revision!==receipt.revision||(t.row?stableJson(observed.binding?.source)!==stableJson(t.row.source)||observed.binding.screenId!==t.screenId:observed.binding!==null))throw Error();return {ok:true,receipt,observed};}catch{if(sent)uncertain=true;return {ok:false,uncertain};}finally{pending=false;}}
 };
}
