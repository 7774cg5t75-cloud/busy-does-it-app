// Presentation eligibility over the ORIGINAL current website gallery. This is
// not storage authorisation: the gateway re-reads the authenticated source.
export function reviewWebsitePhoto(draft,storagePath,{now=Date.now()}={}){
 const fail=reason=>({ok:false,reason});
 if(!draft?.businessId||typeof storagePath!=='string'||!/^[A-Za-z0-9_./-]{1,300}$/.test(storagePath)||storagePath.split('/').includes('..'))return fail('Choose an exact photograph from this website.');
 const rows=(draft.sections||[]).filter(s=>s.type==='gallery'&&s.enabled!==false).flatMap(s=>s.items||[]).filter(a=>a?.storagePath===storagePath);
 if(rows.length!==1)return fail('This photograph is missing or ambiguous. Review the current gallery.');
 const asset=rows[0];if(asset.approved!==true||[asset.businessId,asset.business_id].some(id=>id&&id!==draft.businessId)||['withdrawn','revoked','deleted'].includes(asset.status)||asset.expiresAt&&(!Number.isFinite(Date.parse(asset.expiresAt))||Date.parse(asset.expiresAt)<=now)||typeof asset.uri!=='string'||!/^https:\/\/[^\s"'<>]+$/.test(asset.uri))return fail('This photograph is not currently eligible for this business.');
 const width=asset.width??asset.metadata?.width,height=asset.height??asset.metadata?.height;
 if(width!==undefined&&(!Number.isSafeInteger(width)||width<600||width>30000)||height!==undefined&&(!Number.isSafeInteger(height)||height<350||height>30000))return fail('This image is too small or its dimensions are invalid. Choose a suitable original; typography works without a photograph.');
 return {ok:true,asset,storagePath,warning:!width||!height?'Image resolution is unverified. Review the original and both screen sizes before any customer use.':width<1200||height<600?'This image may suit a smaller presentation. Review sharpness and cropping; avoid an enlarged full-width image.':'Review the crop on phone and desktop. Resolution alone does not establish photographic quality or rights.',hasRecordedDimensions:!!width&&!!height,resolutionVerified:false};
}
export function websitePhotoChoices(draft){return (draft?.sections||[]).filter(s=>s.type==='gallery'&&s.enabled!==false).flatMap(s=>s.items||[]).map(a=>reviewWebsitePhoto(draft,a?.storagePath)).filter(r=>r.ok);}
