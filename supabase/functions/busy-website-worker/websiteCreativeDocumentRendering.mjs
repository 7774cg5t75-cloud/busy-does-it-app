import {websiteCreativeDocumentSection,websiteCreativeDocumentPageModel,websiteCreativeDocumentAsset,resolveWebsiteCreativeSource,creativeDocumentColours} from './websiteCreativeDocument.mjs';
import {websiteOwnerTextPresentation,websiteOwnerSectionSpacing} from './websiteTextTypography.mjs';
import {websiteAssetAvailable} from './websitePhotoPresentation.mjs';
import {readableAccent,textContrast} from './websiteTextColours.mjs';

// Reviewed local renderer vocabulary. These are platform font stacks, not
// downloaded assets or a claim that a proprietary font is installed everywhere.
export const WEBSITE_CREATIVE_FONT_PROVENANCE=Object.freeze({
 'system-sans':{stack:'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif',availability:'Uses the operating system font, then ordinary installed sans-serif fallbacks; no bundled font file.'},
 georgia:{stack:'Georgia,"Times New Roman",ui-serif,serif',availability:'Georgia or Times New Roman when supplied by the operating system; otherwise the installed serif fallback. No font redistribution.'},
 trebuchet:{stack:'"Trebuchet MS",Verdana,Arial,sans-serif',availability:'Trebuchet MS where already installed; otherwise Verdana/Arial or the installed sans-serif fallback. No font redistribution.'},
 verdana:{stack:'Verdana,Geneva,Arial,sans-serif',availability:'Verdana/Geneva where already installed; otherwise Arial or the installed sans-serif fallback. No font redistribution.'}
});
// A stale or withdrawn source must not leave a blank preview or silently
// replace an approved design. This fixed message contains no private source
// data, guessed replacement imagery, transaction or publishing action.
export const websiteCreativeDocumentUnavailableHtml='<section class="creative-document-review-required" aria-labelledby="creative-document-review-title"><div class="wrap"><h1 id="creative-document-review-title">Review changed business information or photographs</h1><p>This preview is temporarily unavailable. Ask Busy to check the current business details and approved photographs. Your saved design and wording are kept.</p></div></section>';
const list=value=>Array.isArray(value)?value:[];
const number=(value,min,max)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max?String(value):null;
const hex=value=>typeof value==='string'&&/^#[a-fA-F0-9]{6}$/.test(value)?value:null;
const colour=value=>hex(value)||typeof value==='string'&&/^var\(--(?:paper|ink)\)$/.test(value);
const escape=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const output=value=>typeof value==='string'&&/^(?:index\.html|(?:[a-z0-9-]+\/){1,3}index\.html)$/.test(value);
const id=value=>typeof value==='string'&&/^[-a-zA-Z0-9_]{1,128}$/.test(value);
const style=values=>Object.entries(values).filter(([,value])=>value!==undefined&&value!==null&&value!=='').map(([name,value])=>name+':'+value).join(';');
function colours(brand,background){
 const chosen=creativeDocumentColours(brand,background);
 const paint=chosen?.background;
 if(!colour(chosen?.color)||!colour(chosen?.muted)||!(colour(paint)||typeof paint==='string'&&/^linear-gradient\((?:\d{1,3}(?:\.\d+)?)deg(?: in srgb)?,\s*#[a-fA-F0-9]{6},\s*#[a-fA-F0-9]{6}\)$/.test(paint)))return null;
 let accent=background==='paper'?'var(--owner-dark-text-accent)':'var(--owner-light-text-accent)';
 if(brand){
  const samples=background==='gradient'?[Math.min,Math.max].map(bound=>'#'+[1,3,5].map(offset=>bound(parseInt(brand.gradient.from.slice(offset,offset+2),16),parseInt(brand.gradient.to.slice(offset,offset+2),16)).toString(16).padStart(2,'0')).join('')):[paint];
  const minimum=colour=>Math.min(...samples.map(fill=>textContrast(colour,fill))),light=minimum('#FFFFFF')>=minimum('#000000');
  accent=readableAccent(brand.palette.accent,samples,light);
 }
 return {background:paint,color:chosen.color,'--dc-muted':chosen.muted,'--owner-text-ink':chosen.color,'--owner-text-accent':accent};
}
function originalLink(draft,current,target,pageHref){
 const matches=list(draft.sections).filter(section=>section.type==='contact'&&section.enabled!==false);
 if(target?.contactField){
  if(matches.length!==1||target.contactField!=='email'&&target.contactField!=='phone')return '';
  const value=matches[0][target.contactField];if(typeof value!=='string')return '';
  if(target.contactField==='email')return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)?'mailto:'+value:'';
  return /^[+()\d .-]{5,40}$/.test(value)?'tel:'+value.replace(/\s+/g,''):'';
 }
 const pages=list(draft.pages).filter(page=>page.enabled!==false),page=pages.find(page=>page.id===target?.pageId);
 if(!page||!output(current?.outputPath)||!output(page.outputPath))return '';
 const fragment=target.sectionId;
 if(fragment!==null&&fragment!==undefined&&(!id(fragment)||!list(page.sectionIds).includes(fragment)))return '';
 const prefix='../'.repeat(current.outputPath.split('/').length-1),relative=prefix+page.outputPath;
 let resolved;try{resolved=typeof pageHref==='function'?pageHref(page.id):'';}catch{return '';}
 let href=relative;
 if(resolved&&resolved!==relative){
  let source;try{source=new URL(pageHref(current.id));}catch{return '';}
  let url;try{url=new URL(resolved);}catch{return '';}
  const suffix='/'+current.outputPath;
  if(source.protocol!=='https:'||url.protocol!=='https:'||url.username||url.password||url.hash||source.username||source.password||source.hash||url.origin!==source.origin||!source.pathname.endsWith(suffix)||url.pathname!==source.pathname.slice(0,-current.outputPath.length)+page.outputPath||/[\s"'<>\u0000-\u001f\u007f]/.test(resolved))return '';
  href=resolved;
 }
 return fragment?href+'#'+fragment:href;
}
function ownerText(draft,copy,target,level,section,copyId){
 const sources=list(copy?.sourceRefs).map(ref=>resolveWebsiteCreativeSource(draft,ref)).filter(Boolean);
 const first=sources.find(source=>source.section||source.item);
 const row=list(section?.items).find(row=>row.id===copyId);
 const appearance={...(first?.section?.appearance||{}),...(first?.item?.appearance||{}),...(section?.appearance||{}),...(row?.appearance||{})};
 const projection=websiteOwnerTextPresentation({appearance},target,level),base=projection.base;
 const result=/** @type {Record<string,any>} */({});
 const names={fontFamily:'font-family',fontWeight:'font-weight',lineHeight:'line-height',textAlign:'text-align'};
 for(const [key,name]of Object.entries(names))if(base[key]!==undefined)result[name]=base[key];
 if(base.colourRole)result.color='var(--owner-text-'+base.colourRole+')';
 if(base.fontSize)result['--dc-owner-size']=base.fontSize;
 if(projection.mobile.fontSize)result['--dc-owner-mobile-size']=projection.mobile.fontSize;
 if(projection.desktop.fontSize)result['--dc-owner-desktop-size']=projection.desktop.fontSize;
 return result;
}

export function websiteCreativeDocumentSite(draft){
 const model=websiteCreativeDocumentPageModel(draft);if(!model)return null;
 if(model.brand===null)return {model,css:'',classes:'creative-document-site creative-document-nav-'+model.navigationPresentation.placement};
 const brand=model.brand,heading=WEBSITE_CREATIVE_FONT_PROVENANCE[brand?.headingFont],body=WEBSITE_CREATIVE_FONT_PROVENANCE[brand?.bodyFont];
 if(!heading||!body||!Object.values(brand?.palette||{}).every(value=>!!hex(value)))return null;
 const palette=brand.palette;
 const darkAccent=readableAccent(palette.accent,[palette.paper,'#FFFFFF']),lightAccent=readableAccent(palette.accent,[palette.ink,'#264D61','#285647','#402B2A'],true);
 // `muted` is a readable foreground, not an interchangeable soft background.
 // Retained original pages must keep a light surface under their ink text.
 const css='body.creative-document-site{--ink:'+palette.ink+';--paper:'+palette.paper+';--accent:'+palette.accent+';--soft:'+palette.paper+';--line:'+palette.muted+';--owner-dark-text-accent:'+darkAccent+';--owner-light-text-accent:'+lightAccent+';--dc-heading-font:'+heading.stack+';--dc-body-font:'+body.stack+';font-family:var(--dc-body-font,inherit);color:var(--ink);background:var(--paper)}';
 return {model,css,classes:'creative-document-site creative-document-nav-'+model.navigationPresentation.placement};
}

// One new original section renderer, not a website/HTML execution engine.
// The independent compiler resolves current copy rows and original source/media
// identities before any markup is emitted. No model-provided style string,
// element name, URL, class name or executable markup is interpolated.
export function renderWebsiteCreativeDocument(draft,section,{pageId='home',resolveImage=/** @type {(asset:any)=>string} */((asset)=>''),responsiveImageAttrs=/** @type {(asset:any,url:string,options?:any)=>string} */((asset,url,options)=>''),pageHref=/** @type {(id:string)=>string} */((id)=>''),editAttrs=(...args)=>''}={}){
 const document=websiteCreativeDocumentSection(draft,section),page=list(draft?.pages).find(page=>page.id===pageId&&page.enabled!==false);
 if(!document||!page||!list(page.sectionIds).includes(section.id))return '';
 const layout=document.layout,brand=document.brand,paint=colours(brand,layout.background);
 if(!paint||[number(layout.maxWidth,640,1440),number(layout.paddingX,16,96),number(layout.paddingY,16,128),number(layout.mobilePaddingX,16,32),number(layout.mobilePaddingY,16,64),number(layout.gap,8,64)].some(value=>value===null))return '';
 const sourceAttrs=copyId=>id(copyId)?editAttrs(section,'body',copyId):'';
 let renderedImages=0;
 function render(node){
  if(!id(node?.id))return '';
  const anchor=section.id+'--'+node.id,attrs=' id="'+escape(anchor)+'"';
  if(node.type==='heading'){
   const size=number(node.size,24,112),level=[1,2,3].includes(node.level)?node.level:null;
   if(size===null||number(node.mobileSize,24,56)===null||!level||typeof node.copy?.text!=='string')return '';
   const typography=style({'--dc-size':size+'px','--dc-mobile-size':node.mobileSize+'px','text-align':node.align==='center'?'center':'start',...ownerText(draft,node.copy,'title',level,section,node.copyId)});
   return '<h'+level+attrs+' class="creative-doc-heading" style="'+escape(typography)+'"'+sourceAttrs(node.copyId)+'>'+escape(node.copy.text)+'</h'+level+'>';
  }
  if(node.type==='text'){
   if(number(node.size,16,24)===null||number(node.measure,24,75)===null||typeof node.copy?.text!=='string')return '';
   const typography=style({'--dc-size':node.size+'px','--dc-mobile-size':Math.min(node.size,20)+'px','max-width':node.measure+'ch',...ownerText(draft,node.copy,'body',2,section,node.copyId)});
   return '<div'+attrs+' class="creative-doc-text" style="'+escape(typography)+'"'+sourceAttrs(node.copyId)+'>'+node.copy.text.split(/\n\s*\n/).map(paragraph=>'<p>'+escape(paragraph).replace(/\n/g,'<br>')+'</p>').join('')+'</div>';
  }
  if(node.type==='image'){
   const asset=websiteCreativeDocumentAsset(draft,node.asset);
   if(!asset||!websiteAssetAvailable(asset,draft.businessId)||number(node.ratio,.5,2.5)===null||number(node.focal?.x,0,100)===null||number(node.focal?.y,0,100)===null||typeof node.alt?.text!=='string')return '';
   let url;try{url=resolveImage(asset);}catch{return '';}
   if(typeof url!=='string'||!url||/[\s"'<>\u0000-\u001f\u007f]/.test(url)||!(/^(?:https:\/\/|(?:\.\.\/)*assets\/)/.test(url)))return '';
   const own=asset.appearance||{},fit=own.photoFit==='contain'?'contain':own.photoFit==='cover'?'cover':node.fit;
   const crop=['top','bottom','center'].includes(own.photoCrop)?'center '+own.photoCrop:node.focal.x+'% '+node.focal.y+'%';
   const css=style({'aspect-ratio':node.ratio,'object-fit':fit,'object-position':crop});
   const cropClasses=['mobile','desktop'].filter(view=>['top','center','bottom'].includes(own[view+'PhotoCrop'])).map(view=>' creative-doc-'+view+'-crop-'+own[view+'PhotoCrop']).join('');
   const eager=renderedImages++===0&&page.sectionIds[0]===section.id,imageAttrs=responsiveImageAttrs(asset,url,{hero:eager});
   return '<figure'+attrs+' class="creative-doc-image"'+sourceAttrs(node.altCopyId)+'><img class="creative-doc-image-element'+cropClasses+'" style="'+escape(css)+'"'+imageAttrs+' src="'+escape(url)+'" alt="'+escape(node.alt.text)+'" width="'+asset.width+'" height="'+asset.height+'" loading="'+(eager?'eager':'lazy')+'"'+(eager?' fetchpriority="high"':'')+' decoding="async"></figure>';
  }
  if(node.type==='link'){
   if(typeof node.copy?.text!=='string')return '';
   const href=originalLink(draft,page,node.target,pageHref);if(!href)return '';
   const typography=style(ownerText(draft,node.copy,'body',2,section,node.copyId));
   return '<a'+attrs+' class="creative-doc-link'+(node.presentation==='button'?' creative-doc-link-button':'')+'" href="'+escape(href)+'"'+(typography?' style="'+escape(typography)+'"':'')+sourceAttrs(node.copyId)+'>'+escape(node.copy.text)+'<span aria-hidden="true">↗</span></a>';
  }
  if(node.type==='list'){
   if(!Array.isArray(node.items)||!node.items.length||node.items.some(copy=>typeof copy?.text!=='string'))return '';
   const tag=node.ordered?'ol':'ul';
   return '<'+tag+attrs+' class="creative-doc-list">'+node.items.map((copy,index)=>{const typography=style(ownerText(draft,copy,'body',2,section,node.itemCopyIds?.[index]));return '<li'+(typography?' style="'+escape(typography)+'"':'')+sourceAttrs(node.itemCopyIds?.[index])+'>'+escape(copy.text).replace(/\n/g,'<br>')+'</li>';}).join('')+'</'+tag+'>';
  }
  if(node.type==='divider')return [1,2,3].includes(node.weight)?'<hr'+attrs+' class="creative-doc-divider" style="border-top-width:'+node.weight+'px">':'';
  if(!['stack','grid','group'].includes(node.type)||!Array.isArray(node.children))return '';
  const children=node.children.map(render).join('');if(!children)return '';
  if(node.type==='group'){
   const groupPaint=colours(brand,node.background);if(!groupPaint||number(node.padding,12,64)===null)return '';
   return '<div'+attrs+' class="creative-doc-group" style="'+escape(style({...groupPaint,'--dc-group-padding':node.padding+'px'}))+'">'+children+'</div>';
  }
  if(number(node.gap,8,64)===null)return '';
  if(node.type==='stack')return '<div'+attrs+' class="creative-doc-stack" style="--dc-gap:'+node.gap+'px">'+children+'</div>';
  if(!Array.isArray(node.columns)||node.columns.length<1||node.columns.length>3||node.columns.some(value=>number(value,1,12)===null)||![1,2].includes(node.mobileColumns)||number(node.mobileGap,8,32)===null)return '';
  const columns=node.columns.map(weight=>'minmax(0,'+weight+'fr)').join(' '),align=['start','center','end'].includes(node.align)?node.align:'start';
  return '<div'+attrs+' class="creative-doc-grid" style="'+escape(style({'--dc-columns':columns,'--dc-gap':node.gap+'px','--dc-mobile-columns':'repeat('+node.mobileColumns+',minmax(0,1fr))','--dc-mobile-gap':node.mobileGap+'px','align-items':align}))+'">'+children+'</div>';
 }
 const html=list(document.nodes).map(render).join('');if(!html)return '';
 const ownSpacing=websiteOwnerSectionSpacing(section);
 const variables=style({...paint,'--dc-max-width':layout.maxWidth+'px','--dc-padding-x':layout.paddingX+'px','--dc-padding-y':layout.paddingY+'px','--dc-mobile-padding-x':layout.mobilePaddingX+'px','--dc-mobile-padding-y':layout.mobilePaddingY+'px','--dc-owner-padding-y':ownSpacing.base,'--dc-owner-mobile-padding-y':ownSpacing.mobile,'--dc-owner-desktop-padding-y':ownSpacing.desktop,'--dc-gap':layout.gap+'px'});
 return '<section id="'+escape(section.id)+'" class="creative-document" style="'+escape(variables)+'"'+editAttrs(section,'section')+'><div class="creative-document-inner">'+html+'</div></section>';
}

export const websiteCreativeDocumentCss=`
body.creative-document-site{display:block}
.creative-document-site main,.creative-document-site main>*{min-width:0}
body.creative-document-site main>section.creative-document{padding:var(--dc-owner-padding-y,var(--dc-padding-y)) var(--dc-padding-x);background:inherit;scroll-margin-top:24px}
.creative-document-inner{width:100%;max-width:var(--dc-max-width);margin-inline:auto;display:grid;gap:var(--dc-gap);min-width:0}
.creative-document :where(div,figure,h1,h2,h3,p,li,a){min-width:0;max-width:100%;box-sizing:border-box}
.creative-doc-heading{font-family:var(--dc-heading-font,inherit);font-size:var(--dc-owner-size,var(--dc-size));font-weight:500;line-height:1.05;letter-spacing:-.045em;margin:0;max-width:none;text-wrap:balance;overflow-wrap:break-word}
.creative-doc-text{font-family:var(--dc-body-font,inherit);font-size:var(--dc-owner-size,var(--dc-size));line-height:1.7;letter-spacing:0}
.creative-document .creative-doc-text p{font-family:inherit;font-size:inherit;line-height:inherit;max-width:none;margin:0 0 1.2em}
.creative-document .creative-doc-text p:last-child{margin-bottom:0}
.creative-doc-stack,.creative-doc-group{display:grid;align-content:start;gap:var(--dc-gap,24px)}
.creative-doc-grid{display:grid;grid-template-columns:var(--dc-columns);gap:var(--dc-gap);min-width:0}
.creative-doc-group{padding:var(--dc-group-padding);color:inherit;background:inherit}
.creative-doc-image{margin:0;width:100%;min-width:0}
.creative-document .creative-doc-image img{display:block;width:100%;height:auto;max-width:100%;box-shadow:none}
.creative-doc-link{display:inline-flex;align-items:center;justify-content:space-between;gap:20px;min-height:48px;max-width:100%;padding:10px 0;text-decoration:underline;text-underline-offset:6px;justify-self:start;font-size:var(--dc-owner-size,1rem);line-height:1.45;overflow-wrap:anywhere}
.creative-doc-link span{flex:none}
.creative-doc-link-button{padding:16px 24px;border:1px solid currentColor;text-decoration:none;min-height:54px}
.creative-doc-link:focus-visible{outline:3px solid currentColor;outline-offset:5px}
.creative-doc-list{display:grid;gap:20px;padding-left:1.3em;margin:0;font-size:1.05rem;line-height:1.7}
.creative-doc-list li{font-size:var(--dc-owner-size,1.05rem)}
.creative-doc-divider{width:100%;margin:0;border:0;border-top:1px solid currentColor;opacity:.45}
body.creative-document-site .site-footer{background:var(--ink);color:var(--paper)}
body.creative-document-site>nav{position:relative;inset:auto;width:auto;min-height:0;height:auto;align-self:auto;grid-column:auto;grid-row:auto;border-right:0;padding:0;background:var(--paper);color:var(--ink)}
.creative-document-site>nav .nav-wrap{display:flex;flex-direction:row;align-items:center;gap:25px;min-height:84px;width:min(calc(100% - 48px),1280px);max-width:1280px;margin-inline:auto;padding:0}
.creative-document-site>nav .nav-links,.creative-document-site>nav .site-nav-items{flex-direction:row;align-items:center;gap:12px 24px;border-left:0;padding-left:0}
body.creative-document-site .nav-links a{min-height:44px;display:inline-flex;align-items:center}
.creative-document-site>nav .site-nav-primary{padding:10px 16px;border:1px solid currentColor;border-radius:0;opacity:1}
@media(min-width:960px){
 body.creative-document-site main>section.creative-document{padding-block:var(--dc-owner-desktop-padding-y,var(--dc-owner-padding-y,var(--dc-padding-y)))}
 .creative-doc-heading,.creative-doc-text{font-size:var(--dc-owner-desktop-size,var(--dc-owner-size,var(--dc-size)))}
 .creative-doc-link,.creative-doc-list li{font-size:var(--dc-owner-desktop-size,var(--dc-owner-size,1rem))}
 .creative-document .creative-doc-desktop-crop-top{object-position:center top!important}.creative-document .creative-doc-desktop-crop-center{object-position:center center!important}.creative-document .creative-doc-desktop-crop-bottom{object-position:center bottom!important}
 body.creative-document-site.creative-document-nav-rail{padding-left:220px}
 body.creative-document-site.creative-document-nav-rail>nav{position:fixed;inset:0 auto 0 0;width:220px;border-right:1px solid var(--line);border-bottom:0;padding:28px 22px;overflow:auto}
 body.creative-document-site.creative-document-nav-rail>nav>.wrap{width:100%;min-height:0;display:block}
 .creative-document-nav-rail nav .brand{margin-bottom:30px;max-width:100%;font-size:1.2rem}
 .creative-document-nav-rail nav .nav-links,.creative-document-nav-rail nav .site-nav-items{display:flex;flex-direction:column;align-items:stretch;gap:8px}
 .creative-document-nav-rail nav .site-nav-panel{position:static;min-width:0;width:100%;max-width:100%;padding:8px 0 8px 12px;box-shadow:none;border:0;border-left:1px solid var(--line)}
 body.creative-document-site.creative-document-nav-split>nav>.wrap{display:grid;grid-template-columns:minmax(160px,.6fr) minmax(0,1.4fr);gap:30px;min-height:100px}
 .creative-document-nav-split nav .brand{font-family:var(--dc-heading-font,inherit);font-weight:500;font-size:1.6rem}
}
@media(max-width:959px){body.creative-document-site{padding-left:0}.creative-document-site>nav{position:relative;width:auto;height:auto;inset:auto}.creative-document-site>nav .wrap{padding:0;min-height:80px}}
@media(max-width:700px){body.creative-document-site>nav .nav-wrap{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;padding-block:18px}body.creative-document-site>nav .nav-mobile-details{width:100%;grid-column:1/-1}}
@media(max-width:720px){
 body.creative-document-site main>section.creative-document{padding:var(--dc-owner-mobile-padding-y,var(--dc-owner-padding-y,var(--dc-mobile-padding-y))) var(--dc-mobile-padding-x)}
 .creative-doc-grid{grid-template-columns:var(--dc-mobile-columns);gap:var(--dc-mobile-gap)}
 .creative-doc-stack,.creative-document-inner{gap:clamp(20px,5vw,var(--dc-gap))}
 .creative-doc-group{padding:clamp(18px,5vw,var(--dc-group-padding))}
 .creative-doc-heading,.creative-doc-text{font-size:var(--dc-owner-mobile-size,var(--dc-owner-size,var(--dc-mobile-size,var(--dc-size))))}
 .creative-doc-link,.creative-doc-list li{font-size:var(--dc-owner-mobile-size,var(--dc-owner-size,1rem))}
 .creative-document .creative-doc-mobile-crop-top{object-position:center top!important}.creative-document .creative-doc-mobile-crop-center{object-position:center center!important}.creative-document .creative-doc-mobile-crop-bottom{object-position:center bottom!important}
 .creative-doc-link-button{padding:14px 18px;min-height:52px}
}
`;
