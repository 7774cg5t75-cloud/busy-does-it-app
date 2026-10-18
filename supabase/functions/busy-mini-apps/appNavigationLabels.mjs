const keys=Object.freeze(['business_profile','services','gallery','contact']);
const valid=value=>typeof value==='string'&&value.trim()===value&&value.length>0&&value.length<=36&&!/[<>\u0000-\u001f\u007f]/.test(value)&&!/\b(?:pay|paid|checkout|purchase|confirmed|available|in stock|book now)\b/i.test(value);
function validNavigationLabels(value){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(key=>keys.includes(key)&&valid(value[key]));}
function publicNavigationLabels(config){return Object.fromEntries((config?.modules||[]).filter(m=>m?.enabled===true&&keys.includes(m.key)&&valid(m.label)).map(m=>[m.key,m.label]));}
function prepareNavigationLabel(config,{moduleKey,value}={}){
 const rows=config?.modules?.filter(m=>m.key===moduleKey&&m.enabled===true)||[];
 if(!keys.includes(moduleKey)||rows.length!==1||value!==null&&!valid(value))return {ok:false,reason:'Choose an information screen and a short, honest navigation label.'};
 const row=rows[0];if(row.label!==undefined&&!valid(row.label))return {ok:false,reason:'Review the existing navigation wording before editing it.'};
 if((row.label??null)===value)return {ok:false,reason:'This label is already selected.'};
 if(value!==null&&config.modules.some(m=>m!==row&&m.enabled===true&&String(m.label||m.title||m.key.replaceAll('_',' ')).trim().toLowerCase()===value.toLowerCase()))return {ok:false,reason:'Use a distinct label so customers can tell screens apart.'};
 const next={...row};if(value===null)delete next.label;else next.label=value;
 return {ok:true,nextConfig:{...config,modules:config.modules.map(m=>m===row?next:m)},undo:{kind:'navigation_label',moduleKey,value:row.label??null},description:'Changed only the '+moduleKey.replaceAll('_',' ')+' navigation wording; its destination and customer actions stay unchanged.'};
}
export {validNavigationLabels,publicNavigationLabels,prepareNavigationLabel};
