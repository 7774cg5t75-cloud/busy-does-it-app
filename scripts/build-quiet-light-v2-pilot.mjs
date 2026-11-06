// Offline preparation only. Both candidates use the original renderer/Studio;
// candidate-02 is an authored engineering fixture, NEVER a real-model result.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {renderWebsiteHtml} from '../src/domain/websiteBuilder.js';
import {buildPortableWebsiteSource} from '../src/core/websiteSourceExport.mjs';
import {buildStandaloneWebsiteArchive} from '../src/core/websiteStandaloneArchive.mjs';
import {websiteRequestContent} from '../src/core/websiteRequestPlan.mjs';
import {stableJson} from '../src/core/stableJson.mjs';
import {websiteCreativeDocumentSection} from '../supabase/functions/busy-website-worker/websiteCreativeDocument.mjs';
import {prepareQuietLightV2Pilot,quietLightV2DeterministicReview,reviewQuietLightV2Offline,keepQuietLightV2Locally,quietLightV2LocalHistoryEvidence,quietLightV2Digest} from './lib/quiet-light-v2-pilot.mjs';

const folder=resolve(process.argv[2]||'.test-artifacts/quiet-light-v2-pilot');mkdirSync(folder,{recursive:true});
const pilot=await prepareQuietLightV2Pilot(),before=websiteRequestContent(pilot.context.website),profile=stableJson(pilot.context.profile);
const deterministic=quietLightV2DeterministicReview(pilot.context),offline=await reviewQuietLightV2Offline(pilot);
const candidates=[{id:'candidate-01',origin:'deterministic-recommendation',review:deterministic},{id:'candidate-02',origin:'deterministic-offline-fixture',review:offline.review}];
const pages=[],sites=[];
function visibleCopy(draft,page){
 const result=[];for(const id of page.sectionIds){const section=draft.sections.find(section=>section.id===id&&section.enabled!==false);if(!section)continue;
  if(section.type==='creative-document'){const resolved=websiteCreativeDocumentSection(draft,section);assert.ok(resolved);const walk=nodes=>{for(const node of nodes){if(['heading','text','link'].includes(node.type))result.push(node.copy.text);if(node.type==='list')result.push(...node.items.map(item=>item.text));if(node.children)walk(node.children);}};walk(resolved.nodes);}
  else if(section.type==='services')for(const item of section.items)result.push(item.title,...item.body.split(/\n\s*\n/));
  else if(section.body)result.push(...section.body.split(/\n\s*\n/));
 }return result;
}
for(const candidate of candidates){
 const kept=await keepQuietLightV2Locally(candidate.review,pilot.context),draft=kept.context.website,root=join(folder,candidate.id);mkdirSync(root,{recursive:true});
 assert.deepEqual(draft.pages.map(page=>page.id),pilot.expectedPageIds);
 const sitePages=[];
 for(const page of draft.pages){
  const file=join(root,page.outputPath);mkdirSync(resolve(file,'..'),{recursive:true});
  const html=renderWebsiteHtml(draft,page.id,{standalone:true});writeFileSync(file,html);
  pages.push({candidateId:candidate.id,pageId:page.id,title:page.title,outputPath:candidate.id+'/'+page.outputPath,sha256:quietLightV2Digest(html),bytes:Buffer.byteLength(html)});
  sitePages.push({id:page.id,title:page.title,path:page.path,outputPath:page.outputPath,before:null,after:candidate.id+'/'+page.outputPath,important:true,reviewPack:true,requiredTextAfter:visibleCopy(draft,page),typographyChecks:[]});
 }
 const portable=buildPortableWebsiteSource(draft);assert.ok(portable.ok,portable.reason);assert.equal(portable.pages,3);
 const archive=await buildStandaloneWebsiteArchive(draft,{renderPage:renderWebsiteHtml,digestBytes:async bytes=>quietLightV2Digest(bytes),readPhoto:async()=>{throw Error('Image-free pilot must not access media.');},isCurrent:()=>websiteRequestContent(draft)===websiteRequestContent(kept.context.website)});assert.ok(archive.ok,archive.reason);assert.equal(archive.photos,0);assert.equal(archive.pages,3);
 writeFileSync(join(root,'portable-content.json'),portable.json+'\n');writeFileSync(join(root,'portable-website.zip'),archive.bytes);
 writeFileSync(join(root,'local-studio-readback.json'),JSON.stringify({receipt:kept.receipt,history:quietLightV2LocalHistoryEvidence(pilot.context,kept.context),websiteContentSha256:quietLightV2Digest(websiteRequestContent(draft)),archive:{pages:archive.pages,photos:archive.photos,bytes:archive.bytes.length,sha256:quietLightV2Digest(archive.bytes)},accountSaved:false,hosted:false},null,2)+'\n');
 sites.push({id:candidate.id,businessName:'Quiet Light Studio',origin:candidate.origin,sourceRichness:'rich',comparisonKind:'deterministic-recommendation-versus-declared-offline-engineering-fixture; no real-model result',approvedInputDigest:pilot.prepared.inputDigest,pages:sitePages});
}
assert.equal(websiteRequestContent(pilot.context.website),before);assert.equal(stableJson(pilot.context.profile),profile);
const write=(name,value)=>writeFileSync(join(folder,name),stableJson(value)+'\n');
write('synthetic-provider-input.json',pilot.prepared.input);write('strict-response-schema.json',pilot.projection.wire.text.format.schema);write('complete-disabled-request.json',pilot.projection.wire);write('offline-response.json',pilot.fixture.response);
write('origin-key.json',{visibility:'Withhold only from voluntary blind visual reviewers; retain permanently for honest provenance.',candidates:candidates.map(({id,origin})=>({id,origin,genuineModelResult:false})),liveModelCandidate:null,providerCalls:0});
const git=async(...args)=>(await promisify(execFile)('git',args,{encoding:'utf8'})).stdout.trim();
const sourceSha=await git('rev-parse','HEAD'),sourceTree=await git('rev-parse','HEAD^{tree}'),dirty=!!(await git('status','--porcelain'));
const report={version:pilot.version,sourceSha,sourceTree,sourceDirty:dirty,fixture:'Explicit fictional approved Mission16 Quiet source; image-free three-page scope via the original finite hide-About operation; approved story retained.',inputDigest:pilot.prepared.inputDigest,schemaDigest:pilot.projection.schemaDigest,envelopeDigest:pilot.projection.envelopeDigest,wireDigest:pilot.projection.requestDigest,sizeEvidence:pilot.sizeEvidence,limits:pilot.limits,pages,providerCalls:0,paidInference:false,accountSaved:false,publication:false,genuineModelResult:false,screenshotStatus:'not-captured-by-this-build-command',goldStandards:{references:3,approved:0},comparison:'Deterministic original recommendation versus deliberately authored OFFLINE v2 engineering fixture. Neither fixture validity nor visual difference establishes real model creativity.',futureLiveRequirements:['Fresh actual Lab source/membership and original immutable binding.','One independently approved exact complete request and compatible token-count evidence.','Verified account availability, current all-in GBP tariff, original reservation/readback and one-use owner approval.','Distinct server-only dispatch/real settlement receipt; no retries or fallback.','Only after receipt/source validation: original review, no automatic save/publication.','Same-source original-renderer mobile/desktop captures and separately recorded blind visual judgement.']};
write('manifest.json',report);console.log(JSON.stringify({ok:true,folder,sourceSha,sourceTree,sourceDirty:dirty,pages:pages.length,sizeEvidence:pilot.sizeEvidence,providerCalls:0,genuineModelResult:false}));
write('scenarios.json',{mission:'quiet-light-v2-pilot',tag:'offline-engineering-only',source:{commit:sourceSha,tree:sourceTree},sourceSha,sourceTree,sourceDirty:dirty,inputDigest:pilot.prepared.inputDigest,generatedBy:'Original buildWebsiteDraft → approved source → original finite recommender / expressive v2 review → original local Keep/readback → renderWebsiteHtml/export. No handwritten business HTML, live model or second renderer.',comparisonProvenance:report.comparison,assets:[],sites,typographyControls:[],providerCalls:0,genuineModelResult:false,professionalAcceptance:false});
