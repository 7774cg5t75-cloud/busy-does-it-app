import {stableJson} from '../../src/core/stableJson.mjs';

export const DISABLED_CREATIVE_SMOKE_VERSION='busy.ai-lab-disabled-creative-smoke.v1';
export const DISABLED_CREATIVE_SMOKE_URL='https://sbvkrvksnruiclcvclbd.supabase.co/functions/v1/busy-creative-document-pilot';
const keys=['version','status','executionId','projectId','functionName','deploymentFilesDigest','expiresAt','maximumRequests','protectedRuntimeVerified'];
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const sha=/^[0-9a-f]{64}$/;
const plain=value=>value&&Object.getPrototypeOf(value)===Object.prototype&&Object.values(Object.getOwnPropertyDescriptors(value)).every(d=>Object.hasOwn(d,'value'));

// No CLI, env reader, native sign-in, server/provider credential, budget or
// database port. A future protected owner runtime must verify the actual
// deployment/approval and supply an atomic one-use intent store. The module
// itself cannot attest that a caller is protected or authorised.
export function createDisabledCreativeDocumentSmoke(ports={}){
 let used=false;
 return async()=>{
  const receipt={version:DISABLED_CREATIVE_SMOKE_VERSION,status:'denied',mayReplay:false,requestsAttempted:0,publishableKeyReads:0,nativeSignIns:0,applicationWrites:0,reservations:0,providerCalls:0,spendingGBP:0};
  if(used)return {...receipt,status:'already-used'};used=true;
  let key=null,intentAttempted=false;
  const controllers=new Set();
  try{
   if(['readServerApproval','claimOneUseIntent','readLabPublishableKey','fetchImpl'].some(name=>typeof ports[name]!=='function')||!sha.test(ports.expectedFilesDigest))return receipt;
   const now=()=>typeof ports.clock==='function'?ports.clock():Date.now();
   const read=async()=>{const a=await ports.readServerApproval();if(!plain(a)||Object.keys(a).sort().join(',')!==[...keys].sort().join(','))throw Error('approval');return structuredClone(a);};
   const approval=await read();
   const valid=a=>a.version===DISABLED_CREATIVE_SMOKE_VERSION&&a.status==='owner-approved'&&uuid.test(a.executionId)&&a.projectId==='sbvkrvksnruiclcvclbd'&&a.functionName==='busy-creative-document-pilot'&&a.deploymentFilesDigest===ports.expectedFilesDigest&&a.maximumRequests===3&&a.protectedRuntimeVerified===true&&Number.isFinite(Date.parse(a.expiresAt))&&now()<Date.parse(a.expiresAt)&&Date.parse(a.expiresAt)<=now()+3600000;
   if(!valid(approval))return receipt;
   const unchanged=async()=>{const a=await read();if(!valid(a)||stableJson(a)!==stableJson(approval))throw Error('approval');};
   intentAttempted=true;
   const claimed=await ports.claimOneUseIntent({version:DISABLED_CREATIVE_SMOKE_VERSION,executionId:approval.executionId,deploymentFilesDigest:approval.deploymentFilesDigest,maximumRequests:3});
   if(!plain(claimed)||claimed.consumed!==true||claimed.executionId!==approval.executionId||claimed.deploymentFilesDigest!==approval.deploymentFilesDigest)throw Error('intent');
   const stages=[{id:'missing-credentials',status:401,headers:{}},{id:'invalid-bearer',status:401,headers:{Authorization:'Bearer synthetic-invalid-token-only'}},{id:'publishable-key-disabled',status:503,headers:null}];
   receipt.results=[];
   for(const stage of stages){
    await unchanged();
    if(stage.headers===null){
     receipt.publishableKeyReads++;key=await ports.readLabPublishableKey();
     if(typeof key!=='string'||!/^sb_publishable_[A-Za-z0-9_-]{16,240}$/.test(key))throw Error('credential');
     await unchanged();stage.headers={apikey:key};
    }
    const controller=new AbortController();controllers.add(controller);
    let timer;
    const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('deadline'));},10000);});
    const request=async()=>{
     receipt.requestsAttempted++;
     const response=await ports.fetchImpl(DISABLED_CREATIVE_SMOKE_URL,{method:'POST',headers:{'content-type':'application/json',...stage.headers},body:'{}',redirect:'error',signal:controller.signal});
     if(!(response instanceof Response)||response.status!==stage.status||(response.url&&response.url!==DISABLED_CREATIVE_SMOKE_URL)||Number(response.headers.get('content-length')||0)>4096)throw Error('response');
     const reader=response.body?.getReader(),chunks=[];let length=0;
     try{if(reader)for(;;){const part=await reader.read();if(part.done)break;length+=part.value.byteLength;if(length>4096)throw Error('response');chunks.push(part.value);}}finally{if(reader)try{await reader.cancel();}catch{}}
     const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
     const body=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
     if(key&&body.includes(key))throw Error('response');
     if(stage.status===503&&(body!=='Creative document pilot disabled'||response.headers.get('cache-control')!=='no-store'||response.headers.get('x-content-type-options')!=='nosniff'))throw Error('response');
     return {id:stage.id,status:response.status};
    };
    try{receipt.results.push(await Promise.race([request(),timeout]));}finally{clearTimeout(timer);controller.abort();controllers.delete(controller);}
   }
   await unchanged();
   receipt.status='disabled-route-verified';receipt.ownerAuthenticationProven=false;
   return receipt;
  }catch{
   receipt.status=receipt.requestsAttempted?'stopped-inspect-only':intentAttempted?'intent-unconfirmed':'denied';return receipt;
  }finally{key=null;for(const controller of controllers)controller.abort();}
 };
}
