import {reviewOriginalImageBytes} from '../../supabase/functions/busy-website-original-media/imageByteReview.mjs';
// Explicit browser implementation only. No Hermes/Web Crypto assumption, remote
// processing, uploads or storage authority. Native callers fail closed.
export async function processBrowserBusinessPhoto({bytes,source,isCurrent=()=>true},platform=globalThis){
 if(!source||!source.assetId||!source.businessId||!source.ownerId||!/^[a-f0-9]{64}$/.test(source.sha256||'')||!isCurrent())throw Error('Review the exact current original first');
 const input=reviewOriginalImageBytes(bytes,{forPrivateNormalisation:true});
 if(!input.ok)throw Error(input.reason);
 if(typeof platform.createImageBitmap!=='function'||!platform.document?.createElement||!platform.crypto?.subtle||!platform.Blob)throw Error('Trusted browser image processing is unavailable on this platform');
 const digest=async b=>Array.from(new Uint8Array(await platform.crypto.subtle.digest('SHA-256',b))).map(n=>n.toString(16).padStart(2,'0')).join('');
 if(await digest(bytes)!==source.sha256||!isCurrent())throw Error('Original bytes or owner context changed');
 const bitmap=await platform.createImageBitmap(new platform.Blob([bytes],{type:input.contentType}),{imageOrientation:'from-image',colorSpaceConversion:'default'});
 let total=0;const derivatives=[];
 try{
  if(!isCurrent()||!((bitmap.width===input.width&&bitmap.height===input.height)||(bitmap.width===input.height&&bitmap.height===input.width)))throw Error('Decoded dimensions differ from the reviewed original');
  const widths=[...new Set([640,1280,1920].map(w=>Math.min(w,bitmap.width)))];
  for(const width of widths){
   if(!isCurrent())throw Error('Owner context changed');
   const height=Math.max(1,Math.round(bitmap.height*width/bitmap.width));
   if(width*height>8000000)throw Error('Derivative dimensions exceed the local processing limit');
   const canvas=platform.document.createElement('canvas');canvas.width=width;canvas.height=height;
   try{
    const ctx=canvas.getContext('2d',{alpha:false,colorSpace:'srgb'});if(!ctx)throw Error('Pixel processing unavailable');
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);ctx.drawImage(bitmap,0,0,width,height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.84));
    if(!blob||blob.type!=='image/webp'||blob.size<20||blob.size>9437184||(total+=blob.size)>9437184)throw Error('Derivative encoding exceeded the reviewed limits');
    const encoded=new Uint8Array(await blob.arrayBuffer()),checked=reviewOriginalImageBytes(encoded);
    if(!checked.ok||checked.width!==width||checked.height!==height||!isCurrent())throw Error('Encoded derivative failed independent container review');
    const decoded=await platform.createImageBitmap(blob);try{if(decoded.width!==width||decoded.height!==height)throw Error('Derivative cannot be decoded');}finally{decoded.close();}
    derivatives.push({width,height,contentType:'image/webp',bytes:encoded,sha256:await digest(encoded)});
   }finally{canvas.width=1;canvas.height=1;}
  }
  if(!isCurrent())throw Error('Source changed during processing');
  return {schemaVersion:1,source:{...source},sourceBytes:bytes.length,sourceWidth:input.width,sourceHeight:input.height,derivatives,decodedPixelsVerified:true,orientation:'browser-from-image-baked-in-derivatives',colour:'browser-converted-srgb-white-alpha-background',privateOnly:true,publicUseAuthorised:false,notSaved:true};
 }finally{bitmap.close();}
}
