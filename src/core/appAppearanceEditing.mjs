/** V3.193 owner-controlled Business App appearance. Exact same code on
 * client and trusted Edge; acceptance and save use the same security rules. */
const OPTIONS=Object.freeze({
 headerStyle:["quiet","bold","refined"],
 layoutDensity:["comfortable","compact","airy"],
 navigationStyle:["tabs","list"],imageScale:["regular","large"],
 galleryLayout:["grid","stack"],imageCorners:["rounded","square"],
 typeStyle:["balanced","editorial","impact","friendly"],
 serviceStyle:["cards","rows","spotlight"],
 brandPalette:["midnight","forest","terracotta","violet","coastal",
  "rosewood","slate","plum","emerald","gilded","sunset","berry",
  "charcoal","olive","copper","porcelain","linen","daylight",
  "blush","sage","custom"]
});
const DEFAULTS=Object.freeze({
 headerStyle:"refined",layoutDensity:"comfortable",
 navigationStyle:"tabs",imageScale:"regular",
 galleryLayout:"grid",imageCorners:"rounded",brandPalette:"midnight",
 typeStyle:"balanced",serviceStyle:"cards"
});
const HEX=/^#[0-9a-fA-F]{6}$/;
const owned=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function previewPrivateAppAppearance(config,{field,value}={}){
 if(!config||typeof config!=="object"||Array.isArray(config)||
   !Array.isArray(config.modules))
  return {ok:false,reason:"Choose a current Business App draft."};
 const isBrand=field==="brandAccent";
 if(isBrand?typeof value!=="string"||!HEX.test(value):
    !owned(OPTIONS,field)||!OPTIONS[field].includes(value)||
     field==="brandPalette"&&value==="custom")
  return {ok:false,reason:"Choose a supported palette, or enter your brand colour as #RRGGBB."};
 const current={...DEFAULTS,...config.presentation};
 if(Object.keys(current).some(key=>key==="brandAccent"?
      typeof current[key]!=="string"||!HEX.test(current[key]):
      !owned(OPTIONS,key)||!OPTIONS[key].includes(current[key]))||
    current.brandPalette==="custom"&&!HEX.test(current.brandAccent||""))
  return {ok:false,reason:"The existing app appearance needs review."};
 const validated=isBrand?value.toUpperCase():value;
 if(isBrand&&current.brandPalette==="custom"&&
    current.brandAccent?.toUpperCase()===validated||
    !isBrand&&current[field]===validated)
  return {ok:false,reason:"This appearance is already selected."};
 const presentation={...current,[field]:validated};
 if(isBrand)presentation.brandPalette="custom";
 else if(field==="brandPalette")delete presentation.brandAccent;
 // Preserve older draft shape when touching an unrelated appearance choice.
 for(const optional of [...Object.keys(DEFAULTS),"brandAccent"]){
  if(optional!==field&&!(isBrand&&optional==="brandPalette")&&
    !owned(config.presentation||{},optional))
   delete presentation[optional];
 }
 const previous=isBrand?current.brandAccent||"":current[field];
 return {ok:true,field,value:validated,previous,
  nextConfig:{...config,presentation},
  privateOnly:true,ownerApprovalRequired:true,changesBooking:false,
  changesPayments:false};
}
export {OPTIONS,DEFAULTS,previewPrivateAppAppearance};
