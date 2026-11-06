import {wholeSiteDerivedSourcesCurrent} from './websiteWholeSite.mjs';

// A presentation over the ORIGINAL current routes. This grants no source,
// account, publication or external-navigation authority.
const list=value=>Array.isArray(value)?value:[];
const text=value=>typeof value==='string'?value.trim():'';
const output=value=>typeof value==='string'&&/^(?:index\.html|(?:[a-z0-9-]+\/){1,3}index\.html)$/.test(value);
const signed=value=>{
 if(typeof value!=='string'||value.length>4096||/[\s\"'<>\u0000-\u001f\u007f]/.test(value))return null;
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.hash?url:null;}catch{return null;}
};

export function websiteSiteNavigationPlan({draft,page,items,pageHref}={}){
 if(draft?.sitePresentation!=='purposeful-v1'||!text(draft.id)||!draft.businessId||draft.business_id&&draft.business_id!==draft.businessId||!wholeSiteDerivedSourcesCurrent(draft))return null;
 if(!page||!output(page.outputPath)||!Array.isArray(items)||items.length<3||items.length>20)return null;
 const pages=list(draft.pages).filter(p=>p?.enabled!==false),ids=new Set(),hrefs=new Set();
 if(pages.filter(p=>p.id===page.id&&p.outputPath===page.outputPath).length!==1||new Set(pages.map(p=>p.id)).size!==pages.length||new Set(pages.map(p=>p.outputPath)).size!==pages.length)return null;
 let currentSigned=null;try{if(typeof pageHref==='function')currentSigned=signed(pageHref(page.id));}catch{return null;}
 const suffix='/'+page.outputPath,basePath=currentSigned?.pathname.endsWith(suffix)?currentSigned.pathname.slice(0,-page.outputPath.length):null;
 const prefix='../'.repeat(page.outputPath.split('/').length-1),rows=[];
 for(const item of items){
  const matches=pages.filter(p=>p.id===item?.id),label=text(item?.label);
  if(matches.length!==1||!label||label.length>160||ids.has(item.id)||!output(matches[0].outputPath))return null;
  const relative=prefix+matches[0].outputPath;let href=relative;
  // Absolute previews are accepted only from the ORIGINAL trusted resolver,
  // with the current page's exact origin/deployment prefix and target output.
  // A model string or navigation label cannot establish a signed destination.
  if(item.href!==relative){
   let trusted;try{trusted=typeof pageHref==='function'?pageHref(item.id):null;}catch{return null;}
   const url=signed(trusted);
   if(!currentSigned||!basePath||!url||url.origin!==currentSigned.origin||url.pathname!==basePath+matches[0].outputPath||item.href!==trusted)return null;
   href=trusted;
  }
  if(hrefs.has(href))return null;
  ids.add(item.id);hrefs.add(href);rows.push({id:item.id,label,href,current:item.id===page.id});
 }
 const overview=rows.find(item=>item.id==='services');
 if(!overview)return null;
 const services=list(draft.customPages).filter(p=>p?.sourceServiceId),group=[];
 if(new Set(services.map(p=>p.sourceServiceId)).size!==services.length)return null;
 for(const entry of services){
  const original=pages.filter(p=>p.id===entry.id&&p.sourceServiceId===entry.sourceServiceId),row=rows.find(item=>item.id===entry.id);
  if(original.length!==1||!row||original[0].sourceServiceSnapshot?.title!==entry.sourceServiceSnapshot?.title||original[0].sourceServiceSnapshot?.body!==entry.sourceServiceSnapshot?.body)return null;
  group.push(row);
 }
 if(group.length<2||new Set(group.map(item=>item.id)).size!==group.length)return null;
 group.sort((a,b)=>rows.findIndex(row=>row.id===a.id)-rows.findIndex(row=>row.id===b.id));
 const grouped=new Set(group.map(item=>item.id));
 return {primary:rows.filter(item=>!grouped.has(item.id)),services:group,overview,groupCurrent:group.some(item=>item.current)};
}

export function renderWebsiteSiteNavigation(context={}){
 const plan=websiteSiteNavigationPlan(context),escape=context.escapeHtml;
 if(!plan||typeof escape!=='function')return null;
 const link=(item,overview=false)=>`<a${item.current?' aria-current="page"':''} href="${escape(item.href)}"><span>${escape(item.label)}</span>${overview?'<span class="site-nav-link-hint">Overview</span>':''}</a>`;
 const group=(desktop=false)=>`<details class="site-nav-group${plan.groupCurrent?' site-nav-group-current':''}"${desktop&&plan.groupCurrent&&context.draft.theme?.pageDirection==='studio-index'?' open':''}><summary${plan.groupCurrent?' aria-label="'+escape(plan.overview.label+', current section')+'"':''}><span>${escape(plan.overview.label)}</span><span class="site-nav-symbol" aria-hidden="true">+</span></summary><ul class="site-nav-panel"><li class="site-nav-overview">${link(plan.overview,true)}</li>${plan.services.map(item=>`<li>${link(item)}</li>`).join('')}</ul></details>`;
 const items=(desktop=false)=>`<ul class="site-nav-items">${plan.primary.map(item=>`<li>${item.id===plan.overview.id?group(desktop):link(item)}</li>`).join('')}</ul>`;
 return `<div class="nav-links nav-long-desktop site-nav-desktop">${items(true)}</div><details class="nav-mobile-details site-nav-mobile"><summary>Menu <span aria-hidden="true">+</span></summary>${items()}</details>`;
}

export const siteNavigationCss=`
/* One reviewed hierarchy, shared by the original private/worker renderer. */
.site-nav-items,.site-nav-panel{list-style:none;margin:0;padding:0}
nav .site-nav-items{display:flex;flex-wrap:wrap;align-items:center;gap:4px 18px;min-width:0}
nav .site-nav-items>li{min-width:0;max-width:100%;position:relative}
nav .site-nav-items a,nav .site-nav-group>summary{min-height:44px;box-sizing:border-box;font-size:.94rem;line-height:1.35}
nav .site-nav-items a{display:flex;align-items:center;gap:16px;text-decoration:none;overflow-wrap:anywhere}
nav .site-nav-items a>span:first-child,nav .site-nav-group>summary>span:first-child{min-width:0;overflow-wrap:anywhere}
nav .site-nav-items a[aria-current='page']{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:7px;opacity:1}
.site-nav-group{position:relative;min-width:0}
.visual-nav-pill nav .site-nav-desktop .site-nav-group>summary{background:var(--soft);border-radius:80px;padding:10px 13px}
nav .site-nav-group>summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 8px;cursor:pointer;list-style:none;font-weight:650;white-space:normal}
.site-nav-group>summary::-webkit-details-marker{display:none}
.site-nav-group-current>summary>span:first-child{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:7px}
.site-nav-symbol{font-size:1.15rem;line-height:1;font-weight:400}
.site-nav-group[open]>.site-nav-symbol,.site-nav-group[open]>summary>.site-nav-symbol{transform:rotate(45deg)}
nav .site-nav-group>summary:focus-visible,nav .site-nav-items a:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
nav .site-nav-panel{position:absolute;top:calc(100% + 6px);left:0;z-index:60;width:max-content;min-width:250px;max-width:min(340px,calc(100vw - 32px));padding:12px 18px;background:var(--paper);color:var(--ink);border:1px solid var(--line);box-shadow:0 12px 32px rgba(0,0,0,.09)}
nav .site-nav-panel li{margin:0;min-width:0}
nav .site-nav-panel a{justify-content:space-between;max-width:100%;padding:12px 0;border:0;border-radius:0;background:transparent;white-space:normal;color:var(--ink);opacity:1}
nav .site-nav-panel li+li{border-top:1px solid var(--line)}
.site-nav-link-hint{font-size:.875rem;font-weight:400}
nav .site-nav-desktop{min-width:0}
@media(min-width:1000px){.direction-studio-index nav .site-nav-items{display:flex;flex-direction:column;align-items:stretch;width:100%;gap:8px}.direction-studio-index nav .site-nav-panel{position:static;width:auto;min-width:0;max-width:100%;padding:8px 0 4px 12px;border:0;border-left:1px solid var(--line);box-shadow:none}.direction-studio-index nav .site-nav-group>summary{padding-inline:0 10px}.direction-studio-index nav .site-nav-items a{padding-inline:0}.direction-studio-index nav .site-nav-panel a{font-size:.875rem}}
@media(min-width:701px) and (max-width:999px){
nav .site-nav-desktop{position:relative}
nav .site-nav-desktop .site-nav-items>li,nav .site-nav-desktop .site-nav-group{position:static}
nav .site-nav-desktop .site-nav-panel{left:0;right:auto;width:340px;max-width:100%;box-sizing:border-box}
}
@media(max-width:700px){
 body nav .site-nav-desktop.nav-links.nav-long-desktop{display:none}
 .site-nav-mobile{grid-column:1/-1;width:100%;min-width:0}
 nav .site-nav-mobile .site-nav-items{display:grid;grid-template-columns:minmax(0,1fr);gap:0;padding:8px 0 16px}
 nav .site-nav-mobile .site-nav-items>li{border-top:1px solid var(--line)}
 nav .site-nav-mobile .site-nav-items>li:first-child{border-top:0}
 nav .site-nav-mobile .site-nav-items>li>a,nav .site-nav-mobile .site-nav-group>summary{padding:12px 0;min-height:48px;justify-content:space-between;border-radius:0;background:transparent;opacity:1}
 nav .site-nav-mobile .site-nav-group>summary{padding:12px 10px 12px 0}
 nav .site-nav-mobile .site-nav-panel{position:static;min-width:0;width:auto;max-width:100%;padding:0 0 8px 18px;border:0;border-left:1px solid var(--line);box-shadow:none;background:transparent}
 nav .site-nav-mobile .site-nav-panel a{font-size:.94rem;min-height:48px;padding:12px 0}
}
`;
