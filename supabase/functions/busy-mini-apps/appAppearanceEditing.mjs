import {validServicePresentation,servicePresentationTarget} from './appServicePresentation.mjs';
import {validImageStyles,imageStyleTargetExists} from './appImageAppearance.mjs';
import {editingQualityDecision} from "./builderQualityPolicy.mjs";
import {validComponentStyles,componentTargetExists} from './appComponentAppearance.mjs';
import {appOwnerLocks,appEditLockReason} from "./appOwnerLocks.mjs";
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
  return {ok:/** @type {const} */ (false),reason:"Choose a current Business App draft."};
 const locked=appEditLockReason(config,{kind:"appearance",field});
 if(locked)return {ok:/** @type {const} */ (false),reason:locked};
 const isBrand=field==="brandAccent";
 if(isBrand?typeof value!=="string"||!HEX.test(value):
    !owned(OPTIONS,field)||!OPTIONS[field].includes(value)||
     field==="brandPalette"&&value==="custom")
  return {ok:/** @type {const} */ (false),reason:"Choose a supported palette, or enter your brand colour as #RRGGBB."};
 const current={...DEFAULTS,...config.presentation};
 if(!appOwnerLocks(config).ok||Object.keys(current).some(key=>key==="servicePresentation"?!validServicePresentation(current[key]):key==="imageStyles"?!validImageStyles(current[key]):key==="componentStyles"?!validComponentStyles(current[key]):key==="ownerLockedElements"?false:key==="brandAccent"?
      typeof current[key]!=="string"||!HEX.test(current[key]):
      !owned(OPTIONS,key)||!OPTIONS[key].includes(current[key]))||
    current.brandPalette==="custom"&&!HEX.test(current.brandAccent||""))
  return {ok:/** @type {const} */ (false),reason:"The existing app appearance needs review."};
 const validated=isBrand?value.toUpperCase():value;
 if(isBrand&&current.brandPalette==="custom"&&
    current.brandAccent?.toUpperCase()===validated||
    !isBrand&&current[field]===validated)
  return {ok:/** @type {const} */ (false),reason:"This appearance is already selected."};
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
 const nextConfig={...config,presentation},quality=reviewAppEditingQuality(nextConfig);
 if(!quality.mayCommit)return {ok:/** @type {const} */ (false),reason:quality.explanation,quality};
 return {ok:/** @type {const} */ (true),field,value:validated,previous,quality,
  nextConfig,
  privateOnly:true,ownerApprovalRequired:true,changesBooking:false,
  changesPayments:false};
}
// Safe distribution projection: edit-only owner metadata stays in the draft.
function publicAppAppearance(presentation={}){
 if(!presentation||typeof presentation!=="object"||Array.isArray(presentation)||
    !appOwnerLocks({presentation}).ok)
  return {ok:/** @type {const} */ (false),reason:"The approved app appearance needs review."};
 const {ownerLockedElements,...look}=presentation;
 if(Object.keys(look).some(key=>key==="servicePresentation"?!validServicePresentation(look[key]):key==="imageStyles"?!validImageStyles(look[key]):key==="componentStyles"?!validComponentStyles(look[key]):key==="brandAccent"?
    typeof look[key]!=="string"||!HEX.test(look[key]):
    !owned(OPTIONS,key)||!OPTIONS[key].includes(look[key]))||
    (look.brandPalette==="custom"&&!HEX.test(look.brandAccent||""))||
    (look.brandAccent!==undefined&&look.brandPalette!=="custom"))
  return {ok:/** @type {const} */ (false),reason:"Use a supported appearance and a valid custom brand colour."};
 return {ok:/** @type {const} */ (true),appearance:{...DEFAULTS,...look,...(look.servicePresentation?{servicePresentation:JSON.parse(JSON.stringify(look.servicePresentation))}:{}),...(look.imageStyles?{imageStyles:JSON.parse(JSON.stringify(look.imageStyles))}:{}),...(look.componentStyles?{componentStyles:JSON.parse(JSON.stringify(look.componentStyles))}:{})}};
}
export {OPTIONS,DEFAULTS,previewPrivateAppAppearance,publicAppAppearance};

// Extends the existing appearance review; schema failures are critical,
// visual preferences remain advisory and never override owner choices.
function reviewAppEditingQuality(config){
 const findings=[],add=(id,level,message,evidence='finite-contract',repair=null)=>findings.push({id,level,message,evidence,repair});
 const enabled=(Array.isArray(config?.modules)?config.modules:[]).filter(m=>m?.enabled===true).map(m=>m.key);
 if(!enabled.includes('business_profile')||new Set(enabled).size!==enabled.length)
  add('essential-navigation','critical','Keep one business profile and unique enabled screens so customers can navigate the app.');
 if(config?.navigation!==undefined&&(!Array.isArray(config.navigation)||config.navigation.length!==enabled.length||
  new Set(config.navigation).size!==enabled.length||config.navigation.some(key=>!enabled.includes(key))))
  add('navigation-permutation','critical','The navigation must contain each enabled screen exactly once. Restore the supported order.');
 if(!publicAppAppearance(config?.presentation||{}).ok)add('appearance-contract','critical','This appearance contains an unsupported style or colour. Choose the supported controls.');
 const p=config?.presentation||{};
 if(validServicePresentation(p.servicePresentation||{})&&Object.keys(p.servicePresentation||{}).some(key=>!servicePresentationTarget(config,key)))add('service-presentation-target','critical','Reset a service card style before removing its source.');
 if(validImageStyles(p.imageStyles||{})&&Object.keys(p.imageStyles||{}).some(uri=>!imageStyleTargetExists(config,uri)))add('image-target','critical','Reset this picture style before removing, replacing or unapproving its source.');
 if(validComponentStyles(p.componentStyles||{})&&Object.keys(p.componentStyles||{}).some(key=>!componentTargetExists(config,key)))add('component-target','critical','A styled text component no longer exists. Reset its style before removing its source.');
 if(p.typeStyle==='impact'&&p.headerStyle==='bold')add('strong-header','advisory','This combines a bold header with emphatic typography. Check long business names on a phone; you may keep your choice.','heuristic',{kind:'appearance',field:'headerStyle',value:'refined'});
 if(p.layoutDensity==='compact'&&enabled.length>=5)add('compact-navigation','advisory','This compact app has several screens. More space may help customers scan it.','heuristic',{kind:'appearance',field:'layoutDensity',value:'comfortable'});
 return editingQualityDecision(findings);
}
export {reviewAppEditingQuality};
