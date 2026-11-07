// Read-only evidence adapter. This is not a second Website Builder, a hosted
// gateway, an authentication route, or authority to save a website.
import {createHash} from 'node:crypto';
import {stableJson} from '../../src/core/stableJson.mjs';
import {renderWebsiteHtml} from '../../src/domain/websiteBuilder.js';
import {websiteCreativeCopyCatalog} from '../../supabase/functions/busy-website-worker/websiteCreativeCopy.mjs';
import {AI_LAB_B3_SOURCE_PLAN,AI_LAB_B3_SOURCE_PLAN_DIGEST} from './ai-lab-b3-source.mjs';

export const HOSTED_BASELINE_INPUT_VERSION='busy.lab-read-only-website-source.v1';
export const HOSTED_BASELINE_VERSION='busy.hosted-source-preview.v1';
export const HOSTED_BASELINE_TARGET=Object.freeze({projectId:'sbvkrvksnruiclcvclbd',organizationId:'wrjfgasxtlznzfzmfrif',region:'eu-west-1'});
export const HOSTED_BASELINE_MANIFEST_DIGEST='3409c7d6f6d4850e0a9cb4c586aca3c89623c0b0f2580de358511d0bc0a403c3';
export const HOSTED_BASELINE_EVIDENCE_SHA256='b8cbbb402a261612983dfc4e547518ed7f7fb60fa0d30f3740ecd54d764273f8';
// Exact source receipts from completed B3 run42377316843, independently
// matched to PostgreSQL before this read-only baseline adapter was prepared.
// These are technical hashes, not private native identities or credentials.
export const HOSTED_BASELINE_SOURCE_HASHES=Object.freeze({profileHash:'2dbed341b135ec19b0fe06e1c84de34a273f2c592f3b604097dd32bba45aeeaa',websiteDraftHash:'4b9ba873205dd46eda20d682ab1644e0dfd344b8cc14455e9f2573ed05c98539',websiteHistoryHash:'c4cfe9a95d09e034e44edf483d8a1d36bb5a6347428a40387b40ea2db6e21c63'});
export const baselineHash=value=>createHash('sha256').update(typeof value==='string'||value instanceof Uint8Array?value:stableJson(value)).digest('hex');
const same=(a,b)=>stableJson(a)===stableJson(b);
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v);
const sha=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const check=(condition,code)=>{if(!condition)throw Error(code);};
const list=v=>Array.isArray(v)?v:[];

/**
 * Accept only the expressly scoped fictional Lab export. The authorisation of
 * the read-only export is documented by its producer; this offline adapter is
 * not remote attestation. Exact PostgreSQL JSONB text accompanies the parsed
 * objects so a changed object cannot retain an old claimed database hash.
 */
