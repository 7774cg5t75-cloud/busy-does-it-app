import {createClient} from '../_shared/supabaseClient.ts';
import {createLabCreativeDocumentExecutionHandler,disabledCreativeDocumentExecution} from '../busy-builder-proposals/creativeDocumentExecutionBootstrap.mjs';
import {CREATIVE_DOCUMENT_LAB_URL} from '../busy-builder-proposals/creativeDocumentExecution.mjs';
import {applyWebsitePageChange,renderWebsiteHtml} from '../../../src/domain/websiteBuilder.js';

// DISABLED deployment candidate only. No env flag or client property activates
// it. A separately reviewed future server artifact must pin one fresh synthetic
// source, exact approval, current tariff, complete token count and operation.
const readManifest=async()=>disabledCreativeDocumentExecution;
const sha256=async(value:string|Uint8Array)=>{
 const bytes=typeof value==='string'?new TextEncoder().encode(value):Uint8Array.from(value);
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes.buffer)),byte=>byte.toString(16).padStart(2,'0')).join('');
};
Deno.serve(async(request:Request)=>{
 const manifest=await readManifest();
 // Check the hard-disabled artifact BEFORE reading any environment binding.
 if(!manifest.enabled||!manifest.executionEnabled)return new Response('Creative document pilot disabled',{status:503,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 if(Deno.env.get('SUPABASE_URL')!==CREATIVE_DOCUMENT_LAB_URL)return new Response('Unavailable',{status:503});
 const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(!service)return new Response('Unavailable',{status:503});
 const client=createClient(CREATIVE_DOCUMENT_LAB_URL,service,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(10000)})}});
 const allowed=new Set(['busy_ai_context_v1','busy_ai_reserve_v1','busy_ai_dispatch_v1','busy_ai_finish_v1','busy_ai_operation_read_v1']);
 const handle=createLabCreativeDocumentExecutionHandler({readManifest,projectUrl:CREATIVE_DOCUMENT_LAB_URL,integrity:{sha256},planner:{pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml},
  authenticate:async(token:string)=>{const {data,error}=await client.auth.getUser(token);if(error||!data.user||data.user.is_anonymous)throw Error('sign_in');return {id:data.user.id};},
  rpc:async(name:string,params:Record<string,unknown>)=>{if(!allowed.has(name))throw Error('unsupported');const {data,error}=await client.rpc(name,params);if(error)throw Error('original authority unavailable');return data;},
  transport:(url:string,options:RequestInit)=>fetch(url,options)
 });
 return handle(request);
});
