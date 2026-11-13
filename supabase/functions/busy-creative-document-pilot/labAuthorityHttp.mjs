// Pilot-local HTTP bindings for the EXISTING native Auth and central AI RPCs.
// No SDK, environment access, sign-in, token refresh, retries or provider port.
import {CREATIVE_DOCUMENT_LAB_URL} from '../busy-builder-proposals/creativeDocumentExecution.mjs';

export const CREATIVE_DOCUMENT_LAB_AUTHORITY_VERSION='busy.lab-creative-authority-http.v1';
export const CREATIVE_DOCUMENT_LAB_RPCS=Object.freeze(['busy_ai_context_v1','busy_ai_reserve_v1','busy_ai_dispatch_v1','busy_ai_finish_v1','busy_ai_operation_read_v1']);
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
const token=value=>typeof value==='string'&&value.length>=20&&value.length<=16384&&/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
const secret=value=>token(value)||(typeof value==='string'&&/^sb_secret_[A-Za-z0-9_-]{16,512}$/.test(value));
const unavailable=()=>new Error('Original Lab authority unavailable; no automatic replay');
function argumentsJson(value){
 if(!plain(value))throw unavailable();
 const seen=new Set();let count=0;
 function visit(item,depth=0){
  if(++count>18000||depth>40)throw unavailable();
  if(item===null||typeof item==='string'||typeof item==='boolean')return;
  if(typeof item==='number'&&Number.isFinite(item))return;
  if(!Array.isArray(item)&&!plain(item))throw unavailable();
  if(seen.has(item))throw unavailable();seen.add(item);
  for(const descriptor of Object.values(Object.getOwnPropertyDescriptors(item))){if(!('value'in descriptor))throw unavailable();visit(descriptor.value,depth+1);}
  seen.delete(item);
 }
 visit(value);const text=JSON.stringify(value);
 if(new TextEncoder().encode(text).byteLength>650000)throw unavailable();return text;
}

/** @param {{fetchImpl?: typeof fetch,serviceKey?: string,requestTimeoutMs?: number}} [options] */
export function createCreativeDocumentLabAuthorities({fetchImpl,serviceKey,requestTimeoutMs=10000}={}){
 if(typeof fetchImpl!=='function'||!secret(serviceKey)||!Number.isSafeInteger(requestTimeoutMs)||requestTimeoutMs<1||requestTimeoutMs>10000)throw unavailable();
 const request=async(path,{method='GET',bearer,body,maxBytes=650000}={})=>{
  const controller=new AbortController();let timer,reader;
  const url=CREATIVE_DOCUMENT_LAB_URL+path;
  const execute=async()=>{
   const headers={Accept:'application/json',apikey:serviceKey,...(bearer?{Authorization:'Bearer '+bearer}:{}),...(body?{'Content-Type':'application/json','Accept-Profile':'public','Content-Profile':'public'}:{})};
   const response=await fetchImpl(url,{method,headers,body,signal:controller.signal,redirect:'error',cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
   if(!response||response.status!==200||response.redirected===true||(response.url&&response.url!==url))throw unavailable();
   const type=response.headers?.get('content-type')||'',length=response.headers?.get('content-length');
   if(!/^application\/json(?:;|$)/i.test(type)||(length!==null&&length!==undefined&&(!/^\d+$/.test(length)||Number(length)>maxBytes)))throw unavailable();
   reader=response.body?.getReader();if(!reader)throw unavailable();
   const chunks=[];let size=0;
   for(;;){const part=await reader.read();if(part.done)break;if(!(part.value instanceof Uint8Array)||(size+=part.value.byteLength)>maxBytes)throw unavailable();chunks.push(part.value);}
   const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
   const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
   if(text.includes(serviceKey)||(bearer&&text.includes(bearer)))throw unavailable();
   return JSON.parse(text);
  };
  try{return await Promise.race([execute(),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(unavailable());},requestTimeoutMs);})]);}
  catch{throw unavailable();}
  finally{clearTimeout(timer);controller.abort();try{void reader?.cancel()?.catch(()=>{});}catch{}try{reader?.releaseLock();}catch{}}
 };
 return Object.freeze({
  authenticate:async bearer=>{
   if(!token(bearer)||bearer===serviceKey)throw unavailable();
   const user=await request('/auth/v1/user',{bearer,maxBytes:32768});
   if(!plain(user)||typeof user.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)||user.is_anonymous!==false||user.role!=='authenticated'||user.aud!=='authenticated')throw unavailable();
   return {id:user.id};
  },
  rpc:async(name,params)=>{
   if(!CREATIVE_DOCUMENT_LAB_RPCS.includes(name))throw unavailable();
   // Native legacy service JWT keeps the SDK's Authorization semantics;
   // modern server keys use only apikey, as the original B3 HTTP binding does.
   return request('/rest/v1/rpc/'+name,{method:'POST',body:argumentsJson(params),...(token(serviceKey)?{bearer:serviceKey}:{})});
  }
 });
}
