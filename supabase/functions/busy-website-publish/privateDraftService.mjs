import {WEBSITE_ATOMIC_CHARACTERS} from '../../../src/core/websiteEditingLimits.mjs';
import {planWebsitePageInstructions} from '../../../src/core/websitePageInstructions.mjs';
import {prepareSelectedWebsiteTransaction} from '../../../src/core/websiteContextPlan.mjs';
import {makeWebsiteRecoveryPoint,restoreWebsiteRecoveryPoint} from '../../../src/core/websiteRecoveryPoint.mjs';
import {buildWebsiteDraft,applyStructuredWebsiteEdit,applyWebsiteLayoutChange,applyWebsitePageChange,rebuildPrivateWebsiteDraft} from '../../../src/domain/websiteBuilder.js';
import {stableJson} from '../../../src/core/stableJson.mjs';
// Purpose-specific extension of the ORIGINAL website gateway. No hosted write
// is enabled by this module. The endpoint requires a separately provisioned,
// exact staging environment AND an explicit server-side activation switch.
export async function privateWebsiteDraftAction({action,body,userId,read,commit,history,transition}){
 if(!['website_create','website_edit_text','website_edit_design','website_edit_page','website_edit_instruction','website_undo','website_redo'].includes(action)||body?.ownerApproved!==true)throw Error('Review this private website operation');
 const basis=await read(body.businessId);
 if(basis?.actorId!==userId||basis.businessId!==body.businessId||basis.revision!==body.expectedRevision||stableJson(basis.websiteDraft||null)!==stableJson(body.expectedDraft||null))throw Error('Website or workspace changed');
 let candidate;
 if(action==='website_create'){
  const profile=basis.profile;
  if(basis.websiteDraft||basis.profileRevision!==body.sourceRevision||!profile?.businessName||!Array.isArray(profile.services)||!profile.services.length||profile.services.length>30)throw Error('Review saved business facts before creating a website');
  const brief={...profile,phone:profile.contact?.phone||'',email:profile.contact?.email||''};
  candidate=buildWebsiteDraft({brandBrain:{websiteBrief:brief},businessId:body.businessId});
 }else if(action==='website_edit_instruction'){
  const patch=body.patch;
  if(!basis.websiteDraft||!patch||Object.keys(patch).some(k=>!['pageId','generation','instruction'].includes(k))||typeof patch.instruction!=='string'||patch.instruction.length>WEBSITE_ATOMIC_CHARACTERS)throw Error('Review exact page instructions');
  const plan=planWebsitePageInstructions(basis.websiteDraft,{...patch,draftId:basis.websiteDraft.id});
  if(!plan.ok)throw Error(plan.reason);
  const edited=prepareSelectedWebsiteTransaction(basis.websiteDraft,plan,{fieldEdit:applyStructuredWebsiteEdit,layoutEdit:applyWebsiteLayoutChange});
  if(!edited.applied)throw Error(edited.reason);
  // One approved transaction is one persisted generation and one Undo entry.
  candidate=rebuildPrivateWebsiteDraft({...edited.draft,generation:basis.websiteDraft.generation});
 }else if(action==='website_undo'||action==='website_redo'){
  if(!basis.websiteDraft||typeof history!=='function'||typeof transition!=='function')throw Error('Account history unavailable');
  const direction=action==='website_undo'?'undo':'redo',observed=await history(body.businessId,basis.revision,basis.websiteDraftHash,direction);
  if(observed?.actorId!==userId||observed.businessId!==body.businessId||observed.revision!==basis.revision||observed.direction!==direction||observed.notOwnReceipt!==true||!observed.target)throw Error('Review current account history');
  const scope={ownerId:userId,businessId:body.businessId},point=makeWebsiteRecoveryPoint(observed.target,new Date().toISOString(),scope);
  const edited=restoreWebsiteRecoveryPoint(basis.websiteDraft,point,rebuildPrivateWebsiteDraft,scope);
  if(!edited.applied)throw Error(edited.reason);candidate=edited.draft;
 }else if(action==='website_edit_design'){
  const patch=body.patch,shapes={'brand-colour':['action','value'],move:['action','sectionId','direction'],style:['action','field','value'],'add-text':['action','title','body'],delete:['action','sectionId'],duplicate:['action','sectionId'],show:['action','sectionId'],hide:['action','sectionId']},keys=Object.hasOwn(shapes,patch?.action)?shapes[patch.action]:null;
  if(!basis.websiteDraft||!patch||!keys||Object.keys(patch).some(k=>!keys.includes(k)))throw Error('Review a supported private design change');
  const edited=applyWebsiteLayoutChange(basis.websiteDraft,patch);if(!edited.applied)throw Error(edited.reason||'Design change unavailable');candidate=edited.draft;
 }else if(action==='website_edit_page'){
  const patch=body.patch,shapes={'create-page':['title','body'],'rename-page':['pageId','title'],'delete-page':['pageId'],'add-page-section':['pageId','title','body'],'assign-section':['pageId','sectionId'],'remove-page-section':['pageId','sectionId'],'move-page-section':['pageId','sectionId','direction'],'edit-page-metadata':['pageId','title','description'],'reset-page-metadata':['pageId']},keys=Object.hasOwn(shapes,patch?.action)?shapes[patch.action]:null;
  if(!basis.websiteDraft||!keys||Object.keys(patch).some(k=>!['action','expectedWebsiteId','expectedGeneration',...keys].includes(k))||Object.hasOwn(patch,'expectedWebsiteId')&&patch.expectedWebsiteId!==basis.websiteDraft.id||Object.hasOwn(patch,'expectedGeneration')&&patch.expectedGeneration!==basis.websiteDraft.generation)throw Error('Review a supported private page change; media and public actions remain unavailable');
  const edited=applyWebsitePageChange(basis.websiteDraft,patch);if(!edited.applied)throw Error(edited.reason||'Page change unavailable');candidate=edited.draft;
 }else{
  const patch=body.patch;
  if(!basis.websiteDraft||!patch||Object.keys(patch).some(k=>!['sectionId','field','value','itemId'].includes(k))||!['title','body','name','description'].includes(patch.field)||typeof patch.value!=='string'||patch.value.length>6000)throw Error('Choose supported private wording');
  const edited=applyStructuredWebsiteEdit(basis.websiteDraft,patch);
  if(!edited.applied)throw Error(edited.reason||'This wording change is unsupported');
  candidate=edited.draft;
 }
 // HTML is reproducible presentation, never an independent stored authority.
 const {html,...model}=candidate;
 const args={p_business_id:body.businessId,p_actor_id:userId,p_expected_revision:basis.revision,p_expected_draft:basis.websiteDraft||null,p_candidate:model,p_profile_revision:basis.profileRevision};
 return action==='website_undo'||action==='website_redo'?transition({...args,p_operation:action.slice(8)}):commit(args);
}
