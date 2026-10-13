/**
 * V3.200 — coherent, strictly private Brand DNA content preparation.
 * Same approved business identity across formats, no made-up offers,
 * unsupported media, campaigns, contacts or publisher calls.
 */
import {buildBusinessBrandDnaSnapshot} from "./businessBrandDnaV3195.mjs";
import {prepareBrandedCopyPreview} from "./brandedContentDraftV3198.mjs";
const CHANNELS=Object.freeze(["social","poster","advert"]);
function reviewCrossChannelBrandContent({businessId="",website,app}={}){
 const dna=buildBusinessBrandDnaSnapshot({businessId,website,app});
 if(!dna.ok)return {ok:false,reason:dna.reason||"Open your current branded drafts."};
 if(dna.conflicts.length)return {ok:false,
  reason:"Resolve differences between your website and app brand information first.",
  conflicts:[...dna.conflicts],ownerApprovalRequired:true};
 const previews=CHANNELS.map(channel=>prepareBrandedCopyPreview(dna,{channel}));
 if(previews.some(x=>!x.ok))return {ok:false,
  reason:previews.find(x=>!x.ok)?.reason||"Brand copy could not be prepared."};
 const inconsistent=previews.some(x=>x.businessId!==businessId||
  JSON.stringify(x.source)!==JSON.stringify(dna.source)||
  x.brandColour!==dna.design.primaryColour||
  x.copy.toLowerCase().indexOf(dna.identity.name.toLowerCase())===-1);
 if(inconsistent)return {ok:false,reason:"All content must match the same current approved business identity."};
 const checklist=[
  {id:"name",label:"Same trading name appears across all three formats",
   status:"static_pass"},
  {id:"colour",label:"Same approved brand colour is available to the design workflows",
   status:dna.design.primaryColour?"static_pass":"needs_owner_choice"},
  {id:"tone",label:"Owner-selected writing tone is recorded",
   status:dna.voice.ownerChosenTone?"present_not_applied":"needs_owner_choice"},
  {id:"assets",label:"Only explicitly owner-approved assets may be reused",
   status:"requires_media_rights_review"},
  {id:"facts",label:"Prices, offers, testimonials and availability have been checked for the campaign",
   status:"needs_owner_review"},
  {id:"channels",label:"Publishing permission and destination are approved",
   status:"not_approved"}
 ];
 return {ok:true,kind:"cross_channel_brand_review_v3200",
  businessId,source:{...dna.source},
  businessName:dna.identity.name,
  channelCount:previews.length,
  drafts:previews.map(p=>({channel:p.channel,text:p.copy,
   brandColour:p.brandColour,ownerChosenTone:p.ownerChosenTone,
   privateOnly:true,notPublished:true})),
  checklist,brandColour:dna.design.primaryColour,
  brandTone:dna.voice.ownerChosenTone,
  mediaApprovedForPublication:false,
  copyRequiresOwnerApproval:true,
  ownerControlsDistribution:true,
  contentWasActuallyPrepared:true,
  allFormatsPublished:false,
  externalProviderCalls:0,generatedImages:0,
  doesNotInventPricesOrOutcomes:true,
  nothingPersisted:true,neverPublishes:true};
}
export {CHANNELS,reviewCrossChannelBrandContent};
