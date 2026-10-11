/**
 * V3.136 owner-triggered self-hostable static website archive.
 * Caller supplies only VERIFIED bytes for each approved picture; never
 * downloads arbitrary URLs, reuses signed URLs, or exports tenant credentials.
 * All-or-nothing if any referenced photograph is unavailable.
 */
import {makeWebsiteZip,crc32} from "./websiteZipArchive.mjs";
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
  const media=["hero","photo-feature"].includes(section?.type)?[section.asset]:
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
