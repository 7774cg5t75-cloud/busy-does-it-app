import {json,ready,isAllowedRequest,bodyJson,clean,emailValid,rateLimit,verifyHuman,resend,errorResponse} from './_shared.js';
export async function onRequestPost({request,env}){
  if(!ready(env,new URL(request.url).hostname))return json({ok:false,error:'Contact form is not open yet.'},503);
  if(!isAllowedRequest(request))return json({ok:false,error:'Invalid form request.'},403);
  try{
    const p=await bodyJson(request);
    if(p.website)return json({ok:true}); // Honeypot; no message is sent.
    const name=clean(p.name,100),email=clean(p.email,254).toLowerCase(),message=clean(p.message,3000);
    if(!name||name.length>100||!emailValid(email)||message.length<5||message.length>3000)return json({ok:false,error:'Please check the form fields.'},400);
    if(!await rateLimit(env,request,'contact'))return json({ok:false,error:'Too many attempts. Please try again later.'},429);
    if(!await verifyHuman(env,request,p.turnstileToken,'contact'))return json({ok:false,error:'Please complete the security check and try again.'},400);
    await resend(env,{to:'hello@busydoesit.co.uk',replyTo:email,subject:'Busy Does It website enquiry',
      text:['New website enquiry','Name: '+name,'Reply-to: '+email,'','Message:',message].join('\n')});
    return json({ok:true,message:'Your message has been sent.'});
  }catch(e){return errorResponse(e);}
}
