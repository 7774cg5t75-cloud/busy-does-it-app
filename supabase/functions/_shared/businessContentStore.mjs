import {RECORD_ID,validateBusinessContent,publicBusinessContent} from './businessContentRecords.mjs';
const TABLE='busy_business_content';
async function readBusinessContent(db,businessId,{publicOnly=false}={}){
 let query=db.from(TABLE).select(publicOnly?'id,business_id,kind,revision,published,published_revision':'id,business_id,kind,revision,draft,published,published_revision,can_undo').eq('business_id',businessId).order('id',{ascending:true}).limit(201);
 const r=await query;if(r.error)throw r.error;if(!Array.isArray(r.data)||r.data.length>200)throw Error('The catalogue exceeds the supported page size.');
 return publicOnly?publicBusinessContent(r.data,businessId):r.data;
}
async function manageBusinessContent(db,{businessId,actorId,role},body){
 if(!businessId||!actorId||!['owner','admin'].includes(role))throw Error('Owner or admin access is required.');
 if(body.action==='content_list'){
  const records=await readBusinessContent(db,businessId),p=await db.from('busy_public_business_profiles').select('profile').eq('business_id',businessId).maybeSingle();if(p.error)throw p.error;
  const images=[p.data?.profile?.assets?.hero,...(p.data?.profile?.assets?.gallery||[])].filter(a=>a?.uri&&(a.approved===true||a.marketingOk===true)).slice(0,25).map(a=>({uri:a.uri,alt:a.alt||a.caption||'Approved business photograph'}));
  return {ok:true,businessId,records:records.map(r=>({...r,canUndo:r.can_undo===true})),images};
 }
 if(!['content_save','content_publish','content_undo'].includes(body.action)||!RECORD_ID.test(body.id||'')||!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision<0||body.ownerApproved!==true)throw Error('Review the exact record and approve the change.');
 const q=await db.from(TABLE).select('*').eq('business_id',businessId).eq('id',body.id).maybeSingle();if(q.error)throw q.error;
 const old=q.data;if((old&&(old.business_id!==businessId||old.id!==body.id||old.revision!==body.expectedRevision))||(!old&&body.expectedRevision!==0))throw Error('The record changed. Reload it before another edit.');
 let next;
 if(body.action==='content_publish'){
  if(!old)throw Error('Save a private record before publication.');
  const checked=validateBusinessContent(old.kind,old.draft);if(!checked.ok)throw Error(checked.reason);
  next={...old,published:checked.data,published_revision:old.revision+1,revision:old.revision+1};
 }else{
  const kind=old?.kind||body.kind;
  const data=body.action==='content_undo'?old?.history?.at(-1):body.data;
  const checked=validateBusinessContent(kind,data);if(!checked.ok)throw Error(checked.reason);
  if(body.action==='content_save'&&old&&kind==='product'&&old.draft.currency!==checked.data.currency&&old.draft.variants?.length&&body.confirmOptionCurrencyChange!==true)throw Error('Explicitly review option prices before changing their currency.');
  if(old&&body.kind&&body.kind!==old.kind)throw Error('A record cannot change its type.');
  const history=old?.history||[];
  next={id:body.id,business_id:businessId,kind,draft:checked.data,revision:(old?.revision||0)+1,published:old?.published||null,published_revision:old?.published_revision||null,
   history:body.action==='content_undo'?history.slice(0,-1):[...history,...old?[old.draft]:[]].slice(-8)};
 }
  if(next.draft.image){
   const p=await db.from('busy_public_business_profiles').select('profile').eq('business_id',businessId).maybeSingle();if(p.error)throw p.error;
   const assets=[p.data?.profile?.assets?.hero,...(p.data?.profile?.assets?.gallery||[])];
   if(!assets.some(a=>a?.uri===next.draft.image.uri&&(a.approved===true||a.marketingOk===true)))throw Error('Choose a currently approved photograph from this business.');
  }
 const payload={...Object.fromEntries(['id','business_id','kind','draft','revision','published','published_revision','history'].map(key=>[key,next[key]])),updated_by:actorId,updated_at:new Date().toISOString()};
 let write=old?db.from(TABLE).update(payload).eq('business_id',businessId).eq('id',body.id).eq('revision',body.expectedRevision).select('*').maybeSingle():db.from(TABLE).insert(payload).select('*').single();
 const saved=await write;if(saved.error)throw saved.error;if(!saved.data||saved.data.business_id!==businessId||saved.data.id!==body.id||saved.data.revision!==next.revision)throw Error('The save result is uncertain. Reload the exact record; do not repeat a new creation.');
 return {ok:true,businessId,record:((({history,...record})=>({...record,canUndo:Array.isArray(history)&&history.length>0}))(saved.data)),publicChange:body.action==='content_publish',stockTracked:false};
}
export {TABLE,readBusinessContent,manageBusinessContent};
