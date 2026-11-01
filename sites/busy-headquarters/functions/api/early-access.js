import {json,ready,isAllowedRequest,bodyJson,clean,emailValid,rateLimit,verifyHuman,resend,supabase,sha256,errorResponse} from './_shared.js';
export async function onRequestPost({request,env}){
  if(!ready(env,new URL(request.url).hostname))return json({ok:false,error:'Early-access signups are not open yet.'},503);
  if(!isAllowedRequest(request))return json({ok:false,error:'Invalid form request.'},403);
  try{
    const p=await bodyJson(request);
    if(p.website)return json({ok:true,message:'If eligible, check your inbox for a confirmation email.'});
    const email=clean(p.email,254).toLowerCase();
    if(!emailValid(email)||p.consent!==true||p.consentVersion!=='2026-11-01-launch-only')
      return json({ok:false,error:'Please enter a valid email and agree to the launch notification.'},400);
    if(!await rateLimit(env,request,'waitlist'))return json({ok:false,error:'Too many attempts. Please try again later.'},429);
    if(!await verifyHuman(env,request,p.turnstileToken,'early_access'))return json({ok:false,error:'Please complete the security check and try again.'},400);
    const rows=await supabase(env,'busy_marketing_waitlist','GET','select=status&email=eq.'+encodeURIComponent(email),undefined,true);
    if(rows.length && rows[0].status==='confirmed')return json({ok:true,message:'If eligible, check your inbox for a confirmation email.'});
    const token=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(n=>n.toString(16).padStart(2,'0')).join('');
    const tokenHash=await sha256(token);
    const expires=new Date(Date.now()+48*3600*1000).toISOString();
    await supabase(env,'busy_marketing_waitlist','POST','on_conflict=email',
      {email,status:'pending',token_hash:tokenHash,token_expires_at:expires,consent_version:'2026-11-01-launch-only',
       consent_at:new Date().toISOString(),updated_at:new Date().toISOString()},false);
    const link=env.MARKETING_PUBLIC_ORIGIN.replace(/\/$/,'')+'/api/confirm?token='+token;
    await resend(env,{to:email,subject:'Confirm your Busy Does It early-access interest',
      text:'You asked to hear when Busy Does It early access opens. To confirm that this email address belongs to you, open the link below and press Confirm.\n\n'+link+'\n\nThe link expires in 48 hours. If you did not ask for this, ignore this email. This is not an account or a guaranteed invitation.\n\nBusy Does It — hello@busydoesit.co.uk'});
    return json({ok:true,message:'If eligible, check your inbox for a confirmation email.'});
  }catch(e){return errorResponse(e);}
}
