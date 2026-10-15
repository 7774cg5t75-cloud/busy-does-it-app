// Encrypted device continuity, using the same SecureStore contract as existing
// private conversation/message recovery. No server state or replay authority.
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const MAX_CHARS=60000,MAX_AGE=7*24*60*60*1000;
function appStudioCheckpointKey({ownerId,businessId,app}={}){
 return [ownerId,businessId,app?.id].every(x=>UUID.test(x||''))?
  `busy_studio_v1_${ownerId}_${businessId}_${app.id}`:'';
}
const queues=new Map();
function createAppStudioCheckpoint(storage,context,{now=Date.now}={}){
 const key=appStudioCheckpointKey(context);
 // Same-scope remounts join outstanding native writes rather than racing them.
 const enqueue=work=>{
  const task=(queues.get(key)||Promise.resolve()).then(work);
  const tail=task.catch(()=>{});queues.set(key,tail);
  tail.then(()=>{if(queues.get(key)===tail)queues.delete(key);});return task;
 };
 return {
  load:()=>enqueue(async()=>{
   if(!key)throw Error('Open the signed-in private app to restore its draft.');
   const raw=await storage.getItemAsync(key);if(!raw)return null;
   if(raw.length>MAX_CHARS)throw Error('The saved Studio checkpoint is too large.');
   const saved=JSON.parse(raw);
   if(saved?.v!==1||saved.ownerId!==context.ownerId||saved.businessId!==context.businessId||
      saved.appId!==context.app.id||!Number.isSafeInteger(saved.at)||saved.at>now()||now()-saved.at>MAX_AGE)
    throw Error('The saved Studio checkpoint is outdated or belongs to another workspace.');
   return saved.state;
  }),
  save:state=>enqueue(async()=>{
   if(!key)throw Error('Private encrypted recovery is unavailable for this app.');
   if(!state){await storage.deleteItemAsync(key);return;}
   const raw=JSON.stringify({v:1,ownerId:context.ownerId,businessId:context.businessId,appId:context.app.id,at:now(),state});
   if(raw.length>MAX_CHARS)throw Error('This proposal is too large for private device recovery. Reduce the batch before approving.');
   await storage.setItemAsync(key,raw);
  })
 };
}
export {appStudioCheckpointKey,createAppStudioCheckpoint};
