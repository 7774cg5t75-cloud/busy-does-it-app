// Provider/error text is untrusted display data, never markup or instructions.
const escaped=value=>String(value??'').slice(0,5000).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function providerMessagePage(status,title,body){
 const heading=escaped(title),message=escaped(body);
 return new Response(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading}</title></head><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:32px;max-width:600px;margin:auto"><h1>${heading}</h1><p>${message}</p><p>You can close this page and return to BUSY.</p></body></html>`,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
}
