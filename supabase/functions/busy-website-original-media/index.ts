import {originalUploadOperations} from './uploadOperations.mjs';
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "jsr:@supabase/supabase-js@2";

/**
 * Explicit, authenticated business-owned original-photo transfer.
 * No arbitrary URL proxy, no signed URL, no legacy shared social bucket reads.
 * Deploy ONLY after the private-bucket/registry migration is applied.
 */
const URL=Deno.env.get("SUPABASE_URL")||"";
const KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const BUCKET="busy-website-originals";
const TABLE="busy_website_original_media";
const AUDIT="busy_website_original_media_audit";
const MAX=9*1024*1024;
const UPLOAD_OPERATIONS_ENABLED=false;
const supabase=createClient(URL,KEY,{auth:{persistSession:false}});
const cors={"Access-Control-Allow-Origin":"*",
 "Access-Control-Allow-Methods":"POST, OPTIONS",
 "Access-Control-Expose-Headers":"X-Busy-Original-Sha256,Content-Length,Content-Type",
 "Access-Control-Allow-Headers":"authorization, apikey, content-type, x-busy-request-id"};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail=(status:number,message:string)=>new Response(JSON.stringify({ok:false,error:message}),{
 status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
const success=(value:unknown)=>new Response(JSON.stringify({ok:true,...value as object}),{
 headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
function inspect(bytes:Uint8Array){
 if(bytes.length<20||bytes.length>MAX)return "";
 const n=bytes.length;
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255&&bytes[n-2]===255&&bytes[n-1]===217)
  return "image/jpeg";
 if([137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)&&
    String.fromCharCode(...bytes.slice(n-8,n-4))==="IEND")return "image/png";
 const tag=(start:number,end:number)=>String.fromCharCode(...bytes.slice(start,end));
 if(tag(0,4)==="RIFF"&&tag(8,12)==="WEBP"&&
    (bytes[4]+(bytes[5]<<8)+(bytes[6]<<16)+(bytes[7]*16777216))>>>0===n-8)
  return "image/webp";
 return "";
}
function pathAllowed(path:string,businessId:string){
 const match=/^([0-9a-f-]{36})\/([0-9a-f-]{36})\/([0-9a-f-]{36})\.(jpg|png|webp)$/i.exec(path);
 return !!match&&match[1].toLowerCase()===businessId.toLowerCase()&&
  UUID.test(match[1])&&UUID.test(match[2])&&UUID.test(match[3]);
}
async function auth(req:Request,businessId:string){
 if(!UUID.test(businessId))throw Error("Select a valid business.");
 const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
 if(!token)throw Error("Sign in to back up or export your pictures.");
 const {data,error}=await supabase.auth.getUser(token);
 if(error||!data?.user?.id)throw Error("Your session expired. Sign in again.");
 const row=await supabase.from("busy_business_memberships").select("role")
  .eq("business_id",businessId).eq("user_id",data.user.id).maybeSingle();
 if(row.error)throw row.error;
 if(!["owner","admin"].includes(row.data?.role))
  throw Error("Only a business owner or admin can transfer website originals.");
 return data.user.id as string;
}
async function rateGate(userId:string,businessId:string,action:string){
 const hour=new Date(Date.now()-3600000).toISOString();
 const result=await supabase.from(AUDIT).select("id",{count:"exact",head:true})
  .eq("user_id",userId).eq("business_id",businessId).eq("action",action)
  .gte("created_at",hour);
 if(result.error)throw result.error;
 if((result.count||0)>=60)throw Error("Photo transfers are temporarily limited. Try again later.");
}
async function audit(userId:string,businessId:string,path:string,action:string,bytes:number){
 const r=await supabase.from(AUDIT).insert({user_id:userId,business_id:businessId,
  storage_path:path,action,byte_length:bytes});
 if(r.error)throw r.error;
}
const uploadOperations=originalUploadOperations({supabase,inspect,rateGate,audit,digest:async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('')});
async function upload(req:Request,raw:any,userId:string,businessId:string){
 const encoded=raw?.photoBase64;
 if(typeof encoded!=="string"||encoded.length<28||encoded.length>12_600_000||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))return fail(400,"Photo upload is not valid bounded base64.");
 await rateGate(userId,businessId,"upload");
 let bytes:Uint8Array;
 try{const data=atob(encoded);bytes=Uint8Array.from(data,c=>c.charCodeAt(0));}
 catch{return fail(400,"The original photograph could not be decoded.");}
 const mime=inspect(bytes);
 if(!mime)return fail(400,"Choose a JPEG, PNG or WebP original no larger than 9 MB.");
 const digestInput=new Uint8Array(bytes.length);
 digestInput.set(bytes);
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",digestInput.buffer)))
  .map(x=>x.toString(16).padStart(2,"0")).join("");
 const known=await supabase.from(TABLE).select("storage_path")
  .eq("business_id",businessId).eq("uploaded_by",userId).eq("sha256",digest).maybeSingle();
 if(known.error)throw known.error;
 if(known.data?.storage_path)return success({storagePath:known.data.storage_path,reused:true,
  bytes:bytes.length,contentType:mime});
 const ext=mime==="image/png"?"png":mime==="image/webp"?"webp":"jpg";
 const path=`${businessId}/${userId}/${crypto.randomUUID()}.${ext}`;
 const stored=await supabase.storage.from(BUCKET).upload(path,bytes,
  {contentType:mime,upsert:false,cacheControl:"3600"});
 if(stored.error)throw stored.error;
 const inserted=await supabase.from(TABLE).insert({business_id:businessId,
  uploaded_by:userId,storage_path:path,content_type:mime,byte_length:bytes.length,sha256:digest});
 if(inserted.error){
  await supabase.storage.from(BUCKET).remove([path]);
  throw inserted.error;
 }
 await audit(userId,businessId,path,"upload",bytes.length);
 return success({storagePath:path,reused:false,bytes:bytes.length,contentType:mime});
}
async function download(raw:any,userId:string,businessId:string){
 const path=typeof raw?.storagePath==="string"?raw.storagePath:"";
 if(!pathAllowed(path,businessId))return fail(403,"This is not a verified original from the selected business.");
 await rateGate(userId,businessId,"download");
 const record=await supabase.from(TABLE).select("content_type,byte_length,sha256")
  .eq("business_id",businessId).eq("storage_path",path).maybeSingle();
 if(record.error)throw record.error;
 if(!record.data||record.data.byte_length>MAX)return fail(404,"Approved cloud original was not found.");
 const result=await supabase.storage.from(BUCKET).download(path);
 if(result.error||!result.data)return fail(404,"The original photograph is not available.");
 const bytes=new Uint8Array(await result.data.arrayBuffer());
 if(bytes.length!==record.data.byte_length||inspect(bytes)!==record.data.content_type)
  return fail(409,"The backed-up original did not pass the integrity checks.");
 const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
 if(sha!==record.data.sha256||raw.expectedSha256!==undefined&&raw.expectedSha256!==sha)return fail(409,"The original digest did not match the reviewed asset.");
 await audit(userId,businessId,path,"download",bytes.length);
 return new Response(bytes,{status:200,headers:{...cors,
  "Content-Type":record.data.content_type,"Content-Length":String(bytes.length),
  "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","X-Busy-Original-Sha256":sha}});
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="POST")return fail(405,"Use the authenticated photo transfer action.");
 if(!URL||!KEY)return fail(503,"Secure photo transfer is not configured.");
 try{
  if(Number(req.headers.get("content-length")||0)>12_800_000)
   return fail(413,"Photo transfer request is too large.");
  const text=await req.text();
  if(text.length>12_800_000)return fail(413,"Photo transfer request is too large.");
  const raw=JSON.parse(text);
  const businessId=typeof raw?.businessId==="string"?raw.businessId:"";
  const userId=await auth(req,businessId);
  if(['creator_upload','creator_upload_inspect','creator_upload_list'].includes(raw?.action)){
   if(!UPLOAD_OPERATIONS_ENABLED)return fail(503,'Creator upload operations are not activated.');
   const value=raw.action==='creator_upload'?await uploadOperations.upload(raw,userId,businessId):raw.action==='creator_upload_inspect'?await uploadOperations.inspect(raw,userId,businessId):await uploadOperations.list(raw,userId,businessId);return success(value);
  }
  if(raw?.action==="upload")return await upload(req,raw,userId,businessId);
  if(raw?.action==="download")return await download(raw,userId,businessId);
  return fail(400,"Unknown photo transfer action.");
 }catch(error){
  const message=String((error as Error)?.message||"Private original transfer failed.");
  if(/only a business owner|not a verified|select a valid|sign in|session expired/i.test(message))
   return fail(403,message);
  // Never return database, provider or storage internals to a customer.
  return fail(503,"Secure photo transfer is unavailable. No website was changed. Try again later.");
 }
});
