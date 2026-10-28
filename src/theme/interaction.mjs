// BUSY chrome only. No business branding, task state, persistence or actions.
export function workspaceDensity({width=390,fontScale=1}={}){
 const narrow=!Number.isFinite(width)||width<370||fontScale>=1.3;
 return {stack:narrow,gutter:width<350?16:20,tileWidth:narrow?'100%':'48%',metricStack:narrow};
}
export function orbMotion(state,{enabled=false,ambient=true}={}){
 if(!enabled)return null;
 if(state==='idle')return ambient?{duration:1600,scale:1.035,opacity:.7,repeat:2}:null;
 if(['listening','speaking','processing'].includes(state))return {duration:state==='processing'?1400:1100,scale:1.045,opacity:.8,repeat:-1};
 return null;
}
export function horizontalOrbDrag(dx,dy){return Number.isFinite(dx)&&Number.isFinite(dy)&&Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.25;}
export function chromeLabel(text){return typeof text==='string'?text.replace(/^V\d+(?:\.\d+)+\s*[•·—–-]\s*/i,''):text;}
