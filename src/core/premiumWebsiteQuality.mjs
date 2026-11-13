import {designForWebsite} from '../../supabase/functions/busy-website-worker/designSystem.mjs';
import {PREMIUM_HERO_COMPOSITIONS} from '../../supabase/functions/busy-website-worker/websitePremiumHero.mjs';
const esc=x=>String(x||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const lum=hex=>[1,3,5].map(n=>parseInt(hex.slice(n,n+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
// These are necessary HTML/source checks, NOT a pixel, photographic-rights or
// professional aesthetic certification. Unknown visual evidence blocks release.
export function inspectPremiumWebsiteOutput({draft,html,verifiedAssetUris=[],unavailableAssetUris=[]}={}){
 const errors=[],pending=['Measured mobile/desktop layout, overflow, crop and readable type','Professional visual merit and comparison against approved references'];
 if(!draft?.id||typeof html!=='string'||html.length>500000||!html.startsWith('<!doctype html>'))return {ok:false,errors:['Bounded original renderer output required'],customerDisplayReady:false,pending};
 if(!draft.businessName||!html.includes(esc(draft.businessName)))errors.push('Missing exact business identity');
 if((html.match(/<h1\b/g)||[]).length!==1)errors.push('One clear page heading required');
 if(!html.includes('aria-label="Main navigation"')||!html.includes('class="skip-link"'))errors.push('Accessible navigation missing');
 if(/<script\b|<iframe\b|<form\b|javascript:/i.test(html))errors.push('Static private preview cannot imply active submission or unreviewed execution');
 const ids=new Set([...html.matchAll(/\bid="([^"<>]+)"/g)].map(m=>m[1]));for(const m of html.matchAll(/href="#([^"<>]+)"/g))if(!ids.has(m[1]))errors.push('Broken internal destination: '+m[1]);
 const kind=draft.theme?.heroComposition;if(kind!==undefined&&!PREMIUM_HERO_COMPOSITIONS.includes(kind))errors.push('Unknown composition');
 const approved=(draft.sections||[]).flatMap(s=>[s.asset,...(s.type==='gallery'?s.items||[]:[])]).filter(a=>a&&a.approved!==false).map(a=>a.uri);
 for(const m of html.matchAll(/<img\b[^>]*>/g)){const src=/\bsrc="([^"<>]*)"/.exec(m[0])?.[1],alt=/\balt="([^"<>]*)"/.exec(m[0])?.[1];if(!src||!approved.map(esc).includes(src)||!alt)errors.push('Unapproved or undescribed image');else if(unavailableAssetUris.map(esc).includes(src))errors.push('Approved image is unavailable: '+src);else if(!verifiedAssetUris.map(esc).includes(src))pending.push('Image availability, rights, dimensions and crop not independently verified: '+src);}
 const d=designForWebsite({businessType:draft.businessType,theme:draft.theme,plan:draft.designPlan});if(ratio(d.ink,d.paper)<4.5||ratio(d.accent,'#FFFFFF')<4.5)errors.push('Base text/button palette contrast below AA');
 if(!html.includes('name="viewport"')||!html.includes('@media(max-width:800px)')||!html.includes('minmax(0,1fr)'))errors.push('Responsive baseline missing');
 return {ok:errors.length===0,errors:[...new Set(errors)],pending:[...new Set(pending)],customerDisplayReady:false,evidence:'actual-original-HTML-and-source-rules',measuredPixels:false};
}
