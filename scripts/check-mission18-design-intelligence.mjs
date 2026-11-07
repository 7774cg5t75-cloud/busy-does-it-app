import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {stableJson} from '../src/core/stableJson.mjs';
import {mission16Fixture} from './lib/mission16-site-fixtures.mjs';
import {applyWebsitePageChange,applyWebsiteLayoutChange,renderWebsiteHtml} from '../src/domain/websiteBuilder.js';
import {prepareWholeWebsite,prepareWholeWebsiteCreativeReview,prepareWholeWebsiteRefinement,keepWholeWebsite,isCurrentWholeWebsite,wholeWebsiteSource} from '../src/core/wholeWebsitePlan.mjs';
import {prepareWebsiteDesignIntelligence,parseWebsiteDesignIntelligenceResponse,createOfflineWebsiteDesignIntelligence,prepareWebsiteVisualReview,reviewWebsiteVisualRecommendations,WEBSITE_DESIGN_INTELLIGENCE_VERSION,WEBSITE_VISUAL_REVIEW_VERSION} from '../src/core/websiteDesignIntelligence.mjs';
import {deterministicWebsiteCreativeSpecification,validateWebsiteCreativeSpecification,websiteCreativePage} from '../supabase/functions/busy-website-worker/websiteCreativeSpecification.mjs';
let cases=0,assertions=0;
const check=new Proxy(assert,{get(target,key){return typeof target[key]==='function'?function(...args){assertions++;return target[key](...args);}:target[key];}});
async function test(name,run){await run();cases++;console.log('PASS '+name);}
const deps={pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml};
const copy=value=>JSON.parse(JSON.stringify(value));
const sha=value=>createHash('sha256').update(value).digest('hex');
function context(index=2,{sparse=false}={}){const source=mission16Fixture(index,{sparse}),review=prepareWholeWebsite(source,deps);check.equal(review.ok,true,review.reason);return {...source,website:review.candidate};}
const goal='Keep my words but redesign the whole website';
function specification(c){const result=deterministicWebsiteCreativeSpecification(c.website,goal);check.equal(result.ok,true,result.reason);return result.specification;}
function proposal(c,spec=specification(c)){return {version:WEBSITE_DESIGN_INTELLIGENCE_VERSION,scope:{ownerId:c.ownerId,businessId:c.businessId,websiteId:c.website.id,generation:c.website.generation,profileRevision:c.profileRevision},explanation:'An offline response fixture coordinating approved page openings and reading rhythm.',specification:spec};}
function fixtureService(p){return createOfflineWebsiteDesignIntelligence(()=>({origin:'deterministic-offline-fixture',proposal:p}));}
const sourceFacts=d=>JSON.stringify({sections:d.sections,theme:d.theme,pages:d.pages,customPages:d.customPages,seo:d.seo,navigation:d.navigation});

await test('six independently scoped rich/sparse sites use one original source projection, schema, renderer and sealed review',async()=>{
 for(let index=0;index<3;index++)for(const sparse of [false,true]){
  const c=context(index,{sparse}),before=sourceFacts(c.website),prepared=await prepareWebsiteDesignIntelligence(c),p=proposal(c);
  check.equal(prepared.ok,true,prepared.reason);check.equal(prepared.providerEnabled,false);check.equal(prepared.providerCalls,0);check.equal(prepared.pilot.maxGBP,0.10);check.equal(prepared.pilot.requests,1);check.equal(prepared.pilot.retries,0);check.equal(prepared.pilot.tools,0);check.equal(prepared.inputDigest,sha(stableJson(prepared.input)));
  const result=await fixtureService(p).review(prepared,()=>c,deps);check.equal(result.ok,true,result.reason);check.equal(result.modelQualityProven,false);check.equal(result.origin,'deterministic-offline-fixture');check.equal(result.review.kind,'reviewed_whole_website');check.equal(result.review.candidate.pages.length,c.website.pages.length);check.equal(sourceFacts(result.review.candidate),before);check.equal(sourceFacts(c.website),before);check.equal(result.review.candidate.generation,c.website.generation+1);
  for(const page of c.website.pages)check.ok(result.review.previews[page.id].startsWith('<!doctype html>'));
 }
});

