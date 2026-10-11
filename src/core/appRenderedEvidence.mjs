/**
 * V3.158 local-device visible-screen capture receipt. These are the pixels
 * rendered on this device, NOT independently authenticated screenshot proof,
 * an AI inspection, a full scrolling screen or store approval.
 */
function appVisibleCaptureReceipt({appId,revision,screenshotUri,width,height,platform,capturedAt}={}){
 if(typeof appId!=="string"||!/^[a-f0-9-]{24,50}$/i.test(appId)||
    !Number.isSafeInteger(revision)||revision<1||
    typeof screenshotUri!=="string"||
    !/^(file:|content:|ph:|asset-library:)/.test(screenshotUri)||
    screenshotUri.length>2000||
    !Number.isSafeInteger(width)||width<250||width>6000||
    !Number.isSafeInteger(height)||height<250||height>12000||
    !["ios","android"].includes(platform)||
    typeof capturedAt!=="string"||!Number.isFinite(Date.parse(capturedAt)))
  return {ok:false,reason:"This capture cannot be linked to the current private app and device."};
 return {ok:true,kind:"owner_device_visible_capture_v1",
  appId,revision,uri:screenshotUri,width,height,platform,capturedAt,
  captureIsLocal:true,fullScrollProven:false,
  screenshotAuthenticatedByServer:false,aiVisualReviewCompleted:false,
  realDevicePixelCapture:true,mayPublish:false};
}
function currentAppVisibleCapture(receipt,{appId,revision}={}){
 return receipt?.ok===true&&receipt.appId===appId&&receipt.revision===revision;
}
export {appVisibleCaptureReceipt,currentAppVisibleCapture};
