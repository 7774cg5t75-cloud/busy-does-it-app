import {ready,supabase,sha256} from './_shared.js';
const headers={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; style-src 'unsafe-inline'"};
function page(message,token){
  const form=token?'<form method="POST"><input type="hidden" name="token" value="'+token+'"><button type="submit">Confirm my email</button></form>':'';
  return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Busy Does It — early access</title><style>body{font:17px system-ui;line-height:1.6;max-width:620px;padding:55px 22px;margin:auto;background:#080f20;color:#f3f6fb}button{padding:15px 23px;border:0;border-radius:12px;background:#83e8fa;color:#071320;font-weight:700;cursor:pointer}a{color:#83e8fa}</style><h1>Busy Does It</h1><p>'+message+'</p>'+form+'<p><a href="/">Back to Busy</a></p></html>',{headers});
}
export async function onRequestGet({request,env}){
  if(!ready(env,new URL(request.url).hostname))return page('Email confirmation is not available yet.');
  const token=new URL(request.url).searchParams.get('token')||'';
  if(!/^[0-9a-f]{64}$/.test(token))return page('Invalid confirmation link.');
  // Do not confirm on GET: email scanners may prefetch links.
  return page('Please confirm that you would like one email when early access opens.',token);
}
export async function onRequestPost({request,env}){
  if(!ready(env,new URL(request.url).hostname))return page('Email confirmation is not available yet.');
  const form=await request.formData();
  const token=form.get('token');
  if(typeof token!=='string'||!/^[0-9a-f]{64}$/.test(token))return page('Invalid confirmation link.');
  try{
    const hash=await sha256(token);
    const matches=await supabase(env,'busy_marketing_waitlist','PATCH',
      'token_hash=eq.'+hash+'&status=eq.pending&token_expires_at=gt.'+encodeURIComponent(new Date().toISOString()),
      {status:'confirmed',confirmed_at:new Date().toISOString(),token_hash:null,token_expires_at:null,updated_at:new Date().toISOString()},true);
    return matches.length?page("Thank you. Your email is confirmed for a one-time early-access launch notification. This isn't a subscription or a guaranteed place."):page('This link has expired or was already used.');
  }catch(_){return page('We could not confirm your email. Please try again later.');}
}