export function validateHostedBaselineSource(envelope){
 check(envelope?.version===HOSTED_BASELINE_INPUT_VERSION&&envelope.origin==='authorised-read-only-hosted-export','hosted_source_provenance_required');
 check(same(envelope.target,HOSTED_BASELINE_TARGET),'foreign_lab_target');
 check(envelope.approvedManifestDigest===HOSTED_BASELINE_MANIFEST_DIGEST&&envelope.evidenceSha256===HOSTED_BASELINE_EVIDENCE_SHA256,'original_b3_evidence_required');
 check(Number.isFinite(Date.parse(envelope.observedAt)),'source_observation_required');
 const binding=envelope.approvedBinding,readback=envelope.readback,packet=readback?.packet;
 check(binding&&Object.keys(binding).sort().join(',')===['ownerId','businessId','executionId','requestNonce','sourcePlanDigest'].sort().join(',')&&['ownerId','businessId','executionId','requestNonce'].every(k=>uuid(binding[k]))&&new Set(['ownerId','businessId','executionId','requestNonce'].map(k=>binding[k])).size===4&&binding.sourcePlanDigest===AI_LAB_B3_SOURCE_PLAN_DIGEST,'invalid_original_source_binding');
 check(readback?.readOnly==='on'&&packet?.actorId===binding.ownerId&&packet.businessId===binding.businessId,'foreign_or_unverified_readback');
 check(readback.observedAt===envelope.observedAt,'source_observation_mismatch');
 const texts=readback.postgresJsonb,hashes=envelope.sourceHashes;
 check(texts&&hashes&&same(hashes,HOSTED_BASELINE_SOURCE_HASHES)&&['profileHash','websiteDraftHash','websiteHistoryHash'].every(k=>sha(hashes[k])&&hashes[k]===packet[k]),'postgres_source_hashes_required');
 for(const [key,value,hashKey]of [['profile',packet.profile,'profileHash'],['websiteDraft',packet.websiteDraft,'websiteDraftHash'],['websiteHistory',readback.history,'websiteHistoryHash']]){
  const text=texts[key];
  check(typeof text==='string'&&Buffer.byteLength(text)<1500000&&baselineHash(text)===hashes[hashKey],'postgres_text_hash_mismatch');
  let parsed;try{parsed=JSON.parse(text);}catch{throw Error('invalid_postgres_source_text');}
  check(same(parsed,value),'parsed_source_differs_from_postgres_bytes');
 }
 const draft=packet.websiteDraft,plan=AI_LAB_B3_SOURCE_PLAN,sections=list(draft?.sections),hero=sections.find(x=>x.id==='hero'),services=sections.find(x=>x.id==='services'),contact=sections.find(x=>x.id==='contact'),stories=sections.filter(x=>x.type==='text'&&x.title===plan.story.title),story=stories[0];
 check(packet.profileRevision===1&&packet.revision===5&&draft?.generation===4&&packet.websiteUndoCount===3&&packet.websiteRedoCount===0,'not_exact_approved_b3_baseline');
 check(same(packet.profile,plan.profile)&&draft.businessId===binding.businessId&&draft.businessName===plan.profile.businessName&&draft.businessType===plan.profile.businessType&&draft.description===plan.profile.description&&draft.serviceArea===plan.profile.serviceArea,'approved_business_facts_changed');
 check(draft.status==='Draft'&&draft.publicStatus==='Not published'&&draft.html===undefined&&readback.profileMetadata?.status==='draft'&&readback.profileMetadata.updatedBy===binding.ownerId&&readback.profileMetadata.sourceWebsiteId===null&&readback.profileMetadata.sourceDeploymentId===null&&readback.publicWebsiteCount===0&&readback.deploymentCount===0,'private_draft_status_required');
 check(same(list(draft.pages).map(x=>x.id),plan.pageIds)&&draft.pages.every(x=>x.enabled!==false),'original_three_page_source_required');
 check(sections.length===4&&same(list(services?.items).map(x=>({id:x.id,name:x.title,description:x.body})),plan.profile.services),'complete_original_services_required');
 check(hero?.body===plan.profile.tagline&&hero.cta===plan.action.wording&&hero.ctaHref===plan.action.destination&&list(hero.ownerEditedFields).includes('cta')&&list(hero.ownerEditedFields).includes('ctaHref'),'approved_action_not_preserved');
 check(stories.length===1&&story.id.startsWith('custom-')&&story.body===plan.story.body&&list(story.ownerEditedFields).includes('body')&&contact?.email===plan.profile.contact.email,'approved_story_or_contact_changed');
 check(!sections.some(x=>['gallery','photo-feature'].includes(x.type)||x.asset||x.storyPhoto||list(x.contentPhotos).length||list(x.items).some(i=>i.photoBinding||i.storagePath||i.asset)),'image_free_source_required');
 const catalogue=websiteCreativeCopyCatalog(draft);
 check(catalogue.ok&&catalogue.sources.some(x=>x.id==='section:'+story.id+':body'&&x.text===story.body&&x.ownerProtected===true)&&catalogue.sources.some(x=>x.id==='section:hero:cta'&&x.text===hero.cta&&x.ownerProtected===true),'owner_wording_protection_required');
 const history=readback.history;
 check(history?.v===1&&history.draftId===draft.id&&same(list(history.undo).map(x=>x.revision),[2,3,4])&&same(list(history.undo).map(x=>x.draft?.generation),[1,2,3])&&same(history.redo,[]),'original_history_changed');
 check(same(readback.snapshotKeys,['websiteDraft','websiteHistory']),'unexpected_snapshot_payload');
 const paths=new Set();
 for(const page of draft.pages){
  check(typeof page.path==='string'&&page.path.startsWith('/')&&/^(?:index\.html|(?:[a-z0-9-]+\/){1,3}index\.html)$/.test(page.outputPath)&&!paths.has(page.outputPath),'invalid_or_duplicate_page_path');paths.add(page.outputPath);
  check(list(page.sectionIds).every(id=>sections.some(x=>x.id===id&&x.enabled!==false)),'unsupported_page_section');
 }
 return {draft,binding,source:{target:envelope.target,observedAt:envelope.observedAt,approvedManifestDigest:envelope.approvedManifestDigest,evidenceSha256:envelope.evidenceSha256,sourcePlanDigest:binding.sourcePlanDigest,profileRevision:packet.profileRevision,snapshotRevision:packet.revision,websiteGeneration:draft.generation,sourceHashes:{...hashes},undoCount:packet.websiteUndoCount,redoCount:packet.websiteRedoCount,privateDraft:true,imageFree:true,approvedServices:plan.profile.services.length,ownerStoryProtected:true,ownerActionProtected:true}};
}

export function renderHostedBaseline(envelope){
 const {draft,binding,source}=validateHostedBaselineSource(envelope),before=stableJson(envelope),pages=[];
 for(const page of draft.pages){
  const html=renderWebsiteHtml(draft,page.id,{standalone:true});
  check(![binding.ownerId,binding.businessId,binding.executionId,binding.requestNonce].some(value=>html.includes(value)),'private_binding_in_rendered_html');
  const requiredVisibleText=[];
  for(const id of page.sectionIds){const section=draft.sections.find(x=>x.id===id);if(!section)continue;
   if(section.type==='services')for(const item of section.items)requiredVisibleText.push(item.title,item.body);
   else {if(section.title)requiredVisibleText.push(section.title);if(section.body)requiredVisibleText.push(section.body);}
  }
  pages.push({id:page.id,title:page.title,path:page.path,outputPath:page.outputPath,html,htmlSha256:baselineHash(html),bytes:Buffer.byteLength(html),requiredVisibleText});
 }
 check(stableJson(envelope)===before,'renderer_changed_read_only_source');
 return {version:HOSTED_BASELINE_VERSION,origin:'verified-hosted-source-local-original-renderer',renderer:{module:'src/domain/websiteBuilder.js',function:'renderWebsiteHtml',standalone:true},source,pages,draft,hostedSourceVerified:true,hostedSaved:true,accountSavedByThisTool:false,previewTransport:'Local original-renderer HTML from an authorised read-only Lab snapshot; no deployed preview route.',providerCalls:0,newNativeSignIns:0,sourceWrites:0,publication:false,genuineModelResult:false,professionalAcceptance:false,goldStandardsApproved:0};
}