await test('minimum source projection omits media URLs, contact details, credentials and unrelated business metadata',async()=>{
 const c=context(1),product=c.website.sections.find(section=>section.id==='products').previewFeed.records[0];
 product.data.image={uri:'https://private.example.invalid/never-send',alt:'Current illustrative image'};
 product.data.variants=[{id:'variant_test_001',label:'Approved choice',sku:'internal-only-sku',amountMinor:950}];
 c.profile.secret='synthetic-secret-never-provider';c.profile.contactNotes={customer:'private-unrelated'};
 c.profile.toneOfVoice='Warm and direct';c.profile.targetAudience='People planning a gathering';
 const r=await prepareWebsiteDesignIntelligence(c);check.equal(r.ok,true,r.reason);const input=JSON.stringify(r.input);
 for(const text of ['private.example.invalid','never-send','internal-only-sku','synthetic-secret-never-provider','private-unrelated','hello@'])check.ok(!input.includes(text));
 check.ok(input.includes('Warm and direct'));check.ok(input.includes('People planning a gathering'));check.ok(input.includes('Approved choice'));check.equal(r.input.approved.sections.find(section=>section.id==='products').records[0].revision,product.revision);
 check.equal(r.schema.additionalProperties,false);check.equal(r.schema.properties.specification.additionalProperties,false);
});

await test('invalid executable structures, unknown measures, foreign identities, omissions and duplicate page/section references fail closed',async()=>{
 const c=context(),prepared=await prepareWebsiteDesignIntelligence(c),original=proposal(c);
 const changes=[p=>{p.html='<script>bad()</script>';},p=>{p.specification.pages[0].css='body{}';},p=>{p.specification.pages[0].opening='arbitrary-css';},p=>{p.scope.businessId='foreign';},p=>{p.scope.generation++;},p=>{p.specification.pages[0].pageId='foreign';},p=>{p.specification.pages.push(copy(p.specification.pages[0]));},p=>{p.specification.pages[0].sectionOrder.pop();},p=>{p.specification.pages[0].sectionOrder[1]=p.specification.pages[0].sectionOrder[0];},p=>{p.specification.pages[0].sectionOrder.reverse();},p=>{p.specification.pages[0].sourceFacts={award:'invented'};}];
 for(const change of changes){const p=copy(original);change(p);check.equal(parseWebsiteDesignIntelligenceResponse(JSON.stringify(p),prepared,c).ok,false);}
 check.equal(parseWebsiteDesignIntelligenceResponse('{',prepared,c).ok,false);check.equal(parseWebsiteDesignIntelligenceResponse(' '.repeat(32001),prepared,c).ok,false);
});

await test('exact current source identity includes unsaved owner wording, profile contents and all approved revisions',async()=>{
 for(const mutate of [c=>{c.ownerId='foreign';},c=>{c.profileRevision++;},c=>{c.website.sections.find(section=>section.id==='hero').title='New unsaved owner wording';},c=>{c.profile.toneOfVoice='Changed unsaved tone at same revision';},c=>{c.profile.description='Unsaved owner profile correction';},c=>{c.website.customPages[0].sourceServiceSnapshot.body='Stale service';}]){
  const c=context(),prepared=await prepareWebsiteDesignIntelligence(c),p=proposal(c);mutate(c);check.equal(parseWebsiteDesignIntelligenceResponse(JSON.stringify(p),prepared,c).ok,false);
 }
});

await test('forged preparation and changed callback after review cannot acquire original source authority',async()=>{
 const c=context(),prepared=await prepareWebsiteDesignIntelligence(c),p=proposal(c);
 check.equal(parseWebsiteDesignIntelligenceResponse(JSON.stringify(p),copy(prepared),c).ok,false);
 prepared.input.goal='Changed callback';check.equal(parseWebsiteDesignIntelligenceResponse(JSON.stringify(p),prepared,c).ok,false);
 const fresh=await prepareWebsiteDesignIntelligence(c),service=createOfflineWebsiteDesignIntelligence(()=>{c.website.sections[0].title='Newer owner edit';return {origin:'deterministic-offline-fixture',proposal:p};});
 check.equal((await service.review(fresh,()=>c,deps)).ok,false);
});

