import {createBuilderProposalContext} from '../../../src/core/governedBuilderProposal.mjs';

export const creativeExecutionUuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
export const creativeExecutionDigest=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export const creativeExecutionReply=(status,code,extra={})=>new Response(JSON.stringify({ok:status===200,code,maySave:false,mayPublish:false,mayRetry:false,...extra}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});

export async function readCreativeExecutionOperation(request,version){
 if(!request.headers.get('content-type')?.startsWith('application/json')||Number(request.headers.get('content-length'))>256)throw Error('body');
 const reader=request.body?.getReader();if(!reader)throw Error('body');let size=0,timer;const parts=[];
 try{return await Promise.race([(async()=>{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>256)throw Error('body');parts.push(value);}const bytes=new Uint8Array(size);let at=0;for(const part of parts){bytes.set(part,at);at+=part.length;}const body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(!body||Array.isArray(body)||Object.keys(body).sort().join(',')!=='operationId,version'||body.version!==version||!creativeExecutionUuid(body.operationId))throw Error('body');return body.operationId;})(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('body')),3000);})]);}
 finally{clearTimeout(timer);try{await reader.cancel();}catch{}reader.releaseLock();}
}
export async function authenticateCreativeExecution(request,authenticate){
 const token=request.headers.get('authorization')||'';
 if(!/^Bearer [^\s]{20,4096}$/.test(token)||typeof authenticate!=='function')throw Error('sign_in');
 const actor=await authenticate(token.slice(7));
 if(!creativeExecutionUuid(actor?.id)||actor.anonymous===true)throw Error('sign_in');
 return actor;
}
export async function readOriginalCreativeExecutionContext({rpc,ownerId,businessId,binding}){
 const result=await rpc('busy_ai_context_v1',{p_actor:ownerId,p_business:businessId,p_binding:binding});
 if(result?.ownerId!==ownerId||result.businessId!==businessId)throw Error('foreign');
 // Home is the existing ledger's current-source anchor. The returned snapshot
 // contains ALL original pages; the v2 input seals every page and profile word.
 const context=createBuilderProposalContext({ownerId,businessId,projectId:binding.projectId,sourceRevision:binding.sourceRevision,profileRevision:binding.profileRevision,surface:'website',pageId:'home',project:result.project,profile:result.profile,catalog:result.catalog});
 if(!context.ok)throw Error('source');
 return {ownerId,businessId,profileRevision:binding.profileRevision,website:context.anchor.project,profile:context.anchor.profile};
}
