import {reviewOriginalImageBytes} from '../../supabase/functions/busy-website-original-media/imageByteReview.mjs';
import {creatorImageDataUri} from './creatorDraftMedia.mjs';
import {stableJson} from './stableJson.mjs';
// No upload, registry, rights ledger, public URL or installation permission.
export async function reviewWebsiteOwnedOriginal({api,photo,usage,rightsAcknowledged,getCurrent,measure}){
 const origin=getCurrent(),stamp=stableJson([origin,photo]),current=()=>stableJson([getCurrent(),photo])===stamp;
 if(!origin?.ownerId||!origin.businessId||origin.ready!==true||!['hero','gallery','supporting'].includes(usage)||rightsAcknowledged!==true||!api?.reviewMedia||!api.downloadMedia||typeof measure!=='function')throw Error('Review the current business, original photo, intended use and your permission statement.');
 const reviewed=await api.reviewMedia(photo);if(!current()||reviewed.projection.state!=='eligible')throw Error('Original permission changed.');
 const bytes=await api.downloadMedia(reviewed.projection,current);if(!current())throw Error('Business changed.');const inspection=reviewOriginalImageBytes(bytes);if(!inspection.ok)throw Error(inspection.reason);
 if(usage==='hero'&&(inspection.width<600||inspection.height<350))throw Error('This original is too small for a hero. Choose a larger photograph or a typography-led design.');
 if(inspection.contentType!==reviewed.projection.contentType||bytes.length!==reviewed.projection.byteLength)throw Error('Original bytes differ from the authenticated registry.');
 const uri=creatorImageDataUri(bytes,inspection.contentType),size=await measure(uri);if(!current()||size?.width!==inspection.width||size.height!==inspection.height)throw Error('Platform image dimensions do not match the original container.');
 const again=await api.reviewMedia(photo);if(!current()||stableJson(again)!==stableJson(reviewed))throw Error('Original revoked or changed during review.');
 return {ok:true,assetId:reviewed.ref.assetId,sha256:reviewed.ref.sha256,width:inspection.width,height:inspection.height,usage,privatePreviewUri:uri,ownerRightsStatement:true,rightsIndependentlyVerified:false,publicUseAuthorised:false,platformDimensionsReviewed:true,decodedPixelsVerified:false,requiresRenderedReview:true,source:origin,privateOnly:true,notSaved:true};
}
