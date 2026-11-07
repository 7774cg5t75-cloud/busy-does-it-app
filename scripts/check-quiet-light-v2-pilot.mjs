import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyWebsitePageChange,renderWebsiteHtml,applyStructuredWebsiteEdit} from '../src/domain/websiteBuilder.js';
import {keepWholeWebsite} from '../src/core/wholeWebsitePlan.mjs';
import {parseWebsiteCreativeDocumentResponse,reviewWebsiteCreativeDocumentProposal} from '../src/core/websiteCreativeDocumentReview.mjs';
import {websiteRequestContent} from '../src/core/websiteRequestPlan.mjs';
import {buildPortableWebsiteSource} from '../src/core/websiteSourceExport.mjs';
import {buildStandaloneWebsiteArchive} from '../src/core/websiteStandaloneArchive.mjs';
import {stableJson} from '../src/core/stableJson.mjs';
import {prepareQuietLightV2Pilot,quietLightV2PilotContext,quietLightV2DeterministicReview,reviewQuietLightV2Offline,keepQuietLightV2Locally,quietLightV2LocalHistoryEvidence,quietLightV2Digest} from './lib/quiet-light-v2-pilot.mjs';

let cases=0,assertions=0;
const check=new Proxy(assert,{get(object,key){return typeof object[key]==='function'?function(...args){assertions++;return object[key](...args);}:object[key];}});
const test=async(name,run)=>{await run();cases++;console.log('PASS '+name);};
const clone=value=>JSON.parse(JSON.stringify(value)),deps={pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml};
const pilot=await prepareQuietLightV2Pilot(),original=websiteRequestContent(pilot.context.website),profile=stableJson(pilot.context.profile);

