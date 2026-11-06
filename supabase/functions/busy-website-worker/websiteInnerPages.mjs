// A finite presentation of the existing page model. No new facts, routes,
// photographs or stored configuration are inferred by this renderer helper.
const clean=value=>typeof value==='string'?value.trim():'';
const array=value=>Array.isArray(value)?value:[];
const regex=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const safeHref=value=>typeof value==='string'&&/^(?:https:\/\/[^\s"'<>]+|\/(?!\/)[a-zA-Z0-9_/?=&.%#-]*|(?:\.\.\/)*(?:[a-z0-9-]+\/)*index\.html(?:#[a-zA-Z0-9_-]+)?|#[a-zA-Z0-9_-]+)$/.test(value)?value:'';

export function websiteInnerPageHtml(sectionHtml,context){
 const {draft,page,sections=[],escapeHtml,editAttrs=()=>'',homeHref='',pageHref=()=>''}=context||{};
 if(!draft||!page||page.id==='home'||!clean(page.title)||typeof escapeHtml!=='function')return null;
 let body=sectionHtml,lead='',openingId='',openingTitleAttrs='';
 const first=sections.find(section=>section&&section.enabled!==false&&body.includes('id="'+escapeHtml(section.id)+'"'));
 const snapshot=page.sourceServiceSnapshot;
 const generatedIntro=!!page.sourceServiceId&&snapshot&&typeof snapshot.title==='string'&&typeof snapshot.body==='string'&&first?.id===array(page.sectionIds)[0]&&clean(first.title)===clean(page.title)&&clean(first.title)===snapshot.title&&clean(first.body)===snapshot.body.split(/\n\s*\n/)[0];
 const generatedPlainIntro=generatedIntro&&Object.keys(first.appearance||{}).every(key=>key==='readingLayout');
 // Lift a short, exact first paragraph once, only for an unstyled plain-text
 // introduction. Photo/owner-format relationships are never moved or guessed.
 if(first?.type==='text'&&!first.asset&&!first.storyPhoto&&!first.contentPhotos?.length&&(!Object.keys(first.appearance||{}).length||generatedPlainIntro)){
  const paragraphs=clean(first.body).split(/\n\s*\n/),paragraph=paragraphs[0];
  if(paragraph&&paragraph.length<=480&&(paragraphs.length>1||clean(first.title)===clean(page.title))){
   const sectionPattern=new RegExp('<section\\b[^>]*\\bid="'+regex(escapeHtml(first.id))+'"[^>]*>[\\s\\S]*?<\\/section>');
   const block=body.match(sectionPattern)?.[0];
   if(block){
    const escaped=escapeHtml(paragraph).replace(/\n/g,'<br>'),exactParagraph=new RegExp('<p\\b[^>]*>'+regex(escaped)+'<\\/p>');
    const prefixParagraph=new RegExp('(<p\\b[^>]*>)'+regex(escaped)+'(?:<br>\\s*){2}');
    let remainder=block,matched=false;
    if(exactParagraph.test(remainder)){remainder=remainder.replace(exactParagraph,'');matched=true;}
    else if(prefixParagraph.test(remainder)){remainder=remainder.replace(prefixParagraph,'$1');matched=true;}
    if(matched){
     lead=`<p class="inner-page-lead"${editAttrs(first,'body')}>${escaped}</p>`;
     if(clean(first.title)===clean(page.title)){remainder=remainder.replace(/<h[12]\b[^>]*>[\s\S]*?<\/h[12]>/,'');openingTitleAttrs=editAttrs(first,'title');}
     if(clean(first.body)===paragraph&&clean(first.title)===clean(page.title)){openingId=first.id;remainder='';}
     body=body.replace(block,remainder);
    }
   }
  }
 }
 // A plain matching first section heading is already the exact page title.
 // Explicit owner typography/reading treatments stay in their original place.
 if(first&&clean(first.title)===clean(page.title)&&(Object.keys(first.appearance||{}).every(key=>/photo/i.test(key))||generatedIntro&&!Object.keys(first.appearance||{}).some(key=>/(?:heading|^title)/i.test(key)))){
  const pattern=new RegExp('<section\\b[^>]*\\bid="'+regex(escapeHtml(first.id))+'"[^>]*>[\\s\\S]*?<\\/section>'),block=body.match(pattern)?.[0];
  if(block){const heading=new RegExp('<(h[12])\\b[^>]*>'+regex(escapeHtml(first.title))+'<\\/\\1>');if(heading.test(block)){body=body.replace(block,block.replace(heading,''));openingTitleAttrs=editAttrs(first,'title');}}
 }
 // The page title is the sole H1. All original section wording/attributes stay.
 body=body.replace(/<(\/?)(h1)(\b[^>]*)>/g,'<$1h2$3>');
 const business=clean(draft.brandLabel||draft.businessName),scope=[clean(draft.businessType),clean(draft.serviceArea)].filter(Boolean).join(' · ');
 const home=safeHref(homeHref),label=escapeHtml(business||'Home');
 const breadcrumbs=`<div class="inner-breadcrumbs" role="navigation" aria-label="Breadcrumb"><ol><li>${home?`<a href="${escapeHtml(home)}">${label}</a>`:`<span>${label}</span>`}</li><li aria-current="page">${escapeHtml(page.title)}</li></ol></div>`;
 const anchors=new Set([...body.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map(match=>match[1]));
 const seen=new Set(),guide=sections.flatMap(section=>{
  const id=clean(section?.id),title=clean(section?.title);
  if(!id||!title||seen.has(id)||!anchors.has(escapeHtml(id))||title===clean(page.title)||!/^[-a-zA-Z0-9_]{1,100}$/.test(id))return [];
  seen.add(id);return [{id,title}];
 }).slice(0,5);
 const guideHtml=draft.theme?.pageGuide!=='none'&&guide.length>=2?`<div class="inner-page-guide"><p>On this page</p><ul>${guide.map(item=>`<li><a href="#${escapeHtml(item.id)}">${escapeHtml(item.title)}</a></li>`).join('')}</ul></div>`:'';
 const opening=`<section class="inner-page-opening"${openingId?` id="${escapeHtml(openingId)}"${editAttrs(first,'section')}`:''}><div class="wrap">${breadcrumbs}<div class="inner-page-opening-grid"><div><h1${openingTitleAttrs}>${escapeHtml(page.title)}</h1>${lead}</div><aside class="inner-page-context">${scope?`<p class="inner-page-scope">${escapeHtml(scope)}</p>`:''}${guideHtml}</aside></div></div></section>`;
 const pages=array(draft.pages).filter(p=>p&&p.enabled!==false&&p.id!==page.id&&p.id!=='home'&&clean(p.title));
 const contact=pages.find(p=>p.id==='contact'),overview=pages.find(p=>p.id==='services');
 const currentIndex=array(draft.pages).findIndex(p=>p.id===page.id);
 const adjacent=array(draft.pages).slice(currentIndex+1).find(p=>pages.includes(p)&&p.id!=='contact')||pages.find(p=>p.id!=='contact');
 const related=overview&&page.id!=='services'?overview:adjacent;
 const hero=array(draft.sections).find(section=>section.type==='hero'&&section.enabled!==false);
 const contactLabel=hero?.ctaHref==='#contact'&&clean(hero.cta)?hero.cta:contact?.title;
 const choices=[related?{...related,label:related.title,kind:'Explore'}:null,contact?{...contact,label:contactLabel,kind:'Contact'}:null].filter(Boolean);
 const used=new Set(),links=choices.flatMap(target=>{
  const href=safeHref(pageHref(target.id));if(!href||used.has(target.id))return [];used.add(target.id);
  return [`<a class="inner-next-link" href="${escapeHtml(href)}"><span class="inner-next-kind">${escapeHtml(target.kind)}</span><strong>${escapeHtml(target.label)}</strong><span aria-hidden="true">↗</span></a>`];
 });
 const conclusion=links.length?`<section class="inner-page-next"><div class="wrap"><h2>Continue exploring</h2><div class="inner-next-links">${links.join('')}</div></div></section>`:'';
 return opening+body+conclusion;
}

export const websiteInnerPageCss=`
.photo-feature-grid .photo-feature-image.owner-image-fit-contain{object-fit:contain;background:var(--soft)}
.photo-feature-grid .photo-feature-image.owner-image-crop-top{object-position:center top}.photo-feature-grid .photo-feature-image.owner-image-crop-bottom{object-position:center bottom}
@media(max-width:800px){.photo-feature-grid .photo-feature-image.owner-image-mobile-crop-top{object-position:center top}.photo-feature-grid .photo-feature-image.owner-image-mobile-crop-center{object-position:center center}.photo-feature-grid .photo-feature-image.owner-image-mobile-crop-bottom{object-position:center bottom}section.owner-mobile-photo-crop-top .photo-feature-grid img{object-position:center top}section.owner-mobile-photo-crop-center .photo-feature-grid img{object-position:center center}section.owner-mobile-photo-crop-bottom .photo-feature-grid img{object-position:center bottom}}
@media(min-width:801px){.photo-feature-grid .photo-feature-image.owner-image-desktop-crop-top{object-position:center top}.photo-feature-grid .photo-feature-image.owner-image-desktop-crop-center{object-position:center center}.photo-feature-grid .photo-feature-image.owner-image-desktop-crop-bottom{object-position:center bottom}section.owner-desktop-photo-crop-top .photo-feature-grid img{object-position:center top}section.owner-desktop-photo-crop-center .photo-feature-grid img{object-position:center center}section.owner-desktop-photo-crop-bottom .photo-feature-grid img{object-position:center bottom}}
.nav-mobile-details{display:none}
@media(max-width:700px){nav .nav-long-desktop{display:none}.nav-mobile-details{display:block;width:100%;min-width:0}.nav-mobile-details>summary{display:flex;justify-content:space-between;align-items:center;min-height:48px;padding:10px 0;cursor:pointer;list-style:none;border-top:1px solid var(--line);font-weight:650}.nav-mobile-details>summary::-webkit-details-marker{display:none}.nav-mobile-details>summary:focus-visible{outline:3px solid var(--accent);outline-offset:3px}.nav-mobile-details[open]>summary>span{transform:rotate(45deg)}nav .nav-mobile-details .nav-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 12px;padding:8px 0 18px}.nav-mobile-details .nav-links a{justify-content:flex-start;min-width:0;min-height:44px;padding:8px 0;white-space:normal}}
.website-inner-page .inner-page-opening{padding-block:clamp(28px,5vw,68px) clamp(40px,7vw,96px);background:var(--paper);border-bottom:1px solid var(--line)}
.inner-breadcrumbs ol{display:flex;flex-wrap:wrap;gap:6px 12px;margin:0 0 clamp(30px,5vw,64px);padding:0;list-style:none;font-size:.875rem;line-height:1.5}
.inner-breadcrumbs li{min-width:0;max-width:100%}.inner-breadcrumbs li+li::before{content:'/';margin-right:12px;color:var(--accent)}
.inner-breadcrumbs a{min-height:44px;display:inline-flex;align-items:center;text-underline-offset:4px}.inner-breadcrumbs li[aria-current]{display:flex;align-items:center}
.inner-page-opening-grid{display:grid;grid-template-columns:minmax(0,3fr) minmax(200px,1fr);gap:clamp(30px,6vw,88px);align-items:end}
.inner-page-opening-grid>*{min-width:0}.website-inner-page .inner-page-opening h1{font-size:clamp(2.6rem,6.2vw,6rem);line-height:1.03;letter-spacing:-.055em;max-width:17ch;margin:0 0 24px;text-wrap:balance}
.website-inner-page .inner-page-lead{font-size:clamp(1.1rem,1.65vw,1.4rem);line-height:1.65;max-width:56ch;margin:0}
.inner-page-context{border-left:1px solid var(--line);padding-left:24px}.inner-page-scope{font-size:.88rem;line-height:1.7;margin:0;max-width:25ch}
.inner-page-guide{margin-top:24px}.inner-page-guide>p{font-size:.875rem;letter-spacing:.1em;text-transform:uppercase;font-weight:700;margin:0 0 8px}.inner-page-guide ul{list-style:none;padding:0;margin:0}.inner-page-guide a{display:inline-flex;align-items:center;min-height:44px;text-decoration:none;font-size:.9rem;text-underline-offset:4px}.inner-page-guide a:hover{text-decoration:underline}
.website-inner-page .nav-links a[aria-current='page']{opacity:1;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:8px}
.website-inner-page .inner-page-next{background:var(--ink);color:var(--paper);padding-block:clamp(42px,6vw,76px)}
.website-inner-page .inner-page-next h2{font-size:1rem;letter-spacing:0;line-height:1.5;font-weight:550;margin-bottom:26px}
.inner-next-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:16px 40px}.inner-next-link{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px 16px;padding:24px 0;min-height:104px;border-top:1px solid currentColor;text-decoration:none}.inner-next-kind{font-size:.875rem;letter-spacing:.1em;text-transform:uppercase;grid-column:1/-1}.inner-next-link strong{font-size:clamp(1.3rem,2.4vw,2rem);line-height:1.2;letter-spacing:-.035em;font-weight:650}.inner-next-link>span:last-child{font-size:1.6rem}.inner-next-link:focus-visible{outline-color:var(--paper)}
.website-inner-page.premium-site-story-spread .inner-page-opening{background:var(--soft)}
.website-inner-page.premium-site-typography-first .inner-page-opening-grid,.website-inner-page.direction-studio-index .inner-page-opening-grid{grid-template-columns:minmax(0,1fr)}
.website-inner-page.premium-site-typography-first .inner-page-opening h1{font-size:clamp(3rem,7.4vw,7.4rem);max-width:14ch}
.website-inner-page.direction-studio-index .inner-page-context{display:flex;gap:30px;border-left:0;border-top:1px solid var(--line);padding:22px 0 0}.website-inner-page.direction-studio-index .inner-page-guide{margin:0}
@media(max-width:700px){.inner-page-opening-grid{grid-template-columns:minmax(0,1fr);gap:28px}.inner-page-context{border-left:0;border-top:1px solid var(--line);padding:18px 0 0;display:flex;gap:24px;flex-wrap:wrap}.inner-page-guide{margin:0}.inner-page-scope{max-width:none}.inner-breadcrumbs ol{margin-bottom:28px}.website-inner-page .inner-page-opening h1{font-size:clamp(2.45rem,10vw,4.2rem);max-width:100%;letter-spacing:-.045em}.website-inner-page .inner-page-lead{font-size:1.05rem}.website-inner-page.premium-site-typography-first .inner-page-opening h1{font-size:clamp(2.7rem,11vw,4.6rem)}.inner-next-links{gap:8px}.inner-next-link{min-height:96px}}
`;
