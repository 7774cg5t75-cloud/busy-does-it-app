import {buildWebsiteDraft,applyStructuredWebsiteEdit} from '../../../src/domain/websiteBuilder.js';
import {stableJson} from '../../../src/core/stableJson.mjs';
// Purpose-specific extension of the ORIGINAL website gateway. No hosted write
// is enabled by this module. The endpoint requires a separately provisioned,
// exact staging environment AND an explicit server-side activation switch.
export async function privateWebsiteDraftAction({action,body,userId,read,commit}){
 if(!['website_create','website_edit_text'].includes(action)||body?.ownerApproved!==true)throw Error('Review this private website operation');
 const basis=await read(body.businessId);
 if(basis?.actorId!==userId||basis.businessId!==body.businessId||basis.revision!==body.expectedRevision||stableJson(basis.websiteDraft||null)!==stableJson(body.expectedDraft||null))throw Error('Website or workspace changed');
 let candidate;
 if(action==='website_create'){
  const profile=basis.profile;
  if(basis.websiteDraft||basis.profileRevision!==body.sourceRevision||!profile?.businessName||!Array.isArray(profile.services)||!profile.services.length||profile.services.length>30)throw Error('Review saved business facts before creating a website');
  const brief={...profile,phone:profile.contact?.phone||'',email:profile.contact?.email||''};
  candidate=buildWebsiteDraft({brandBrain:{websiteBrief:brief},businessId:body.businessId});
 }else{
  const patch=body.patch;
  if(!basis.websiteDraft||!patch||Object.keys(patch).some(k=>!['sectionId','field','value','itemId'].includes(k))||!['title','body','name','description'].includes(patch.field)||typeof patch.value!=='string'||patch.value.length>6000)throw Error('Choose supported private wording');
  const edited=applyStructuredWebsiteEdit(basis.websiteDraft,patch);
  if(!edited.applied)throw Error(edited.reason||'This wording change is unsupported');
  candidate=edited.draft;
 }
 // HTML is reproducible presentation, never an independent stored authority.
 const {html,...model}=candidate;
 return commit({p_business_id:body.businessId,p_actor_id:userId,p_expected_revision:basis.revision,p_expected_draft:basis.websiteDraft||null,p_candidate:model,p_profile_revision:basis.profileRevision});
}
