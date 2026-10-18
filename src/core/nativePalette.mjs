/**
 * V3.193 brand design tokens: curated choices plus an owner-supplied brand
 * accent. Generates all on-screen colours locally and checks their contrast.
 * Neither code execution nor CSS is accepted in any colour value.
 * Standalone exporter copies this exact same source into the native shell.
 */
const HEX=/^#[a-fA-F0-9]{6}$/;
const SEEDS=Object.freeze({
 midnight:["#101827","#92B9FF"],
 forest:["#101E1B","#98EFC4"],
 terracotta:["#281A19","#FFD0AC"],
 violet:["#1B172A","#DFBEFF"],
 coastal:["#13242C","#AFE7F0"],
 rosewood:["#2A1926","#FFBED5"],
 slate:["#1E2630","#BFD4EB"],
 plum:["#25172E","#F0B7FA"],
 emerald:["#09271F","#98F7C1"],
 gilded:["#272118","#F9D47F"],
 sunset:["#2D1917","#FFB2A2"],
 berry:["#281526","#FFA9DE"],
 charcoal:["#1A1D21","#D9DAE0"],
 olive:["#242719","#D5E39B"],
 copper:["#292018","#FFD0A1"],
 porcelain:["#F8F6F2","#7C3B70"],
 linen:["#F5EFE5","#365F73"],
 daylight:["#F1F7FB","#22558C"],
 blush:["#FAF1F3","#8B3553"],
 sage:["#F2F7F0","#286543"]
});
const LABELS=Object.freeze({
 midnight:"Midnight blue",forest:"Forest green",
 terracotta:"Warm terracotta",violet:"Soft violet",coastal:"Coastal teal",
 rosewood:"Rosewood",slate:"Slate & ice",plum:"Deep plum",
 emerald:"Emerald",gilded:"Midnight gold",sunset:"Sunset coral",
 berry:"Berry pink",charcoal:"Charcoal",olive:"Olive garden",
 copper:"Copper",porcelain:"Porcelain",linen:"Natural linen",
 daylight:"Daylight blue",blush:"Soft blush",sage:"Sage green",
 custom:"My brand colour"
});
const DEFAULT_PALETTE="midnight";
const safeHex=v=>typeof v==="string"&&HEX.test(v)?v.toUpperCase():null;
const channels=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const value=(rgb)=>"#"+rgb.map(c=>Math.round(Math.min(255,Math.max(0,c)))
 .toString(16).padStart(2,"0")).join("").toUpperCase();
const mix=(a,b,t)=>value(channels(a).map((c,i)=>c*(1-t)+channels(b)[i]*t));
function luminance(hex){
 const l=channels(hex).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);
 return l[0]*.2126+l[1]*.7152+l[2]*.0722;
}
function contrast(a,b){
 const x=luminance(a),y=luminance(b);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
function improveContrast(foreground,background,target=4.5){
 if(contrast(foreground,background)>=target)return foreground;
 const towards=luminance(background)>.22?"#111111":"#FFFFFF";
 for(let i=1;i<=100;i++){
  const next=mix(foreground,towards,i/100);
  if(contrast(next,background)>=target)return next;
 }
 return towards;
}
function tokens(background,seed){
 const light=luminance(background)>.22;
 const text=light?"#14212B":"#F8FAFF";
 const surface=mix(background,text,light?.07:.075);
 // Accent is also small text on service cards, not only a button on the page.
 // The surface is closer to text luminance than the page background; ensuring
 // contrast here protects both supported solid backgrounds without changing
 // the stored owner-supplied seed or introducing arbitrary styling.
 const accent=improveContrast(seed,surface,4.6);
 const muted=improveContrast(mix(surface,text,.68),surface,4.55);
 return Object.freeze({bg:background,surface,text,muted,accent,
  line:mix(surface,text,light?.19:.23)});
}
const PALETTES=Object.freeze(Object.fromEntries(
 Object.entries(SEEDS).map(([name,[bg,accent]])=>[name,tokens(bg,accent)])
));
function nativePalette(name,brandAccent){
 if(name==="custom"){
  const accent=safeHex(brandAccent);
  if(!accent)return PALETTES[DEFAULT_PALETTE];
  const bg=mix("#101827",accent,.105);
  return tokens(bg,accent);
 }
 return PALETTES[Object.prototype.hasOwnProperty.call(PALETTES,name)?
  name:DEFAULT_PALETTE];
}
export {PALETTES,LABELS,DEFAULT_PALETTE,safeHex,
 nativePalette,contrast};
