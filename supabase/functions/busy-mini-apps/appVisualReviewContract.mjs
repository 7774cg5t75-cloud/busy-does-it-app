/**
 * V3.159: finite design-only guard for owner-consented native-app screenshot
 * reviews. Never turns model words into arbitrary actions. The model output is
 * untrusted and cannot publish, charge, edit customer data or create bookings.
 */
import {previewPrivateAppAppearance} from "./appAppearanceEditing.mjs";
const MAX_JPEG_BASE64=800000;
const FIELDS=new Set(["headerStyle","layoutDensity","navigationStyle","imageScale"]);
// Public screenshots may still include phone/email contact information.
 // Model observations must not repeat that information back as AI prose.
const text=(x,max)=>typeof x==="string"?x.trim().slice(0,max)
 .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,"[email withheld]")
 .replace(/\+?\d[\d ()-]{7,}\d/g,"[phone withheld]"):"";
const IDENT=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
function validateAppScreenshotReview(body){
 if(!IDENT.test(body?.appId||"")||
   !Number.isSafeInteger(body?.expectedRevision)||body.expectedRevision<1||
   body?.ownerConsent!==true||
   body?.captureScope!=="public_app_only"||
   typeof body?.imageBase64!=="string"||
   body.imageBase64.length<100||body.imageBase64.length>MAX_JPEG_BASE64||
   !/^[a-zA-Z0-9+/]+={0,2}$/.test(body.imageBase64)||
   body.imageBase64.length%4!==0)
  return {ok:false,reason:"Review requires a current private public-only JPEG capture and explicit consent."};
 return {ok:true,appId:body.appId,revision:body.expectedRevision,
   imageBase64:body.imageBase64,ownerConsent:true};
}
function normalizeAppVisualAIResult(raw,config){
 if(!raw||typeof raw!=="object"||Array.isArray(raw)||
    !Array.isArray(raw.suggestions)||raw.suggestions.length>6)
  return {ok:false,reason:"The AI review did not return a bounded design report."};
 const suggestions=[],seen=new Set();
 for(const p of raw.suggestions){
  if(!p||typeof p!=="object"||Array.isArray(p)||!FIELDS.has(p.field)||
     typeof p.value!=="string"||seen.has(p.field))continue;
  const preview=previewPrivateAppAppearance(config,{field:p.field,value:p.value});
  if(!preview.ok)continue;
  seen.add(p.field);
  suggestions.push({kind:"appearance",field:p.field,value:p.value,
   reason:text(p.reason,180)||"Compare this design choice with your current private app."});
  if(suggestions.length===3)break;
 }
 const observations=Array.isArray(raw.observations)?
  raw.observations.filter(x=>typeof x==="string")
    .slice(0,4).map(x=>text(x,160)).filter(Boolean):[];
 return {ok:true,kind:"owner_submitted_app_screenshot_ai_review_v1",
  summary:text(raw.summary,380)||"Screenshot inspected; compare the proposed design choices.",
  observations,suggestions,requiresOwnerApproval:true,
  screenshotWasSubmittedByOwner:true,
  screenshotAuthenticityIndependentlyVerified:false,
  measuredLayout:false,otherDevicesChecked:false,
  paymentEnabled:false,bookingsChanged:false,autoPublished:false};
}
function previewAppVisualSuggestion(config,suggestion){
 if(!suggestion||suggestion.kind!=="appearance"||!FIELDS.has(suggestion.field))
  return {ok:false,reason:"Only supported design suggestions can be previewed."};
 const one=previewPrivateAppAppearance(config,{field:suggestion.field,value:suggestion.value});
 if(!one.ok)return one;
 return {ok:true,operation:{kind:"appearance",field:suggestion.field,value:suggestion.value},
  nextConfig:one.nextConfig,reason:text(suggestion.reason,180),
  requiresOwnerApproval:true,noLiveChanges:true};
}
export {MAX_JPEG_BASE64,validateAppScreenshotReview,
 normalizeAppVisualAIResult,previewAppVisualSuggestion};
