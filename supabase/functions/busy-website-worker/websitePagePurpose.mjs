// Reviewed presentation over the original page/section model. This helper
// neither invents facts nor stores a second copy of the owner's business.
import {wholeSiteDerivedSourcesCurrent,wholeSiteContentCurrent} from './websiteWholeSite.mjs';
const text=value=>typeof value==='string'?value.trim():'';
const list=value=>Array.isArray(value)?value:[];
const regex=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const safeHref=value=>typeof value==='string'&&/^(?:\/(?!\/)[a-zA-Z0-9_/?=&.%#-]*|(?:\.\.\/)*(?:[a-z0-9-]+\/)*index\.html(?:#[a-zA-Z0-9_-]+)?|#[a-zA-Z0-9_-]+)$/.test(value)?value:'';
function originalHref(draft,page,target,pageHref,provided){
 const matches=list(draft.pages).filter(p=>p?.id===target?.id&&p.enabled!==false);
 const output=value=>typeof value==='string'&&/^(?:index\.html|(?:[a-z0-9-]+\/)+index\.html)$/.test(value);
 if(matches.length!==1||[target?.businessId,target?.business_id].some(id=>id&&id!==draft.businessId)||!output(matches[0].outputPath)||!output(page?.outputPath))return '';
 let value;try{value=provided===undefined?pageHref(target.id):provided;}catch{return '';}
 const prefix='../'.repeat(page.outputPath.split('/').length-1);
 if(safeHref(value)&&[prefix+target.outputPath,target.path,target.path+'/'].includes(value))return value;
 // Signed previews must come from the same ORIGINAL page resolver and exact
 // deployment prefix; arbitrary model/source URLs never gain authority here.
 const signed=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&!/[\s"'<>]/.test(value)?u:null;}catch{return null;}};
 let current;try{current=signed(pageHref(page.id));}catch{return '';}
 const url=signed(value),suffix='/'+page.outputPath;
 if(!current||!url||!current.pathname.endsWith(suffix)||url.origin!==current.origin)return '';
 const base=current.pathname.slice(0,-page.outputPath.length);
 return url.pathname===base+target.outputPath?value:'';
}
const paragraphs=value=>text(value).split(/\n\s*\n/).filter(Boolean);
const explicitType=section=>Object.keys(section?.appearance||{}).some(key=>/(?:font|weight|tracking|lineheight|heading|bodyScale|textAlign|colou?r)/i.test(key));
function sectionBlock(html,id,escape){return html.match(new RegExp('<section\\b[^>]*\\bid="'+regex(escape(id))+'"[^>]*>[\\s\\S]*?<\\/section>'))?.[0]||'';}
function classes(block,names){return block.replace(/^<section\b([^>]*)>/,(_all,attrs)=>'<section'+(/\bclass="/.test(attrs)?attrs.replace(/\bclass="([^"]*)"/,(_m,current)=>'class="'+current+' '+names+'"'):attrs+' class="'+names+'"')+'>');}
function removeHeading(block,section,escape){
 if(list(section.ownerEditedFields).includes('title')||explicitType(section))return block;
 const heading=new RegExp('<(h[12])\\b[^>]*>'+regex(escape(text(section.title)))+'<\\/\\1>');
 return block.replace(heading,'');
}
function breadcrumb(draft,page,homeHref,pageHref,escape,label=page.title){
 const home=originalHref(draft,page,list(draft.pages).find(p=>p.id==='home'),pageHref,homeHref),business=text(draft.brandLabel||draft.businessName)||'Home';
 return '<div class="inner-breadcrumbs" role="navigation" aria-label="Breadcrumb"><ol><li>'+(home?'<a href="'+escape(home)+'">'+escape(business)+'</a>':'<span>'+escape(business)+'</span>')+'</li><li aria-current="page">'+escape(label)+'</li></ol></div>';
}
function fontClass(draft,section){return !draft.theme?.typography&&!explicitType(section)&&['story-spread','editorial-collage','typography-first','quiet-portrait'].includes(draft.theme?.heroComposition)?' purpose-default-serif':'';}
function nextStep(draft,page,pageHref,escape){
 const pages=list(draft.pages).filter(p=>p?.enabled!==false&&p.id!==page.id),contact=pages.find(p=>p.id==='contact'),services=pages.find(p=>p.id==='services');
 const menu=draft.theme?.pageDirection==='menu-house'?pages.find(p=>p.id==='products'):null;
 const hero=list(draft.sections).find(s=>s.id==='hero'&&s.enabled!==false);
 const route=target=>target?originalHref(draft,page,target,pageHref):'';
 const primary=page.sourceServiceId||page.id==='products'?contact:menu||services||contact;
 const primaryHref=route(primary);if(!primaryHref)return '';
 const approvedAction=hero?.ctaHref==='#contact'&&text(hero.cta)?text(hero.cta):text(contact?.title);
 const navLabel=target=>text(list(draft.navigation).find(n=>n.id===target?.id)?.label)||text(target?.title);
 const label=primary===contact?approvedAction:navLabel(primary);
 const secondary=primary===contact?services:contact,secondaryHref=route(secondary);
 return '<section class="purpose-next" aria-label="Continue with '+escape(text(draft.businessName)||'this business')+'"><div class="wrap purpose-next-grid"><div><p class="purpose-next-context">'+escape(page.sourceServiceId?page.title:text(draft.businessName))+'</p><a class="purpose-primary" href="'+escape(primaryHref)+'">'+escape(label)+'<span aria-hidden="true">↗</span></a></div>'+(secondaryHref&&secondary!==primary?'<a class="purpose-secondary" href="'+escape(secondaryHref)+'">'+escape(secondary===contact?approvedAction:navLabel(secondary))+'<span aria-hidden="true">↗</span></a>':'')+'</div></section>';
}
function businessContext(draft,page,sections,pageHref,escape){
 const matches=list(draft.sections).filter(s=>s.id==='about'&&s.enabled!==false&&text(s.body)),aboutPage=list(draft.pages).find(p=>p.id==='about'&&p.enabled!==false);
 if(matches.length!==1||!aboutPage||[matches[0].businessId,matches[0].business_id,aboutPage.businessId,aboutPage.business_id].some(id=>id&&id!==draft.businessId))return '';
 const parts=paragraphs(matches[0].body),method=parts[1];
 // A visibly shared business-story excerpt is not a service-specific claim.
 // Never repeat source already supplied in this service's own paragraphs.
 if(!method||method.length<40||method.length>700||sections.some(s=>text(s.body).includes(method)))return '';
 const href=originalHref(draft,page,aboutPage,pageHref);
 return '<aside class="purpose-business-context" aria-label="From the approved business story"><p class="purpose-overline">From our business story</p><blockquote>'+escape(method).replace(/\n/g,'<br>')+'</blockquote>'+(href?'<a href="'+escape(href)+'">'+escape(text(draft.brandLabel||draft.businessName))+'<span aria-hidden="true">↗</span></a>':'')+'</aside>';
}

export function websitePurposefulInnerPageHtml(sectionHtml,context){
 const {draft,page,sections=[],escapeHtml:escape,editAttrs=()=>'',homeHref='',pageHref=()=>''}=context||{};
 if(draft?.sitePresentation!=='purposeful-v1'||!page||page.id==='home'||typeof escape!=='function'||!text(page.title))return null;
 const businessId=text(draft.businessId),foreign=value=>[value?.businessId,value?.business_id].some(id=>id&&id!==businessId);
 const current=list(draft.pages).filter(row=>row?.id===page.id&&row.enabled!==false);
 if(!businessId||foreign(draft)||foreign(page)||current.length!==1||['title','outputPath','path','sourceServiceId'].some(key=>current[0][key]!==page[key])||JSON.stringify(current[0].sectionIds)!==JSON.stringify(page.sectionIds)||JSON.stringify(current[0].sourceServiceSnapshot)!==JSON.stringify(page.sourceServiceSnapshot))return null;
 if(sections.some(section=>foreign(section)||!list(draft.sections).includes(section)))return null;

 const first=sections.find(s=>s?.enabled!==false&&sectionBlock(sectionHtml,s.id,escape));if(!first)return null;
 const firstBlock=sectionBlock(sectionHtml,first.id,escape),editable=!!editAttrs(first,'section'),crumb=breadcrumb(draft,page,homeHref,pageHref,escape);
 let body=sectionHtml;
 if(page.id==='products'&&first.id==='products'&&first.type==='products'){
  // The original current listing remains the complete product authority.
  // A reviewed Menu navigation label is presentation, never a product claim.
  if(!wholeSiteContentCurrent(draft)||first.previewFeed?.businessId!==businessId)return null;
  const label=page.title==='Products'&&!list(page.ownerEditedFields).includes('title')&&text(first.navigationLabel)?text(first.navigationLabel):page.title;
  const menuCrumb=breadcrumb(draft,page,homeHref,pageHref,escape,label);
  const opening='<section class="purpose-service-opening purpose-menu-opening'+fontClass(draft,first)+'"><div class="wrap">'+menuCrumb+'<h1>'+escape(label)+'</h1></div></section>';
  body=body.replace(firstBlock,classes(firstBlock,'purpose-menu-body')).replace(/<(\/?)(h1)(\b[^>]*)>/g,'<$1h2$3>');
  return opening+body+nextStep(draft,page,pageHref,escape);
 }
 if(page.id==='contact'&&first.id==='contact'&&first.type==='contact'){
  // Keep actual source channels and their original editable composition. The
  // contact page concludes at those channels, not another contact invitation.
  const opening='<div class="wrap purpose-contact-meta">'+crumb+'<h1>'+escape(page.title)+'</h1></div>';
  const contact=classes(firstBlock,'purpose-contact').replace(/^(<section\b[^>]*>)/,'$1'+opening);
  body=body.replace(firstBlock,contact).replace(/<h1\b/g,'<h2').replace(/<\/h1>/g,'</h2>');
  return body.replace('<h2>'+escape(page.title)+'</h2>','<h1>'+escape(page.title)+'</h1>');
 }
 if(page.id==='about'&&first.id==='about'&&text(first.body)){
  // The approved story itself opens About. Its original rendered paragraphs,
  // photos, captions, crop/fit settings and editable body remain untouched.
  let story=firstBlock;
  if(!editable&&['about','about us'].includes(text(first.title).toLowerCase()))story=removeHeading(story,first,escape);
  story=classes(story,'purpose-story'+fontClass(draft,first)+(!explicitType(first)?' purpose-auto-type':'')+(story.includes('<img')?' purpose-story-has-photo':''));
  const opening='<div class="wrap purpose-story-meta">'+crumb+'<h1>'+escape(page.title)+'</h1></div>';
  story=story.replace(/^(<section\b[^>]*>)/,'$1'+opening);
  // The new page-label H1 remains the sole H1; original source headings keep
  // their edit attributes and are secondary within this exact story page.
  body=body.replace(firstBlock,story).replace(/<h1\b/g,'<h2').replace(/<\/h1>/g,'</h2>');
  body=body.replace('<h2>'+escape(page.title)+'</h2>','<h1>'+escape(page.title)+'</h1>');
  return body+nextStep(draft,page,pageHref,escape);
 }
 if(!page.sourceServiceId||!wholeSiteDerivedSourcesCurrent(draft))return null;
 const snapshot=page.sourceServiceSnapshot,sourceParts=paragraphs(snapshot?.body);
 const generated=first.id===list(page.sectionIds)[0]&&text(first.title)===text(snapshot?.title)&&(text(first.body)===sourceParts[0]||text(first.body)===text(snapshot?.body));
 if(!generated)return null;
 let openingAttrs='',lead='',titleAttrs='';
 const plainIntro=text(first.body)===sourceParts[0]&&first.type==='text'&&!first.asset&&!first.storyPhoto&&!list(first.contentPhotos).length&&!explicitType(first)&&sourceParts[0]?.length<=700;
 if(plainIntro){
  const root=firstBlock.match(/^<section\b([^>]*)>/)?.[1]||'';
  openingAttrs=root;body=body.replace(firstBlock,'');
  lead='<p class="inner-page-lead"'+editAttrs(first,'body')+'>'+escape(first.body).replace(/\n/g,'<br>')+'</p>';
  titleAttrs=editAttrs(first,'title');
 }else{
  let intro=firstBlock;
  if(!editable&&text(first.title)===text(page.title))intro=removeHeading(intro,first,escape);
  const sized=Object.keys(first.appearance||{}).concat(Object.keys(first.asset?.appearance||{})).some(key=>/(?:photo|image|gallery).*(?:size|scale)/i.test(key));
  intro=classes(intro,'purpose-service-intro'+(!intro.includes('<img')?' purpose-text-intro':'')+(!explicitType(first)?' purpose-auto-type':'')+(!sized?' purpose-compact-photo':''));body=body.replace(firstBlock,intro);
  if(!explicitType(first))titleAttrs=editAttrs(first,'title');
 }
 const ordinal=draft.theme?.pageDirection==='studio-index'?list(draft.sections).find(s=>s.id==='services')?.items?.findIndex(item=>item.id===page.sourceServiceId):-1;
 const index=ordinal>=0?'<p class="purpose-service-number"><span>'+String(ordinal+1).padStart(2,'0')+'</span><span>Service</span></p>':'';
 const opening=classes('<section'+openingAttrs+'>','purpose-service-opening'+fontClass(draft,first))+'<div class="wrap">'+crumb+index+'<h1'+titleAttrs+'>'+escape(page.title)+'</h1>'+lead+'</div></section>';
 for(const section of sections.slice(1)){
  const block=sectionBlock(body,section.id,escape);if(!block)continue;
  let detailed=block;
  if(!editable&&text(section.title)==='A closer look'&&text(section.body)===sourceParts.slice(1).join('\n\n'))detailed=removeHeading(detailed,section,escape);
  body=body.replace(block,classes(detailed,'purpose-service-detail'+(!explicitType(section)?' purpose-auto-type':'')));
 }
 body=body.replace(/<(\/?)(h1)(\b[^>]*)>/g,'<$1h2$3>');
 const shared=businessContext(draft,page,sections,pageHref,escape);
 return opening+'<div class="purpose-service-layout'+(shared?' purpose-has-context':'')+(first.type==='photo-feature'?' purpose-photo-layout':'')+'"><div class="purpose-service-copy">'+body+'</div>'+shared+'</div>'+nextStep(draft,page,pageHref,escape);
}

export const websitePagePurposeCss=`
.purpose-service-opening{padding-block:clamp(24px,3.5vw,48px) clamp(32px,4vw,58px)!important;background:var(--paper)!important;border-bottom:1px solid var(--line)}
.purpose-service-opening .inner-breadcrumbs ol{margin-bottom:clamp(20px,3vw,36px)}
.purpose-service-opening h1{font-size:clamp(2.5rem,5.8vw,5.5rem);line-height:1.05;letter-spacing:-.045em;max-width:20ch;margin:0 0 22px;text-wrap:balance}
.purpose-default-serif h1{font-family:Georgia,'Times New Roman',serif;font-weight:500}
.purpose-service-opening .inner-page-lead{font-size:clamp(1.1rem,1.8vw,1.45rem);line-height:1.65;max-width:58ch;margin:0}
body.website-inner-page main>section.purpose-menu-body{padding-block:clamp(32px,4vw,60px) clamp(40px,5vw,72px)}
body.website-inner-page main>section.purpose-contact{padding-block:28px clamp(40px,5vw,72px)}
.purpose-contact-meta .inner-breadcrumbs ol{margin-bottom:18px}.purpose-contact-meta>h1{font-size:1rem;line-height:1.5;letter-spacing:.08em;text-transform:uppercase;font-family:inherit;font-weight:650;margin:0 0 clamp(24px,4vw,48px)}
.purpose-service-layout{width:min(calc(100% - 96px),1180px);margin-inline:auto;padding-block:clamp(34px,5vw,68px)}
.purpose-service-layout.purpose-has-context{display:grid;grid-template-columns:minmax(0,1fr) minmax(230px,.42fr);gap:clamp(32px,5vw,70px);align-items:start}
.purpose-service-layout.purpose-photo-layout{display:block}.purpose-photo-layout .purpose-business-context{display:grid;grid-template-columns:minmax(150px,.35fr) minmax(0,1fr);gap:14px 40px;border-left:0;border-top:1px solid var(--line);padding:28px 0 0}.purpose-photo-layout .purpose-business-context blockquote{max-width:55ch;margin:0}.purpose-photo-layout .purpose-business-context a{grid-column:2;justify-self:start}.purpose-service-number{display:flex;align-items:baseline;gap:22px;margin:0 0 18px}.purpose-service-number span:first-child{font-family:Georgia,serif;font-size:1.9rem;line-height:1}.purpose-service-number span:last-child{font-size:.875rem;text-transform:uppercase;letter-spacing:.1em}
.purpose-service-copy,.purpose-service-copy>*{min-width:0}.purpose-service-copy section{padding-block:0 36px;background:transparent!important}.purpose-service-copy .wrap{width:auto;max-width:none}
.purpose-service-copy .photo-feature-grid{gap:clamp(24px,4vw,54px)}.purpose-service-copy .purpose-compact-photo img.photo-feature-image{height:clamp(260px,30vw,420px);max-width:100%}
.purpose-text-intro .crafted-story,.purpose-text-intro .authored-story{grid-template-columns:minmax(0,1fr);gap:0}.purpose-text-intro.purpose-auto-type .crafted-story-lead,.purpose-text-intro.purpose-auto-type .authored-story-lead{font-size:clamp(1.2rem,2vw,1.6rem);line-height:1.65;max-width:46ch}.purpose-text-intro .story-copy>p+p{font-size:1.08rem;line-height:1.8;max-width:58ch;margin-top:24px}
/* The original editorial reading treatment reserves a heading column. Once
   its unedited duplicate heading is omitted, the source body must occupy the
   complete readable track. Beat that original rule without changing fonts or
   owner-formatted sections. The browser checks BODY width, not only the H1. */
main .purpose-service-copy section.owner-reading-editorial.purpose-text-intro.purpose-auto-type>.wrap.crafted-story{grid-template-columns:minmax(0,1fr);width:100%;max-width:none;gap:0}
.purpose-service-copy section.owner-reading-editorial.purpose-text-intro.purpose-auto-type>.wrap.crafted-story>.story-copy{grid-column:1/-1;grid-row:auto;width:100%;min-width:0;max-width:58ch;margin:0}
.purpose-service-copy .crafted-section-heading:empty,.purpose-service-copy .authored-story>header:empty{display:none}
.purpose-service-detail .crafted-story,.purpose-service-detail .story-layout,.purpose-service-detail .authored-story{grid-template-columns:minmax(0,1fr);gap:0}
.purpose-service-detail.purpose-auto-type .crafted-story-lead,.purpose-service-detail.purpose-auto-type .authored-story-lead{font-size:clamp(1.08rem,1.45vw,1.25rem);line-height:1.75;max-width:58ch}
.purpose-service-detail.purpose-auto-type .story-copy{max-width:none;margin:0}.purpose-service-copy .purpose-auto-type p{max-width:60ch}
.purpose-business-context{padding:24px 0 0 26px;border-left:1px solid var(--line);min-width:0}
.purpose-overline{font-size:.875rem;line-height:1.6;letter-spacing:.08em;text-transform:uppercase;font-weight:650;margin:0 0 18px}
.purpose-business-context blockquote{font-size:clamp(1.15rem,1.7vw,1.5rem);line-height:1.65;letter-spacing:-.02em;margin:0 0 22px;max-width:34ch}
.purpose-business-context a{display:inline-flex;gap:14px;align-items:center;min-height:48px;text-decoration:none;border-bottom:1px solid var(--line);font-size:.95rem;max-width:100%;overflow-wrap:anywhere}
.direction-studio-index .purpose-business-context{border-left:0;border-top:3px solid var(--accent);padding:24px 0 0}
.direction-menu-house .purpose-business-context{border-left:0;border-top:1px solid var(--line);padding:24px 0 0}
body.website-inner-page main>section.purpose-story{padding-block:28px clamp(44px,6vw,84px)!important;background:var(--paper)!important}
.purpose-story-meta .inner-breadcrumbs ol{margin-bottom:18px}.purpose-story-meta>h1{font-size:1rem;line-height:1.5;letter-spacing:.08em;text-transform:uppercase;font-family:inherit;font-weight:650;margin:0 0 32px}
.purpose-story .crafted-section-heading:empty,.purpose-story .authored-story>header:empty{display:none}.purpose-story:not(.purpose-story-has-photo) .crafted-story,.purpose-story:not(.purpose-story-has-photo) .authored-story{grid-template-columns:minmax(0,1fr);gap:0}
.purpose-story .story-copy{margin:0;max-width:none}.purpose-story.purpose-auto-type .crafted-story-lead,.purpose-story.purpose-auto-type .authored-story-lead{font-size:clamp(1.6rem,3.4vw,3.3rem);line-height:1.38;letter-spacing:-.035em;max-width:38ch;margin:0 0 32px}
.purpose-story.purpose-auto-type .story-copy>p:not(:first-child){font-size:clamp(1.08rem,1.45vw,1.3rem);line-height:1.8;max-width:56ch;margin-left:auto}
.direction-studio-index .purpose-story.purpose-default-serif .story-copy>p:first-child{font-family:Georgia,'Times New Roman',serif;max-width:28ch}
.direction-menu-house .purpose-story.purpose-default-serif .story-copy>p:first-child{font-family:Georgia,'Times New Roman',serif;max-width:34ch}
body.website-inner-page main>section.purpose-next{padding-block:30px 40px;background:var(--paper)!important;color:var(--ink);border-top:1px solid var(--line)}
.purpose-next-grid{display:flex;justify-content:space-between;gap:24px 48px;align-items:end;flex-wrap:wrap}.purpose-next-context{margin:0 0 14px;font-size:.9rem;line-height:1.5}
.purpose-primary{display:inline-flex;align-items:center;justify-content:space-between;gap:28px;max-width:100%;min-height:54px;padding:14px 20px;background:var(--ink);color:var(--paper)!important;text-decoration:none;font-size:clamp(1rem,1.4vw,1.25rem);font-weight:650;line-height:1.45;overflow-wrap:anywhere}
.purpose-primary span,.purpose-secondary span{flex:none}.purpose-secondary{display:inline-flex;align-items:center;gap:24px;min-height:48px;padding:12px 0;text-underline-offset:5px;max-width:100%;font-size:1rem;line-height:1.5}.purpose-primary:focus-visible{outline:3px solid var(--ink);outline-offset:5px}
@media(max-width:1000px){.purpose-service-layout.purpose-has-context{grid-template-columns:minmax(0,1fr) minmax(210px,.45fr);gap:30px}.direction-studio-index .purpose-service-layout.purpose-has-context{grid-template-columns:minmax(0,1fr)}}
@media(max-width:700px){.purpose-service-opening h1{font-size:clamp(2.35rem,9vw,3.3rem);max-width:100%;letter-spacing:-.04em}.purpose-service-opening .inner-page-lead{font-size:1.08rem}.purpose-service-layout{width:calc(100% - 36px);padding-block:30px 34px}.purpose-service-layout.purpose-has-context{grid-template-columns:minmax(0,1fr);gap:12px}.purpose-service-copy section{padding-bottom:26px}.purpose-photo-layout .purpose-business-context{display:block}.purpose-photo-layout .purpose-business-context blockquote{margin-bottom:18px}.purpose-business-context{border-left:0;border-top:1px solid var(--line);padding:24px 0 0}.purpose-business-context blockquote{font-size:1.2rem;max-width:40ch}.purpose-next-grid{display:block}.purpose-primary{width:100%;gap:20px}.purpose-secondary{margin-top:16px}.purpose-story-meta>h1{margin-bottom:24px}.purpose-story.purpose-auto-type .crafted-story-lead,.purpose-story.purpose-auto-type .authored-story-lead{font-size:clamp(1.55rem,6.4vw,1.85rem);line-height:1.45;max-width:none}.purpose-story.purpose-auto-type .story-copy>p:not(:first-child){font-size:1.06rem;max-width:none;margin-left:0}}
`;
