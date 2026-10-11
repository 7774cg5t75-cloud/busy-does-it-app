/** Private Business App appearance choices shared by client and server. */
const OPTIONS=Object.freeze({headerStyle:["quiet","bold","refined"],
 layoutDensity:["comfortable","compact","airy"],navigationStyle:["tabs","list"],
 imageScale:["regular","large"]});
const DEFAULTS=Object.freeze({headerStyle:"refined",layoutDensity:"comfortable",
 navigationStyle:"tabs",imageScale:"regular"});
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
 return {ok:true,field,value,previous:current[field],
  nextConfig:{...config,presentation:{...current,[field]:value}},
  privateOnly:true,ownerApprovalRequired:true,changesBooking:false,changesPayments:false};
}
export {OPTIONS,DEFAULTS,previewPrivateAppAppearance};
