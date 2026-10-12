/**
 * V3.193: owner-reviewed, same-tenant private website colour match. This
 * offers a shared brand token, not a promise that app/website layouts match.
 * No background sync, CSS injection, publishing, AI or customer data.
 */
import {nativePalette,PALETTES,safeHex} from "./nativePalette.mjs";
function planMatchAppBrandToWebsite(website,app,{businessId}={}){
 const p=app?.draft_config?.presentation||{};
 const name=p.brandPalette||"midnight";
 const custom=name==="custom";
 if(!website?.id||!Number.isSafeInteger(website.generation)||
    website.generation<1||!Array.isArray(website.sections)||
    typeof businessId!=="string"||!businessId||
    app?.business_id!==businessId||
    typeof app?.id!=="string"||!app.id||
    !Number.isSafeInteger(app.draft_revision)||app.draft_revision<1||
    !Array.isArray(app.draft_config?.modules)||
    !(custom||Object.prototype.hasOwnProperty.call(PALETTES,name))||
    (custom&&!safeHex(p.brandAccent)))
  return {ok:false,reason:"Choose current private website and Business App drafts belonging to the same business."};
 const base=nativePalette(name,p.brandAccent);
 const targetColour=custom?p.brandAccent.toUpperCase():base.accent;
 if((website.theme?.primary||"").toUpperCase()===targetColour)
  return {ok:false,reason:"The website already uses this Business App colour."};
 return {ok:true,kind:"private_cross_builder_brand_match_v3193",
  appId:app.id,appRevision:app.draft_revision,
  websiteId:website.id,websiteGeneration:website.generation,businessId,
  paletteName:name,targetColour,
  appearanceEvidence:JSON.stringify({name,brandAccent:p.brandAccent||""}),
  privateOnly:true,doesNotPublish:true,changesBookings:false,
  colourOnly:true,requiresOwnerConfirmation:true,
  note:"Your site design remains distinct. BUSY uses the website's existing readable colour design rules."};
}
function confirmMatchAppBrandToWebsite(website,app,{businessId,evidence}={}){
 if(!evidence||evidence.appId!==app?.id||
    evidence.websiteId!==website?.id||
    evidence.appRevision!==app?.draft_revision||
    evidence.websiteGeneration!==website?.generation||
    evidence.businessId!==businessId)
  return {ok:false,reason:"One of these drafts changed. Review the brand colour again."};
 const now=planMatchAppBrandToWebsite(website,app,{businessId});
 if(!now.ok||now.targetColour!==evidence.targetColour||
    now.appearanceEvidence!==evidence.appearanceEvidence)
  return {ok:false,reason:"The proposed brand colour changed. Review the latest colours first."};
 return now;
}
export {planMatchAppBrandToWebsite,confirmMatchAppBrandToWebsite};
