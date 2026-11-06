import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyWebsitePageChange,renderWebsiteHtml,buildWebsiteDraft} from '../src/domain/websiteBuilder.js';
import {prepareWholeWebsite} from '../src/core/wholeWebsitePlan.mjs';
import {mission16Fixture} from './lib/mission16-site-fixtures.mjs';
import {creativeWebsiteClasses,creativeWebsiteOrder,creativeWebsiteCss} from '../supabase/functions/busy-website-worker/websiteCreativeRendering.mjs';
import {validateWebsiteCreativeSpecification,deterministicWebsiteCreativeSpecification} from '../supabase/functions/busy-website-worker/websiteCreativeSpecification.mjs';
let cases=0,assertions=0;
const check=new Proxy(assert,{get(target,key){return typeof target[key]==='function'?function(...args){assertions++;return target[key](...args);}:target[key];}});
const test=(name,fn)=>{fn();cases++;console.log('PASS '+name);};
const clone=value=>structuredClone(value),main=html=>html.split('<main id="main">')[1].split('</main>')[0];
const prepared=index=>prepareWholeWebsite(mission16Fixture(index),{pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml}).candidate;
function directed(index){const draft=prepared(index),r=deterministicWebsiteCreativeSpecification(draft,'Keep my wording but redesign the website');check.equal(r.ok,true,r.reason);draft.creativeSpecification=r.specification;return draft;}

