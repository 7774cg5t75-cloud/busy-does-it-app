// Finite chrome geometry. Coordinates are relative to the measured content viewport,
// already inside the original app safe area and excluding the bottom navigation.
export const ORB_SIZE=48,ORB_MARGIN=12;
export function floatingBounds(bounds){
 if(!bounds||![bounds.width,bounds.height].every(Number.isFinite)||bounds.width<160||bounds.height<160||bounds.width>10000||bounds.height>10000)return null;
 return {left:ORB_MARGIN,top:ORB_MARGIN,right:bounds.width-ORB_MARGIN-ORB_SIZE,bottom:bounds.height-ORB_MARGIN-ORB_SIZE};
}
export function clampFloatingOrb(point,bounds){const b=floatingBounds(bounds);if(!b)return null;return {x:Math.max(b.left,Math.min(b.right,Number.isFinite(point?.x)?point.x:b.right)),y:Math.max(b.top,Math.min(b.bottom,Number.isFinite(point?.y)?point.y:b.bottom))};}
export function floatingDrag(dx,dy){return Number.isFinite(dx)&&Number.isFinite(dy)&&Math.hypot(dx,dy)>=9;}
export function clearFloatingSlot(point,obstacles=[]){
 if(!point||!Array.isArray(obstacles))return false;
 return obstacles.every(r=>r&&[r.x,r.y,r.width,r.height].every(Number.isFinite)&&r.width>=0&&r.height>=0&&(r.width===0||r.height===0||point.x+ORB_SIZE<=r.x-8||point.x>=r.x+r.width+8||point.y+ORB_SIZE<=r.y-8||point.y>=r.y+r.height+8));
}
export const floatingEdges=['left','right','top','bottom'];
function closestEdge(p,b){return floatingEdges.map(edge=>({edge,d:edge==='left'?p.x-b.left:edge==='right'?b.right-p.x:edge==='top'?p.y-b.top:b.bottom-p.y})).sort((a,c)=>a.d-c.d)[0].edge;}
function onEdge(p,b,edge){return edge==='left'?{x:b.left,y:p.y}:edge==='right'?{x:b.right,y:p.y}:edge==='top'?{x:p.x,y:b.top}:{x:p.x,y:b.bottom};}
// Analytic interval endpoints, not a coarse grid of parking slots. Exact contact
// boundaries remain safe under clearFloatingSlot's eight-point exclusion gap.
function safeOnEdge(p,b,obstacles,edge){
 const vertical=edge==='left'||edge==='right',projected=onEdge(p,b,edge),low=vertical?b.top:b.left,high=vertical?b.bottom:b.right,desired=vertical?p.y:p.x;
 const candidates=[Math.max(low,Math.min(high,desired)),low,high];
 for(const r of obstacles){if(!r||![r.x,r.y,r.width,r.height].every(Number.isFinite)||r.width<0||r.height<0)return null;if(!r.width||!r.height)continue;const near=vertical?!(projected.x+ORB_SIZE<=r.x-8||projected.x>=r.x+r.width+8):!(projected.y+ORB_SIZE<=r.y-8||projected.y>=r.y+r.height+8);if(near){const a=(vertical?r.y:r.x)-ORB_SIZE-8,z=(vertical?r.y+r.height:r.x+r.width)+8;candidates.push(Math.max(low,Math.min(high,a)),Math.max(low,Math.min(high,z)));}}
 for(const t of [...new Set(candidates)].sort((a,c)=>Math.abs(a-desired)-Math.abs(c-desired))){const q=vertical?{x:projected.x,y:t}:{x:t,y:projected.y};if(clearFloatingSlot(q,obstacles))return q;}return null;
}
export function floatingPlacement(point,bounds,obstacles=[],edge){
 const b=floatingBounds(bounds),p=clampFloatingOrb(point,bounds);if(!b||!p||!Array.isArray(obstacles))return {point:null,reason:'geometry-unavailable'};
 const preferred=floatingEdges.includes(edge)?edge:closestEdge(p,b),adjacent=preferred==='left'||preferred==='right'?['top','bottom']:['left','right'],opposite={left:'right',right:'left',top:'bottom',bottom:'top'}[preferred];
 const direct=onEdge(p,b,preferred),same=safeOnEdge(p,b,obstacles,preferred);
 const sameDistance=same?Math.hypot(same.x-p.x,same.y-p.y):Infinity;
 if(same&&(sameDistance<=96||same.x===direct.x&&same.y===direct.y))return {point:same,edge:preferred,reason:same.x===direct.x&&same.y===direct.y?'preferred-safe':'essential-control',blockedBy:obstacles.map((r,i)=>!clearFloatingSlot(direct,[r])?i:null).filter(i=>i!==null)};
 const other=adjacent.map(e=>({point:safeOnEdge(p,b,obstacles,e),edge:e})).filter(v=>v.point).sort((a,c)=>Math.hypot(a.point.x-p.x,a.point.y-p.y)-Math.hypot(c.point.x-p.x,c.point.y-p.y))[0];
 if(same&&(!other||sameDistance<=Math.hypot(other.point.x-p.x,other.point.y-p.y)+8))return {point:same,edge:preferred,reason:'essential-control'};
 if(other)return {...other,reason:same?'nearer-adjacent-slot':'preferred-edge-blocked'};const last=safeOnEdge(p,b,obstacles,opposite);return {point:last,edge:last?opposite:preferred,reason:last?'adjacent-edges-blocked':'no-safe-slot'};
}
export function parkFloatingOrb(point,bounds,obstacles=[],edge){return floatingPlacement(point,bounds,obstacles,edge).point;}
// Persist intent, never the temporarily displaced safe result. orbY is retained
// only as a compatibility alias for existing left/right callers.
export function floatingIntent(point,bounds,edgeHint){const b=floatingBounds(bounds),p=clampFloatingOrb(point,bounds);if(!b||!p)return null;const edge=floatingEdges.includes(edgeHint)?edgeHint:closestEdge(p,b),vertical=edge==='left'||edge==='right',position=vertical?(p.y-b.top)/(b.bottom-b.top):(p.x-b.left)/(b.right-b.left);return {edge,position,orbY:position};}
export function preferredFloatingOrb(bounds,edge='right',position=1){const b=floatingBounds(bounds);if(!b)return null;const t=Number.isFinite(position)?Math.max(0,Math.min(1,position)):1;return edge==='left'||edge==='right'?{x:edge==='left'?b.left:b.right,y:b.top+(b.bottom-b.top)*t}:{x:b.left+(b.right-b.left)*t,y:edge==='top'?b.top:b.bottom};}
