import {createClient} from '../_shared/supabaseClient.ts';
import {createBuilderProposalGateway} from './gateway.mjs';
import {offlineBuilderProvider} from './offlineProvider.mjs';
// No OpenAI/provider key, URL or live adapter. Source is disabled by default.
// Enabling even this offline hosted route remains a separate approval operation.
Deno.serve(async(request:Request)=>{
 const projectUrl=Deno.env.get('SUPABASE_URL')||'';
 if(Deno.env.get('BUSY_AI_PROPOSALS_OFFLINE_ENABLED')!=='reviewed-offline-only'||projectUrl!=='https://pnjdlogwegnqbsfpcofw.supabase.co')return new Response('Preparation is disabled',{status:503,headers:{'Cache-Control':'no-store'}});
 const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(!secret)return new Response('Preparation is unavailable',{status:503});
 const client=createClient(projectUrl,secret,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(10000)})}});
 const handler=createBuilderProposalGateway({enabled:true,projectUrl,providerMode:'offline-simulation',offlineProvider:offlineBuilderProvider,
  authenticate:async(token:string)=>{const {data,error}=await client.auth.getUser(token);if(error||!data.user||data.user.is_anonymous)throw Error('Unauthenticated');return {id:data.user.id};},
  rpc:async(name:string,params:Record<string,unknown>)=>{
   if(!['busy_ai_context_v1','busy_ai_reserve_v1','busy_ai_dispatch_v1','busy_ai_finish_v1'].includes(name))throw Error('Unsupported operation');
   const {data,error}=await client.rpc(name,params);if(error)throw Error(error.message);return data;
  }});
 return handler(request);
});
