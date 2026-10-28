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
export function parkFloatingOrb(point,bounds,obstacles=[],edge){
 const b=floatingBounds(bounds),p=clampFloatingOrb(point,bounds);if(!b||!p)return null;
 const preferred=edge||((p.x+ORB_SIZE/2)<bounds.width/2?'left':'right'),xs=preferred==='left'?[b.left,b.right]:[b.right,b.left];
 const ys=[p.y,b.bottom,b.top];for(let y=b.top;y<=b.bottom;y+=16)ys.push(y);
 const ordered=[...new Set(ys)].sort((a,c)=>Math.abs(a-p.y)-Math.abs(c-p.y));
 for(const x of xs)for(const y of ordered){const next={x,y};if(clearFloatingSlot(next,obstacles))return next;}
 return null;
}

// Device intent is independent of the currently safe (possibly displaced) slot.
export function floatingIntent(point,bounds){const b=floatingBounds(bounds),p=clampFloatingOrb(point,bounds);if(!b||!p)return null;return {edge:p.x+ORB_SIZE/2<bounds.width/2?'left':'right',orbY:(p.y-b.top)/(b.bottom-b.top)};}
export function preferredFloatingOrb(bounds,edge='right',orbY=1){const b=floatingBounds(bounds);if(!b)return null;const y=Number.isFinite(orbY)?Math.max(0,Math.min(1,orbY)):1;return {x:edge==='left'?b.left:b.right,y:b.top+(b.bottom-b.top)*y};}
