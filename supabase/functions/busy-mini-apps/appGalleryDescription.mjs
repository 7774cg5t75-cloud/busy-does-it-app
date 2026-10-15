import {appEditLockReason} from "./appOwnerLocks.mjs";
/**
 * V3.162: update owner-approved public gallery accessibility descriptions
 * without changing images, media approval, order, private data or remote URLs.
 */
const text=(value,max)=>value===null||typeof value==="string"&&
 value.length<=max&&!/[<>\u0000-\u001f]/.test(value);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function captureGalleryDescription(image){
 return Object.fromEntries(['alt','caption'].map(k=>[k,own(image,k)?{present:true,value:image[k]}:{present:false}]));
}
function restoreGalleryDescription(config,{index,expectedUri,value}={}){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==2||
  !['alt','caption'].every(k=>{
   const field=value[k];return field&&typeof field==='object'&&!Array.isArray(field)&&
    typeof field.present==='boolean'&&Object.keys(field).every(key=>['present','value'].includes(key))&&
    (field.present?own(field,'value')&&text(field.value,k==='alt'?160:240):!own(field,'value'));
  }))return {ok:false,reason:'Review the original image description before restoring it.'};
 // Validate the same locks, image approval, identity and text limits as an edit.
 const edit=proposeGalleryImageDescription(config,{index,expectedUri,value:{alt:value.alt.present?value.alt.value:null,caption:value.caption.present?value.caption.value:null},allowUnchanged:true});
 if(!edit.ok)return edit;
 const gallery=[...edit.nextConfig.publicProfile.assets.gallery],image={...gallery[index]};
 for(const key of ['alt','caption']){if(value[key].present)image[key]=value[key].value;else delete image[key];}
 if(JSON.stringify(captureGalleryDescription(config.publicProfile.assets.gallery[index]))===JSON.stringify(value))return {ok:false,reason:'These image descriptions are already restored.'};
 gallery[index]=image;
 return {...edit,nextConfig:{...edit.nextConfig,publicProfile:{...edit.nextConfig.publicProfile,assets:{...edit.nextConfig.publicProfile.assets,gallery}}}};
}
function proposeGalleryImageDescription(config,{index,expectedUri,value,allowUnchanged=false}={}){
 const locked=appEditLockReason(config,{kind:"photo_description"});
 if(locked)return {ok:false,reason:locked};
 const gallery=config?.publicProfile?.assets?.gallery;
 if(!Array.isArray(config?.modules)||
   !config.modules.some(m=>m.key==="gallery"&&m.enabled===true)||
   !Array.isArray(gallery)||gallery.length<1||gallery.length>40||
   !Number.isInteger(index)||index<0||index>=gallery.length||
   typeof expectedUri!=="string"||expectedUri!==gallery[index]?.uri||
   !gallery[index]||typeof gallery[index]!=="object"||
   gallery[index].approved!==true&&gallery[index].marketingOk!==true||
   !value||typeof value!=="object"||Array.isArray(value)||
   Object.keys(value).some(k=>!["alt","caption"].includes(k))||
   !Object.prototype.hasOwnProperty.call(value,"alt")||
   !Object.prototype.hasOwnProperty.call(value,"caption")||
   !text(value.alt,160)||!text(value.caption,240))
  return {ok:false,reason:"Choose an approved current gallery image and short, safe descriptions."};
 const prior=gallery[index];
 if(["alt","caption"].some(k=>own(prior,k)&&!text(prior[k],k==="alt"?160:240)))return {ok:false,reason:"Review the existing image descriptions before changing them."};
 const alt=value.alt,caption=value.caption;
 if(!allowUnchanged&&(prior.alt??null)===alt&&(prior.caption??null)===caption)
  return {ok:false,reason:"These image descriptions are already set."};
 const revised={...prior};
 if(alt===null)delete revised.alt;else revised.alt=alt;
 if(caption===null)delete revised.caption;else revised.caption=caption;
 const next=[...gallery];next[index]=revised;
 return {ok:true,nextConfig:{...config,publicProfile:{
  ...config.publicProfile,assets:{...config.publicProfile.assets,gallery:next}}},
  previous:{alt:prior.alt??null,caption:prior.caption??null},
  previousSnapshot:captureGalleryDescription(prior),
  description:"Updated accessible text for approved gallery photo "+(index+1),
  mediaUnchanged:true,privateUntilApproved:true,bookingsUnchanged:true};
}
export {proposeGalleryImageDescription,restoreGalleryDescription};
