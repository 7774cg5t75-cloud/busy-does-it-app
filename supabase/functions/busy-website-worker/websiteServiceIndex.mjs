import {itemTypographyClasses} from './websiteTextTypography.mjs';
export function validServiceIndex(section){
 const items=section?.items;
 return section?.type==='services'&&Array.isArray(items)&&items.length>=2&&items.every(item=>item&&typeof item.id==='string'&&item.id.trim()&&String(item.title||'').trim()&&String(item.body||'').trim())&&new Set(items.map(item=>item.id)).size===items.length;
}
// Original record order and wording; finite local anchors, never new actions.
/** @param {unknown} section @param {{escapeHtml:(value:unknown)=>string,editAttrs?:(...args:unknown[])=>string,itemHeadingClass?:(item:unknown)=>string,contactHref?:string}} options */
export function serviceIndexHtml(section,{escapeHtml,editAttrs=()=>'',itemHeadingClass=/** @type {(item:unknown)=>string} */(()=>''),contactHref=''}={}){
 if(!validServiceIndex(section)||typeof escapeHtml!=='function')return '';
 const segment=value=>Array.from(String(value),letter=>letter.codePointAt(0).toString(16)).join('-');
 const anchor=item=>'service-index-'+segment(section.id)+'--'+segment(item.id);
 return `<div class="service-index-layout"><nav aria-label="${escapeHtml(section.title||'Services')}"><ul>${section.items.map(item=>`<li><a href="#${escapeHtml(anchor(item))}">${escapeHtml(item.title)}</a></li>`).join('')}</ul></nav><div class="service-index-details">${section.items.map(item=>`<article id="${escapeHtml(anchor(item))}" tabindex="-1" class="${itemTypographyClasses(item)}"><h3${itemHeadingClass(item)}${editAttrs(section,'title',item.id)}>${escapeHtml(item.title)}</h3><p${editAttrs(section,'body',item.id)}>${escapeHtml(item.body)}</p>${serviceContactAction(item,contactHref,escapeHtml)}</article>`).join('')}</div></div>`;
}

// A contact-section link is navigation only, never a submitted service request.
export function serviceContactAction(item,href,escapeHtml){
 if(href!=='#contact'||typeof item?.title!=='string'||!item.title.trim()||typeof escapeHtml!=='function')return '';
 return `<a class="service-enquiry-link" href="#contact">${escapeHtml('Discuss '+item.title)}</a>`;
}

// Shared hero orientation: exact current service names, never fabricated proof.
// A short selection is labelled honestly; complete details stay in Services.
export function heroServiceOverview(section,escapeHtml){
 if(section?.enabled===false||section?.type!=='services'||!Array.isArray(section.items)||typeof escapeHtml!=='function')return '';
 const names=section.items.map(r=>typeof r?.title==='string'?r.title.trim():'').filter(Boolean);
 if(!names.length||new Set(names.map(n=>n.toLowerCase())).size!==names.length)return '';
 return `<div class="hero-service-overview"><p class="hero-services-label">Services include</p><ul>${names.slice(0,3).map(name=>`<li>${escapeHtml(name)}</li>`).join('')}</ul></div>`;
}
