/**
 * Reusable private builder revision and change-boundary checks.
 *
 * The Website Builder's permitted visual suggestions are presentation-only.
 * Future App Builder surfaces can reuse the same guard with their own finite
 * allowed theme keys, rather than treating an AI model output as authority.
 */
const isOwn=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const toJson=value=>{try{return JSON.stringify(value)??"";}catch{return null;}};
const allowedWebsiteTheme=new Set([
 "heroLayout","cardLayout","navStyle","ornament","typography",
 "paletteVariant","heroSize","spacing"
]);
function privateBuilderRevisionMatches(current,{draftId,generation,pageId}={}){
 if(!current||typeof current!=="object"||
    typeof current.id!=="string"||!current.id||current.id!==draftId||
    !Number.isSafeInteger(generation)||current.generation!==generation)
   return false;
 if(pageId!==undefined){
  if(!Array.isArray(current.pages)||!current.pages.some(page=>page?.id===pageId&&page.enabled!==false))
   return false;
 }
 return true;
}
/**
 * Only presentation changes, plus derived ephemeral rendering/cache metadata,
 * are allowed. The rest of the draft MUST remain exactly the owner's data.
 * JSON equality is intentionally conservative: if the renderer reorders
 * customer content or mutates an unrelated key, reject that candidate.
 */
function privateBuilderVisualIntegrity(before,after,{allowedThemeKeys=allowedWebsiteTheme}={}){
 if(!before||!after||typeof before!=="object"||typeof after!=="object"||
   before.id!==after.id||!Number.isSafeInteger(before.generation)||
   !Number.isSafeInteger(after.generation)||after.generation<=before.generation)
  return {ok:false,reason:"The visual candidate is not a newer private version."};
 const ignored=new Set(["generation","updatedAt","html","designReview","designPlan","theme"]);
 const allKeys=new Set([...Object.keys(before),...Object.keys(after)]);
 for(const key of allKeys){
  if(ignored.has(key))continue;
  if(!isOwn(before,key)||!isOwn(after,key)||toJson(before[key])!==toJson(after[key]))
   return {ok:false,reason:"A design candidate attempted to change non-design website data: "+key};
 }
 const a=before.theme||{},b=after.theme||{};
 for(const key of new Set([...Object.keys(a),...Object.keys(b)])){
  if(toJson(a[key])===toJson(b[key]))continue;
  if(!allowedThemeKeys.has(key))
   return {ok:false,reason:"A design candidate attempted an unapproved theme change: "+key};
  if(typeof b[key]!=="string"||!/^[a-z][a-z-]{0,30}$/.test(b[key]))
   return {ok:false,reason:"An invalid visual design setting was proposed."};
 }
 return {ok:true,reason:"Design-only changes remain within the private builder boundary."};
}
export {privateBuilderRevisionMatches,privateBuilderVisualIntegrity,allowedWebsiteTheme};
