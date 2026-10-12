/**
 * V3.194 owner-approved, same-business private typography coordination.
 * This is an approximate shared style identity, not shared font files.
 * No customer data, network, public writes, model credits or publishing.
 */
import {appVisualPresentation} from "./appVisualPresentationV3194.mjs";
const WEBSITE_TYPE=Object.freeze({
 balanced:"confident",editorial:"editorial",
 impact:"confident",friendly:"friendly"
});
function planMatchAppTypeToWebsite(website,app,{businessId}={}){
 const p=app?.draft_config?.presentation||{};
 if(typeof businessId!=="string"||!businessId||app?.business_id!==businessId||
  typeof app?.id!=="string"||!app.id||
  !Number.isSafeInteger(app.draft_revision)||app.draft_revision<1||
  !Array.isArray(app.draft_config?.modules)||
  !website?.id||!Number.isSafeInteger(website.generation)||
  website.generation<1||!Array.isArray(website.sections)||
  p.typeStyle!==undefined&&
   !Object.prototype.hasOwnProperty.call(WEBSITE_TYPE,p.typeStyle))
  return {ok:false,reason:"Open current private App and Website drafts for the same business."};
 const typeStyle=appVisualPresentation(p).typeStyle;
 const webTypography=WEBSITE_TYPE[typeStyle];
 if(website.theme?.typography===webTypography)
  return {ok:false,reason:"Your website already uses this typography style."};
 return {ok:true,kind:"private_cross_builder_type_match_v3194",
  businessId,appId:app.id,appRevision:app.draft_revision,
  websiteId:website.id,websiteGeneration:website.generation,
  typeStyle,webTypography,reviewEvidence:JSON.stringify({
   typeStyle,webTypography}),
  privateOnly:true,requiresOwnerApproval:true,autoPublishes:false,
  changesContent:false,changesCustomerData:false};
}
function confirmMatchAppTypeToWebsite(website,app,{businessId,evidence}={}){
 if(!evidence||evidence.businessId!==businessId||
   evidence.appId!==app?.id||evidence.appRevision!==app?.draft_revision||
   evidence.websiteId!==website?.id||
   evidence.websiteGeneration!==website?.generation)
  return {ok:false,reason:"The Business App or website has changed. Review again."};
 const now=planMatchAppTypeToWebsite(website,app,{businessId});
 if(!now.ok||now.reviewEvidence!==evidence.reviewEvidence||
    now.webTypography!==evidence.webTypography)
  return {ok:false,reason:"Typography has changed since review. Review again."};
 return now;
}
export {WEBSITE_TYPE,planMatchAppTypeToWebsite,confirmMatchAppTypeToWebsite};