await test('offline fixture origin cannot masquerade as a real model receipt and interruption never retries',async()=>{
 for(const result of [{origin:'real-model',proposal:proposal(context())},{origin:'deterministic-offline-fixture',proposal:proposal(context()),providerReceipt:'fake'}]){
  const c=context(),prepared=await prepareWebsiteDesignIntelligence(c);let calls=0;
  const service=createOfflineWebsiteDesignIntelligence(()=>{calls++;return result;});check.equal((await service.review(prepared,()=>c,deps)).ok,false);check.equal((await service.review(prepared,()=>c,deps)).ok,false);check.equal(calls,1);
 }
 const c=context(),prepared=await prepareWebsiteDesignIntelligence(c);let calls=0;const interrupted=createOfflineWebsiteDesignIntelligence(()=>{calls++;throw Error('interrupted fixture');});
 const result=await interrupted.review(prepared,()=>c,deps);check.equal(result.unknown,true);check.equal(result.mayReplay,false);check.equal((await interrupted.review(prepared,()=>c,deps)).ok,false);check.equal(calls,1);
});

await test('future site metadata, unsupported goals and missing current profile scope remain unavailable',async()=>{
 for(const mutate of [c=>{c.website.sitePresentation='future';},c=>{c.website.siteComposition='future';},c=>{c.businessId='foreign';},c=>{c.profile.businessId='foreign';},c=>{c.profileRevision=null;}]){const c=context();mutate(c);check.equal((await prepareWebsiteDesignIntelligence(c)).ok,false);}
 const c=context();check.equal((await prepareWebsiteDesignIntelligence(c,{goal:'Publish the website'})).ok,false);check.equal(prepareWholeWebsiteRefinement(c,'Invent awards and book every customer',deps).ok,false);
});

await test('original service/product and photograph authorities deny withdrawn, expired, foreign or stale relations',async()=>{
 for(const mutate of [c=>{c.website.sections.find(section=>section.id==='services').items[0].body+=' Current changed service.';},c=>{c.website.sections.find(section=>section.type==='gallery').items[0].status='withdrawn';},c=>{c.website.sections.find(section=>section.type==='gallery').items[0].expiresAt='2000-01-01T00:00:00.000Z';},c=>{c.website.sections.find(section=>section.type==='gallery').items[0].businessId='foreign';},c=>{c.website.sections.find(section=>section.id==='services').items[0].photoBinding.sha256='a'.repeat(64);},c=>{c.website.sections.find(section=>section.id==='products').previewFeed.businessId='foreign';},c=>{c.website.sections.find(section=>section.id==='products').previewFeed.records[0].data.status='archived';c.website.sections.find(section=>section.id==='products').previewFeed.records[1].data.status='archived';}]){
  const c=context(1);mutate(c);check.equal((await prepareWebsiteDesignIntelligence(c)).ok,false);
 }
});

