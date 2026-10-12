/**
 * V3.192: curated native Business App colour systems, each with accessible
 * text/button contrast on its own solid surfaces. Finite owner choice only:
 * no arbitrary user CSS, theme scripts, private tenant data or paid AI.
 *
 * JS file copied into unsigned native output; no runtime network dependency.
 */
const PALETTES=Object.freeze({
 midnight:Object.freeze({bg:"#101827",surface:"#1C293C",text:"#F1F6FF",
  muted:"#B8C7DF",accent:"#92B9FF",line:"#465975"}),
 forest:Object.freeze({bg:"#101E1B",surface:"#1C3029",text:"#F3FFF6",
  muted:"#BED9CA",accent:"#98EFC4",line:"#456352"}),
 terracotta:Object.freeze({bg:"#281A19",surface:"#392624",text:"#FFF7F2",
  muted:"#E6C8BF",accent:"#FFD0AC",line:"#68504A"}),
 violet:Object.freeze({bg:"#1B172A",surface:"#2C2340",text:"#F9F3FF",
  muted:"#D7CBE9",accent:"#DFBEFF",line:"#635474"}),
 coastal:Object.freeze({bg:"#13242C",surface:"#213741",text:"#F2FCFF",
  muted:"#C5DCE6",accent:"#AFE7F0",line:"#4B6976"})
});
const LABELS=Object.freeze({
 midnight:"Midnight blue",forest:"Forest green",
 terracotta:"Warm terracotta",violet:"Soft violet",coastal:"Coastal teal"
});
const DEFAULT_PALETTE="midnight";
function nativePalette(name){
 return PALETTES[Object.prototype.hasOwnProperty.call(PALETTES,name)?name:
   DEFAULT_PALETTE];
}
export {PALETTES,LABELS,DEFAULT_PALETTE,nativePalette};
