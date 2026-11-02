import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {createHash} from 'node:crypto';

const root='sites/busy-headquarters/functions/api/';
const sharedSrc=readFileSync(root+'_shared.js','utf8');
const sharedURL='data:text/javascript;charset=utf-8,'+encodeURIComponent(sharedSrc);
const route=async name=>{
 const src=readFileSync(root+name+'.js','utf8').replaceAll("'./_shared.js'", JSON.stringify(sharedURL));
 return import('data:text/javascript;charset=utf-8,'+encodeURIComponent(src));
};
const [contact,early,confirm] = await Promise.all([route('contact'),route('early-access'),route('confirm')]);
const origin='https://busydoesit.co.uk';
const makeEnv=()=>({
 MARKETING_FORMS_ENABLED:'1',MARKETING_PRIVACY_APPROVED:'1',
 MARKETING_ALLOWED_HOSTS:'busydoesit.co.uk',MARKETING_PUBLIC_ORIGIN:origin,
 TURNSTILE_SITE_KEY:'fake_public',TURNSTILE_SECRET:'fake_secret',
 MARKETING_RATE_KV: (()=>{const items=new Map();return {
   get:async k=>items.get(k)||null,put:async(k,v)=>{items.set(k,v);}
 };})(),
 MARKETING_IP_PEPPER:'fake_pepper',SUPABASE_URL:'https://fake.supabase.local',
 SUPABASE_SERVICE_ROLE_KEY:'fake_role',RESEND_API_KEY:'fake_email_key',
 MARKETING_FROM:'Busy Does It <updates@notify.busydoesit.co.uk>'
});
const post=(route,payload,options={})=>new Request(origin+route,{
 method:'POST',
 headers:{'Origin':options.origin||origin,'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.11'},
 body:JSON.stringify(payload)
});
const captcha=(action)=>({success:true,action,hostname:'busydoesit.co.uk'});
async function useNetwork(fn) {
 const original=globalThis.fetch;const requests=[];let sent=[];
 const db=new Map();
 globalThis.fetch=async(input,init={})=>{
  const url=String(input);
  requests.push({url,method:init.method||'GET',body:init.body,headers:init.headers});
  if(url.includes('/turnstile/v0/siteverify')){
   const data=new URLSearchParams(init.body);
   return Response.json(captcha(data.get('response')==='contact-token'?'contact':'early_access'));
  }
  if(url==='https://api.resend.com/emails'){
   sent.push(JSON.parse(init.body));
   return Response.json({id:'mock-email-id'});
  }
  if(url.startsWith('https://fake.supabase.local/rest/v1/busy_marketing_waitlist')){
   const u=new URL(url), method=init.method||'GET';
   if(method==='GET'){
    const email=decodeURIComponent((u.searchParams.get('email')||'').replace(/^eq\./,''));
    return Response.json(db.has(email)?[{status:db.get(email).status}]:[]);
   }
   if(method==='POST'){
    const body=JSON.parse(init.body);
    assert.match(init.headers.Prefer,/resolution=merge-duplicates/);
    db.set(body.email,body);
    return new Response('',{status:201});
   }
   if(method==='PATCH'){
    const hash=(u.searchParams.get('token_hash')||'').slice(3);
    const row=[...db.values()].find(x=>x.token_hash===hash&&x.status==='pending');
    if(!row)return Response.json([]);
    assert.ok(Date.parse(row.token_expires_at)>Date.now());
    Object.assign(row,JSON.parse(init.body));
    return Response.json([row]);
   }
  }
  throw Error('Unexpected external request '+url);
 };
 try{await fn({requests,sent,db});}finally{globalThis.fetch=original;}
}

test('contact: disabled means no external requests; permitted form is validated and delivered',async()=>{
 await useNetwork(async({requests,sent})=>{
  const env=makeEnv(); env.MARKETING_FORMS_ENABLED='0';
  const req=post('/api/contact',{name:'Business Owner',email:'owner@example.com',message:'Hello from the website',turnstileToken:'contact-token'});
  const off=await contact.onRequestPost({request:req,env});
  assert.equal(off.status,503);assert.equal(requests.length,0);
  env.MARKETING_FORMS_ENABLED='1';
  const wrong=await contact.onRequestPost({request:post('/api/contact',{name:'X'}, {origin:'https://evil.example'}),env});
  assert.equal(wrong.status,403);assert.equal(requests.length,0);
  const invalid=await contact.onRequestPost({request:post('/api/contact',{name:'X',email:'bad',message:'Hi',turnstileToken:'contact-token'}),env});
  assert.equal(invalid.status,400);assert.equal(requests.length,0);
  const ok=await contact.onRequestPost({request:post('/api/contact',{name:'Business Owner',email:'owner@example.com',message:'Hello from the website',turnstileToken:'contact-token'}),env});
  assert.equal(ok.status,200);
  assert.equal((await ok.json()).message,'Your message has been sent.');
  assert.equal(sent.length,1);
  assert.equal(sent[0].to[0],'hello@busydoesit.co.uk');
  assert.equal(sent[0].reply_to,'owner@example.com');
  assert.match(sent[0].text,/Hello from the website/);
  assert.ok(requests.find(x=>x.url.includes('/siteverify')));
  assert.ok(!requests.some(x=>x.url.includes('fake.supabase')));
 });
});

test('waitlist: consent required, double opt-in and GET cannot confirm',async()=>{
 await useNetwork(async({requests,sent,db})=>{
  const env=makeEnv(),email='interested@example.net';
  const refused=await early.onRequestPost({env,request:post('/api/early-access',{email,consent:false,consentVersion:'2026-11-01-launch-only',turnstileToken:'early-access-token'})});
  assert.equal(refused.status,400);assert.equal(requests.length,0);
  const valid={email,consent:true,consentVersion:'2026-11-01-launch-only',turnstileToken:'early-access-token'};
  const submitted=await early.onRequestPost({env,request:post('/api/early-access',valid)});
  assert.equal(submitted.status,200);
  assert.equal(db.get(email).status,'pending');
  assert.equal(sent.length,1);
  assert.equal(sent[0].to[0],email);
  const match=sent[0].text.match(/https:\/\/busydoesit\.co\.uk\/api\/confirm\?token=([a-f0-9]{64})/);
  assert.ok(match,'confirmation link is present');
  const token=match[1];
  assert.equal(createHash('sha256').update(token).digest('hex'),db.get(email).token_hash);
  const confirmationURL=origin+'/api/confirm?token='+token;
  const before=await confirm.onRequestGet({env,request:new Request(confirmationURL)});
  assert.equal(before.status,200);
  assert.equal(db.get(email).status,'pending','GET did not confirm');
  const form=new URLSearchParams({token});
  const confirmed=await confirm.onRequestPost({env,request:new Request(confirmationURL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form})});
  assert.equal(confirmed.status,200);
  assert.equal(db.get(email).status,'confirmed');
  assert.equal(db.get(email).token_hash,null);
  const second=await confirm.onRequestPost({env,request:new Request(confirmationURL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token})})});
  assert.match(await second.text(),/expired or was already used/);
  assert.equal(db.get(email).status,'confirmed');
 });
});
