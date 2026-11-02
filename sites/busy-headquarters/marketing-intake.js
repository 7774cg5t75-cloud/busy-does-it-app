// Fail-closed enhancement: the default contact form still prepares mail in the user's own app.
(() => {
  const contact=document.getElementById('busy-contact-form');
  const waitlist=document.getElementById('busy-early-access-form');
  const link=document.querySelector('.early-interest-link');
  const status=document.getElementById('contact-form-status');
  const contactNotice=document.getElementById('contact-form-note');
  const waitlistStatus=document.getElementById('early-access-form-status');
  const earlyStatus=document.getElementById('early-access-badge');
  if(!contact||!waitlist||!status||!waitlistStatus)return;
  let enabled=false, contactWidget=null, waitWidget=null;
  const fallback=()=> {
    const name=contact.elements.namedItem('name').value.trim();
    const email=contact.elements.namedItem('email').value.trim();
    const message=contact.elements.namedItem('message').value.trim();
    const body=['Name: '+name,'Reply-to: '+email,'','Message:',message].join('\n');
    status.textContent='Your email app should open. Please press Send there — your message has not been sent by this website.';
    window.location.href='mailto:hello@busydoesit.co.uk?subject='+encodeURIComponent('Busy Does It website enquiry')+'&body='+encodeURIComponent(body);
  };
  const setBusy=(form,busy)=>{
    form.querySelector('button[type=submit]').disabled=busy;
    form.setAttribute('aria-busy',String(busy));
  };
  const resetWidget=(widget)=>{
    try { if(widget!==null&&window.turnstile)window.turnstile.reset(widget); } catch(_) {}
  };
  const send=async(path,payload)=>{
    const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',cache:'no-store',body:JSON.stringify(payload)});
    const data=await r.json();
    if(!r.ok||data.ok!==true)throw Error(data.error||'Unable to submit. Please try again later.');
    return data;
  };
  contact.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!contact.reportValidity())return;
    if(!enabled){fallback();return;}
    const token=window.turnstile?.getResponse(contactWidget);
    if(!token){status.textContent='Please complete the security check.';return;}
    setBusy(contact,true);
    status.textContent='Sending your message…';
    try{
      const data=await send('/api/contact',{
        name:contact.elements.namedItem('name').value.trim(),
        email:contact.elements.namedItem('email').value.trim(),
        message:contact.elements.namedItem('message').value.trim(),
        website:contact.elements.namedItem('website').value,
        turnstileToken:token
      });
      status.textContent=data.message||'Your message has been sent.';
      contact.reset();
    }catch(e){status.textContent=e.message||'Unable to send. Please try later.';}
    finally{resetWidget(contactWidget);setBusy(contact,false);}
  });
  waitlist.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!enabled){waitlistStatus.textContent='Early access is not open yet.';return;}
    if(!waitlist.reportValidity())return;
    const token=window.turnstile?.getResponse(waitWidget);
    if(!token){waitlistStatus.textContent='Please complete the security check.';return;}
    setBusy(waitlist,true);waitlistStatus.textContent='Preparing your confirmation email…';
    try{
      const data=await send('/api/early-access',{
        email:waitlist.elements.namedItem('email').value.trim(),
        consent:waitlist.elements.namedItem('consent').checked,
        consentVersion:'2026-11-01-launch-only',
        website:waitlist.elements.namedItem('website').value,
        turnstileToken:token
      });
      waitlistStatus.textContent=data.message;
      waitlist.reset();
    }catch(e){waitlistStatus.textContent=e.message||'Unable to register. Please try later.';}
    finally{resetWidget(waitWidget);setBusy(waitlist,false);}
  });
  const script=document.createElement('script');
  script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async=true;
  script.onload=()=>{
    if(!window.turnstile)return;
    try{
      contactWidget=window.turnstile.render('#busy-contact-turnstile',{sitekey:window.__busyMarketingSiteKey,action:'contact',theme:'dark'});
      waitWidget=window.turnstile.render('#busy-waitlist-turnstile',{sitekey:window.__busyMarketingSiteKey,action:'early_access',theme:'dark'});
      enabled=true;
      if(contactNotice)contactNotice.textContent='Your message is submitted securely to Busy Does It. We only use your details to respond. Please avoid sensitive information.';
      const submit=contact.querySelector('button[type=submit]');if(submit)submit.textContent='Send message';
      waitlist.hidden=false;
      if(link)link.hidden=true;
      if(earlyStatus)earlyStatus.textContent='Email interest list now open — subscriptions are not yet available';
    }catch(_){ /* keep manual fallback and no waitlist */ }
  };
  fetch('/api/config',{cache:'no-store',credentials:'same-origin'}).then(r=>r.ok?r.json():null).then(config=>{
    if(!config?.enabled||!config.siteKey)return;
    window.__busyMarketingSiteKey=config.siteKey;
    document.head.appendChild(script);
  }).catch(()=>{ /* fail closed: mailto only, no data stored */ });
})();
