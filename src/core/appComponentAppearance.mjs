// Finite text styling shared by Studio, trusted validation and native renders.
// No action, URL, position, visibility or executable property is accepted.
const COMPONENT_STYLE_OPTIONS=Object.freeze({size:['normal','large','extra-large'],weight:['regular','medium','bold'],align:['left','center','right'],colour:['brand','ink','accent']});
import {validPublicCollection} from './appPublicCollections.mjs';
const keyValid=key=>['header-title','header-tagline'].includes(key)||/^(service|faq):[a-zA-Z0-9_-]{1,80}:(title|body)$/.test(key);
const plain=value=>value&&typeof value==='object'&&!Array.isArray(value);
function validComponentStyle(value){return plain(value)&&Object.keys(value).length>0&&Object.keys(value).every(key=>Object.hasOwn(COMPONENT_STYLE_OPTIONS,key)&&COMPONENT_STYLE_OPTIONS[key].includes(value[key]));}
function validComponentStyles(value){return plain(value)&&Object.keys(value).length<=24&&Object.entries(value).every(([key,style])=>keyValid(key)&&validComponentStyle(style));}
function componentTargetExists(config,key){
 if(!keyValid(key))return false;
 const enabled=name=>config?.modules?.some(m=>m.key===name&&m.enabled===true);
 if(key.startsWith('header-'))return enabled('business_profile');
 const id=key.split(':')[1];
 if(key.startsWith('faq:'))return enabled('business_profile')&&validPublicCollection('faqs',config.publicProfile?.faqs)&&config.publicProfile.faqs.filter(row=>row.id===id).length===1;
 return enabled('services')&&Array.isArray(config.publicProfile?.services)&&config.publicProfile.services.filter(row=>row?.id===id).length===1;
}
function componentLockTargets(key){return ['appearance','typography','componentStyles',key,...(key.startsWith('header-')?['header','copy']:key.startsWith('faq:')?['faqs','copy']:['services','copy'])];}
function appComponentTextStyle(styles,key,{colors,baseSize=15}={}){
 if(!validComponentStyles(styles||{})||!Object.hasOwn(styles||{},key))return {};
 const value=styles[key],out={};
 if(value.size){out.fontSize=Math.round(baseSize*({normal:1,large:1.15,'extra-large':1.3}[value.size]));out.lineHeight=Math.ceil(out.fontSize*(key.endsWith('title')?1.22:1.5));}
 if(value.weight)out.fontWeight={regular:'400',medium:'600',bold:'800'}[value.weight];
 if(value.align)out.textAlign=value.align;
 if(value.colour==='ink')out.color=colors.text;
 if(value.colour==='accent')out.color=colors.accent;
 return out;
}
function previewAppComponentAppearance(config,{field,value}={}){
 if(!componentTargetExists(config,field)||value!==null&&!validComponentStyle(value))return {ok:false,reason:'Select a current supported heading or identified service text and use finite text controls.'};
 const before=config.presentation?.componentStyles||{};
 if(!validComponentStyles(before))return {ok:false,reason:'Review the existing component styles first.'};
 const styles={...before};if(value===null)delete styles[field];else styles[field]={...styles[field],...value};
 if(JSON.stringify(before)===JSON.stringify(styles))return {ok:false,reason:'This component style is already selected.'};
 if(!validComponentStyles(styles))return {ok:false,reason:'Up to 24 supported text components may be styled.'};
 const presentation={...config.presentation};if(Object.keys(styles).length)presentation.componentStyles=styles;else delete presentation.componentStyles;
 return {ok:true,nextConfig:{...config,presentation},description:'Styled only '+field+'; customer actions and business facts are unchanged.'};
}
export {COMPONENT_STYLE_OPTIONS,validComponentStyles,componentTargetExists,componentLockTargets,appComponentTextStyle,previewAppComponentAppearance};
