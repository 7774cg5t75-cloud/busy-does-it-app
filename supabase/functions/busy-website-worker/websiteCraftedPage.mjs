import {heroFamilies} from './websiteHeroFamilies.mjs';
// Reviewed full-page presentation opt-in through the original variation field.
// No new content source, executable fields or industry-template assignment.
export function craftedPage(draft){return ['crafted','crafted-airy','crafted-compact','authored','authored-airy','authored-compact'].includes(draft?.theme?.heroVariation)&&heroFamilies.some(f=>f.id===draft.theme.heroComposition);}
export function craftedServiceLayout(section,family,direction=''){
 if(section?.appearance?.serviceLayout==='cards')return 'tiles';
 if(section?.appearance?.serviceLayout==='directory')return 'ledger';
 if(direction.startsWith('authored'))return ({'story-spread':'menu','service-led':'board','quiet-portrait':'studio','typography-first':'studio','asymmetric-split':'offset','editorial-collage':'mosaic','cinematic-full-bleed':'board','product-showcase':'menu'})[family]||'studio';
 return ({'story-spread':'spread','asymmetric-split':'split','quiet-portrait':'quiet','typography-first':'quiet','editorial-collage':'tiles','product-showcase':'ledger','cinematic-full-bleed':'ledger','service-led':'ledger'})[family]||'ledger';
}
export function craftedServices(section,family,{escapeHtml,editAttrs=(...args)=>'',itemHeadingClass=(item)=>'',itemClasses=(item)=>'',contactAction=(item)=>'',direction=''}){
 const items=Array.isArray(section.items)?section.items.filter(i=>i&&String(i.title||i.body||'').trim()):[];
 if(!items.length||!heroFamilies.some(f=>f.id===family))return '';
 const layout=direction.startsWith('authored')&&items.length===1?'studio':craftedServiceLayout(section,family,direction);
 return `<div class="crafted-services crafted-services--${layout}${direction.startsWith('authored')?' crafted-services-count-'+Math.min(items.length,3):''}">${items.map((item,index)=>`<article class="crafted-service ${itemClasses(item)}"><span class="crafted-service-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><h3${itemHeadingClass(item)}${editAttrs(section,'title',String(item.id||''))}>${escapeHtml(item.title||'')}</h3>${item.body?`<p class="crafted-service-description"${editAttrs(section,'body',String(item.id||''))}>${escapeHtml(item.body)}</p>`:''}${contactAction(item)}</article>`).join('')}</div>`;
}
export function craftedStory(section,{escapeHtml,editAttrs=(...args)=>'',headingTag='h2',direction='',family=''}){
 const paragraphs=String(section.body||'').split(/\n\s*\n/).filter(x=>x.trim());
 if(direction.startsWith('authored')&&(!section.appearance?.readingLayout||section.appearance.readingLayout==='brand'))return `<div class="wrap authored-story authored-story--${['story-spread','editorial-collage'].includes(family)?'spread':['typography-first','quiet-portrait'].includes(family)?'manifesto':'method'}"><header><${headingTag}${editAttrs(section,'title')}>${escapeHtml(section.title||'')}</${headingTag}></header><div class="story-copy"${editAttrs(section,'body')}>${paragraphs.map((p,i)=>`<p${i===0?' class="authored-story-lead"':''}>${escapeHtml(p).replace(/\n/g,'<br>')}</p>`).join('')}</div></div>`;
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
 :where(.premium-crafted) .crafted-service,:where(.premium-crafted) .crafted-services--quiet .crafted-service,:where(.premium-crafted) .crafted-services--tiles .crafted-service,:where(.premium-crafted) .crafted-services--spread .crafted-service:first-child{grid-template-columns:26px minmax(0,1fr);gap:12px 16px;padding-block:28px}
 :where(.premium-crafted) .crafted-service .crafted-service-description,:where(.premium-crafted) .crafted-services--spread .crafted-service:first-child .crafted-service-description,:where(.premium-crafted) .crafted-services--spread .service-enquiry-link{grid-column:2}
 :where(.premium-crafted) .crafted-services--spread,:where(.premium-crafted) .crafted-services--tiles,:where(.premium-crafted) .crafted-story,:where(.premium-crafted) .crafted-contact{grid-template-columns:minmax(0,1fr)}
 :where(.premium-crafted) .crafted-services--split .crafted-service:nth-child(even){margin-left:0}
 :where(.premium-crafted) .crafted-service .service-enquiry-link,:where(.premium-crafted) .crafted-services--spread .crafted-service:first-child .service-enquiry-link{grid-column:2}
 :where(.premium-crafted) .crafted-contact{gap:32px}:where(.premium-crafted) .crafted-story{gap:8px}
 :where(.premium-crafted).premium-site-editorial-collage .gallery.gallery-rich .gallery-image:first-child,:where(.premium-crafted).premium-site-asymmetric-split .gallery.gallery-rich .gallery-image:first-child{grid-column:auto;aspect-ratio:4/3}
 :where(.premium-crafted) .crafted-contact-actions a{font-size:1rem}
}

