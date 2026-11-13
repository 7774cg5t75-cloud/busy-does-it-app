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
const zipEntries=bytes=>{
 const files=new Map(),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),decoder=new TextDecoder();let offset=0;
 while(offset+30<=bytes.length&&view.getUint32(offset,true)===0x04034b50){
  const size=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true),start=offset+30+nameLength+extraLength;
  assert.ok(start+size<=bytes.length);files.set(decoder.decode(bytes.subarray(offset+30,offset+30+nameLength)),bytes.slice(start,start+size));offset=start+size;
 }
 return files;
};
function allPageImageFreeFixture(){
 const context=mission16Fixture(0),fixture=mission19MinimalCreativeDocument(context),template=fixture.document.pages[0];
 // Engineering fixture only: every original route explicitly chooses reviewed
 // source-grounded text. Original fact/photo sections remain for provenance.
 fixture.document.pages=context.website.pages.map((page,index)=>{
  const result=clone(template);result.pageId=page.id;result.purpose=['home','about','contact','services'].includes(page.id)?page.id:'information';
  result.sections[0].id='custom-creative-noimage-'+index;for(const node of result.sections[0].nodes)node.id='page-'+index+'-'+node.id;return result;
 });
 const review=prepareWholeWebsiteCreativeDocumentReview(context,fixture.document,deps,{approvedIntent:fixture.approvedIntent,origin:'deterministic-offline-fixture'});assert.equal(review.ok,true,review.reason);
 return {context,draft:review.candidate};
}
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
await test('an approved image-free five-page document exports no retained unused photograph bytes while legacy selection is unchanged',async()=>{
 const {context,draft:current}=allPageImageFreeFixture();assert.equal(current.pages.length,5);
 assert.ok(current.sections.some(section=>section.asset),'Original facts and media authority remain in the draft');
 for(const page of current.pages){assert.ok(page.sectionIds.every(id=>current.sections.find(section=>section.id===id)?.type==='creative-document'));assert.equal((renderWebsiteHtml(current,page.id,{standalone:true}).match(/<img\b/g)||[]).length,0);}
 const needs=archiveRequirements(current);assert.equal(needs.ok,true,needs.reason);assert.equal(needs.assets.length,0);
 let reads=0;const result=await buildStandaloneWebsiteArchive(current,{readPhoto:async()=>{reads++;throw Error('Unselected media must not be read');},renderPage:renderWebsiteHtml});
 assert.equal(result.ok,true,result.reason);assert.equal(result.photos,0);assert.equal(reads,0);
 const files=zipEntries(result.bytes);assert.ok(![...files.keys()].some(path=>path.startsWith('assets/')));assert.equal(JSON.parse(new TextDecoder().decode(files.get('EXPORT-MANIFEST.json'))).photos,0);
 for(const page of current.pages)assert.equal((new TextDecoder().decode(files.get(page.outputPath)).match(/<img\b/g)||[]).length,0);
 // Portable editable source may retain public source facts/media inventories;
 // that does not authorise reading/bundling unselected files in a static site.
 const portable=buildPortableWebsiteSource(current);assert.equal(portable.ok,true,portable.reason);assert.ok(JSON.parse(portable.json).sections.some(section=>section.id==='hero'));
 const legacyNeeds=archiveRequirements(context.website);assert.equal(legacyNeeds.ok,true,legacyNeeds.reason);assert.deepEqual(legacyNeeds.assets.map(asset=>asset.storagePath),['approved/mission16/garden-path.jpg','approved/mission16/patio']);
 const assets=mission16Assets(),legacy=await buildStandaloneWebsiteArchive(context.website,{readPhoto:async asset=>new Uint8Array(readFileSync(assets.find(row=>row.sha256===asset.sha256).file)),digestBytes:async bytes=>createHash('sha256').update(bytes).digest('hex'),renderPage:renderWebsiteHtml});assert.equal(legacy.ok,true,legacy.reason);assert.equal(legacy.photos,2);
});
await test('a stale v2 canonical page binding cannot widen the selected archive assets',async()=>{
 const {draft:current}=allPageImageFreeFixture();current.pages[0].sectionIds.push('hero');
 assert.equal(archiveRequirements(current).ok,false);let reads=0;const result=await buildStandaloneWebsiteArchive(current,{readPhoto:async()=>{reads++;throw Error('No stale selection reads');},renderPage:renderWebsiteHtml});assert.equal(result.ok,false);assert.equal(reads,0);assert.match(result.reason,/page selection/);
});
console.log(JSON.stringify({passed,failed:0,providerCalls:0,hostedWrites:0,scope:'Original portable content and standalone ZIP authorities, synthetic fixture only'}));
