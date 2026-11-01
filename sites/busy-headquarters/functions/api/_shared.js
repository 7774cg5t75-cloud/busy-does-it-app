// Server-only helpers for the Busy marketing site. No secrets or personal data in client files.
const jsonHeaders = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
export function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:jsonHeaders});}
export function ready(env,host) {
  const allowed=(env.MARKETING_ALLOWED_HOSTS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  return env.MARKETING_FORMS_ENABLED==='1' && env.MARKETING_PRIVACY_APPROVED==='1'
    && allowed.includes(host.toLowerCase()) && !!env.TURNSTILE_SITE_KEY
    && !!env.TURNSTILE_SECRET && !!env.MARKETING_RATE_KV && !!env.MARKETING_IP_PEPPER
    && !!env.SUPABASE_URL && !!env.SUPABASE_SERVICE_ROLE_KEY && !!env.RESEND_API_KEY
    && !!env.MARKETING_FROM && !!env.MARKETING_PUBLIC_ORIGIN
    && /^https:\/\//.test(env.MARKETING_PUBLIC_ORIGIN)
    && new URL(env.MARKETING_PUBLIC_ORIGIN).hostname===host;
}
export function isAllowedRequest(request){
  const actual=new URL(request.url).origin;
  return request.headers.get('Origin')===actual && request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase()==='application/json';
}
export async function bodyJson(request){
  if(Number(request.headers.get('Content-Length')||0)>12000)throw new Error('invalid_payload');
  const text=await request.text();
  if(text.length>12000)throw new Error('invalid_payload');
  const obj=JSON.parse(text);
  if(!obj||typeof obj!=='object'||Array.isArray(obj))throw new Error('invalid_payload');
  return obj;
}
export function emailValid(s){return typeof s==='string' && s.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);}
export function clean(s,max){return typeof s==='string'?s.trim().slice(0,max+1):'';}
export async function sha256(str) {
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));
  return Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function rateLimit(env,request,type){
  // KV is an additional soft throttle, NOT atomic. Cloudflare WAF rate limiting is required before public activation.
  const ip=request.headers.get('CF-Connecting-IP')||'';
  if(!ip)return false;
  const key='marketing:'+type+':'+await sha256(env.MARKETING_IP_PEPPER+':'+ip+':'+new Date().toISOString().slice(0,13));
  const count=Number(await env.MARKETING_RATE_KV.get(key)||'0');
  if(!Number.isSafeInteger(count)||count>=5)return false;
  await env.MARKETING_RATE_KV.put(key,String(count+1),{expirationTtl:7200});
  return true;
}
export async function verifyHuman(env,request,token,action) {
  if(typeof token!=='string'||token.length<10||token.length>2048)return false;
  const body=new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token});
  const ip=request.headers.get('CF-Connecting-IP');
  if(ip)body.set('remoteip',ip);
  const result=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body
  });
  if(!result.ok)return false;
  const validation=await result.json();
  return validation.success===true && validation.action===action && validation.hostname===new URL(request.url).hostname;
}
export async function resend(env,{to,subject,text,replyTo}){
  const payload={from:env.MARKETING_FROM,to:[to],subject,text};
  if(replyTo)payload.reply_to=replyTo;
  const r=await fetch('https://api.resend.com/emails',{method:'POST',
    headers:{'Authorization':'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},
    body:JSON.stringify(payload)});
  if(!r.ok)throw new Error('email_provider_unavailable');
}
export async function supabase(env,table,method,query,body,returnRepresentation=false){
  const base=env.SUPABASE_URL.replace(/\/$/,'');
  const r=await fetch(base+'/rest/v1/'+table+(query?'?'+query:''),{
    method,headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type':'application/json',
      Prefer:(method==='POST'?'resolution=merge-duplicates,':'')+(returnRepresentation?'return=representation':'return=minimal')},
    body:body===undefined?undefined:JSON.stringify(body)});
  if(!r.ok)throw new Error('database_unavailable');
  return returnRepresentation?await r.json():null;
}
export function errorResponse(err){
  if(err instanceof SyntaxError || err.message==='invalid_payload')return json({ok:false,error:'Please check the form and try again.'},400);
  return json({ok:false,error:'We could not complete that request. Please try again later.'},503);
}
