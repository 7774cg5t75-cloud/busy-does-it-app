import {renderWebsiteCreativeDocument,websiteCreativeDocumentSite,websiteCreativeDocumentCss,websiteCreativeDocumentUnavailableHtml} from '../supabase/functions/busy-website-worker/websiteCreativeDocumentRendering.mjs';
import {deterministicWebsiteCreativeSpecification} from '../supabase/functions/busy-website-worker/websiteCreativeSpecification.mjs';
import {creativeWebsiteClasses,creativeWebsiteOrder,creativeWebsiteCss} from '../supabase/functions/busy-website-worker/websiteCreativeRendering.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildWebsiteDraft,applyWebsitePageChange,renderWebsiteHtml} from '../src/domain/websiteBuilder.js';
import {websitePageHeadingHierarchy} from '../supabase/functions/busy-website-worker/websitePageGuide.mjs';
import {websiteInnerPageHtml,websiteInnerPageCss} from '../supabase/functions/busy-website-worker/websiteInnerPages.mjs';
import {stripTypeScriptTypes} from 'node:module';
import {originalWebsiteSectionRuntime} from './lib/original-website-section-runtime.mjs';
import {pageDirectionClass,craftedPage} from '../supabase/functions/busy-website-worker/websiteCraftedPage.mjs';
import {designForWebsite,designCss} from '../supabase/functions/busy-website-worker/designSystem.mjs';
import {planWebsiteDesign} from '../supabase/functions/busy-website-worker/designPlanner.mjs';
import {responsivePhotoAttributes} from '../supabase/functions/busy-website-worker/websiteResponsivePhotos.mjs';
import {websiteGalleryPresentation,websiteAssetAvailable} from '../supabase/functions/busy-website-worker/websitePhotoPresentation.mjs';
import {websitePageGuide} from '../supabase/functions/busy-website-worker/websitePageGuide.mjs';
import {renderWebsiteSiteNavigation} from '../supabase/functions/busy-website-worker/websiteSiteNavigation.mjs';
import {prepareWholeWebsite} from '../src/core/wholeWebsitePlan.mjs';
import {mission16Fixture} from './lib/mission16-site-fixtures.mjs';
import {websiteMovementOptions,resolveWebsiteMovement} from '../src/core/websiteVisualMovement.mjs';
import {compileWebsiteCreativeDocument} from '../supabase/functions/busy-website-worker/websiteCreativeDocument.mjs';
import {mission19MinimalCreativeDocument} from './lib/mission19-document-fixture.mjs';
import {rebuildPrivateWebsiteDraft} from '../src/domain/websiteBuilder.js';
const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const workerSource=readFileSync('supabase/functions/busy-website-worker/index.ts','utf8');
const fragment=(first,last)=>{const start=workerSource.indexOf('function '+first+'('),end=workerSource.indexOf(last,start);assert.ok(start>=0&&end>start);return workerSource.slice(start,end);};
const workerCode=stripTypeScriptTypes(fragment('pageSeo','function renderSectionHtml(')+fragment('relativePageHref','function renderWebsiteHtml(')+fragment('renderWebsiteHtml','async function ensureBucket('));
const workerDeps={renderWebsiteCreativeDocument,websiteCreativeDocumentSite,websiteCreativeDocumentCss,websiteCreativeDocumentUnavailableHtml,creativeWebsiteClasses,creativeWebsiteOrder,creativeWebsiteCss,renderSectionHtml:originalWebsiteSectionRuntime(),safeArray:value=>Array.isArray(value)?value:[],clean:value=>typeof value==='string'?value.trim():'',escapeHtml:escape,pageDirectionClass,craftedPage,designForWebsite,designCss,planWebsiteDesign,websiteGalleryPresentation,websitePageGuide,websitePageHeadingHierarchy,renderWebsiteSiteNavigation,responsivePhotoAttributes,websiteAssetAvailable,urlForAsset:(asset,urls)=>websiteAssetAvailable(asset)?urls[asset?.storagePath]||'':''};
const worker=Function(...Object.keys(workerDeps),workerCode+';return renderWebsiteHtml;')(...Object.values(workerDeps));
let cases=0;
for(const [businessType,family] of [['Landscaping','split-editorial'],['Festival catering','story-spread'],['Creative studio','typography-first']]){
 let draft=buildWebsiteDraft({brandBrain:{websiteBrief:{businessName:'Fictional '+businessType,businessType,serviceArea:'Devon',description:'Approved business introduction.',about:'Approved business story.',email:'owner@example.invalid',services:[{id:'care',name:'Garden maintenance',description:'Owner supplied service.'}]}}});
 draft={...draft,siteComposition:'connected-pages-v1',theme:{...draft.theme,heroComposition:family,heroVariation:'atelier'}};
 const created=applyWebsitePageChange(draft,{action:'create-page',title:'Garden maintenance',body:'Exact owner introduction.\n\nExact owner working method.'});assert.equal(created.applied,true);draft=created.draft;
 const page=draft.pages.find(p=>p.id==='page-garden-maintenance'),before=JSON.stringify(draft),html=renderWebsiteHtml(draft,page.id,{standalone:true});
 assert.equal(JSON.stringify(draft),before);assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.match(html,/<h1>Garden maintenance<\/h1>/);assert.match(html,/class="inner-page-lead"[^>]*>Exact owner introduction\.<\/p>/);
 const main=html.split('<main id="main">')[1].split('</main>')[0];assert.equal(main.split('Exact owner introduction.').length-1,1);assert.equal(main.split('Exact owner working method.').length-1,1);
 const deployed=worker(draft,{},page,'synthetic-deployment');assert.equal((deployed.match(/<h1\b/g)||[]).length,1);assert.equal(JSON.stringify(draft),before);assert.equal(deployed.match(/<section class="inner-page-opening"[\s\S]*?<\/section>/)?.[0],html.match(/<section class="inner-page-opening"[\s\S]*?<\/section>/)?.[0]);assert.equal(deployed.match(/<section class="inner-page-next"[\s\S]*?<\/section>/)?.[0],html.match(/<section class="inner-page-next"[\s\S]*?<\/section>/)?.[0]);assert.match(deployed,/class="wrap nav-wrap"/);
 assert.match(html,/role="navigation" aria-label="Breadcrumb"/);assert.match(html,/href="\.\.\/\.\.\/index.html"/);assert.match(html,/aria-current="page" href="\.\.\/\.\.\/pages\/garden-maintenance\/index.html"/);
 assert.match(html,/class="inner-page-next"/);assert.match(html,/href="\.\.\/\.\.\/services\/index.html"/);assert.match(html,/href="\.\.\/\.\.\/contact\/index.html"/);assert.match(renderWebsiteHtml(draft,'contact',{standalone:true}),/mailto:owner@example.invalid/);
 const home=renderWebsiteHtml(draft,'home',{standalone:true});assert.ok(!home.includes('<section class="inner-page-opening"'));assert.ok(!home.includes('<section class="inner-page-next"'));
 // Explicit owner formatting remains in its section instead of being lifted.
 const formatted=structuredClone(draft),first=formatted.sections.find(s=>s.id===page.sectionIds[0]);first.appearance={readingLayout:'chapters'};const formattedHtml=renderWebsiteHtml(formatted,page.id,{standalone:true});assert.ok(!formattedHtml.includes('class="inner-page-lead"'));assert.match(formattedHtml,/Exact owner introduction/);
 // A photograph relationship never becomes an inferred page-opening image.
 const paired=structuredClone(draft);paired.sections.find(s=>s.id===page.sectionIds[0]).storyPhoto={storagePath:'not-an-authorised-image'};const pairedHtml=renderWebsiteHtml(paired,page.id,{standalone:true});assert.ok(!pairedHtml.includes('class="inner-page-lead"'));assert.ok(!pairedHtml.includes('<img src="not-an-authorised-image"'));
 cases++;
}
const source=buildWebsiteDraft({brandBrain:{websiteBrief:{businessName:'Fictional business',businessType:'Creative studio',description:'Approved text.',email:'owner@example.invalid'}}});
let editable=applyWebsitePageChange(source,{action:'create-page',title:'Owner workshop',body:'Exact owner introduction.'}).draft;
const editablePageId=editable.customPages.at(-1).id;
editable=applyWebsitePageChange(editable,{action:'add-page-section',pageId:editablePageId,title:'Owner working method',body:'Exact owner method.'}).draft;
const editablePage=editable.pages.find(p=>p.id===editablePageId),editableFirst=editablePage.sectionIds[0],editableLast=editablePage.sectionIds.at(-1),editableHtml=renderWebsiteHtml(editable,editablePageId,{editablePreview:true}),editableOptions=websiteMovementOptions(editable,editablePageId,'current-source',editableHtml);
assert.ok(editableHtml.includes('<section class="inner-page-opening" id="'+editableFirst+'" data-busy-edit-section="'+editableFirst+'" data-busy-edit-field="section"'));
assert.ok(editableHtml.includes('<h1 data-busy-edit-section="'+editableFirst+'" data-busy-edit-field="title"'));
assert.ok(editableHtml.includes('<p class="inner-page-lead" data-busy-edit-section="'+editableFirst+'" data-busy-edit-field="body"'));
assert.ok(resolveWebsiteMovement(editable,editablePageId,'current-source',{channel:editableOptions.channel,sourceKey:editableOptions.sourceKey,sectionId:editableLast,targetSectionId:editableFirst,position:'before'},editableHtml));
// The genuine multi-page generator chooses an editorial intro appearance.
// That finite default must not repeat the auto page title as another heading.
const legacyStudioContext=mission16Fixture(2);legacyStudioContext.website.theme.lockedSections=['hero'];
// A protected original hero retains the M16 presentation/storage contract;
// reviewed purposeful-v1 rendering is exercised separately by Mission17.
const studio=prepareWholeWebsite(legacyStudioContext,{pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml});assert.equal(studio.ok,true);
const studioPage=studio.candidate.pages.find(p=>p.sourceServiceId==='service-0'),studioHtml=renderWebsiteHtml(studio.candidate,studioPage.id,{standalone:true});assert.equal((studioHtml.match(/>Brand direction<\/h[12]>/g)||[]).length,1);assert.match(studioHtml,/class="inner-page-lead"/);assert.equal((studioHtml.split('<main id="main">')[1].split('</main>')[0].match(/Find a clear starting point/g)||[]).length,1);
const studioOwner=structuredClone(studio.candidate),studioFirst=studioOwner.sections.find(s=>s.id===studioPage.sectionIds[0]);studioFirst.appearance.titleFont='serif';const styledStudio=renderWebsiteHtml(studioOwner,studioPage.id,{standalone:true});assert.match(styledStudio,/owner-text-titleFont-serif/);assert.ok(!styledStudio.includes('class="inner-page-lead"'));assert.match(styledStudio,/<h2>Brand direction<\/h2>/);
let many={...source,siteComposition:'connected-pages-v1'};for(let i=1;i<=6;i++)many=applyWebsitePageChange(many,{action:'create-page',title:'Approved page '+i,body:'Approved owner text '+i+'.'}).draft;
const nav=renderWebsiteHtml(many,'home',{standalone:true});assert.match(nav,/<details class="nav-mobile-details"><summary>Menu/);assert.match(nav,/class="nav-links nav-long-desktop"/);assert.equal((nav.match(/id="nav/g)||[]).length,0);assert.match(websiteInnerPageCss,/min-height:48px/);
const photoDraft=applyWebsitePageChange({...source,siteComposition:'connected-pages-v1'},{action:'create-page',title:'Garden detail',body:'Exact approved service explanation.'}).draft;
const photoPage=photoDraft.pages.find(p=>p.id==='page-garden-detail'),photoSection=photoDraft.sections.find(s=>s.id===photoPage.sectionIds[0]);
photoSection.type='photo-feature';photoSection.asset={approved:true,storagePath:'approved/detail.jpg',uri:'https://assets.example.invalid/detail.jpg',alt:'Licensed garden illustration, not completed customer work',width:1600,height:1000,appearance:{photoFit:'contain',photoCrop:'bottom',mobilePhotoCrop:'center',desktopPhotoCrop:'top'}};photoSection.appearance={mobilePhotoCrop:'bottom',desktopPhotoCrop:'center',desktopPhotoSide:'right'};
const maps={'approved/detail.jpg':'https://assets.example.invalid/detail.jpg','approved/detail.jpg#640':'https://assets.example.invalid/detail-640.webp','approved/detail.jpg#1280':'https://assets.example.invalid/detail-1280.webp'},beforePhoto=JSON.stringify(photoDraft),privatePhoto=renderWebsiteHtml(photoDraft,photoPage.id,{assetVariants:maps}),workerPhoto=worker(photoDraft,maps,photoPage,'synthetic-deployment');
for(const html of [privatePhoto,workerPhoto]){assert.match(html,/alt="Licensed garden illustration, not completed customer work"/);assert.match(html,/width="1600" height="1000"/);assert.match(html,/decoding="async"/);assert.match(html,/loading="eager"/);assert.match(html,/srcset="https:\/\/assets.example.invalid\/detail-640.webp 640w, https:\/\/assets.example.invalid\/detail-1280.webp 1280w"/);assert.match(html,/owner-image-fit-contain/);assert.match(html,/owner-image-mobile-crop-center/);assert.match(html,/owner-mobile-photo-crop-bottom/);assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/>Garden detail<\/h[12]>/g)||[]).length,1);}
assert.equal(JSON.stringify(photoDraft),beforePhoto);const revoked=structuredClone(photoDraft);revoked.sections.find(s=>s.id===photoSection.id).asset.status='withdrawn';assert.ok(!renderWebsiteHtml(revoked,photoPage.id).includes('src="https://assets.example.invalid/detail.jpg"'));
const context={draft:source,page:{id:'custom',title:'<svg onload=alert(1)>'},sections:[],escapeHtml:escape,homeHref:'javascript:alert(1)',pageHref:()=> 'javascript:alert(1)'};
const unsafe=websiteInnerPageHtml('',context);assert.match(unsafe,/&lt;svg/);assert.ok(!unsafe.includes('<svg'));assert.ok(!unsafe.includes('href="javascript:'));
assert.equal(websiteInnerPageHtml('<h1>Home</h1>',{...context,page:{id:'home',title:'Home'}}),null);
const titledSection={id:'custom-method',type:'text',enabled:true,title:'Our method',body:'One exact owner paragraph.'},titled=websiteInnerPageHtml('<section id="custom-method"><h1>Our method</h1><p>One exact owner paragraph.</p></section>',{...context,page:{id:'about',title:'About'},sections:[titledSection]});assert.ok(!titled.includes('class="inner-page-lead"'));assert.match(titled,/<h2>Our method<\/h2><p>One exact owner paragraph/);
assert.equal(websitePageHeadingHierarchy('<section><h2>Legacy</h2></section>'),'<section><h1>Legacy</h1></section>');
// Both actual renderers delegate to the same helper through the unchanged shared import.
for(const file of ['src/domain/websiteBuilder.js','supabase/functions/busy-website-worker/index.ts']){
 const s=readFileSync(file,'utf8');assert.match(s,/websitePageHeadingHierarchy\(rawSectionHtml,\{draft,page,sections/);assert.match(s,/nav-mobile-details/);assert.match(s,/aria-current="page"/);assert.match(s,/website-inner-page/);
}
console.log('PASS '+cases+' business-family fixtures; exact single-H1 page opening, source paragraph once, current navigation, safe related destinations, formatting/photo/source preservation, long mobile menu and legacy hierarchy. No hosted/provider/save/publication or aesthetic acceptance claimed.');

// Mission18 executes the actual original worker page renderer with the same
// reviewed image-free composition; no source-text substitute or stub geometry.
const creativeContext=mission16Fixture(2),creativePlan=prepareWholeWebsite(creativeContext,{pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml});
assert.equal(creativePlan.ok,true,creativePlan.reason);
const specification=deterministicWebsiteCreativeSpecification(creativePlan.candidate,'Keep my words but redesign the website');assert.equal(specification.ok,true,specification.reason);
const creativeDraft={...creativePlan.candidate,creativeSpecification:specification.specification};
for(const page of creativeDraft.pages){
 const native=renderWebsiteHtml(creativeDraft,page.id,{standalone:true}),edge=worker(creativeDraft,{},page,'synthetic-deployment');
 const expected=creativeWebsiteClasses(creativeDraft,page.id);assert.ok(expected);assert.ok(native.includes(expected));assert.ok(edge.includes(expected));assert.ok(edge.includes(creativeWebsiteCss));
 const sectionIds=html=>[...html.split('<main id="main">')[1].split('</main>')[0].matchAll(/<section[^>]* id="([^"]+)"/g)].map(match=>match[1]);
 assert.deepEqual(sectionIds(edge),sectionIds(native));assert.equal((edge.match(/<h1\b/g)||[]).length,1);
}
console.log('PASS Mission18 actual worker/native creative geometry and exact section-order parity across all seven original Quiet Light pages.');

// Execute the COMPLETE original worker renderer as well as the native renderer:
// a source denial must be visible and must never become a blank H1-less page.
for(const index of [2,0]){
 const c=mission16Fixture(index),planned=prepareWholeWebsite(c,{pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml});assert.equal(planned.ok,true);
 const fixture=mission19MinimalCreativeDocument({...c,website:planned.candidate}),compiled=compileWebsiteCreativeDocument(planned.candidate,fixture.document,{approvedIntent:fixture.approvedIntent});assert.equal(compiled.ok,true,compiled.reason);
 const denied=rebuildPrivateWebsiteDraft(compiled.draft);
 if(index===2)denied.sections.find(section=>section.id==='hero').title='Newer exact owner wording';
 else denied.sections.find(section=>section.type==='gallery').items[0].status='withdrawn';
 const before=JSON.stringify(denied),page=denied.pages.find(page=>page.id==='home'),native=renderWebsiteHtml(denied,'home',{standalone:true}),edge=worker(denied,{},page,'synthetic-source-denial');
 const body=html=>html.split('<main id="main">')[1].split('</main>')[0];
 assert.equal(body(native),websiteCreativeDocumentUnavailableHtml);assert.equal(body(edge),body(native));assert.equal((body(edge).match(/<h1\b/g)||[]).length,1);assert.ok(!/<img\b|<a\b|<button\b|<script\b/.test(body(edge)));assert.equal(JSON.stringify(denied),before);
}
console.log('PASS 2 complete original worker/native review-notice cases, 14 assertions: stale wording and withdrawn photographs retain source bytes and show one truthful H1 without replacement assets or actions.');
