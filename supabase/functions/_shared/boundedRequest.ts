// Read bytes incrementally: Content-Length is only a hint, never a memory limit.
export class BoundedRequestError extends Error {
 constructor(public readonly status:number){super(status===413?'Request is too large.':'Request could not be read safely.');}
}
export async function boundedJson(request:Request,maxBytes:number,timeoutMs=10000):Promise<unknown>{
 if(!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>16000000)throw new Error('Invalid request bound');
 const declared=request.headers.get('content-length');
 if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>maxBytes))throw new BoundedRequestError(413);
 if(!request.body)throw new BoundedRequestError(400);
 const reader=request.body.getReader(),chunks:Uint8Array[]=[];let total=0,timer:ReturnType<typeof setTimeout>|undefined;
 const deadline=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new BoundedRequestError(408)),timeoutMs);});
 try{
  while(true){const part=await Promise.race([reader.read(),deadline]);if(part.done)break;total+=part.value.byteLength;if(total>maxBytes)throw new BoundedRequestError(413);chunks.push(part.value);}
  const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new BoundedRequestError(400);}
 }catch(error){void reader.cancel().catch(()=>{});throw error;}
 finally{clearTimeout(timer);reader.releaseLock();}
}
