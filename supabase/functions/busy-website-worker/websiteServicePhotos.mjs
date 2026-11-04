// A presentation reference to an existing approved WEBSITE gallery original.
// Never storage authorisation, a new media registry, or proof of legal rights.
export function websiteServicePhoto(draft,item){
 const b=item?.photoBinding;if(!b||Object.keys(b).sort().join(',')!=='assetRevision,serviceId,sha256,storagePath'||b.serviceId!==item.id||!Number.isSafeInteger(b.assetRevision)||b.assetRevision<1||!/^[a-f0-9]{64}$/.test(b.sha256||''))return null;
 const matches=(draft?.sections||[]).filter(s=>s.type==='gallery'&&s.enabled!==false).flatMap(s=>s.items||[]).filter(a=>a.storagePath===b.storagePath);if(matches.length!==1)return null;
 const a=matches[0];if(a.approved!==true||a.businessId!==draft.businessId||a.revision!==b.assetRevision||a.sha256!==b.sha256||['revoked','withdrawn','deleted'].includes(a.status)||a.expiresAt&&(!Number.isFinite(Date.parse(a.expiresAt))||Date.parse(a.expiresAt)<=Date.now())||!/^https:\/\/[^\s"'<>]+$/.test(a.uri||'')||!Number.isSafeInteger(a.width)||a.width<600||a.width>30000||!Number.isSafeInteger(a.height)||a.height<350||a.height>30000)return null;
 return a;
}
export function usedServicePhotos(draft){return (draft?.sections||[]).filter(s=>s.type==='services'&&s.enabled!==false).flatMap(s=>(s.items||[]).map(i=>websiteServicePhoto(draft,i))).filter(Boolean);}

export function servicePhotoHtml(draft,item,resolve,escape){
 const a=websiteServicePhoto(draft,item);if(!a)return item?.photoBinding?'<p class="service-photo-unavailable">Photograph currently unavailable.</p>':'';
 const url=resolve(a);if(!url)return '';
 return `<img class="service-photo${a.width<1000?' service-photo-small':''}${a.appearance?.photoFit==='contain'?' owner-image-fit-contain':''}" src="${escape(url)}" alt="${escape(a.alt||'Approved business photograph')}" width="${a.width}" height="${a.height}" loading="lazy" decoding="async" style="object-position:${['top','bottom'].includes(a.appearance?.photoCrop)?a.appearance.photoCrop:'center'}">`;
}