/* Reviewed whole-page art direction. Existing signature/crafted output is inert. */
:where(.premium-authored){--crafted-gap:clamp(24px,4vw,64px)}
:where(.premium-authored) main>section:where(:not(.hero)){padding-block:clamp(60px,7vw,104px)}
:where(.premium-authored) .hero .lead{max-width:42ch}
:where(.premium-authored) .crafted-services--menu{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 6%}
:where(.premium-authored) .crafted-services--menu .crafted-service{grid-template-columns:32px minmax(0,1fr);gap:16px 24px;padding:32px 0}
:where(.premium-authored) .crafted-services--menu .crafted-service:first-child{grid-column:1/-1;grid-template-columns:52px minmax(0,1fr) minmax(0,1fr);padding-bottom:52px}
:where(.premium-authored) .crafted-services--menu .crafted-service:first-child:not([class*="owner-text-"])>h3:not([class*="owner-item-heading"]){font-size:clamp(2.4rem,4.6vw,4.6rem);font-weight:500;max-width:15ch}
:where(.premium-authored) .crafted-services--menu .crafted-service-description,:where(.premium-authored) .crafted-services--menu .service-enquiry-link{grid-column:2}
:where(.premium-authored) .crafted-services--menu .crafted-service:first-child .crafted-service-description,:where(.premium-authored) .crafted-services--menu .crafted-service:first-child .service-enquiry-link{grid-column:3}
:where(.premium-authored) .crafted-services--board{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
:where(.premium-authored) .crafted-services--board .crafted-service{grid-template-columns:28px minmax(0,1fr);gap:12px 20px;background:var(--paper);border:1px solid var(--line);padding:32px}
:where(.premium-authored) .crafted-services--board.crafted-services-count-3 .crafted-service:first-child{grid-row:span 2;background:var(--soft);padding:clamp(32px,4vw,56px);align-content:start}
:where(.premium-authored) .crafted-services--board .crafted-service:first-child:not([class*="owner-text-"])>h3:not([class*="owner-item-heading"]){font-size:clamp(2rem,3.2vw,3.2rem)}
:where(.premium-authored) .crafted-services--board .crafted-service p,:where(.premium-authored) .crafted-services--board .service-enquiry-link{grid-column:2}
:where(.premium-authored) .crafted-services--studio .crafted-service{grid-template-columns:40px minmax(0,1.2fr) minmax(0,.8fr);padding-block:44px;align-items:start}
:where(.premium-authored) .crafted-services--studio .crafted-service:not([class*="owner-text-"])>h3:not([class*="owner-item-heading"]){font-size:clamp(2rem,4vw,4rem);font-weight:400;max-width:18ch}
:where(.premium-authored) .crafted-services--offset .crafted-service{grid-template-columns:40px minmax(0,.9fr) minmax(0,1.1fr);padding-block:40px}
:where(.premium-authored) .crafted-services--offset .crafted-service:nth-child(even){margin-left:14%;border-left:4px solid var(--accent);padding-left:28px}
:where(.premium-authored) .crafted-services--mosaic{display:grid;grid-template-columns:1.2fr .8fr;gap:24px}
:where(.premium-authored) .crafted-services--mosaic .crafted-service{grid-template-columns:28px minmax(0,1fr);padding:32px;border:1px solid var(--line);background:var(--paper)}
:where(.premium-authored) .crafted-services--mosaic .crafted-service:nth-child(even){margin-top:48px;background:var(--soft)}
:where(.premium-authored) .crafted-services--mosaic .crafted-service p,:where(.premium-authored) .crafted-services--mosaic .service-enquiry-link{grid-column:2}
:where(.premium-authored) .authored-story{display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:var(--crafted-gap);align-items:start}
:where(.premium-authored) .authored-story h2{max-width:15ch}
:where(.premium-authored) .authored-story-lead{font-size:clamp(1.5rem,2.6vw,2.4rem);line-height:1.45;letter-spacing:-.02em;margin:0 0 1em;max-width:35ch}
:where(.premium-authored) .authored-story--spread .story-copy{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 40px;max-width:none}
:where(.premium-authored) .authored-story--spread .authored-story-lead{grid-column:1/-1;font-family:inherit}
:where(.premium-authored) .authored-story--method{padding:clamp(28px,5vw,64px);box-sizing:border-box;border-left:6px solid var(--accent);background:var(--paper)}
:where(.premium-authored) .authored-story--manifesto{grid-template-columns:1fr;max-width:1000px;border-top:1px solid var(--line);padding-top:40px}
:where(.premium-authored) .authored-story--manifesto .story-copy{max-width:76ch}
:where(.premium-authored) .authored-story--manifesto .authored-story-lead{font-size:clamp(1.8rem,3.4vw,3.1rem);max-width:34ch;line-height:1.35}
:where(.premium-authored) .photo-feature-grid{gap:clamp(28px,5vw,72px);grid-template-columns:repeat(2,minmax(0,1fr))}
:where(.premium-authored) .photo-feature-grid img{height:clamp(320px,42vw,600px);border-radius:0}
:where(.premium-authored) .photo-feature-grid img:not(.owner-image-fit-contain){object-fit:cover}
:where(.premium-authored) .photo-feature-grid h2{max-width:16ch}
:where(.premium-authored) .photo-feature-grid p{max-width:48ch}
:where(.premium-authored) .gallery{grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
:where(.premium-authored) .gallery .gallery-image{aspect-ratio:4/3}
:where(.premium-authored) .gallery.gallery-rich .gallery-image:first-child{grid-row:span 2;grid-column:auto;aspect-ratio:3/4;height:100%}
:where(.premium-authored) #contact{background:var(--soft)!important;color:var(--ink);border-top:1px solid var(--line)}
:where(.premium-authored) #contact a{color:inherit}
:where(.premium-authored) #contact .crafted-contact-actions{border-color:var(--line)}
:where(.premium-authored) .site-footer{background:var(--ink);color:var(--paper)}
:where(.premium-authored) .site-footer .wrap{border:0;gap:24px}
:where(.premium-authored) .approved-menu{display:grid;gap:48px}
:where(.premium-authored) .menu-items{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 56px}
:where(.premium-authored) .menu-label{font-size:.9rem;text-transform:uppercase;letter-spacing:.12em;border-bottom:2px solid var(--accent);padding-bottom:16px}
:where(.premium-authored) .menu-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px 24px;padding:28px 0;border:0;border-bottom:1px solid var(--line);background:transparent;box-shadow:none;min-width:0}
:where(.premium-authored) .menu-item h3{font-size:1.5rem;margin:0;max-width:26ch}
:where(.premium-authored) .menu-item .menu-description{grid-column:1/-1;max-width:48ch}
:where(.premium-authored) .menu-price{font-variant-numeric:tabular-nums;white-space:nowrap;margin:0}
:where(.premium-authored) .listing-note{font-size:.875rem;margin-top:32px;max-width:70ch;border-top:1px solid var(--line);padding-top:16px}
@media(max-width:800px){
 :where(.premium-authored) main>section:where(:not(.hero)){padding-block:52px}
 :where(.premium-authored) .crafted-services--menu,:where(.premium-authored) .crafted-services--board,:where(.premium-authored) .crafted-services--mosaic,:where(.premium-authored) .authored-story,:where(.premium-authored) .authored-story--spread .story-copy,:where(.premium-authored) .photo-feature-grid,:where(.premium-authored) .menu-items{grid-template-columns:minmax(0,1fr)}
 :where(.premium-authored) .crafted-services--menu .crafted-service,:where(.premium-authored) .crafted-services--menu .crafted-service:first-child,:where(.premium-authored) .crafted-services--studio .crafted-service,:where(.premium-authored) .crafted-services--offset .crafted-service{grid-template-columns:26px minmax(0,1fr);gap:16px;padding-block:28px}
 :where(.premium-authored) .crafted-services .crafted-service .crafted-service-description,:where(.premium-authored) .crafted-services .crafted-service .service-enquiry-link{grid-column:2}
 :where(.premium-authored) .crafted-services .crafted-service>h3{grid-column:2}
 :where(.premium-authored) .crafted-services--menu .crafted-service:first-child .crafted-service-description,:where(.premium-authored) .crafted-services--menu .crafted-service:first-child .service-enquiry-link{grid-column:2}
 :where(.premium-authored) .crafted-services--board .crafted-service:first-child{grid-row:auto}
 :where(.premium-authored) .crafted-services--board .crafted-service,:where(.premium-authored) .crafted-services--board .crafted-service:first-child,:where(.premium-authored) .crafted-services--mosaic .crafted-service{padding:24px}
 :where(.premium-authored) .crafted-services--mosaic .crafted-service:nth-child(even){margin-top:0}
 :where(.premium-authored) .crafted-services--offset .crafted-service:nth-child(even){margin-left:0;padding-left:0;border-left:0}
 :where(.premium-authored) .authored-story{gap:20px}
 :where(.premium-authored) .authored-story--method{padding:28px}
 :where(.premium-authored) .gallery.gallery-rich .gallery-image:first-child{height:auto;grid-row:auto;grid-column:1/-1;aspect-ratio:4/3}
 :where(.premium-authored) .photo-feature-grid img{height:clamp(260px,85vw,440px)}
}
`;
