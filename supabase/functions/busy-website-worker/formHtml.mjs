/**
 * V3.79 opt-in public contact form HTML. Absent unless the server has been
 * explicitly activated, Turnstile is configured and the specific live site is
 * owner-enabled. Never embed a service key, access token or customer data.
 */
function renderOptInContactForm({siteId="",siteKey="",enabled=false,endpoint="",siteHostname=""}={}){
 if(enabled!==true||typeof siteId!=="string"||
   !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(siteId)||
   typeof siteHostname!=="string"||!new RegExp("^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\\\.busydoesit\\\\.co\\\\.uk$").test(siteHostname)||
   typeof siteKey!=="string"||!/^[a-zA-Z0-9_-]{10,200}$/.test(siteKey)||
   typeof endpoint!=="string"||
   !/^https:\/\/[a-z0-9-]+\.supabase\.co\/functions\/v1\/busy-website-form$/.test(endpoint))
   return "";
 const escape=s=>String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
 const id=escape(siteId),key=escape(siteKey),url=escape(endpoint);
 // Encode constant values with JSON.stringify: no untrusted JS interpolations.
 const cfg=JSON.stringify({siteId,endpoint,expectedOrigin:"https://"+siteHostname}).replace(/</g,"\\u003c");
 return `<section id="busy-enquiry" aria-label="Contact this business"><div class="wrap">
 <h2>Request a quote or ask a question</h2>
 <p>Send this business an enquiry. Your details will be used to respond to your request; no automated marketing message will be sent.</p>
 <form id="busy-enquiry-form" aria-label="Business enquiry form" novalidate>
 <label for="busy-enquiry-name">Your name</label>
 <input id="busy-enquiry-name" name="name" maxlength="120" required autocomplete="name">
 <label for="busy-enquiry-email">Email</label>
 <input id="busy-enquiry-email" name="email" type="email" maxlength="180" required autocomplete="email">
 <label for="busy-enquiry-service">What do you need help with?</label>
 <input id="busy-enquiry-service" name="service" maxlength="160">
 <label for="busy-enquiry-notes">Details (optional)</label>
 <textarea id="busy-enquiry-notes" name="notes" maxlength="1200" rows="4"></textarea>
 <label style="display:block"><input name="permission" type="checkbox" required>
 I agree to this business using these details to respond to my enquiry.</label>
 <input name="trap" tabindex="-1" aria-hidden="true" autocomplete="off" style="position:absolute;left:-10000px" value="">
 <div class="cf-turnstile" data-sitekey="${key}" data-action="busy_website_enquiry"></div>
 <button class="cta" type="submit">Send enquiry</button>
 <p id="busy-enquiry-result" aria-live="polite"></p>
 </form></div></section>
 <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
 <script>(function(){
 "use strict";
 var cfg=${cfg};
 var form=document.getElementById("busy-enquiry-form");
 var status=document.getElementById("busy-enquiry-result");
 if(!form||!status)return;
 if(location.origin!==cfg.expectedOrigin){
  status.textContent="Private hosted preview: form submissions are disabled until this version is approved and published.";
  form.querySelector('button[type="submit"]').disabled=true;
  return;
 }
 var pending=false,requestKey="";
 form.addEventListener("submit",async function(e){
  e.preventDefault();
  if(pending)return;
  if(!form.reportValidity())return;
  var token=form.querySelector('[name="cf-turnstile-response"]');
  if(!token||!token.value){status.textContent="Please complete the verification first.";return;}
  if(!requestKey){requestKey="web-"+crypto.randomUUID();}
  pending=true;status.textContent="Sending your enquiry…";
  try{
   var response=await fetch(cfg.endpoint,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     siteId:cfg.siteId,idempotencyKey:requestKey,
     name:form.elements.namedItem("name").value,contactMethod:"email",
     contactValue:form.elements.namedItem("email").value,
     service:form.elements.namedItem("service").value,notes:form.elements.namedItem("notes").value,
     contactPermissionConfirmed:form.elements.namedItem("permission").checked,
     turnstileToken:token.value,trap:form.elements.namedItem("trap").value
    })
   });
   var result=await response.json().catch(function(){return {};});
   if(!response.ok||result.ok!==true)throw Error("Submission not confirmed");
   status.textContent="Enquiry received. The business can now review your message.";
   form.reset();requestKey="";
   if(window.turnstile)window.turnstile.reset();
  }catch(err){
   status.textContent="Your enquiry was not confirmed. Please verify again before retrying.";
   if(window.turnstile)window.turnstile.reset();
  }finally{pending=false;}
 });
 })();</script>
 <style>#busy-enquiry-form{display:grid;gap:10px;max-width:640px}
 #busy-enquiry-form input:not([type=checkbox]),#busy-enquiry-form textarea{
 padding:12px;border:1px solid #9ca3af;border-radius:9px;font:inherit}
 #busy-enquiry-form button{border:0;cursor:pointer}
 #busy-enquiry-form label{font-weight:600}</style>`;
}
export {renderOptInContactForm};
