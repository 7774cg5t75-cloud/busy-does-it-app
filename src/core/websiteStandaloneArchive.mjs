/**
 * V3.136 owner-triggered self-hostable static website archive.
 * Caller supplies only VERIFIED bytes for each approved picture; never
 * downloads arbitrary URLs, reuses signed URLs, or exports tenant credentials.
 * All-or-nothing if any referenced photograph is unavailable.
 */
import {makeWebsiteZip} from "./websiteZipArchive.mjs";
const list=x=>Array.isArray(x)?x:[];
const clean=x=>typeof x==="string"?x.trim():"";
const IMAGE_MAX=9*1024*1024;
const mimeFromBytes=bytes=>{
 if(bytes.length>=4&&bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47)return "png";
 if(bytes.length>=4&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return "jpg";
 if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&
  String.fromCharCode(...bytes.slice(8,12))==="WEBP")return "webp";
 return "";
};
const keyOf=asset=>clean(asset?.storagePath)||clean(asset?.uri);
function archiveRequirements(draft={}){
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
 const assets=[],seen=new Set();
 const visibleSections=draft.sections.filter(s=>s?.enabled!==false);
 for(const section of visibleSections){
  const media=section?.type==="hero"?[section.asset]:
    section?.type==="gallery"?list(section.items):[];
  for(const item of media){
   if(!item)continue;
   if(item.approved===false)return {ok:false,reason:"An image has not been approved for your website."};
   const key=keyOf(item);
   if(!key)return {ok:false,reason:"A website photo has no retrievable source. Reattach the original first."};
   if(!seen.has(key)){seen.add(key);assets.push({...item,_lookupKey:key});}
  }
 }
 if(assets.length>48)return {ok:false,reason:"Your website has more than 48 images. Reduce the gallery or use a larger archive flow."};
 return {ok:true,pages,assets};
}
async function buildStandaloneWebsiteArchive(draft,{readPhoto,renderPage}={}){
 const requirements=archiveRequirements(draft);
 if(!requirements.ok)return requirements;
 if(typeof renderPage!=="function")return {ok:false,reason:"The website HTML renderer is unavailable."};
 const assetFiles=Object.create(null),files=[];
 const {assets,pages}=requirements;
 if(assets.length&&typeof readPhoto!=="function")
  return {ok:false,reason:"This website contains photos but the original photo reader is not connected."};
 let mediaBytes=0;
 for(let i=0;i<assets.length;i++){
  const asset=assets[i],key=asset._lookupKey;
  let bytes;
  try{bytes=await readPhoto(asset);}
  catch(_error){return {ok:false,reason:"Photo "+(i+1)+" is not available on this device. Reattach the approved original before creating a complete ZIP.",missingPhoto:i+1};}
  if(!(bytes instanceof Uint8Array)||bytes.length===0||bytes.length>IMAGE_MAX)
   return {ok:false,reason:"Photo "+(i+1)+" has invalid contents or exceeds the 9 MB per-photo limit.",missingPhoto:i+1};
  const ext=mimeFromBytes(bytes);
  if(!ext)return {ok:false,reason:"Photo "+(i+1)+" is not a supported JPEG, PNG or WebP image.",missingPhoto:i+1};
  const path="assets/photo-"+String(i+1).padStart(3,"0")+"."+ext;
  assetFiles[key]=path;
  mediaBytes+=bytes.length;
  if(mediaBytes>25*1024*1024)return {ok:false,reason:"Total approved photographs exceed the 25 MB mobile archive limit."};
  files.push({path,content:bytes});
 }
 try{
  for(const page of pages){
   const html=renderPage(draft,page.id,{standalone:true,assetFiles});
   if(typeof html!=="string"||!html.startsWith("<!doctype html>")||
      /<script\b/i.test(html))
    return {ok:false,reason:"The offline HTML renderer produced an unsafe or incomplete page."};
   // Guard against signed remote media or access-token leakage.
   if(/https?:\/\/[^"' <]+\/storage\/v1\//i.test(html)||
      /<img\b[^>]*src=["']https?:\/\//i.test(html))
    return {ok:false,reason:"The export still refers to a hosted photograph. The archive was not created."};
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
   "- Keep your original content and photos backed up independently.",""
  ].join("\n");
  files.push({path:"README.txt",content:readme});
  // Manifest intentionally contains only public, generic file metadata.
  files.push({path:"EXPORT-MANIFEST.json",content:JSON.stringify({
   format:"busy-does-it-static-website",version:1,portable:true,
   pages:pages.map(p=>({title:clean(p.title).slice(0,80),path:p.outputPath})),
   photos:assets.length,limitations:["Static HTML only","No cloud forms, bookings, accounts, DNS or hosting transfer"]
  },null,2)});
  const bytes=makeWebsiteZip(files);
  const fileName=(clean(draft.businessName).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,55)||"website")+"-website.zip";
  return {ok:true,bytes,fileName,pages:pages.length,photos:assets.length,
   warning:"Static website only. Forms, bookings, domain and cloud services require separate migration."};
 }catch(error){
  return {ok:false,reason:"Website archive validation failed: "+String(error?.message||"Unknown file error.")};
 }
}
export {buildStandaloneWebsiteArchive,archiveRequirements,mimeFromBytes};