await test('owner locks, explicit order and exact no-op denial remain enforced in original page action',()=>{
 const c=context(),spec=specification(c),action={action:'apply-site-creative-specification',expectedWebsiteId:c.website.id,expectedGeneration:c.website.generation,expectedBusinessId:c.businessId,expectedProfileRevision:c.profileRevision,specification:spec};
 const locked=copy(c.website);locked.theme.lockedSections=['hero'];check.equal(applyWebsitePageChange(locked,action).applied,false);
 const edited=applyWebsitePageChange(c.website,action);check.equal(edited.applied,true);check.equal(validateWebsiteCreativeSpecification(edited.draft,spec,{forEdit:true}).ok,false);
 const reordered=copy(spec);reordered.pages.reverse();check.equal(validateWebsiteCreativeSpecification(edited.draft,reordered,{forEdit:true}).ok,false,'Reordering metadata alone cannot produce a no-op review');
 edited.draft.theme.lockedSections=['hero'];check.ok(websiteCreativePage(edited.draft,'home'),'Adding a later lock preserves the selected design');
 const ordered=copy(c.website);ordered.theme.sectionOrder=[...ordered.pages[0].sectionIds];const moved=copy(spec);[moved.pages[0].sectionOrder[1],moved.pages[0].sectionOrder[2]]=[moved.pages[0].sectionOrder[2],moved.pages[0].sectionOrder[1]];check.equal(validateWebsiteCreativeSpecification(ordered,moved,{forEdit:true}).ok,false);
 for(const extras of [{html:'<div>'},{providerEnabled:true},{published:true}])check.equal(applyWebsitePageChange(c.website,{...action,...extras}).applied,false);
});
await test('a later original Studio section movement takes priority over saved creative ordering',()=>{
 const c=context(),spec=specification(c),review=prepareWholeWebsiteCreativeReview(c,spec,deps);check.equal(review.ok,true);
 const edited=applyWebsiteLayoutChange(review.candidate,{action:'move-relative',sectionId:'about',targetSectionId:'services',position:'before',pageId:'home'});check.equal(edited.applied,true,edited.reason);
 const current=edited.draft.pages.find(page=>page.id==='home'),creative=websiteCreativePage(edited.draft,'home');check.ok(creative);check.deepEqual(creative.sectionOrder,current.sectionIds);
 check.ok(creative.sectionOrder.indexOf('about')<creative.sectionOrder.indexOf('services'));check.equal(creative.opening,spec.pages.find(page=>page.pageId==='home').opening);
 const html=renderWebsiteHtml(edited.draft,'home',{standalone:true,privatePagePreview:true});check.ok(html.indexOf('<section id="about"')<html.indexOf('<section id="services"'),'Actual renderer respects the later original owner movement');
});

await test('one exact private Studio readback keeps the original result once without an account-save claim',async()=>{
 const c=context(),prepared=await prepareWebsiteDesignIntelligence(c),result=await fixtureService(proposal(c)).review(prepared,()=>c,deps);let state=c,calls=0;
 const kept=await keepWholeWebsite(result.review,{getContext:()=>state,apply:async action=>{calls++;const edited=applyWebsitePageChange(state.website,action);state={...state,website:edited.draft};return {...edited,localPrivateReadback:{websiteDraft:edited.draft}};}});
 check.equal(kept.ok,true,kept.reason);check.equal(kept.accountSaved,false);check.equal(kept.mayReplay,false);check.deepEqual(state.website.creativeSpecification,result.proposal.specification);check.equal(isCurrentWholeWebsite(result.review,state),false);
 check.equal((await keepWholeWebsite(result.review,{getContext:()=>state,apply:()=>{calls++;}})).ok,false);check.equal(calls,1);
});

await test('unknown save, incorrect readback and changed profile acknowledgement retain non-replay fences',async()=>{
 for(const mode of ['throw','wrong','profile']){const c=context(),r=prepareWholeWebsiteCreativeReview(c,specification(c),deps);let calls=0;
  const kept=await keepWholeWebsite(r,{getContext:()=>c,apply:async action=>{calls++;if(mode==='throw')throw Error('lost acknowledgement');const edited=applyWebsitePageChange(c.website,action);if(mode==='profile')c.profile.description='New unsaved correction';if(mode==='wrong')edited.draft.sections[0].title='Wrong readback';return {...edited,localPrivateReadback:{websiteDraft:edited.draft}};}});
  check.equal(kept.ok,false);check.equal(kept.unknown,true);check.equal(kept.mayReplay,false);check.equal((await keepWholeWebsite(r,{getContext:()=>c,apply:()=>{calls++;}})).ok,false);check.equal(calls,1);
 }
});

