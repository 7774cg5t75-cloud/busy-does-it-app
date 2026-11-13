// Finite section composition over ORIGINAL modules, not a plugin/code runtime.
const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const sections={business_profile:['introduction','products','events','faqs','testimonials','gallery','contact'],services:['services','gallery','contact']};
function validScreenComposition(value,config){
 if(!plain(value)||Object.keys(value).some(k=>!['version','screens'].includes(k))||value.version!==1||!Array.isArray(value.screens)||!value.screens.length||value.screens.length>2)return false;
 const seen=new Set(),enabled=new Set((config?.modules||[]).filter(m=>m.enabled===true).map(m=>m.key));
 return value.screens.every(s=>plain(s)&&Object.keys(s).length===2&&Object.keys(s).every(k=>['moduleKey','sections'].includes(k))&&Object.hasOwn(sections,s.moduleKey)&&!seen.has(s.moduleKey)&&!!seen.add(s.moduleKey)&&(!config||enabled.has(s.moduleKey))&&Array.isArray(s.sections)&&s.sections.length>0&&s.sections.length<=7&&new Set(s.sections).size===s.sections.length&&s.sections.includes(s.moduleKey==='business_profile'?'introduction':'services')&&s.sections.every(k=>sections[s.moduleKey].includes(k)&&(!config||!['gallery','contact'].includes(k)||enabled.has(k))&&(!config||!['products','events'].includes(k)||config.contentLayout?.some(b=>b.kind===(k==='products'?'product':'event')))));
}
function appScreenSections(config,moduleKey){
 if(config.screenComposition!==undefined&&!validScreenComposition(config.screenComposition,config))return null;
 const configured=config.screenComposition?.screens.find(s=>s.moduleKey===moduleKey);
 return configured?configured.sections:moduleKey==='business_profile'?['introduction',...(config.contentLayout||[]).map(b=>b.kind==='product'?'products':'events'),'faqs','testimonials']:[moduleKey];
}
export {validScreenComposition,appScreenSections};
