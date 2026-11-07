import {createHash} from 'node:crypto';
import {createConnectedBuilderSession} from '../../src/staging/connectedBuilderSession.mjs';
import {privateWebsiteDraftAction} from '../../supabase/functions/busy-website-publish/privateDraftService.mjs';
import {websiteCreativeCopyCatalog} from '../../supabase/functions/busy-website-worker/websiteCreativeCopy.mjs';
import {stableJson} from '../../src/core/stableJson.mjs';
import {mission16Businesses} from './mission16-site-fixtures.mjs';

// Source orchestration only. No network, login, environment, credential, SQL,
// provider, public gateway or new persistence authority is defined here.
const clone=value=>JSON.parse(JSON.stringify(value));
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
const digest=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const same=(left,right)=>stableJson(left)===stableJson(right);
const original=mission16Businesses[2];
const profile={businessName:original.name,businessType:original.type,tagline:original.tagline,description:original.description,serviceArea:original.area,services:original.services.map(([name,description],index)=>({id:'service-'+index,name,description})),contact:{email:'hello@quiet-light.example.invalid'}};

export const AI_LAB_B3_SOURCE_VERSION='busy.ai-lab-original-source.v1';
export const AI_LAB_B3_SOURCE_PLAN=freeze({
 version:AI_LAB_B3_SOURCE_VERSION,
 target:{projectRef:'sbvkrvksnruiclcvclbd',organisationId:'wrjfgasxtlznzfzmfrif',region:'eu-west-1'},
 profile,story:{title:'Clarity comes before decoration',firstParagraph:original.story.split('\n\n')[0],body:original.story},
 action:{wording:'Discuss your project',destination:'#contact'},pageIds:['home','services','contact'],
 goal:'Prepare one image-free three-page website: Home, Services and Contact. Audience: independent businesses working through brand direction and website content. Personality: considered, clear and independent; purposeful creative decisions. Keep approved action and story wording. Use only supplied facts.',
 operations:[
  {id:'initialize',authority:'busy_connected_initialize_v1',kind:'initialize'},
  {id:'profile',authority:'busy_connected_profile_write_v1',kind:'profile-cas'},
  {id:'create',authority:'original-private-website-handler',action:'create'},
  {id:'story-add',authority:'original-private-website-handler',action:'edit_design',patch:{action:'add-text',title:'Clarity comes before decoration',body:original.story.split('\n\n')[0]}},
  {id:'story-complete',authority:'original-private-website-handler',action:'edit_text',target:'actual-created-story-section',field:'body',value:original.story},
  {id:'cta',authority:'original-private-website-handler',action:'edit_instruction',pageId:'home',instruction:'set the hero button text to "Discuss your project"'}
 ],
 writes:6,media:0,providerCalls:0,automaticSaveOfModelOutput:false,publication:false
});
export const aiLabB3SourcePlanDigest=()=>createHash('sha256').update(stableJson(AI_LAB_B3_SOURCE_PLAN)).digest('hex');
export const AI_LAB_B3_SOURCE_PLAN_DIGEST=aiLabB3SourcePlanDigest();

