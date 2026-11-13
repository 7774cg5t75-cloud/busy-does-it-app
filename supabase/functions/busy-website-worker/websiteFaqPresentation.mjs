import {itemTypographyClasses} from './websiteTextTypography.mjs';
// Shared static semantic HTML; no scripts, request actions or factual rewriting.
/** @param {unknown} section @param {{escapeHtml:(value:unknown)=>string,editAttrs?:(...args:unknown[])=>string,itemHeadingClass?:(item:unknown)=>string,contactHref?:string}} options */
export function faqDisclosureItems(section,{escapeHtml,editAttrs=()=>'',itemHeadingClass=/** @type {(item:unknown)=>string} */(()=>'')}={}){
 if(section?.type!=='faq'||section.appearance?.faqLayout!=='questions'||typeof escapeHtml!=='function')return '';
 return (Array.isArray(section.items)?section.items:[]).filter(item=>String(item?.title||'').trim()&&String(item?.body||'').trim()).map(item=>{
  const classes=itemTypographyClasses(item);
  return `<article${classes?` class="${classes}"`:''}><details><summary><h3${itemHeadingClass(item)}${editAttrs(section,'title',String(item.id||''))}>${escapeHtml(item.title)}</h3></summary><p${editAttrs(section,'body',String(item.id||''))}>${escapeHtml(item.body)}</p></details></article>`;
 }).join('');
}
