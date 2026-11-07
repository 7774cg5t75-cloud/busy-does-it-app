// WCAG relative-luminance calculations on canonical palette colours only.
// No image-based contrast/aesthetic assessment or user-supplied CSS.
const rgb=hex=>/^#[0-9a-f]{6}$/i.test(hex)?[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)):null;
const luminance=hex=>{const c=rgb(hex);if(!c)return null;const x=c.map(v=>{const n=v/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return .2126*x[0]+.7152*x[1]+.0722*x[2];};
function textContrast(a,b){const x=luminance(a),y=luminance(b);return x===null||y===null?0:(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function readableAccent(accent,backgrounds,light=false){
 const start=rgb(accent)||[0,0,0],end=light?255:0;
 for(let step=0;step<=64;step++){
  const hex='#'+start.map(v=>Math.round(v+(end-v)*step/64).toString(16).padStart(2,'0')).join('');
  if(backgrounds.every(bg=>textContrast(hex,bg)>=4.5))return hex;
 }
 return light?'#ffffff':'#000000';
}
function websiteTextColourCss(design){
 const dark=readableAccent(design.accent,[design.paper,design.soft,'#ffffff']);
 // Known canonical dark hero treatments and contact background. The original
 // paper/soft editorial and boutique heroes explicitly restore light tokens.
 const light=readableAccent(design.accent,[design.ink,'#264D61','#285647','#402B2A'],true);
 return `:root{--owner-dark-text-accent:${dark};--owner-light-text-accent:${light}}
 section{--owner-text-ink:var(--ink);--owner-text-accent:var(--owner-dark-text-accent)}
 section.hero,section#contact{--owner-text-ink:#fff;--owner-text-accent:var(--owner-light-text-accent)}
 .family-editorial section.hero,.family-boutique section.hero{--owner-text-ink:var(--ink);--owner-text-accent:var(--owner-dark-text-accent)}`;
}
export {textContrast,readableAccent,websiteTextColourCss};