// Synthetic, valid PNG pixels exercise receipt tampering locally. These are
// NOT browser or aesthetic evidence; the browser workflow separately supplies
// genuine full-resolution original-renderer captures through this same API.
function syntheticPng(width=320,height=640){
 function crc(data){let value=0xffffffff;for(const byte of data){value^=byte;for(let i=0;i<8;i++)value=value&1?0xedb88320^(value>>>1):value>>>1;}return (value^0xffffffff)>>>0;}
 function chunk(type,data){const tag=Buffer.from(type),out=Buffer.alloc(12+data.length);out.writeUInt32BE(data.length);tag.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc(Buffer.concat([tag,data])),8+data.length);return out;}
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
 const pixels=Buffer.alloc(height*(1+width*3),230);for(let row=0;row<height;row++)pixels[row*(1+width*3)]=0;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
}
function visualEvidence(c,png=syntheticPng()){
 return {version:'busy.website-rendered-evidence.v1',sourceCommit:'1'.repeat(40),sourceTree:'2'.repeat(40),websiteSourceDigest:sha(wholeWebsiteSource(c)),captures:[{id:'synthetic-contract-png',pageId:'home',sha256:sha(png),browser:{name:'synthetic-contract-only',version:'not-a-browser-result'},viewport:{width:320,height:640,dpr:1},assetManifestSha256:'3'.repeat(64),kind:'actual-original-renderer'}]};
}
function recommendations(c,receipt,spec=specification(c)){
 spec={...spec,pages:spec.pages.filter(page=>page.pageId==='home')};
 return {version:WEBSITE_VISUAL_REVIEW_VERSION,origin:'deterministic-offline-fixture',sourceDigest:receipt.sourceDigest,findings:[{captureId:receipt.evidence.captures[0].id,sha256:receipt.evidence.captures[0].sha256,pageId:'home',category:'reading-measure',observation:'Synthetic receipt boundary test only; no professional visual judgement is asserted.'}],specification:spec};
}
// Dependency double for contract tests only. Actual Chromium decode is a
// mandatory, separate genuine browser-workflow check, never claimed here.
const syntheticDecode=(_png,expected)=>({decoded:true,sha256:expected.sha256,width:expected.width,height:expected.height});
function readOptions(c,png){const original=visualEvidence(c,png);return {readScreenshot:()=>({bytes:png,receipt:{version:'busy.website-capture-receipt.v1',sourceCommit:original.sourceCommit,sourceTree:original.sourceTree,websiteSourceDigest:original.websiteSourceDigest,capture:copy(original.captures[0])}}),verifyDecodedScreenshot:syntheticDecode};}

await test('screenshot reviewer binds bytes, source, browser, viewport and page, then prepares the SAME sealed Studio action',async()=>{
 const c=context(),png=syntheticPng(),evidence=visualEvidence(c,png),receipt=await prepareWebsiteVisualReview(c,evidence,readOptions(c,png));check.equal(receipt.ok,true,receipt.reason);check.equal(receipt.visionExecuted,false);check.equal(receipt.pixelsSentToModel,false);check.equal(receipt.requiresProfessionalPixelReview,true);
 const result=reviewWebsiteVisualRecommendations(receipt,recommendations(c,receipt),c,deps);check.equal(result.ok,true,result.reason);check.equal(result.review.operation.action,'apply-site-creative-specification');check.equal(result.review.kind,'reviewed_whole_website');check.equal(result.providerCalls,0);check.equal(result.modelQualityProven,false);check.equal(sourceFacts(result.review.candidate),sourceFacts(c.website));
});

await test('screenshot hashes, current source, pixel geometry and actual byte availability cannot be substituted',async()=>{
 const c=context(),png=syntheticPng();
 for(const mutate of [e=>{e.websiteSourceDigest='f'.repeat(64);},e=>{e.captures[0].sha256='f'.repeat(64);},e=>{e.captures[0].pageId='foreign';},e=>{e.captures[0].pageId='about';},e=>{e.captures[0].viewport.width=390;},e=>{e.captures[0].kind='ai-mockup';},e=>{e.captures.push(copy(e.captures[0]));},e=>{e.captures[0].browser.key='unapproved';},e=>{e.captures[0].browser.version='different-browser';},e=>{e.captures[0].assetManifestSha256='e'.repeat(64);},e=>{e.sourceCommit='e'.repeat(40);},e=>{e.sourceTree='e'.repeat(40);}]){const e=visualEvidence(c,png);mutate(e);check.equal((await prepareWebsiteVisualReview(c,e,readOptions(c,png))).ok,false);}
 check.equal((await prepareWebsiteVisualReview(c,visualEvidence(c,png),{...readOptions(c,png),readScreenshot:()=>({sha256:sha(png)})})).ok,false);
 check.equal((await prepareWebsiteVisualReview(c,visualEvidence(c,png),{...readOptions(c,png),readScreenshot:()=>new Uint8Array([1,2,3])})).ok,false);
 check.equal((await prepareWebsiteVisualReview(c,visualEvidence(c,png),{readScreenshot:()=>png})).ok,false,'PNG hash/header alone never establishes decoded pixels');
 check.equal((await prepareWebsiteVisualReview(c,visualEvidence(c,png),{...readOptions(c,png),verifyDecodedScreenshot:()=>({decoded:false})})).ok,false);
});

