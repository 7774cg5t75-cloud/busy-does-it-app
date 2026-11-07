import {createClient} from '../_shared/supabaseClient.ts';
import {createStagingCreativeExecutionHandler,disabledCreativeExecution,CREATIVE_STAGING_URL} from '../busy-builder-proposals/executionBootstrap.mjs';
import {applyStructuredWebsiteEdit,applyWebsiteLayoutChange,rebuildPrivateWebsiteDraft,renderWebsiteHtml} from '../../../src/domain/websiteBuilder.js';
const planner={fieldEdit:applyStructuredWebsiteEdit,layoutEdit:applyWebsiteLayoutChange,rebuild:rebuildPrivateWebsiteDraft,renderPage:renderWebsiteHtml};
// No environment switch enables this reviewed server artifact. Execution is absent.
// A future separately approved artifact must pin exact owner approval, scope, count,
// tariff, wire digest and one operation/nonce. No request can supply those values.
const readManifest=async()=>disabledCreativeExecution;
const sha256=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
Deno.serve(async(request:Request)=>{
 const manifest=await readManifest();
 if(!manifest.enabled||!manifest.executionEnabled||Deno.env.get('SUPABASE_URL')!==CREATIVE_STAGING_URL)return new Response('Creative pilot disabled',{status:503,headers:{'Cache-Control':'no-store'}});
 const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(!service)return new Response('Unavailable',{status:503});
 const client=createClient(CREATIVE_STAGING_URL,service,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(10000)})}});
 const allowed=new Set(['busy_ai_context_v1','busy_ai_reserve_v1','busy_ai_dispatch_v1','busy_ai_finish_v1','busy_ai_operation_read_v1']);
 const handle=createStagingCreativeExecutionHandler({readManifest,projectUrl:CREATIVE_STAGING_URL,integrity:{sha256},planner,
  authenticate:async(token:string)=>{const {data,error}=await client.auth.getUser(token);if(error||!data.user||data.user.is_anonymous)throw Error('sign_in');return {id:data.user.id};},
  rpc:async(name:string,params:Record<string,unknown>)=>{if(!allowed.has(name))throw Error('unsupported');const {data,error}=await client.rpc(name,params);if(error)throw Error('original authority unavailable');return data;},
  transport:(url:string,options:RequestInit)=>fetch(url,options)
 });
 return handle(request);
});
