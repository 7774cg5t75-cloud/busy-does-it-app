import {websiteServicePhoto} from './websiteServicePhotos.mjs';
import {validPublicBusinessContent} from '../_shared/businessContentRecords.mjs';
// References to original website gallery records, never a media permission or
// evidence that an illustration depicts a real product, person or past project.
export function websitePresentationPhoto(draft,ref){
 if(!ref||Object.keys(ref).sort().join(',')!=='assetRevision,sha256,storagePath')return null;
 return websiteServicePhoto(draft,{id:'presentation',photoBinding:{serviceId:'presentation',...ref}});
}
export function websiteRecordPhoto(draft,section,record){
 if(section?.type!=='products'||!validPublicBusinessContent(section.previewFeed)||section.previewFeed.businessId!==draft.businessId||record?.kind!=='product'||record.data?.status!=='active')return null;
 const current=section.previewFeed.records.filter(r=>r.id===record.id&&r.revision===record.revision&&r.kind==='product'&&r.data.status==='active');
 const refs=Array.isArray(section.contentPhotos)?section.contentPhotos.filter(p=>p.recordId===record.id):[];
 if(current.length!==1||refs.length!==1||Object.keys(refs[0]).sort().join(',')!=='asset,recordId,recordRevision'||refs[0].recordRevision!==record.revision)return null;
 return websitePresentationPhoto(draft,refs[0].asset);
}
export function websiteSectionPhoto(draft,section){return ['about','text'].includes(section?.type)&&section.enabled!==false?websitePresentationPhoto(draft,section.storyPhoto):null;}
export function usedContentPhotos(draft){return (draft.sections||[]).filter(s=>s.enabled!==false).flatMap(s=>[websiteSectionPhoto(draft,s),...(Array.isArray(s.previewFeed?.records)?s.previewFeed.records:[]).map(r=>websiteRecordPhoto(draft,s,r))]).filter(Boolean);}
export function presentationPhotoHtml(asset,resolve,escape,attributes=/** @type {(asset:any,url:string)=>string} */((asset,url)=>''),kind='content'){
 if(!asset)return '';const url=resolve(asset);if(!url)return '';
 return `<figure class="reviewed-${kind}-photo"><img${attributes(asset,url)} src="${escape(url)}" alt="${escape(asset.alt||'Owner-reviewed website photograph')}" width="${asset.width}" height="${asset.height}" loading="lazy" decoding="async" style="object-fit:${asset.appearance?.photoFit==='contain'?'contain':'cover'};object-position:${['top','bottom'].includes(asset.appearance?.photoCrop)?asset.appearance.photoCrop:'center'}"></figure>`;
}
