import {createCreativeDocumentLabAuthorities} from './labAuthorityHttp.mjs';
import {createLabCreativeDocumentExecutionHandler,disabledCreativeDocumentExecution} from '../busy-builder-proposals/creativeDocumentExecutionBootstrap.mjs';
import {CREATIVE_DOCUMENT_LAB_URL} from '../busy-builder-proposals/creativeDocumentExecution.mjs';
import {applyWebsitePageChange,renderWebsiteHtml} from '../../../src/domain/websiteBuilder.js';

// DISABLED deployment candidate only. No env flag or client property activates
// it. A separately reviewed future server artifact must pin one fresh synthetic
// source, exact approval, current tariff, complete token count and operation.
const readManifest=async()=>disabledCreativeDocumentExecution;
// Reviewed original renderer closure, excluding this server activation entry.
// The deployment compiler independently checks all renderer dependency bytes.
const rendererDigest='4c55a4d33388e54fba7ea7bd0baa829dac23d83bde60b2676584ec27aaadf172';
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
 const authorities=createCreativeDocumentLabAuthorities({fetchImpl:fetch,serviceKey:service});
 const handle=createLabCreativeDocumentExecutionHandler({readManifest,rendererDigest,projectUrl:CREATIVE_DOCUMENT_LAB_URL,integrity:{sha256},planner:{pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml},
  authenticate:authorities.authenticate,
  rpc:authorities.rpc,
  transport:(url:string,options:RequestInit)=>fetch(url,options)
 });
 return handle(request);
});
