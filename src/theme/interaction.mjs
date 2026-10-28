// BUSY chrome only. No business branding, task state, persistence or actions.
export function workspaceDensity({width=390,fontScale=1}={}){
 const narrow=!Number.isFinite(width)||width<350||fontScale>=1.6;
 return {stack:narrow,gutter:width<350?16:20,tileWidth:narrow?'100%':'48%',metricStack:width<330||fontScale>=1.6};
}
export function orbMotion(state,{enabled=false,ambient=true,small=false}={}){
 if(!enabled)return null;
 if(state==='idle')return ambient?{duration:small?4600:3600,scale:small?1.008:1.018,baseOpacity:small?.86:.87,opacity:small?.93:.99,repeat:-1}:null;
 if(['listening','speaking','processing'].includes(state))return {duration:state==='processing'?1400:1100,scale:small?1.02:1.035,baseOpacity:.86,opacity:1,repeat:-1};
 return null;
}
export function horizontalOrbDrag(dx,dy){return Number.isFinite(dx)&&Number.isFinite(dy)&&Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.25;}
export function chromeLabel(text){return typeof text==='string'?text.replace(/^V\d+(?:\.\d+)+\s*[•·—–-]\s*/i,''):text;}
// Home hero geometry includes the largest genuine active halo scale (1.035).
// Keep every decorative pixel within its own row; text grows below, never over it.
export function homeHeroGeometry({width=390}={}){
 const available=Math.max(48,Math.min(960,Number.isFinite(width)?width:390)-32);
 const orbSize=Math.round(Math.min(204,Math.max(196,available*.55),available/1.05));
 return {orbSize,heroHeight:Math.ceil(orbSize*1.04)+8,available};
}
