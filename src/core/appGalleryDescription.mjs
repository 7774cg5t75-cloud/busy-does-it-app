import {appEditLockReason} from "./appOwnerLocks.mjs";
/**
 * V3.162: update owner-approved public gallery accessibility descriptions
 * without changing images, media approval, order, private data or remote URLs.
 */
const text=(value,max)=>value===null||typeof value==="string"&&
 value.length<=max&&!/[<>\u0000-\u001f]/.test(value);
function proposeGalleryImageDescription(config,{index,expectedUri,value}={}){
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
 const alt=value.alt,caption=value.caption;
 if((prior.alt??null)===alt&&(prior.caption??null)===caption)
  return {ok:false,reason:"These image descriptions are already set."};
 const revised={...prior};
 if(alt===null)delete revised.alt;else revised.alt=alt;
 if(caption===null)delete revised.caption;else revised.caption=caption;
 const next=[...gallery];next[index]=revised;
 return {ok:true,nextConfig:{...config,publicProfile:{
  ...config.publicProfile,assets:{...config.publicProfile.assets,gallery:next}}},
  previous:{alt:prior.alt??null,caption:prior.caption??null},
  description:"Updated accessible text for approved gallery photo "+(index+1),
  mediaUnchanged:true,privateUntilApproved:true,bookingsUnchanged:true};
}
export {proposeGalleryImageDescription};
