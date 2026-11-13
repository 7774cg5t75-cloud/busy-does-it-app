/**
 * V3.161 — preview up to three bounded AI appearance suggestions together.
 * Client and trusted Edge share the identical implementation. AI prose is
 * not a command: only the finite review fields can become private draft edits.
 */
import {proposeCoordinatedAppChanges} from "./appCoordinatedStudio.mjs";
import {OPTIONS} from "./appAppearanceEditing.mjs";
function prepareAppVisualBatch(config,suggestions){
 if(!config||!Array.isArray(config.modules)||!Array.isArray(suggestions)||
    suggestions.length<1||suggestions.length>3)
  return {ok:/** @type {const} */ (false),reason:"Choose one to three supported design suggestions."};
 const fields=new Set(),operations=[];
 for(const item of suggestions){
  if(!item||typeof item!=="object"||Array.isArray(item)||
     item.kind!=="appearance"||
     !Object.prototype.hasOwnProperty.call(OPTIONS,item.field)||
     !OPTIONS[item.field].includes(item.value)||fields.has(item.field))
   return {ok:/** @type {const} */ (false),reason:"One or more suggestions are unsupported or conflict."};
  fields.add(item.field);
  operations.push({kind:"appearance",field:item.field,value:item.value});
 }
 const proposal=proposeCoordinatedAppChanges(config,operations);
 if(!proposal.ok)return proposal;
 return {...proposal,kind:"private_ai_visual_batch_v3161",
  safeDesignOnly:true,maximumChanges:3,aiReviewNotAutoApproved:true,
  screenshotComparisonPerformed:false,
  requiresOwnerApproval:true,mayPublish:false,chargesCreated:false};
}
function validatePairedAppVisualRequest(body){
 if(!body||body.captureScope!=="public_app_only"||
    body.ownerConsent!==true||
    typeof body.compareImageBase64!=="string"||
    body.compareImageBase64.length<100||
    body.compareImageBase64.length>800000||
    body.compareImageBase64.length%4!==0||
    !/^[a-zA-Z0-9+/]+={0,2}$/.test(body.compareImageBase64)||
    !Array.isArray(body.candidateOperations)||
    body.candidateOperations.length<1||body.candidateOperations.length>3)
  return {ok:/** @type {const} */ (false),reason:"Two current public-only JPEG captures and 1–3 owner-reviewed design changes are required."};
 return {ok:/** @type {const} */ (true),afterImageBase64:body.compareImageBase64,
  operations:body.candidateOperations.map(op=>({...op})),
  requiresOwnerConsent:true,imagesNotStored:true};
}
export {prepareAppVisualBatch,validatePairedAppVisualRequest};
