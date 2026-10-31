// Subordinate original-gateway candidate. Only index.ts authenticates callers;
// its production gate stays false. No client digest or identity is authoritative.
export function originalUploadOperations({supabase,inspect,digest,rateGate,audit}){
 const rpc=async(action,actor,business,key=null,extra={})=>{const r=await supabase.rpc('busy_original_upload_operation_v1',{p_action:action,p_business_id:business,p_actor_id:actor,p_request_key:key,...extra});if(r.error)throw r.error;return r.data;};
 const find=async(op,actor,business)=>{const r=await supabase.from('busy_website_original_media').select('storage_path').eq('business_id',business).eq('uploaded_by',actor).eq('sha256',op.sha256).maybeSingle();if(r.error)throw r.error;return r.data?.storage_path||op.storagePath||op.plannedPath;};
 const verify=async(op,path)=>{const match=typeof path==='string'&&/^([a-f0-9-]{36})\/([a-f0-9-]{36})\/([a-f0-9-]{36})\.(jpg|png|webp)$/.exec(path);if(!match||match[1]!==op.businessId||match[2]!==op.ownerId)return false;const r=await supabase.storage.from('busy-website-originals').download(path);if(r.error||!r.data||r.data.size!==op.bytes||r.data.size>9437184)return false;const bytes=new Uint8Array(await r.data.arrayBuffer());return bytes.length===op.bytes&&inspect(bytes)===op.contentType&&await digest(bytes)===op.sha256;};
 const observe=async(op,actor,business)=>{if(!op.found)return op;if(op.state==='committed'&&!op.assetEligible)return {...op,mayUpload:false,mediaState:'unavailable',ownOperationReceipt:false,notOwnReceipt:true};const path=await find(op,actor,business);if(!await verify(op,path))return {...op,mayUpload:false,mediaState:'unavailable',ownOperationReceipt:false,notOwnReceipt:true};if(op.state==='pending'&&!op.readOnly)op=await rpc('commit',actor,business,op.requestKey,{p_verified_path:path});else if(op.state==='committed'){if(op.state!=='committed')return {...op,mayUpload:false,mediaState:'unavailable',ownOperationReceipt:false,notOwnReceipt:true};const current=await rpc('inspect',actor,business,op.requestKey);if(!current.found||!current.assetEligible||current.operationId!==op.operationId||current.storagePath!==path||current.sha256!==op.sha256)return {...current,mediaState:'unavailable',ownOperationReceipt:false,notOwnReceipt:true};op=current;}if(op.state!=='committed')return {...op,mayUpload:false,mediaState:'unavailable',ownOperationReceipt:false,notOwnReceipt:true};const current=await rpc('inspect',actor,business,op.requestKey);if(!current.found||current.operationId!==op.operationId||current.revision!==op.revision||(current.state==='committed'&&!current.assetEligible))throw Error('Original upload authority changed');return {...current,mayUpload:false,mediaState:'eligible',ownOperationReceipt:false,notOwnReceipt:true,operationObserved:true};};
 return {
  async list(raw,actor,business){return rpc('list',actor,business,null,{p_after:raw.after||null});},
  async inspect(raw,actor,business){const op=await rpc('inspect',actor,business,raw.requestKey);return observe(op,actor,business);},
  async upload(raw,actor,business){
   if(typeof raw.photoBase64!=='string'||raw.photoBase64.length<28||raw.photoBase64.length>12600000||!/^[A-Za-z0-9+/]+={0,2}$/.test(raw.photoBase64))return {ok:false,rejected:true,businessId:business,ownerId:actor};
   let bytes;try{bytes=Uint8Array.from(atob(raw.photoBase64),c=>c.charCodeAt(0));}catch{return {ok:false,rejected:true,businessId:business,ownerId:actor};}
   const mime=inspect(bytes);if(!mime)return {ok:false,rejected:true,businessId:business,ownerId:actor};
   const sha=await digest(bytes),op=await rpc('begin',actor,business,raw.requestKey,{p_selection_id:raw.selectionId,p_sha256:sha,p_byte_length:bytes.length,p_content_type:mime});
   if(!op.mayUpload)return {ok:true,...await observe(op,actor,business)};
   const path=await find(op,actor,business);
   if(path===op.plannedPath){
    await rateGate(actor,business,'upload');
    const current=await rpc('inspect',actor,business,raw.requestKey);
    if(!current.found||current.operationId!==op.operationId||current.revision!==op.revision||current.state!=='pending')throw Error('Original upload authority changed');
    const stored=await supabase.storage.from('busy-website-originals').upload(path,bytes,{contentType:mime,upsert:false,cacheControl:'3600'});
    if(stored.error)return {ok:true,...await observe(op,actor,business)};
   }
   // Never delete a known object if metadata/audit acknowledgement is lost.
   if(!await verify(op,path))return {ok:true,...op,mayUpload:false,mediaState:'unavailable'};
   const committed=await rpc('commit',actor,business,raw.requestKey,{p_verified_path:path});
   await audit(actor,business,path,'upload',bytes.length);
   return {ok:true,...committed,mediaState:'eligible'};
  }
 };
}
