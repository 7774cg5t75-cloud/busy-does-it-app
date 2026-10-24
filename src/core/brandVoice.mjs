// Existing explicit owner choices, shared as read-only guidance; never action authority.
export const BRAND_TONE_CHOICES=Object.freeze(['Friendly and professional','Warm and conversational','Straightforward and practical','Premium and polished']);
export function approvedBrandTone(value){
 if(typeof value!=='string'||value.length>80)return null;
 const key=value.trim().toLowerCase(),mapped={'friendly and professional':'professional','warm and conversational':'warm','straightforward and practical':'direct','premium and polished':'premium'};
 return (Object.hasOwn(mapped,key)?mapped[key]:null)||(['warm','professional','playful','direct','premium','calm'].includes(key)?key:null);
}
