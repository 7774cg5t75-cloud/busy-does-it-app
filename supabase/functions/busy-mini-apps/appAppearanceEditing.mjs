/** Private Business App appearance choices shared by client and server. */
const OPTIONS=Object.freeze({headerStyle:["quiet","bold","refined"],
 layoutDensity:["comfortable","compact","airy"],navigationStyle:["tabs","list"],
 imageScale:["regular","large"],galleryLayout:["grid","stack"],
 imageCorners:["rounded","square"]});
const DEFAULTS=Object.freeze({headerStyle:"refined",layoutDensity:"comfortable",
 navigationStyle:"tabs",imageScale:"regular",
 galleryLayout:"grid",imageCorners:"rounded"});
function previewPrivateAppAppearance(config,{field,value}={}){
 if(!config||typeof config!=="object"||!Array.isArray(config.modules))
  return {ok:false,reason:"Choose a current Business App draft."};
 if(!Object.prototype.hasOwnProperty.call(OPTIONS,field)||!OPTIONS[field].includes(value))
  return {ok:false,reason:"This design setting is not supported."};
 const current={...DEFAULTS,...config.presentation};
 if(Object.keys(current).some(key=>!Object.prototype.hasOwnProperty.call(OPTIONS,key)||
    !OPTIONS[key].includes(current[key])))
  return {ok:false,reason:"The existing app appearance needs review."};
 if(current[field]===value)return {ok:false,reason:"This appearance is already selected."};
 // Preserve the shape of an older draft when editing an unrelated field.
 // New settings must not appear in older drafts unless explicitly selected.
 const presentation={...current,[field]:value};
 for(const optional of ["imageScale","galleryLayout","imageCorners"]){
  if(optional!==field&&!Object.prototype.hasOwnProperty.call(
     config.presentation||{},optional))
   delete presentation[optional];
 }
 return {ok:true,field,value,previous:current[field],
  nextConfig:{...config,presentation},
  privateOnly:true,ownerApprovalRequired:true,changesBooking:false,changesPayments:false};
}
export {OPTIONS,DEFAULTS,previewPrivateAppAppearance};