await test('visual findings cannot forge model origin, source, inspected page or silently redesign another page',async()=>{
 for(const mutate of [r=>{r.origin='real-model';},r=>{r.sourceDigest='f'.repeat(64);},r=>{r.findings[0].sha256='f'.repeat(64);},r=>{r.findings[0].pageId='about';},r=>{r.findings[0].category='verified-awards';},r=>{r.specification.pages.push({...r.specification.pages[0],pageId:'about',sectionOrder:['about']});}]){
  const c=context(),png=syntheticPng(),receipt=await prepareWebsiteVisualReview(c,visualEvidence(c,png),readOptions(c,png)),response=recommendations(c,receipt);mutate(response);check.equal(reviewWebsiteVisualRecommendations(receipt,response,c,deps).ok,false);
 }
});

await test('mutated visual receipt and later owner correction invalidate visual change preparation and Keep',async()=>{
 const c=context(),png=syntheticPng(),receipt=await prepareWebsiteVisualReview(c,visualEvidence(c,png),readOptions(c,png)),response=recommendations(c,receipt);
 check.equal(reviewWebsiteVisualRecommendations(copy(receipt),response,c,deps).ok,false);receipt.evidence.captures[0].viewport.width=390;check.equal(reviewWebsiteVisualRecommendations(receipt,response,c,deps).ok,false);
 const fresh=await prepareWebsiteVisualReview(c,visualEvidence(c,png),readOptions(c,png)),review=reviewWebsiteVisualRecommendations(fresh,recommendations(c,fresh),c,deps).review;check.ok(review);c.profile.toneOfVoice='New owner correction';check.equal(isCurrentWholeWebsite(review,c),false);
});
await test('visual review cannot silently remove an uninspected previous page direction',async()=>{
 const original=context(),selected=prepareWholeWebsiteCreativeReview(original,specification(original),deps);check.equal(selected.ok,true);const c={...original,website:selected.candidate},png=syntheticPng(),receipt=await prepareWebsiteVisualReview(c,visualEvidence(c,png),readOptions(c,png));check.equal(receipt.ok,true);
 const home=copy(c.website.creativeSpecification.pages.find(page=>page.pageId==='home'));home.rhythm='compact';
 const response={version:WEBSITE_VISUAL_REVIEW_VERSION,origin:'deterministic-offline-fixture',sourceDigest:receipt.sourceDigest,findings:[{captureId:receipt.evidence.captures[0].id,sha256:receipt.evidence.captures[0].sha256,pageId:'home',category:'section-rhythm',observation:'Synthetic boundary test for a current Home rhythm change.'}],specification:{version:c.website.creativeSpecification.version,pages:[home]}};
 check.equal(reviewWebsiteVisualRecommendations(receipt,response,c,deps).ok,false,'Omitted About/service directions would reset uninspected page designs');
 response.specification.pages=c.website.creativeSpecification.pages.map(page=>page.pageId==='home'?home:copy(page));check.equal(reviewWebsiteVisualRecommendations(receipt,response,c,deps).ok,true,'Unchanged directions need no fictitious extra screenshot finding');
});
console.log('PASS '+cases+' Mission18 design-intelligence cases; '+assertions+' assertions; zero failures. Offline fixtures and synthetic byte-contract tests only; no hosted, real vision, provider, spending or publication claim.');