for(let i=0;i<3;i++)test('actual original renderer uses source-bound complete-page specification '+i,()=>{
 const draft=directed(i),before=JSON.stringify(draft);
 for(const page of draft.pages){
  const html=renderWebsiteHtml(draft,page.id,{standalone:true,privatePagePreview:true}),spec=draft.creativeSpecification.pages.find(p=>p.pageId===page.id);
  check.ok(html.includes('creative-opening-'+spec.opening));check.ok(html.includes('creative-measure-'+spec.measure));check.ok(html.includes('creative-alignment-'+spec.alignment));check.ok(html.includes('creative-rhythm-'+spec.rhythm));check.ok(html.includes('creative-emphasis-'+spec.emphasis));
  check.ok(html.includes(creativeWebsiteCss));check.equal((main(html).match(/<h1\b/g)||[]).length,1);check.ok(!main(html).includes('Book now'));check.ok(!main(html).includes('<script'));
 }
 check.equal(JSON.stringify(draft),before,'Rendering cannot rewrite owner source or source permissions');
});
test('unknown and executable-style measures yield the exact original legacy output',()=>{
 const draft=prepared(2),baseline=renderWebsiteHtml(draft,'home',{standalone:true}),invalid=directed(2);
 for(const mutate of [d=>{d.creativeSpecification.version='unreviewed';},d=>{d.creativeSpecification.pages[0].opening='url(javascript:alert(1))';},d=>{d.creativeSpecification.pages[0].css='body{display:none}';},d=>{d.creativeSpecification.pages[0].sectionOrder.push(d.creativeSpecification.pages[0].sectionOrder[0]);}]){
  const d=clone(invalid);mutate(d);check.equal(creativeWebsiteClasses(d,'home'),'');check.equal(renderWebsiteHtml(d,'home',{standalone:true}),baseline);check.ok(!renderWebsiteHtml(d).includes('creative-site main'));
 }
 check.equal(creativeWebsiteClasses(draft,'home'),'');check.equal(creativeWebsiteOrder(draft,'home',['hero','services']).join(','),'hero,services');
});
test('exact reviewed section order is shared by preview, worker and export',()=>{
 const draft=directed(2),home=draft.creativeSpecification.pages.find(p=>p.pageId==='home'),order=home.sectionOrder;
 const a=order.indexOf('services'),b=order.indexOf('about');[order[a],order[b]]=[order[b],order[a]];
 check.equal(validateWebsiteCreativeSpecification(draft,draft.creativeSpecification).ok,true);
 for(const options of [{},{editablePreview:true},{standalone:true}]){
  const body=main(renderWebsiteHtml(draft,'home',options));check.ok(body.indexOf('id="about"')<body.indexOf('id="services"'));check.ok(body.indexOf('id="services"')<body.indexOf('id="contact"'));
 }
 const source=readFileSync('supabase/functions/busy-website-worker/index.ts','utf8');check.match(source,/const renderedOrder=creativeWebsiteOrder\(draft,page\?\.id\|\|'home'/);check.match(source,/creativeClasses\?creativeWebsiteCss:''/);check.match(source,/creativeClasses\?creativeClasses\+' ':''/);
});
test('owner typography, original words, crops and native editable markers are retained',()=>{
 const draft=directed(0),home=draft.sections.find(s=>s.id==='hero'),about=draft.sections.find(s=>s.id==='about');
 home.appearance={titleFont:'sans',headingScale:'compact'};about.title='Our exact approved heading';about.ownerEditedFields=['title'];
 const html=renderWebsiteHtml(draft,'home',{editablePreview:true});check.ok(!creativeWebsiteClasses(draft,'home').includes('creative-auto-type'));check.match(html,/owner-text-titleFont-sans/);check.match(html,/owner-heading-compact/);check.ok(main(html).includes('Our exact approved heading'));check.match(html,/data-busy-edit-field="title"/);check.match(html,/data-busy-edit-field="photo"/);
 const page=draft.pages.find(p=>p.sourceServiceId),section=draft.sections.find(s=>s.id===page.sectionIds[0]);section.asset.appearance={photoFit:'contain',desktopPhotoCrop:'top'};section.appearance.mobilePhotoCrop='bottom';
 const photoHtml=main(renderWebsiteHtml(draft,page.id,{standalone:true,assetFiles:{[section.asset.storagePath]:'assets/licensed.jpg'}}));check.match(photoHtml,/owner-image-fit-contain/);check.match(photoHtml,/owner-image-desktop-crop-top/);check.match(photoHtml,/owner-mobile-photo-crop-bottom/);check.ok(photoHtml.includes(section.body.split('\n\n')[0]));
});
test('a later owner lock preserves the exact reviewed presentation',()=>{
 const draft=directed(2),before=renderWebsiteHtml(draft,'about',{standalone:true});draft.theme.lockedSections=['all'];check.equal(renderWebsiteHtml(draft,'about',{standalone:true}),before);
});
test('same-owner factual refresh retains exact reviewed geometry and owner wording; foreign scope cannot inherit it',()=>{
 const context=mission16Fixture(2),draft=prepared(2),proposal=deterministicWebsiteCreativeSpecification(draft,'Keep my wording but redesign the website');
 const edited=applyWebsitePageChange(draft,{action:'apply-site-creative-specification',specification:proposal.specification,expectedWebsiteId:draft.id,expectedGeneration:draft.generation,expectedBusinessId:context.businessId,expectedProfileRevision:context.profileRevision});
 check.equal(edited.applied,true,edited.reason);const previous=edited.draft,hero=previous.sections.find(section=>section.id==='hero');hero.title='The owner chose these exact words';hero.ownerEditedFields=['title'];
 const refresh=buildWebsiteDraft({businessId:context.businessId,previousDraft:previous,brandBrain:{websiteBrief:{...context.profile,description:'A current approved fictional introduction.'}}});
 check.deepEqual(refresh.creativeSpecification,previous.creativeSpecification);check.deepEqual(refresh.creativeSpecificationSourceOrder,previous.creativeSpecificationSourceOrder);check.equal(refresh.sections.find(section=>section.id==='hero').title,hero.title);check.ok(creativeWebsiteClasses(refresh,'home'));check.ok(creativeWebsiteClasses(refresh,'page-brand-direction'));
 check.notEqual(refresh.creativeSpecification,previous.creativeSpecification);check.notEqual(refresh.creativeSpecificationSourceOrder,previous.creativeSpecificationSourceOrder);
 for(const businessId of ['foreign-business','']){const rejected=buildWebsiteDraft({businessId,previousDraft:previous,brandBrain:{websiteBrief:context.profile}});check.equal(Object.hasOwn(rejected,'creativeSpecification'),false);check.equal(Object.hasOwn(rejected,'creativeSpecificationSourceOrder'),false);}
 const invalid=clone(previous);invalid.creativeSpecification.pages[0].opening='unreviewed';const rejected=buildWebsiteDraft({businessId:context.businessId,previousDraft:invalid,brandBrain:{websiteBrief:context.profile}});check.equal(Object.hasOwn(rejected,'creativeSpecification'),false);
 const malformed=clone(previous);malformed.creativeSpecificationSourceOrder[0].sectionOrder=['foreign-section'];const safe=buildWebsiteDraft({businessId:context.businessId,previousDraft:malformed,brandBrain:{websiteBrief:context.profile}});check.ok(safe.creativeSpecification);check.equal(Object.hasOwn(safe,'creativeSpecificationSourceOrder'),false);
});
test('explicit general, mobile and desktop owner spacing suppresses automatic opening padding',()=>{
 for(const field of ['sectionSpacing','mobileSectionSpacing','desktopSectionSpacing'])for(const value of ['compact','generous'])for(const pageId of ['home','page-brand-direction']){
  const draft=directed(2),page=draft.pages.find(p=>p.id===pageId),first=draft.sections.find(s=>s.id===page.sectionIds[0]);
  check.ok(creativeWebsiteClasses(draft,page.id).includes('creative-auto-opening-space'));
  first.appearance={...first.appearance,[field]:value};
  check.ok(!creativeWebsiteClasses(draft,page.id).includes('creative-auto-opening-space'));
  const html=renderWebsiteHtml(draft,page.id,{standalone:true});check.ok(!html.match(/<body class="[^"]*creative-auto-opening-space/));
 }
 const rules=creativeWebsiteCss.split('}').filter(rule=>/creative-opening-(?:display|compact)/.test(rule)&&/padding-(?:block|bottom):/.test(rule));
 check.equal(rules.length,4);for(const rule of rules)for(const selector of rule.split('{').at(-2).split(','))check.ok(selector.includes('.creative-auto-opening-space'),'Every optional opening padding selector must yield to explicit owner spacing');
});
test('stale or foreign exact source blocks creative rendering without exposing replacement media',()=>{
 for(const mutate of [d=>{d.business_id='foreign-business';},d=>{d.sections.find(s=>s.id==='services').items[0].body+=' Stale original service.';},d=>{d.sections.find(s=>s.type==='gallery').items[0].status='withdrawn';}]){
  const draft=directed(0);mutate(draft);check.equal(creativeWebsiteClasses(draft,'home'),'');check.ok(!renderWebsiteHtml(draft,'home').includes(creativeWebsiteCss));
 }
});
test('finite responsive CSS retains usable mobile text tracks and cannot fetch remote assets',()=>{
 check.match(creativeWebsiteCss,/@media\(max-width:900px\)/);check.match(creativeWebsiteCss,/grid-template-columns:minmax\(0,1fr\)/);check.match(creativeWebsiteCss,/min-width:0/);check.match(creativeWebsiteCss,/min-height:54px/);check.ok(!/(?:url\(|@import|font-family|object-fit|object-position|animation:|position:absolute)/i.test(creativeWebsiteCss));check.ok(!creativeWebsiteCss.includes('display:none'));
 const draft=directed(2),thin=clone(draft);thin.creativeSpecification.pages=thin.creativeSpecification.pages.filter(p=>p.pageId!=='about');check.equal(creativeWebsiteClasses(thin,'about'),'');check.equal(creativeWebsiteOrder(thin,'about',['about']).join(','),'about');
});
console.log('PASS '+cases+' Mission18 creative-rendering cases; '+assertions+' assertions; zero failures. Actual original renderer, finite source measures and preserved owner content. No model or hosted result claimed.');
