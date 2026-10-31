/**
 * V3.161 instrumental WCAG 2.x contrast calculations for fixed native shell
 * palette combinations. These are measured token ratios, NOT screenshot
 * OCR, image-on-image contrast or a full accessibility/WCAG certification.
 */
import {nativePalette,DEFAULT_PALETTE} from "./nativePalette.mjs";
const NATIVE_SHELL_PALETTE=nativePalette(DEFAULT_PALETTE);
function relativeLuminance(hex){
 if(typeof hex!=="string"||!/^#[a-f0-9]{6}$/i.test(hex))
  throw Error("Choose a supported six-digit hexadecimal colour.");
 const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
   .map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4);
 return 0.2126*channels[0]+0.7152*channels[1]+0.0722*channels[2];
}
function measuredContrast(foreground,background){
 const a=relativeLuminance(foreground),b=relativeLuminance(background);
 return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
}
function auditStandaloneContrast(palette=NATIVE_SHELL_PALETTE){
 const pairs=[
  ["body_text", "text","surface","normal",4.5],
  ["secondary_text","muted","surface","normal",4.5],
  ["service_accent_text","accent","surface","normal",4.5],
  ["page_header","text","bg","normal",4.5],
  ["primary_button_label","bg","accent","normal",4.5],
  ["navigation_label","text","surface","normal",4.5],
  ["inactive_button_label","muted","line","disabled",0]
 ];
 const readings=pairs.map(([id,fg,bg,size,minimum])=>{
  const ratio=measuredContrast(palette[fg],palette[bg]);
  return {id,foreground:palette[fg],background:palette[bg],
   ratio:Number(ratio.toFixed(2)),size,threshold:minimum,
   passes:size==="disabled"?null:ratio>=minimum,
   evidence:"fixed_native_palette_calculation_only"};
 });
 return {kind:"native_shell_color_contrast_v3161",
  readings,normalTextAA:readings.filter(x=>x.threshold>0).every(x=>x.passes),
  measuredPaletteOnly:true,
  otherColorsChecked:false,imagesChecked:false,
  textScalingChecked:false,screenReaderChecked:false,
  touchTargetsMeasured:false,accessibilityCertified:false,
  note:"Ratios apply to the selected native palette tokens only; overlays, images, platform states, and real devices require separate checks."};
}
export {NATIVE_SHELL_PALETTE,relativeLuminance,measuredContrast,auditStandaloneContrast};
