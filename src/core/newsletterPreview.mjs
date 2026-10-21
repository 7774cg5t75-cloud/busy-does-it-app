import {readNewsletterWording} from './newsletterWording.mjs';

// Presentation only. Original Creator text remains the sole editable source.
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function newsletterPreview({text='',name='',colour=''}={}){
 const fields=readNewsletterWording(text),subject=fields?.subject||'Newsletter preview',body=fields?fields.body:text;
 const accent=/^#[0-9a-f]{6}$/i.test(colour)?colour:'#334155';
 const paragraphs=body.split(/\n\n+/).map(part=>`<p style="margin:0 0 20px;white-space:pre-wrap;overflow-wrap:anywhere">${escape(part)}</p>`).join('');
 // No automatic linkification, remote assets, tracking, scripts or active forms.
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; form-action 'none'; base-uri 'none'"><title>${escape(subject)}</title></head><body style="margin:0;background:#f1f5f9;color:#172033;font-family:Arial,Helvetica,sans-serif"><table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="padding:16px 8px"><table role="presentation" align="center" style="width:100%;max-width:600px;border-collapse:collapse;background:#fff;border-top:8px solid ${accent}"><tr><td style="padding:24px"><p style="margin:0 0 16px;font-size:14px;font-weight:bold">${escape(name)}</p><h1 style="font-size:26px;line-height:1.3;margin:0 0 24px;overflow-wrap:anywhere">${escape(subject)}</h1><div style="font-size:17px;line-height:1.65">${paragraphs}</div></td></tr></table></td></tr></table></body></html>`;
 return {html,subject,body};
}
