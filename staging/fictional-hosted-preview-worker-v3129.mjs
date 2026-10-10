/**
 * V3.129 independent fictional website-preview Worker.
 * Data: only generated fictional static HTML. No real customer information.
 * A real Supabase Auth /auth/v1/user check is required for EACH response.
 * The staging environment is fail-closed; no staging project or domain is
 * created or altered by importing this module. No website writes allowed.
 */
const REF=/^[a-z]{20}$/;
const SHA=/^[a-f0-9]{40}$/i;
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const HEADERS={
  "Cache-Control":"private, no-store, max-age=0",
  "X-Robots-Tag":"noindex, nofollow, noarchive",
  "X-Content-Type-Options":"nosniff",
  "Referrer-Policy":"no-referrer",
  "Cross-Origin-Resource-Policy":"same-origin",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
};
const jsonHeaders={...HEADERS,"Content-Type":"application/json; charset=utf-8"};
const htmlHeaders={...HEADERS,"Content-Type":"text/html; charset=utf-8"};
function stageBoundary(env={},url=null,sourceSha=""){
 const project=env.BUSY_STAGING_SUPABASE_REF||"",
  prod=env.BUSY_PRODUCTION_SUPABASE_REF||"",
  other=env.BUSY_OTHER_PROTECTED_SUPABASE_REF||"",
  host=env.BUSY_STAGING_EXPECTED_HOST||"";
 return !!url&&
  [project,prod,other].every(x=>REF.test(x))&&
  new Set([project,prod,other]).size===3&&
  SHA.test(sourceSha)&&env.BUSY_STAGING_SOURCE_SHA===sourceSha&&
  typeof host==="string"&&/^[a-z0-9]+(?:[.-][a-z0-9-]+)*\.[a-z]{2,}$/.test(host)&&
  !["busydoesit.co.uk","sites.busydoesit.co.uk"].includes(host)&&
  url.protocol==="https:"&&url.hostname===host&&!url.port&&!url.username&&!url.password&&
  typeof env.BUSY_STAGING_PUBLISHABLE_KEY==="string"&&
  /^sb_publishable_[A-Za-z0-9_-]{15,}$/.test(env.BUSY_STAGING_PUBLISHABLE_KEY)&&
  UUID.test(env.BUSY_STAGING_OWNER_A_ID||"")&&
  UUID.test(env.BUSY_STAGING_OWNER_B_ID||"")&&
  env.BUSY_STAGING_OWNER_A_ID!==env.BUSY_STAGING_OWNER_B_ID;
}
function verifiedPreviewAssets(assets=[],sha=""){
 return SHA.test(sha)&&Array.isArray(assets)&&assets.length===2&&
  ["a","b"].every(slot=>{
   const rows=assets.filter(item=>item.slot===slot);
   const item=rows[0];
   return rows.length===1&&UUID.test(item?.id||"")&&
    Number.isSafeInteger(item?.revision)&&item.revision>0&&
    typeof item.html==="string"&&item.html.length>200&&item.html.length<150000&&
    /^[a-f0-9]{64}$/.test(item.digest||"")&&
    item.fictionalOnly===true;
  })&&assets[0].id!==assets[1].id;
}
function createFictionalHostedPreviewWorker({assets=[],sourceSha="",authFetch=fetch}={}){
 const assetsValid=verifiedPreviewAssets(assets,sourceSha);
 const lookup=new Map(assetsValid?assets.map(item=>[item.id,item]):[]);
 const reply=(code,method="GET")=>new Response(method==="HEAD"?null:
  JSON.stringify({status:"unavailable"}),{status:code,headers:jsonHeaders});
 return {
  async fetch(request,env={},ctx={}){
   if(request.method!=="GET"&&request.method!=="HEAD")return reply(405);
   let url;
   try{url=new URL(request.url);}catch{return reply(400);}
   if(!assetsValid||!stageBoundary(env,url,sourceSha))return reply(503,request.method);
   if(url.search||url.hash)return reply(404,request.method);
   if(url.pathname==="/__busy_staging/health"){
    return new Response(request.method==="HEAD"?null:JSON.stringify({
     status:"preview-worker-configured",sourceCommit:sourceSha,
     environment:"isolated-staging",fictionalOnly:true,
     genuineAuthVerifiedForThisRequest:false,
     fullAppStagingVerified:false,websitePublishedPublicly:false
    }),{status:200,headers:jsonHeaders});
   }
   const match=/^\/preview\/([a-f0-9-]{36})$/.exec(url.pathname);
   const item=match?lookup.get(match[1]):null;
   if(!item)return reply(404,request.method);
   // Do not accept caller-provided role/business/user claims. Require the
   // real staging Auth server to validate the bearer and identify the user.
   const auth=request.headers.get("Authorization")||"";
   if(!/^Bearer [^\s]{30,}$/.test(auth))return reply(401,request.method);
   const authUrl="https://"+env.BUSY_STAGING_SUPABASE_REF+".supabase.co/auth/v1/user";
   let identity=null;
   try{
    const response=await authFetch(authUrl,{
     method:"GET",headers:{apikey:env.BUSY_STAGING_PUBLISHABLE_KEY,
      Authorization:auth,Accept:"application/json"},
     redirect:"error",cache:"no-store",
     signal:AbortSignal.timeout(5000)
    });
    if(response.status===200)identity=await response.json();
   }catch{return reply(503,request.method);}
   const requiredOwner=item.slot==="a"?
    env.BUSY_STAGING_OWNER_A_ID:env.BUSY_STAGING_OWNER_B_ID;
   if(!identity||identity.id!==requiredOwner)return reply(404,request.method);
   // Do not fetch fonts, scripts, database records or private URLs.
   return new Response(request.method==="HEAD"?null:item.html,{
    status:200,headers:{...htmlHeaders,
     "X-Preview-Revision":String(item.revision),
     "X-Content-SHA256":item.digest}
   });
  }
 };
}
export {createFictionalHostedPreviewWorker,stageBoundary,verifiedPreviewAssets};