const bindingKeys=['ownerId','businessId','executionId','requestNonce','sourcePlanDigest'];
function sourceBinding(manifest){
 if(!manifest||typeof manifest!=='object'||Array.isArray(manifest)||!bindingKeys.slice(0,4).every(key=>uuid(manifest[key]))||new Set(bindingKeys.slice(0,4).map(key=>manifest[key])).size!==4||!digest(manifest.sourcePlanDigest)||manifest.sourcePlanDigest!==AI_LAB_B3_SOURCE_PLAN_DIGEST)throw Error('invalid_source_binding');
 return freeze(Object.fromEntries(bindingKeys.map(key=>[key,manifest[key]])));
}
function cleanInitial(packet,binding){
 return packet?.actorId===binding.ownerId&&packet.businessId===binding.businessId&&packet.revision===1&&packet.websiteDraft==null&&packet.profile==null&&[null,undefined,0].includes(packet.profileRevision)&&!packet.websiteUndoCount&&!packet.websiteRedoCount&&packet.websiteHistoryHash==null;
}
function validatePreparedSource(packet,binding){
 const draft=packet?.websiteDraft,sections=draft?.sections||[],hero=sections.find(section=>section.id==='hero'),services=sections.find(section=>section.id==='services'),contact=sections.find(section=>section.id==='contact'),stories=sections.filter(section=>section.type==='text'&&section.title===AI_LAB_B3_SOURCE_PLAN.story.title),story=stories[0];
 if(packet.actorId!==binding.ownerId||packet.businessId!==binding.businessId||!same(packet.profile,AI_LAB_B3_SOURCE_PLAN.profile)||packet.profileRevision!==1||!digest(packet.profileHash)||!digest(packet.websiteDraftHash)||!digest(packet.websiteHistoryHash)||!Number.isSafeInteger(packet.revision)||packet.revision<2||draft?.businessId!==binding.businessId||draft.status!=='Draft'||draft.publicStatus!=='Not published'||draft.html!==undefined||draft.businessName!==profile.businessName||draft.businessType!==profile.businessType||draft.description!==profile.description||draft.serviceArea!==profile.serviceArea||!same(draft.pages?.map(page=>page.id),AI_LAB_B3_SOURCE_PLAN.pageIds)||draft.pages.some(page=>page.enabled===false)||!same(services?.items?.map(item=>({id:item.id,name:item.title,description:item.body})),profile.services)||hero?.body!==profile.tagline||hero.cta!==AI_LAB_B3_SOURCE_PLAN.action.wording||hero.ctaHref!==AI_LAB_B3_SOURCE_PLAN.action.destination||!hero.ownerEditedFields?.includes('cta')||!hero.ownerEditedFields?.includes('ctaHref')||contact?.email!==profile.contact.email||stories.length!==1||!story.id.startsWith('custom-')||story.body!==AI_LAB_B3_SOURCE_PLAN.story.body||!story.ownerEditedFields?.includes('body')||sections.length!==4||sections.some(section=>section.type==='gallery'||section.type==='photo-feature'||section.asset||section.items?.some(item=>item.photoBinding||item.storagePath||item.asset)))throw Error('source_readback_mismatch');
 const catalogue=websiteCreativeCopyCatalog(draft);
 if(!catalogue.ok||!catalogue.sources.some(source=>source.id==='section:'+story.id+':body'&&source.text===story.body&&source.ownerProtected===true)||!catalogue.sources.some(source=>source.id==='section:hero:cta'&&source.text===hero.cta&&source.ownerProtected===true))throw Error('source_wording_not_protected');
 return {storySectionId:story.id,sourceIds:catalogue.sources.map(source=>source.id)};
}

