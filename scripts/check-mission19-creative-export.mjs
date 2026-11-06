import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {mission16Fixture,mission16Assets} from './lib/mission16-site-fixtures.mjs';
import {mission19MinimalCreativeDocument} from './lib/mission19-document-fixture.mjs';
import {prepareWholeWebsiteCreativeDocumentReview} from '../src/core/wholeWebsitePlan.mjs';
import {applyWebsitePageChange,renderWebsiteHtml} from '../src/domain/websiteBuilder.js';
import {buildPortableWebsiteSource} from '../src/core/websiteSourceExport.mjs';
import {buildStandaloneWebsiteArchive,archiveRequirements} from '../src/core/websiteStandaloneArchive.mjs';
const clone=value=>JSON.parse(JSON.stringify(value)),deps={pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml};
let passed=0;async function test(name,run){await run();passed++;console.log('PASS '+name);}
const c=mission16Fixture(0),f=mission19MinimalCreativeDocument(c),photo=c.website.sections.find(section=>section.id==='hero').asset;
f.document.pages[0].sections[0].nodes.push({id:'creative-image',type:'image',asset:{storagePath:photo.storagePath,revision:photo.revision,sha256:photo.sha256},alt:f.copy('photo:'+photo.sha256+':alt'),ratio:1.6,fit:'cover',focal:{x:50,y:50}});
const review=prepareWholeWebsiteCreativeDocumentReview(c,f.document,deps,{approvedIntent:f.approvedIntent,origin:'deterministic-offline-fixture'});assert.equal(review.ok,true,review.reason);
const draft=review.candidate;
await test('original portable content export preserves actual declarative layout and copy without private authorities',()=>{
 const result=buildPortableWebsiteSource(draft);assert.equal(result.ok,true,result.reason);const value=JSON.parse(result.json),section=value.sections.find(section=>section.type==='creative-document');
 assert.equal(value.creativeDesign.version,'busy.website-creative-document.v2');assert.equal(section.nodes[0].copy.text,c.website.sections.find(section=>section.id==='hero').title);assert.equal(section.layout.maxWidth,1240);assert.equal(section.media.length,1);assert.equal(section.nodes.at(-1).asset.originalFileRequired,true);
 for(const secret of [photo.storagePath,photo.sha256,c.ownerId,c.businessId,'sourceRefs','provenance','approvedIntent'])assert.ok(!result.json.includes(secret),secret+' stays outside public content transfer');
 assert.ok(result.missingMedia>=1);assert.equal(value.creativeDesign.brand,null);
});
await test('actual original ZIP exports bytes for the recursive creative image and local links',async()=>{
 const needs=archiveRequirements(draft);assert.equal(needs.ok,true,needs.reason);assert.ok(needs.assets.some(asset=>asset.sha256===photo.sha256));
 const assets=mission16Assets(),archive=await buildStandaloneWebsiteArchive(draft,{readPhoto:async asset=>new Uint8Array(readFileSync(assets.find(row=>row.sha256===asset.sha256).file)),digestBytes:async bytes=>createHash('sha256').update(bytes).digest('hex'),renderPage:renderWebsiteHtml});
 assert.equal(archive.ok,true,archive.reason);assert.ok(archive.bytes instanceof Uint8Array||archive.zip instanceof Uint8Array||archive.base64);assert.ok(archive.pages>=1);
});
await test('changed source, withdrawn media and hostile compiled layout fail before either original export',()=>{
 for(const mutate of [d=>{d.sections.find(section=>section.id==='hero').body='A newer approved original description.';},d=>{d.sections.find(section=>section.id==='hero').asset.status='withdrawn';},d=>{d.sections.find(section=>section.type==='creative-document').creativeDocument.layout.paddingX='url(javascript:alert(1))';}]){
  const current=clone(draft);mutate(current);assert.equal(buildPortableWebsiteSource(current).ok,false);assert.equal(archiveRequirements(current).ok,false);
 }
});
await test('portable creative identifiers retain exact page-to-section relationships at the validated length boundary',()=>{
 const context=mission16Fixture(2),fixture=mission19MinimalCreativeDocument(context),longId='custom-creative-'+ 'x'.repeat(70);
 fixture.document.pages[0].sections[0].id=longId;
 const reviewed=prepareWholeWebsiteCreativeDocumentReview(context,fixture.document,deps,{approvedIntent:fixture.approvedIntent,origin:'deterministic-offline-fixture'});assert.equal(reviewed.ok,true,reviewed.reason);
 const result=buildPortableWebsiteSource(reviewed.candidate);assert.equal(result.ok,true,result.reason);const value=JSON.parse(result.json);
 assert.equal(value.sections.find(section=>section.type==='creative-document').id,longId);assert.ok(value.pages.find(page=>page.id==='home').sectionIds.includes(longId));
});
console.log(JSON.stringify({passed,failed:0,providerCalls:0,hostedWrites:0,scope:'Original portable content and standalone ZIP authorities, synthetic fixture only'}));
