/**
 * V3.136 owner-triggered self-hostable static website archive.
 * Caller supplies only VERIFIED bytes for each approved picture; never
 * downloads arbitrary URLs, reuses signed URLs, or exports tenant credentials.
 * All-or-nothing if any referenced photograph is unavailable.
 */
import {makeWebsiteZip,crc32} from "./websiteZipArchive.mjs";
import {websiteAssetAvailable} from '../../supabase/functions/busy-website-worker/websitePhotoPresentation.mjs';
import {websiteServicePhoto} from '../../supabase/functions/busy-website-worker/websiteServicePhotos.mjs';
import {wholeSiteDerivedSourcesCurrent,wholeSiteContentCurrent} from '../../supabase/functions/busy-website-worker/websiteWholeSite.mjs';
import {websiteSectionPhoto,websiteRecordPhoto} from '../../supabase/functions/busy-website-worker/websiteContentPhotos.mjs';
import {reviewOriginalImageBytes} from '../../supabase/functions/busy-website-original-media/imageByteReview.mjs';
import {websiteCreativeDocumentSection,websiteCreativeDocumentAsset,websiteCreativeDocumentPageModel} from '../../supabase/functions/busy-website-worker/websiteCreativeDocument.mjs';
const list=x=>Array.isArray(x)?x:[];
const clean=x=>typeof x==="string"?x.trim():"";
const IMAGE_MAX=9*1024*1024;
const readBE32=(bytes,at)=>((bytes[at]*16777216)+(bytes[at+1]<<16)+(bytes[at+2]<<8)+bytes[at+3])>>>0;
const readLE32=(bytes,at)=>(bytes[at]+(bytes[at+1]<<8)+(bytes[at+2]<<16)+(bytes[at+3]*16777216))>>>0;
function pngValid(bytes){
 if(bytes.length<45||![
  0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a
 ].every((v,i)=>bytes[i]===v))return false;
 let offset=8,ihdr=false,idat=false,iend=false;
 while(offset+12<=bytes.length){
  const size=readBE32(bytes,offset),end=offset+12+size;
  if(size>9*1024*1024||end>bytes.length)return false;
  const type=String.fromCharCode(...bytes.subarray(offset+4,offset+8));
  if(crc32(bytes.subarray(offset+4,offset+8+size))!==readBE32(bytes,offset+8+size))return false;
  if(type==="IHDR"){if(ihdr||size!==13)return false;ihdr=true;}
  if(type==="IDAT")idat=true;
  if(type==="IEND"){if(size!==0||end!==bytes.length)return false;iend=true;break;}
  offset=end;
 }
 return ihdr&&idat&&iend;
}
const mimeFromBytes=bytes=>{
 if(!(bytes instanceof Uint8Array))return "";
 if(pngValid(bytes))return "png";
 if(bytes.length>20&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff&&
    bytes.at(-2)===0xff&&bytes.at(-1)===0xd9)return "jpg";
 if(bytes.length>=20&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&
   String.fromCharCode(...bytes.slice(8,12))==="WEBP"&&
   readLE32(bytes,4)===bytes.length-8)return "webp";
 return "";
};
const keyOf=asset=>clean(asset?.storagePath)||clean(asset?.uri);
function archiveRequirements(draft={}){
 if(draft.creativeDocumentPageModel&&!websiteCreativeDocumentPageModel(draft))return {ok:false,reason:'Review the current creative design and approved sources before exporting the complete site.'};
 if(draft.siteComposition==='connected-pages-v1'&&!wholeSiteContentCurrent(draft))return {ok:false,reason:'Review current menu/product/event sources before exporting the complete site.'};
 if(!wholeSiteDerivedSourcesCurrent(draft))return {ok:false,reason:"A service source changed. Review its related pages in the original Studio before exporting; owner wording is kept."};
 const pages=list(draft.pages).filter(p=>p?.enabled!==false);
 if(!draft.id||!pages.length||pages.length>20||!pages.some(p=>p.id==="home"))
  return {ok:false,reason:"Prepare a valid website with a homepage before exporting it."};
 if(!Array.isArray(draft.sections)||draft.sections.length>160)
  return {ok:false,reason:"This site has too many sections for the current archive safety limit."};
 const seenPaths=new Set();
 for(const page of pages){
  const output=page?.outputPath;
  if(!/^(?:index\.html|(?:[a-z0-9-]+\/){1,3}index\.html)$/.test(output||"")||
    seenPaths.has(output))return {ok:false,reason:"Invalid or duplicated website page path."};
  seenPaths.add(output);
 }
 const assets=[],seen=new Map(),businessId=draft.businessId||draft.business_id;
 const visibleSections=draft.sections.filter(s=>s?.enabled!==false);
 for(const section of visibleSections){
  const media=["hero","photo-feature"].includes(section?.type)?[section.asset]:
    section?.type==="gallery"?[...list(section.items)]:[];
  if(section.type==='creative-document'){
   const composition=websiteCreativeDocumentSection(draft,section);
   if(!composition)return {ok:false,reason:'A creative photograph, wording or source changed. Review the current composition before exporting.'};
   const collect=nodes=>{for(const node of nodes){
    if(node.type==='image')media.push(websiteCreativeDocumentAsset(draft,node.asset));
    if(node.children)collect(node.children);
   }};
   collect(composition.nodes);
   if(media.some(asset=>!asset))return {ok:false,reason:'A creative photograph is no longer approved. Review its original source before exporting.'};
  }
  // Reuse exact current relationship readers; captions/paths cannot establish facts or rights.
  if(section.type==='services')for(const item of list(section.items))if(item?.photoBinding){
   const photo=websiteServicePhoto(draft,item);
   if(!photo)return {ok:false,reason:"A service photograph changed or is no longer approved. Review its exact source before exporting."};
   media.push(photo);
  }
  if(section.storyPhoto){
   const photo=websiteSectionPhoto(draft,section);
   if(!photo)return {ok:false,reason:"A story photograph changed or is no longer approved. Review its exact source before exporting."};
   media.push(photo);
  }
  for(const ref of list(section.contentPhotos)){
   const record=list(section.previewFeed?.records).find(r=>r.id===ref?.recordId),photo=websiteRecordPhoto(draft,section,record);
   if(!photo)return {ok:false,reason:"A menu or product photograph no longer matches its approved current record. Review it before exporting."};
   media.push(photo);
  }
  for(const item of media){
   if(!item)continue;
   if(!websiteAssetAvailable(item,businessId,draft,section))return {ok:false,reason:"An image is unapproved, expired, withdrawn or belongs to another business."};
   const key=keyOf(item);
   if(!key||key.length>2048||item.storagePath&&(!/^[A-Za-z0-9_./-]{1,300}$/.test(item.storagePath)||item.storagePath.split('/').includes('..')))return {ok:false,reason:"A website photo has no safe retrievable source. Reattach the original first."};
   const previous=seen.get(key);
   if(previous&&['businessId','business_id','ownerId','assetId','sha256','revision','exportOriginalPath'].some(k=>previous[k]!==undefined&&item[k]!==undefined&&previous[k]!==item[k]))return {ok:false,reason:"Conflicting versions of a photograph share the same source. Review the current original first."};
   if(!previous){const copy={...item,_lookupKey:key};seen.set(key,copy);assets.push(copy);}
   else for(const field of ['businessId','business_id','ownerId','assetId','sha256','revision','exportOriginalPath'])if(previous[field]===undefined&&item[field]!==undefined)previous[field]=item[field];
  }
 }
 if(assets.length>48)return {ok:false,reason:"Your website has more than 48 images. Reduce the gallery or use a larger archive flow."};
 return {ok:true,pages,assets};
}
async function buildStandaloneWebsiteArchive(draft,{readPhoto,readPhotoVariants,digestBytes,renderPage,isCurrent=()=>true}={}){
 // Own a snapshot before any asynchronous reader; a later edit/withdrawal cannot
 // be silently bundled under the original review. Callers may also bind their owner task.
 let snapshot,sourceText;
 try{sourceText=JSON.stringify(draft);snapshot=JSON.parse(sourceText);}catch{return {ok:false,reason:"Review a serialisable current website before exporting."};}
 const current=()=>{try{return isCurrent()&&JSON.stringify(draft)===sourceText&&JSON.stringify(snapshot)===sourceText;}catch{return false;}};
 if(!current())return {ok:false,reason:"The website or owner context changed. Review it before exporting."};
 const requirements=archiveRequirements(snapshot);
 if(!requirements.ok)return requirements;
 if(typeof renderPage!=="function")return {ok:false,reason:"The website HTML renderer is unavailable."};
 const assetFiles=Object.create(null),assetVariants=Object.create(null),files=[];
 const digest=typeof digestBytes==='function'?digestBytes:globalThis.crypto?.subtle
  ?async bytes=>Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join(''):null;
 const changed=()=>({ok:false,reason:"The website, photograph permission or owner context changed during export. Review the current result first."});
 const {assets,pages}=requirements;
 if(assets.length&&typeof readPhoto!=="function")
  return {ok:false,reason:"This website contains photos but the original photo reader is not connected."};
 let mediaBytes=0;
 for(let i=0;i<assets.length;i++){
  const asset=assets[i],key=asset._lookupKey;
  let bytes;
  try{bytes=await readPhoto(JSON.parse(JSON.stringify(asset)));}
  catch(_error){return {ok:false,reason:"Photo "+(i+1)+" is not available on this device. Reattach the approved original before creating a complete ZIP.",missingPhoto:i+1};}
  if(!current())return changed();
  if(!(bytes instanceof Uint8Array)||bytes.length===0||bytes.length>IMAGE_MAX)
   return {ok:false,reason:"Photo "+(i+1)+" has invalid contents or exceeds the 9 MB per-photo limit.",missingPhoto:i+1};
  // Snapshot the returned byte buffer too; a caller retaining it must not mutate the ZIP.
  bytes=new Uint8Array(bytes);
  if(digest&&/^[a-f0-9]{64}$/.test(asset.sha256||'')){
   let actual;try{actual=await digest(bytes);}catch{return {ok:false,reason:"Photograph integrity verification is unavailable."};}
   if(!current())return changed();
   if(actual!==asset.sha256)return {ok:false,reason:"Photograph bytes do not match the reviewed original."};
  }
  const ext=mimeFromBytes(bytes);
  if(!ext)return {ok:false,reason:"Photo "+(i+1)+" is not a supported JPEG, PNG or WebP image.",missingPhoto:i+1};
  const path="assets/photo-"+String(i+1).padStart(3,"0")+"."+ext;
  assetFiles[key]=path;
  mediaBytes+=bytes.length;
  if(mediaBytes>25*1024*1024)return {ok:false,reason:"Total approved photographs exceed the 25 MB mobile archive limit."};
  if(files.length>=48)return {ok:false,reason:"Original and responsive photographs exceed the existing 48-image archive limit."};
  files.push({path,content:bytes});
  if(typeof readPhotoVariants==='function'){
   if(!digest||!/^[a-f0-9]{64}$/.test(asset.sha256||''))return {ok:false,reason:"Verified responsive export requires an exact original digest and trusted byte-integrity capability."};
   let processed;try{processed=await readPhotoVariants(JSON.parse(JSON.stringify(asset)));}catch{return {ok:false,reason:"The reviewed responsive photographs are unavailable. Export the originals or reprocess the current source."};}
   if(!current())return changed();
   const source=processed?.source;
   if(processed?.schemaVersion!==1||processed.decodedPixelsVerified!==true||processed.privateOnly!==true||processed.publicUseAuthorised!==false||!source||Object.keys(source).sort().join(',')!=='assetId,businessId,ownerId,sha256'||!['assetId','businessId','ownerId'].every(k=>/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(source[k]||''))||source.businessId!==(snapshot.businessId||snapshot.business_id)||source.sha256!==asset.sha256||asset.assetId&&source.assetId!==asset.assetId||asset.ownerId&&source.ownerId!==asset.ownerId||!Array.isArray(processed.derivatives)||!processed.derivatives.length||processed.derivatives.length>3)return {ok:false,reason:"Responsive photographs do not match the reviewed original source."};
   const originalReview=reviewOriginalImageBytes(bytes,{forPrivateNormalisation:true});
   if(!originalReview.ok||processed.sourceBytes!==bytes.length||processed.sourceWidth!==originalReview.width||processed.sourceHeight!==originalReview.height)return {ok:false,reason:"Responsive photographs do not match the reviewed original dimensions."};
   const widths=new Set();
   let variants;try{variants=processed.derivatives.map(v=>({...v,bytes:v?.bytes instanceof Uint8Array?new Uint8Array(v.bytes):null}));}catch{return {ok:false,reason:"Responsive photograph buffers became unavailable during export."};}
   for(const variant of variants){
    if(![640,1280,1920].includes(variant?.width)||widths.has(variant.width)||variant.contentType!=='image/webp'||!(variant.bytes instanceof Uint8Array)||variant.bytes.length>IMAGE_MAX||!/^[a-f0-9]{64}$/.test(variant.sha256||''))return {ok:false,reason:"Responsive photograph metadata is invalid or duplicated."};
    widths.add(variant.width);const body=new Uint8Array(variant.bytes),review=reviewOriginalImageBytes(body);
    let actual;try{actual=await digest(body);}catch{return {ok:false,reason:"Responsive photograph integrity verification failed."};}
    if(!review.ok||review.contentType!=='image/webp'||review.width!==variant.width||review.height!==variant.height||review.width*review.height>originalReview.width*originalReview.height||!([Math.round(originalReview.height*review.width/originalReview.width),Math.round(originalReview.width*review.width/originalReview.height)].includes(review.height))||actual!==variant.sha256)return {ok:false,reason:"Responsive photograph bytes, dimensions or digest do not match their reviewed derivative."};
    if(!current())return changed();
    mediaBytes+=body.length;
    if(mediaBytes>25*1024*1024||files.length>=48)return {ok:false,reason:"Original and responsive photographs exceed the existing mobile archive safety limits. Export originals or use fewer images."};
    const path="assets/photo-"+String(i+1).padStart(3,"0")+"-"+variant.width+".webp";assetVariants[key+'#'+variant.width]=path;files.push({path,content:body});
   }
   const highest=[1920,1280,640].find(width=>width<=originalReview.width);
   if(highest&&!widths.has(highest))return {ok:false,reason:"Responsive export would reduce the reviewed image quality. Include its larger derivative or export the original."};
  }
 }
 try{
  for(const page of pages){
   const prefix='../'.repeat(page.outputPath.split('/').length-1);
   const localVariants=Object.fromEntries(Object.entries(assetVariants).map(([key,path])=>[key,prefix+path]));
   const html=renderPage(snapshot,page.id,{standalone:true,assetFiles,assetVariants:localVariants});
   if(!current())return changed();
   if(typeof html!=="string"||!html.startsWith("<!doctype html>")||
      /<(?:script|iframe|object|embed|base)\b/i.test(html)||/<[^>]+\son[a-z]+\s*=/i.test(html))
    return {ok:false,reason:"The offline HTML renderer produced an unsafe or incomplete page."};
   // Guard against signed remote media or access-token leakage.
   if(/https?:\/\/[^"' <]+\/storage\/v1\//i.test(html)||
      /<(?:img|source)\b[^>]*(?:src|srcset)\s*=["'][^"']*(?:https?:)?\/\//i.test(html)||/url\(\s*["']?\s*(?:https?:)?\/\//i.test(html)||/@import\s*(?:url\()?\s*["']?(?:https?:)?\/\//i.test(html))
    return {ok:false,reason:"The export still refers to a hosted photograph. The archive was not created."};
   // Every image must resolve to an actual bundled file, including srcset on
   // nested pages. This is a finite archive postcondition, not an HTML runtime.
   const bundled=new Set(files.map(file=>file.path));
   const imagePath=value=>{
    if(!/^(?:\.\.\/)*assets\/[A-Za-z0-9_.-]+\.(?:png|jpe?g|webp)$/.test(value))return '';
    const stack=page.outputPath.split('/').slice(0,-1);
    for(const part of value.split('/')){if(part==='..'){if(!stack.length)return '';stack.pop();}else stack.push(part);}
    return stack.join('/');
   };
   for(const tag of html.match(/<(?:img|source)\b[^>]*>/gi)||[]){
    const refs=[...tag.matchAll(/\b(src|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)];
    if(!refs.length||/^<img\b/i.test(tag)&&!refs.some(r=>r[1].toLowerCase()==='src'))return {ok:false,reason:"An exported image has no complete local source."};
    for(const ref of refs){const value=ref[2]??ref[3]??ref[4];const sources=ref[1].toLowerCase()==='srcset'?value.split(',').map(v=>v.trim().split(/\s+/)[0]):[value];if(sources.some(v=>!bundled.has(imagePath(v))))return {ok:false,reason:"An exported image or responsive source is missing from the ZIP."};}
   }
   files.push({path:page.outputPath,content:html});
  }
  const readme=[
   "Busy Does It — Your Portable Static Website","",
   "This ZIP contains your website HTML, responsive styles, and the approved",
   "original image bytes that were readable when you chose to export.","",
   "HOW TO USE","1. Unzip the archive.","2. Open index.html or upload these files to any static HTTPS web host.",
   "3. Keep the folders and filenames unchanged to preserve page links.",
   "4. Point your own domain at your chosen host using its DNS instructions.","",
   "IMPORTANT LIMITATIONS",
   "- This is a standalone STATIC website; BUSY-managed bookings, cloud contact",
   "  forms, customer records, billing, AI features, and account authentication",
   "  do not move with it.","- Inspect each public contact link and any booking CTA before going live.",
   "- DNS, ownership of a domain, and third-party services do not change automatically.",
   "- Your current BUSY website is untouched by exporting.",
   "- Images are copies from approved source files, not external signed URLs.",
   "- Original files may retain embedded metadata. Review privacy and usage rights",
   "  before hosting them publicly; export itself grants no publication authority.",
   "- Keep your original content and photos backed up independently.",""
  ].join("\n");
  files.push({path:"README.txt",content:readme});
  // Manifest intentionally contains only public, generic file metadata.
  files.push({path:"EXPORT-MANIFEST.json",content:JSON.stringify({
   format:"busy-does-it-static-website",version:1,portable:true,
   pages:pages.map(p=>({title:clean(p.title).slice(0,80),path:p.outputPath})),
   photos:assets.length,responsiveDerivatives:Object.keys(assetVariants).length,limitations:["Static HTML only","No cloud forms, bookings, accounts, DNS or hosting transfer"]
  },null,2)});
  if(!current())return changed();
  const bytes=makeWebsiteZip(files);
  const fileName=(clean(draft.businessName).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,55)||"website")+"-website.zip";
  return {ok:true,bytes,fileName,pages:pages.length,photos:assets.length,responsiveDerivatives:Object.keys(assetVariants).length,
   warning:"Static website only. Forms, bookings, domain and cloud services require separate migration."};
 }catch(error){
  return {ok:false,reason:"Website archive validation failed: "+String(error?.message||"Unknown file error.")};
 }
}
export {buildStandaloneWebsiteArchive,archiveRequirements,mimeFromBytes};
