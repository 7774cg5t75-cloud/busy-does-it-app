import {usedServicePhotos} from './websiteServicePhotos.mjs';
export function websiteAssetAvailable(asset,businessId=''){
 return !!asset&&asset.approved!==false&&!['revoked','withdrawn','deleted'].includes(asset.status)&&![asset.businessId,asset.business_id].some(id=>id&&businessId&&id!==businessId)&&(!asset.expiresAt||Number.isFinite(Date.parse(asset.expiresAt))&&Date.parse(asset.expiresAt)>Date.now());
}
// Presentation over original records only. Never mint approval, URLs or assets.
export function websitePhotoKeys(asset){
 if(!websiteAssetAvailable(asset))return [];
 return [...new Set([asset.storagePath?'path:'+asset.storagePath:'',asset.uri?'uri:'+asset.uri:'',/^[a-f0-9]{64}$/.test(asset.sha256||'')?'hash:'+asset.sha256:''].filter(Boolean))];
}
/** @param {any[]} items @param {{businessId?:string,exclude?:any[]}} [options] */
export function distinctWebsitePhotos(items,{businessId='',exclude=[]}={}){
 const seen=new Set(exclude.flatMap(websitePhotoKeys)),out=[];
 for(const [index,asset] of (Array.isArray(items)?items:[]).entries()){
  const keys=websitePhotoKeys(asset);
  if(!keys.length||[asset.businessId,asset.business_id].some(id=>id&&businessId&&id!==businessId)||asset.expiresAt&&(!Number.isFinite(Date.parse(asset.expiresAt))||Date.parse(asset.expiresAt)<=Date.now()))continue;
  // Record all aliases even for a duplicate, preventing transitive filler.
  const repeated=keys.some(k=>seen.has(k));keys.forEach(k=>seen.add(k));if(!repeated)out.push({asset,index});
 }
 return out;
}
export function websiteHeroPhotos(draft){
 const heroes=(draft?.sections||[]).filter(s=>s.type==='hero'&&s.enabled!==false).map(s=>s.asset).filter(Boolean);
 return distinctWebsitePhotos((draft?.sections||[]).filter(s=>s.type==='gallery'&&s.enabled!==false).flatMap(s=>s.items||[]),{businessId:draft?.businessId||draft?.business_id,exclude:[...heroes,...(['narrative','atelier'].includes(draft?.theme?.heroVariation)?usedServicePhotos(draft):[])]});
}
export function websiteGalleryPresentation(section,draft,{omitHero=true}={}){
 const heroes=omitHero&&draft?.theme?.heroComposition?(draft.sections||[]).filter(s=>s.type==='hero'&&s.enabled!==false).map(s=>s.asset).filter(Boolean):[];
 const exclude=[...heroes,...(['narrative','atelier'].includes(draft?.theme?.heroVariation)?usedServicePhotos(draft):[])];if(omitHero&&draft?.theme?.heroComposition==='editorial-collage')exclude.push(...websiteHeroPhotos(draft).slice(0,2).map(r=>r.asset));
 return distinctWebsitePhotos(section?.items,{businessId:draft?.businessId||draft?.business_id,exclude});
}