export function createAiLabB3SourceOrchestrator({manifest,authenticatedRpc,serviceRpc,readAuthenticatedOwner,verifySourceEmpty,consumeApproval}={}){
 const binding=sourceBinding(manifest),stamp=stableJson(binding);
 if([authenticatedRpc,serviceRpc,readAuthenticatedOwner,verifySourceEmpty,consumeApproval].some(value=>typeof value!=='function'))throw Error('original_source_ports_required');
 let state='unused',phase='preflight',writesAttempted=0,uncertain=false;
 const completedSteps=[],receipts=[];
 const ensureOwner=async()=>{
  if(stamp!==stableJson(sourceBinding(manifest)))throw Error('source_binding_changed');
  const owner=await readAuthenticatedOwner();
  if(owner?.id!==binding.ownerId||owner.anonymous!==false||owner.emailConfirmed!==true)throw Error('owner_changed');
 };
 const ownerRpc=async(name,args)=>{await ensureOwner();return authenticatedRpc(name,args);};
 const read=()=>ownerRpc('busy_connected_builder_read_v1',{p_business_id:binding.businessId});
 const attemptWrite=async operation=>{writesAttempted++;uncertain=true;const result=await operation();uncertain=false;return result;};
 const writeRpc=async(name,args)=>{await ensureOwner();return attemptWrite(()=>serviceRpc(name,args));};
 const session=createConnectedBuilderSession({request:async(action,body={})=>{
  if(body.businessId!==binding.businessId)throw Error('foreign_source_request');
  if(action==='builder_read')return read();
  if(action==='profile_write'){
   await ensureOwner();return attemptWrite(()=>authenticatedRpc('busy_connected_profile_write_v1',{p_business_id:binding.businessId,p_expected_revision:body.p_expected_revision,p_expected_profile:body.p_expected_profile,p_profile:body.p_profile,p_owner_approved:body.p_owner_approved}));
  }
  if(!['website_create','website_edit_design','website_edit_text','website_edit_instruction'].includes(action))throw Error('unsupported_source_operation');
  return privateWebsiteDraftAction({action,body,userId:binding.ownerId,read,commit:args=>writeRpc('busy_connected_website_commit_v1',args)});
 }});
 const must=result=>{if(!result?.ok){uncertain=result?.unknown===true;throw Error('source_write_unconfirmed');}receipts.push(clone(result.receipt));return result.observed;};
 return Object.freeze({
  get state(){return state;},
  async run(){
   if(state!=='unused')return {ok:false,status:'already-used',phase,mayReplay:false,writesAttempted,completedSteps:[...completedSteps],providerCalls:0};
   state='running';
   try{
    await ensureOwner();
    const workspaces=await ownerRpc('busy_connected_workspaces_v1',{});
    if(workspaces?.actorId!==binding.ownerId||!Array.isArray(workspaces.items)||workspaces.items.length!==1||workspaces.items[0]?.businessId!==binding.businessId||workspaces.items[0]?.role!=='owner'||workspaces.items[0]?.businessName!==profile.businessName)throw Error('membership_changed');
    // Idempotent initialize cannot prove an empty source: an existing empty
    // revision-one snapshot must fail BEFORE the first write. The trusted
    // native runtime supplies this read-only proof, never a caller boolean.
    phase='verify-empty-source';await ensureOwner();
    if(!same(await verifySourceEmpty(clone(binding)),{empty:true}))throw Error('source_not_empty');
    phase='consume-source-approval';
    const approval=await consumeApproval(clone(binding));
    if(approval?.consumed!==true||!bindingKeys.every(key=>approval[key]===binding[key]))throw Error('source_approval_denied');
    phase='initialize';await ensureOwner();
    const initialized=await attemptWrite(()=>authenticatedRpc('busy_connected_initialize_v1',{p_business_id:binding.businessId}));
    if(!cleanInitial(initialized,binding))throw Error('source_not_empty');
    completedSteps.push(phase);
    let basis=await session.open(binding.businessId);
    if(!cleanInitial(basis,binding))throw Error('source_not_empty');
    phase='profile';basis=must(await session.profile({basis,profile:clone(profile),ownerApproved:true}));completedSteps.push(phase);
    phase='create';basis=must(await session.website({basis,action:'create',sourceRevision:basis.profileRevision,ownerApproved:true}));completedSteps.push(phase);
    if(!same(basis.websiteDraft.pages?.map(page=>page.id),AI_LAB_B3_SOURCE_PLAN.pageIds))throw Error('source_pages_changed');
    phase='story-add';basis=must(await session.website({basis,action:'edit_design',patch:clone(AI_LAB_B3_SOURCE_PLAN.operations[3].patch),ownerApproved:true}));completedSteps.push(phase);
    const stories=basis.websiteDraft.sections.filter(section=>section.type==='text'&&section.title===AI_LAB_B3_SOURCE_PLAN.story.title);
    if(stories.length!==1||!stories[0].id.startsWith('custom-'))throw Error('story_target_changed');
    phase='story-complete';basis=must(await session.website({basis,action:'edit_text',patch:{sectionId:stories[0].id,field:'body',value:AI_LAB_B3_SOURCE_PLAN.story.body},ownerApproved:true}));completedSteps.push(phase);
    phase='cta';basis=must(await session.website({basis,action:'edit_instruction',patch:{pageId:'home',generation:basis.websiteDraft.generation,instruction:AI_LAB_B3_SOURCE_PLAN.operations[5].instruction},ownerApproved:true}));completedSteps.push(phase);
    phase='independent-readback';basis=await session.read();const verified=validatePreparedSource(basis,binding);
    if(writesAttempted!==6||completedSteps.length!==6)throw Error('source_operation_count_changed');
    state='complete';return {ok:true,status:'source-prepared',phase,mayReplay:false,writesAttempted,completedSteps:[...completedSteps],receipts:clone(receipts),observed:basis,source:{version:AI_LAB_B3_SOURCE_VERSION,sourcePlanDigest:binding.sourcePlanDigest,storySectionId:verified.storySectionId,sourceIds:verified.sourceIds},binding:{surface:'website',projectId:basis.websiteDraft.id,sourceRevision:basis.websiteDraft.generation,profileRevision:basis.profileRevision,snapshotRevision:basis.revision,pageId:'home'},providerCalls:0,publication:false};
   }catch(error){
    // Native sign-in can have an uncertain Auth-session outcome before any
    // source write. Copy only the runtime's own boolean flag, never its text,
    // cause, provider response or credential-bearing details.
    let nativeUnknown=false;try{nativeUnknown=Object.getOwnPropertyDescriptor(error,'unknownOutcome')?.value===true;}catch{}
    uncertain=uncertain||nativeUnknown;
    state='stopped';return {ok:false,status:uncertain?'unknown-outcome':writesAttempted?'stopped-partial':'denied',phase,mayReplay:false,writesAttempted,completedSteps:[...completedSteps],providerCalls:0,requiresIndependentInspection:uncertain||writesAttempted>0};
   }
  }
 });
}