await test('three purposeful original pages retain all approved facts and owner action',()=>{
 check.deepEqual(pilot.context.website.pages.map(page=>page.id),['home','services','contact']);check.deepEqual(pilot.fixture.response.document.pages.map(page=>[page.pageId,page.purpose]),[['home','home'],['services','services'],['contact','contact']]);
 check.equal(pilot.context.website.sections.find(section=>section.id==='about').body,pilot.context.profile.about);check.equal(pilot.context.website.sections.find(section=>section.id==='about').enabled,false);check.equal(pilot.context.website.sections.find(section=>section.id==='services').items.length,3);
 check.deepEqual(pilot.prepared.input.approved.copyCatalog.sources.filter(row=>row.ownerProtected).map(row=>row.id),['section:hero:cta']);check.equal(pilot.fixture.response.document.imageBriefs.length,0);check.equal(pilot.context.sourcePhotos.length,0);
});
await test('repeated offline source preparation has exact stable wire and source digests',async()=>{
 const repeated=await prepareQuietLightV2Pilot();check.equal(repeated.prepared.inputDigest,pilot.prepared.inputDigest);check.equal(repeated.projection.schemaDigest,pilot.projection.schemaDigest);check.equal(repeated.projection.requestDigest,pilot.projection.requestDigest);check.equal(stableJson(repeated.fixture.response),stableJson(pilot.fixture.response));check.equal(repeated.context.website.id,'website-quiet-light-v2-offline-source');
});
await test('exact complete request includes unchanged source, instructions and full strict recursive schema',()=>{
 const p=pilot.projection;check.equal(p.inputDigest,pilot.prepared.inputDigest);check.equal(p.requestDigest,quietLightV2Digest(stableJson(p.wire)));check.equal(p.schemaDigest,quietLightV2Digest(stableJson(p.wire.text.format.schema)));check.equal(p.wire.input,stableJson(pilot.prepared.input));check.ok(p.wire.text.format.schema.$defs);check.equal(p.wire.text.format.strict,true);check.equal(p.wire.store,false);check.deepEqual(p.wire.tools,[]);check.equal(p.wire.tool_choice,'none');check.equal(p.wire.max_output_tokens,4000);
 check.equal(p.dispatchAllowed,false);check.equal(p.providerCalls,0);check.equal(p.maySave,false);check.equal(p.mayPublish,false);check.equal(pilot.limits.maximumGBP,.10);check.equal(pilot.limits.requests,1);check.equal(pilot.limits.retries,0);check.equal(pilot.limits.fallbacks,0);
});
await test('model input omits contact values and private/real media while retaining supported action',()=>{
 const input=stableJson(pilot.prepared.input);check.ok(!input.includes(pilot.context.profile.email));check.ok(!input.includes('@'));check.ok(!input.includes('BUSY_OPENAI_CREATIVE_PILOT_KEY'));check.deepEqual(pilot.prepared.input.approved.photos,[]);check.equal(pilot.prepared.input.approved.contact.hasEmail,true);check.ok(input.includes('Discuss your project'));check.ok(input.includes('Brand direction'));
});
await test('byte evidence remains explicitly unverified token/three-page total-output fit',()=>{
 const evidence=pilot.sizeEvidence;check.equal(evidence.completeWire.bytes,Buffer.byteLength(stableJson(pilot.projection.wire)));check.equal(evidence.strictSchema.bytes,Buffer.byteLength(stableJson(pilot.projection.wire.text.format.schema)));check.equal(evidence.validOfflineResponse.bytes,Buffer.byteLength(stableJson(pilot.fixture.response)));check.equal(evidence.compatibleCompleteRequestTokens,null);check.equal(evidence.providerOutputTokens,null);check.equal(evidence.completeInputFit,'not-established');check.equal(evidence.threePageOutputFit,'not-established');check.match(evidence.reason,/include reasoning/);
});
await test('deterministic candidate and offline fixture use identical source, permitted facts and original renderer',async()=>{
 const a=quietLightV2DeterministicReview(pilot.context),b=await reviewQuietLightV2Offline(pilot);check.equal(a.creativeDirection.origin,'deterministic-recommendation');check.equal(b.origin,'deterministic-offline-fixture');check.equal(b.modelQualityProven,false);check.equal(b.providerCalls,0);
 const keptA=await keepQuietLightV2Locally(a,pilot.context),keptB=await keepQuietLightV2Locally(b.review,pilot.context);check.equal(keptA.receipt.accountSaved,false);check.equal(keptB.receipt.accountSaved,false);check.equal(keptA.receipt.dispatches,1);check.equal(keptB.receipt.dispatches,1);check.equal(websiteRequestContent(pilot.context.website),original);check.equal(stableJson(pilot.context.profile),profile);
 for(const kept of [keptA,keptB])for(const page of kept.context.website.pages){const html=renderWebsiteHtml(kept.context.website,page.id,{standalone:true});check.ok(html.startsWith('<!doctype html>'));check.equal((html.match(/<h1\b/g)||[]).length,1);check.match(html,/Skip to content/);check.match(html,/<meta name="description"/);check.ok(!/<script\b|<iframe\b/i.test(html));check.ok(!html.includes(pilot.context.ownerId));}
 check.notEqual(renderWebsiteHtml(keptA.context.website,'home',{standalone:true}),renderWebsiteHtml(keptB.context.website,'home',{standalone:true}));check.ok(renderWebsiteHtml(keptB.context.website,'home',{standalone:true}).includes('Discuss your project'));
 check.equal((await keepWholeWebsite(b.review,{getContext:()=>pilot.context,apply:()=>{throw Error('A consumed review cannot dispatch twice.');}})).ok,false);
});
await test('real-model origin cannot be fabricated from the offline engineering fixture',async()=>{
 const p=await prepareQuietLightV2Pilot(),result=await reviewWebsiteCreativeDocumentProposal(p.prepared,stableJson(p.fixture.response),p.context,deps,{origin:'real-model'});check.equal(result.ok,false);check.equal(result.providerCalls||0,0);check.match(result.reason,/origin|provider|receipt|review/i);
});
await test('fresh source and exact owner identity are required after preparation',()=>{
 for(const change of [c=>{c.ownerId='foreign-owner';},c=>{c.businessId='foreign-business';},c=>{c.profileRevision++;},c=>{c.profile.toneOfVoice='New owner correction';},c=>{c.website.sections.find(s=>s.id==='hero').title='New unsaved headline';}]){const current=clone(pilot.context);change(current);check.equal(parseWebsiteCreativeDocumentResponse(stableJson(pilot.fixture.response),pilot.prepared,current).ok,false);}
});
await test('owner CTA wording and destination cannot be silently replaced',()=>{
 for(const alter of [node=>{node.copy.text='Get in touch';},node=>{node.target.pageId='services';}]){const response=clone(pilot.fixture.response),walk=nodes=>{for(const node of nodes){if(node.type==='link'&&node.copy.text==='Discuss your project')alter(node);if(node.children)walk(node.children);}};for(const page of response.document.pages)for(const section of page.sections)walk(section.nodes);check.equal(parseWebsiteCreativeDocumentResponse(stableJson(response),pilot.prepared,pilot.context).ok,false);}
});
await test('missing sources, invented claims, executable nodes and foreign contact cannot enter the renderer',()=>{
 const changes=[r=>{r.document.pages[0].sections[0].nodes[0].copy.sourceRefs[0].revision++;},r=>{r.document.pages[0].sections[0].nodes[0].copy={text:'Award-winning creative experts since 2001.',classification:'derived',sourceRefs:[{id:'business:description',revision:pilot.context.website.generation}]};},r=>{r.document.pages[0].sections[0].nodes.push({id:'attack',type:'html',html:'<script>alert(1)</script>'});},r=>{r.document.pages[0].sections[0].nodes.push({id:'attack',type:'link',copy:{text:'A project conversation',classification:'derived',sourceRefs:[{id:'business:description',revision:pilot.context.website.generation}]},target:{pageId:'https://foreign.example.invalid',sectionId:null,contactField:null},presentation:'button'});}];for(const change of changes){const response=clone(pilot.fixture.response);change(response);check.equal(parseWebsiteCreativeDocumentResponse(stableJson(response),pilot.prepared,pilot.context).ok,false);}
});
await test('complete valid response and exact portable three-page export preserve the reviewed design',async()=>{
 const p=await prepareQuietLightV2Pilot();check.equal(parseWebsiteCreativeDocumentResponse(stableJson(p.fixture.response),p.prepared,p.context).ok,true);const result=await reviewQuietLightV2Offline(p),kept=await keepQuietLightV2Locally(result.review,p.context),draft=kept.context.website;
 const portable=buildPortableWebsiteSource(draft);check.equal(portable.ok,true);check.equal(portable.pages,3);check.equal(portable.json.includes(p.context.ownerId),false);check.equal(portable.json.includes(p.context.businessId),false);check.deepEqual(JSON.parse(portable.json).creativeDesign.brand,p.fixture.response.document.brand);
 const archive=await buildStandaloneWebsiteArchive(draft,{renderPage:renderWebsiteHtml,digestBytes:async bytes=>quietLightV2Digest(bytes),readPhoto:async()=>{throw Error('No image access for this pilot.');},isCurrent:()=>true});check.equal(archive.ok,true);check.equal(archive.photos,0);check.equal(archive.pages,3);check.ok(archive.bytes.length>0);
});
await test('original local scoped history restores all three exact pages through Undo and Redo',async()=>{
 const p=await prepareQuietLightV2Pilot(),review=await reviewQuietLightV2Offline(p),kept=await keepQuietLightV2Locally(review.review,p.context),history=quietLightV2LocalHistoryEvidence(p.context,kept.context);check.equal(history.undo,true);check.equal(history.redo,true);check.equal(history.exactPageRendering,true);check.equal(history.monotonicRevisions,true);check.equal(history.publicStatusPreserved,true);check.equal(history.foreignOwnerDenied,true);check.equal(history.hosted,false);
});
await test('original owner correction makes a prepared design stale and cannot be cleared by a late Keep',async()=>{
 const p=await prepareQuietLightV2Pilot(),result=await reviewQuietLightV2Offline(p),edited=applyStructuredWebsiteEdit(p.context.website,{sectionId:'hero',field:'title',value:'My exact new unsaved owner headline'});check.equal(edited.applied,true);let calls=0;const kept=await keepWholeWebsite(result.review,{getContext:()=>({...p.context,website:edited.draft}),apply:()=>{calls++;throw Error('Must fail before writing.');}});check.equal(kept.ok,false);check.equal(calls,0);check.equal(edited.draft.sections.find(section=>section.id==='hero').title,'My exact new unsaved owner headline');
});
await test('unknown original Keep outcome consumes the approval and never replays',async()=>{
 const context=quietLightV2PilotContext(),review=quietLightV2DeterministicReview(context);let calls=0;const apply=()=>{calls++;throw Error('Synthetic lost acknowledgement');};const first=await keepWholeWebsite(review,{getContext:()=>context,apply}),second=await keepWholeWebsite(review,{getContext:()=>context,apply});check.equal(first.ok,false);check.equal(first.unknown,true);check.equal(first.mayReplay,false);check.equal(second.ok,false);check.equal(calls,1);
});
await test('pilot helper has no provider transport, key binding, installation or automatic save authority',()=>{
 const source=readFileSync(new URL('./lib/quiet-light-v2-pilot.mjs',import.meta.url),'utf8');check.ok(!/\bfetch\s*\(|Deno\.env|process\.env|api\.openai\.com|apply_migration|execute_sql/.test(source));check.equal(pilot.dispatchAllowed,false);check.equal(pilot.providerCalls,0);check.equal(pilot.paidInference,false);check.equal(pilot.accountSaved,false);check.equal(pilot.publication,false);check.equal(pilot.labInstallationRequired,true);
});
console.log(JSON.stringify({ok:true,cases,assertions,failed:0,providerCalls:0,paidInference:false,liveModelResult:false,sizeEvidence:pilot.sizeEvidence}));
