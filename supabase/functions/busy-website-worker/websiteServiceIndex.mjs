import {itemTypographyClasses} from './websiteTextTypography.mjs';
export function validServiceIndex(section){
 const items=section?.items;
 return section?.type==='services'&&Array.isArray(items)&&items.length>=2&&items.every(item=>typeof item.id==='string'&&item.id.trim()&&String(item.title||'').trim()&&String(item.body||'').trim())&&new Set(items.map(item=>item.id)).size===items.length;
}
// Original record order and wording; finite local anchors, never new actions.
export function serviceIndexHtml(section,{escapeHtml,editAttrs=()=>'',itemHeadingClass=()=>''}={}){
 if(!validServiceIndex(section)||typeof escapeHtml!=='function')return '';
 const anchor=item=>'service-index-'+encodeURIComponent(section.id)+'-'+encodeURIComponent(item.id);
 return `<div class="service-index-layout"><nav aria-label="${escapeHtml(section.title||'Services')}"><ul>${section.items.map(item=>`<li><a href="#${escapeHtml(anchor(item))}">${escapeHtml(item.title)}</a></li>`).join('')}</ul></nav><div class="service-index-details">${section.items.map(item=>`<article id="${escapeHtml(anchor(item))}" tabindex="-1" class="${itemTypographyClasses(item)}"><h3${itemHeadingClass(item)}${editAttrs(section,'title',item.id)}>${escapeHtml(item.title)}</h3><p${editAttrs(section,'body',item.id)}>${escapeHtml(item.body)}</p></article>`).join('')}</div></div>`;
}
