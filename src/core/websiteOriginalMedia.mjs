/**
 * V3.137: private, owner-initiated backup of original approved website photos.
 * Source storagePath remains untouched: hosted website publishing may depend
 * on the legacy source bucket. exportOriginalPath is private export metadata.
 */
const clean=v=>typeof v==="string"?v.trim():"";
const pathFor=asset=>clean(asset?.storagePath)||clean(asset?.uri);
const UUID="[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const pathPattern=new RegExp("^("+UUID+")/("+UUID+")/("+UUID+")\\.(jpg|png|webp)$","i");
function validExportOriginalPath(path,businessId){
 const found=pathPattern.exec(clean(path));
 return !!found&&found[1].toLowerCase()===clean(businessId).toLowerCase();
}
function sitePhotoAssets(draft){
 const found=new Map();
 for(const section of Array.isArray(draft?.sections)?draft.sections:[]){
  if(section?.enabled===false)continue;
  const assets=["hero","photo-feature"].includes(section?.type)?[section.asset]:
    section?.type==="gallery"&&Array.isArray(section.items)?section.items:[];
  for(const asset of assets){
   if(!asset||asset.approved===false)continue;
   const key=pathFor(asset);
   if(key&&!found.has(key))found.set(key,asset);
  }
 }
 return [...found.entries()].map(([key,asset])=>({key,asset}));
}
function attachExportOriginal(draft,sourceKey,exportOriginalPath){
 if(!draft||!clean(sourceKey)||!clean(exportOriginalPath))return draft;
 const edit=asset=>asset&&pathFor(asset)===sourceKey?{...asset,exportOriginalPath}:asset;
 return {...draft,sections:(draft.sections||[]).map(section=>{
  if(["hero","photo-feature"].includes(section.type))return {...section,asset:edit(section.asset)};
  if(section.type==="gallery")return {...section,
   items:(section.items||[]).map(edit)};
  return section;
 })};
}
function preserveExportOriginals(previous,sections){
 const originals=new Map(sitePhotoAssets(previous).filter(x=>clean(x.asset.exportOriginalPath))
  .map(x=>[x.key,x.asset.exportOriginalPath]));
 const edit=a=>a&&originals.has(pathFor(a))?{...a,exportOriginalPath:originals.get(pathFor(a))}:a;
 return sections.map(section=>{
  if(["hero","photo-feature"].includes(section.type))return {...section,asset:edit(section.asset)};
  if(section.type==="gallery")return {...section,items:(section.items||[]).map(edit)};
  return section;
 });
}
export {validExportOriginalPath,sitePhotoAssets,attachExportOriginal,preserveExportOriginals};
