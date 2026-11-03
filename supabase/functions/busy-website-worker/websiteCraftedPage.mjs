import {heroFamilies} from './websiteHeroFamilies.mjs';
// Reviewed full-page presentation opt-in through the original variation field.
// No new content source, executable fields or industry-template assignment.
export function craftedPage(draft){return ['crafted','crafted-airy','crafted-compact'].includes(draft?.theme?.heroVariation)&&heroFamilies.some(f=>f.id===draft.theme.heroComposition);}
export function craftedServiceLayout(section,family){
 if(section?.appearance?.serviceLayout==='cards')return 'tiles';
 if(section?.appearance?.serviceLayout==='directory')return 'ledger';
 return ({'story-spread':'spread','asymmetric-split':'split','quiet-portrait':'quiet','typography-first':'quiet','editorial-collage':'tiles','product-showcase':'ledger','cinematic-full-bleed':'ledger','service-led':'ledger'})[family]||'ledger';
}
export function craftedServices(section,family,{escapeHtml,editAttrs=(...args)=>'',itemHeadingClass=(item)=>'',itemClasses=(item)=>'',contactAction=(item)=>''}){
 const items=Array.isArray(section.items)?section.items.filter(i=>i&&String(i.title||i.body||'').trim()):[];
 if(!items.length||!heroFamilies.some(f=>f.id===family))return '';
 const layout=craftedServiceLayout(section,family);
 return `<div class="crafted-services crafted-services--${layout}">${items.map((item,index)=>`<article class="crafted-service ${itemClasses(item)}"><span class="crafted-service-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><h3${itemHeadingClass(item)}${editAttrs(section,'title',String(item.id||''))}>${escapeHtml(item.title||'')}</h3>${item.body?`<p class="crafted-service-description"${editAttrs(section,'body',String(item.id||''))}>${escapeHtml(item.body)}</p>`:''}${contactAction(item)}</article>`).join('')}</div>`;
}
export function craftedStory(section,{escapeHtml,editAttrs=(...args)=>'',headingTag='h2'}){
 const paragraphs=String(section.body||'').split(/\n\s*\n/).filter(x=>x.trim());
 return `<div class="wrap crafted-story story-layout"><div class="crafted-section-heading"><${headingTag}${editAttrs(section,'title')}>${escapeHtml(section.title||'')}</${headingTag}></div><div class="story-copy"${editAttrs(section,'body')}>${paragraphs.map((p,i)=>`<p${i===0?' class="crafted-story-lead"':''}>${escapeHtml(p).replace(/\n/g,'<br>')}</p>`).join('')}</div></div>`;
}
// Inputs are escaped markup produced by the ORIGINAL renderer, not customer HTML.
export function craftedContact({heading,body,channels,extra='',family}){
 const treatment=['quiet-portrait','typography-first'].includes(family)?'quiet':['story-spread','editorial-collage'].includes(family)?'editorial':'direct';
 return `<div class="wrap crafted-contact crafted-contact--${treatment}"><div class="crafted-contact-heading">${heading}${body}</div><div class="crafted-contact-actions">${channels}${extra}</div></div>`;
}
export const craftedPageCss=`
/* Only a reviewed 'crafted' variation opts in. Legacy approved output is unchanged. */
:where(.premium-crafted){--crafted-gap:clamp(28px,5vw,80px)}
:where(.premium-crafted) main>section:where(:not(.hero)){padding-block:clamp(64px,9vw,132px)}
:where(.premium-crafted) main>section:where(:not(.hero)) h2{font-size:clamp(2rem,4.1vw,3.7rem);line-height:1.13;letter-spacing:-.035em;max-width:23ch;margin:0 0 1.1em}
:where(.premium-crafted) main>section:where(:not(.hero)) p{font-size:clamp(1rem,1.1vw,1.125rem);line-height:1.8;max-width:62ch}
:where(.premium-crafted) .crafted-services{margin-top:clamp(28px,5vw,64px)}
:where(.premium-crafted) .crafted-service{display:grid;grid-template-columns:40px minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(16px,3vw,42px);background:transparent;border:0;border-top:1px solid var(--line);border-radius:0;box-shadow:none;padding:clamp(26px,4vw,48px) 0;min-width:0}
:where(.premium-crafted) .crafted-service h3{font-size:clamp(1.5rem,2.6vw,2.3rem);line-height:1.18;letter-spacing:-.025em;margin:0;overflow-wrap:anywhere}
:where(.premium-crafted) .crafted-service p{margin:0 0 1.25em;grid-column:3}:where(.premium-crafted) .crafted-service .service-enquiry-link{grid-column:3}
:where(.premium-crafted) .crafted-service-number{font-variant-numeric:tabular-nums;font-size:.875rem;padding-top:.4em}
:where(.premium-crafted) .service-enquiry-link{display:inline-flex;align-items:center;min-height:44px;text-underline-offset:.3em;text-decoration-thickness:1px;line-height:1.5;padding-block:8px}
:where(.premium-crafted) .crafted-services--spread{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:var(--crafted-gap)}
:where(.premium-crafted) .crafted-services--spread .crafted-service{grid-template-columns:28px minmax(0,1fr)}
:where(.premium-crafted) .crafted-services--spread .crafted-service-description,:where(.premium-crafted) .crafted-services--spread .service-enquiry-link{grid-column:2}
:where(.premium-crafted) .crafted-services--spread .crafted-service:first-child{grid-column:1/-1;grid-template-columns:40px minmax(0,1fr) minmax(0,1fr)}
:where(.premium-crafted) .crafted-services--spread .crafted-service:first-child h3{font-size:clamp(2rem,4vw,3.5rem);font-weight:500}
:where(.premium-crafted) .crafted-services--spread .crafted-service:first-child .crafted-service-description,:where(.premium-crafted) .crafted-services--spread .crafted-service:first-child .service-enquiry-link{grid-column:3}
:where(.premium-crafted) .crafted-services--tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}
:where(.premium-crafted) .crafted-services--tiles .crafted-service{grid-template-columns:28px minmax(0,1fr);padding:28px;border:1px solid var(--line)}
:where(.premium-crafted) .crafted-services--tiles .crafted-service-description,:where(.premium-crafted) .crafted-services--tiles .service-enquiry-link{grid-column:2}
:where(.premium-crafted) .crafted-services--split .crafted-service:nth-child(even){margin-left:12%}
:where(.premium-crafted) .crafted-services--quiet .crafted-service{grid-template-columns:40px minmax(0,1.1fr) minmax(0,.9fr);padding-block:48px}
:where(.premium-crafted) .crafted-services--quiet h3{font-weight:400}
:where(.premium-crafted) .crafted-story{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:var(--crafted-gap);align-items:start}
:where(.premium-crafted) .story-copy{max-width:65ch}
:where(.premium-crafted) .story-copy p.crafted-story-lead{font-size:clamp(1.35rem,2.2vw,1.85rem);line-height:1.55;letter-spacing:-.015em;margin-top:0}
:where(.premium-crafted) .story-copy p+p{margin-top:1.5em}
:where(.premium-crafted) :where(#contact){border-top:1px solid currentColor}
:where(.premium-crafted) .crafted-contact{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:var(--crafted-gap);align-items:end}
:where(.premium-crafted) .crafted-contact h2{font-size:clamp(2.6rem,5.5vw,5rem);max-width:16ch;font-weight:500;margin-bottom:.5em}
:where(.premium-crafted) .crafted-contact-actions{border-top:1px solid currentColor;padding-top:24px;min-width:0}
:where(.premium-crafted) .crafted-contact-actions p{margin:0 0 .75em}
:where(.premium-crafted) .crafted-contact-actions a{display:inline-flex;min-height:44px;align-items:center;text-underline-offset:.25em;overflow-wrap:anywhere;max-width:100%;font-size:clamp(1rem,1.7vw,1.35rem)}
:where(.premium-crafted) .crafted-contact--quiet{grid-template-columns:1fr;max-width:1000px}
:where(.premium-crafted) .crafted-contact--quiet .crafted-contact-actions{display:flex;flex-wrap:wrap;gap:16px 40px}
:where(.premium-crafted) .crafted-contact--editorial h2{font-family:Georgia,'Times New Roman',serif;font-style:italic}
:where(.premium-crafted) .service-index-layout{gap:var(--crafted-gap)}
:where(.premium-crafted) .service-index-layout nav{position:static;background:transparent;border:0;padding:0}
:where(.premium-crafted) .service-index-layout nav a{min-height:44px;display:flex;align-items:center;background:transparent;border:0;border-bottom:1px solid var(--line);border-radius:0;padding:14px 0;text-underline-offset:.25em}
:where(.premium-crafted) .service-index-details article{background:transparent;border:0;border-top:1px solid var(--line);border-radius:0;box-shadow:none;padding:40px 0}
:where(.premium-crafted) .service-index-details h3{font-size:clamp(1.6rem,2.8vw,2.5rem);line-height:1.2;font-weight:500}
:where(.premium-crafted) .gallery{gap:clamp(16px,3vw,36px)}
:where(.premium-crafted) .gallery-image{border-radius:0;aspect-ratio:4/3;height:auto;width:100%}
:where(.premium-crafted) .gallery-image:not(.owner-image-fit-contain){object-fit:cover}
:where(.premium-crafted).premium-site-editorial-collage .gallery.gallery-rich .gallery-image:first-child,:where(.premium-crafted).premium-site-asymmetric-split .gallery.gallery-rich .gallery-image:first-child{grid-column:span 2;aspect-ratio:16/9}
:where(.premium-crafted) #products article,:where(.premium-crafted) #events article{border-radius:0;box-shadow:none}
:where(.premium-crafted) .site-footer strong{font-size:clamp(1.2rem,2.5vw,2rem);font-weight:500;letter-spacing:-.02em}
:where(.premium-crafted) .site-footer .wrap{border-top:1px solid var(--line);padding-top:32px;padding-bottom:32px}
:where(.premium-crafted) nav.nav-wrap a,:where(.premium-crafted) .nav-links a{min-height:44px;display:inline-flex;align-items:center}
:where(.premium-crafted) :focus-visible{outline:3px solid currentColor;outline-offset:5px}
:where(.premium-crafted) .hero-art{display:none}
@media(max-width:700px){
 :where(.premium-crafted) main>section:where(:not(.hero)){padding-block:56px}
 :where(.premium-crafted) .crafted-service,:where(.premium-crafted) .crafted-services--quiet .crafted-service,:where(.premium-crafted) .crafted-services--spread .crafted-service:first-child{grid-template-columns:26px minmax(0,1fr);gap:12px 16px;padding-block:28px}
 :where(.premium-crafted) .crafted-service-description,:where(.premium-crafted) .crafted-services--spread .crafted-service:first-child .crafted-service-description,:where(.premium-crafted) .crafted-services--spread .service-enquiry-link{grid-column:2}
 :where(.premium-crafted) .crafted-services--spread,:where(.premium-crafted) .crafted-services--tiles,:where(.premium-crafted) .crafted-story,:where(.premium-crafted) .crafted-contact{grid-template-columns:minmax(0,1fr)}
 :where(.premium-crafted) .crafted-services--split .crafted-service:nth-child(even){margin-left:0}
 :where(.premium-crafted) .crafted-service .service-enquiry-link,:where(.premium-crafted) .crafted-services--spread .crafted-service:first-child .service-enquiry-link{grid-column:2}
 :where(.premium-crafted) .crafted-contact{gap:32px}:where(.premium-crafted) .crafted-story{gap:8px}
 :where(.premium-crafted).premium-site-editorial-collage .gallery.gallery-rich .gallery-image:first-child,:where(.premium-crafted).premium-site-asymmetric-split .gallery.gallery-rich .gallery-image:first-child{grid-column:auto;aspect-ratio:4/3}
 :where(.premium-crafted) .crafted-contact-actions a{font-size:1rem}
}
`;
