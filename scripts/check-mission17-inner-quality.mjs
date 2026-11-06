import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyWebsitePageChange,renderWebsiteHtml} from '../src/domain/websiteBuilder.js';
import {prepareWholeWebsite} from '../src/core/wholeWebsitePlan.mjs';
import {websiteMovementOptions,resolveWebsiteMovement} from '../src/core/websiteVisualMovement.mjs';
import {websitePurposefulInnerPageHtml,websitePagePurposeCss} from '../supabase/functions/busy-website-worker/websitePagePurpose.mjs';
import {websitePageHeadingHierarchy} from '../supabase/functions/busy-website-worker/websitePageGuide.mjs';
import {mission16Fixture} from './lib/mission16-site-fixtures.mjs';
import {originalWebsiteSectionRuntime} from './lib/original-website-section-runtime.mjs';
import {businessContentSectionHtml as workerBusinessContentSectionHtml} from '../supabase/functions/_shared/businessContentHtml.mjs';
import {craftedPage} from '../supabase/functions/busy-website-worker/websiteCraftedPage.mjs';
import {sectionAppearanceClasses} from '../supabase/functions/busy-website-worker/websiteAppearanceClasses.mjs';

let assertions=0,cases=0;
const check=new Proxy(assert,{get(target,key){const value=target[key];return typeof value==='function'?function(...args){assertions++;return value.apply(target,args);}:value;}});
const test=(name,fn)=>{fn();cases++;console.log('PASS '+name);};
const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const main=html=>html.split('<main id="main">')[1].split('</main>')[0];
const count=(html,value)=>html.split(value).length-1;
const sectionRuntime=originalWebsiteSectionRuntime();
function prepared(index){const review=prepareWholeWebsite(mission16Fixture(index),{pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml});check.equal(review.ok,true);return {...review.candidate,sitePresentation:'purposeful-v1'};}
function context(draft,pageId,{editable=false,signed=false}={}){
 const page=draft.pages.find(p=>p.id===pageId),sections=page.sectionIds.map(id=>draft.sections.find(s=>s.id===id)).filter(Boolean);
 const prefix='../'.repeat(page.outputPath.split('/').length-1);
 const pageHref=id=>{const p=draft.pages.find(p=>p.id===id&&p.enabled!==false);return p?(signed?'https://preview.example.invalid/original-deployment/'+p.outputPath+'?token=synthetic':prefix+p.outputPath):'';};
 const editAttrs=(section,field)=>editable?' data-busy-edit-section="'+section.id+'" data-busy-edit-field="'+field+'"':'';
 const raw=sections.map((section,index)=>['products','events'].includes(section.type)?workerBusinessContentSectionHtml(section,{businessId:typeof draft.businessId==='string'&&(draft.business_id===undefined||draft.business_id===draft.businessId)?draft.businessId:null,recordPhoto:()=>'',narrative:['narrative','atelier'].includes(draft.theme?.heroVariation),artDirection:craftedPage(draft)&&(draft.theme.heroVariation.startsWith('authored')||['narrative','atelier'].includes(draft.theme.heroVariation)),sectionClasses:sectionAppearanceClasses(section)}):sectionRuntime(draft,section,{},index===0,pageHref('contact'))).join('');
 return {raw,ctx:{draft,page,sections,escapeHtml:escape,editAttrs,homeHref:pageHref('home'),pageHref}};
}

for(let index=0;index<3;index++)test('approved About story opens '+['landscaping','catering','image-free studio'][index],()=>{
 const draft=prepared(index),source=draft.sections.find(s=>s.id==='about'),before=JSON.stringify(draft),html=main(renderWebsiteHtml(draft,'about',{standalone:true}));
 check.match(html,/class="[^\"]*purpose-story/);check.match(html,/<h1>About<\/h1>/);check.equal((html.match(/<h1\b/g)||[]).length,1);
 check.ok(!html.includes('>About us</h2>'));check.ok(!html.includes('inner-page-opening-grid'));check.ok(!html.includes('Continue exploring'));
 for(const paragraph of source.body.split(/\n\s*\n/))check.equal(count(html,escape(paragraph)),1,'Exact source paragraphs appear once');
 check.ok(html.indexOf(escape(source.body.split(/\n\s*\n/)[0]))<html.indexOf('purpose-next'));
 check.equal(JSON.stringify(draft),before,'Presentation does not rewrite approved source');
 const {raw,ctx}=context(draft,'about');check.equal(websitePageHeadingHierarchy(raw,ctx),html,'Actual worker section runtime uses the same reviewed inner-page presentation');
});

for(let index=0;index<3;index++)test('source-bound service depth and supported customer route '+index,()=>{
 const draft=prepared(index),page=draft.pages.find(p=>p.sourceServiceId),before=JSON.stringify(draft),html=main(renderWebsiteHtml(draft,page.id,{standalone:true}));
 check.match(html,/purpose-service-opening/);check.equal((html.match(/<h1\b/g)||[]).length,1);check.ok(!html.includes('>A closer look</h2>'));check.ok(!html.includes('Continue exploring'));
 check.equal(count(html,'>'+escape(page.title)+'</h1>'),1);
 for(const paragraph of page.sourceServiceSnapshot.body.split(/\n\s*\n/))check.equal(count(html,escape(paragraph)),1);
 const method=draft.sections.find(s=>s.id==='about').body.split(/\n\s*\n/)[1];check.equal(count(html,escape(method)),1);check.match(html,/From our business story/);
 const cta=draft.sections.find(s=>s.id==='hero').cta;check.ok(html.includes('>'+escape(cta)+'<span aria-hidden="true">↗</span></a>'));check.ok(html.includes('href="../../contact/index.html"'));
 check.equal(JSON.stringify(draft),before);
 const {raw,ctx}=context(draft,page.id);check.equal(websitePageHeadingHierarchy(raw,ctx),html,'Actual worker source renderer and private preview preserve identical inner content');
 check.ok(!html.includes('completed projects'));check.ok(!html.includes('Book now'));
});

test('legacy two-section generated services and one-section full source both stay exact',()=>{
 const draft=prepared(2),page=draft.pages.find(p=>p.sourceServiceId),first=draft.sections.find(s=>s.id===page.sectionIds[0]),[lead,...rest]=page.sourceServiceSnapshot.body.split(/\n\s*\n/);
 first.body=lead;const detail={id:first.id+'-detail',type:'text',enabled:true,pageOnly:true,title:'A closer look',body:rest.join('\n\n'),appearance:{readingLayout:'feature-chapters'}};
 draft.sections.push(detail);page.sectionIds.push(detail.id);draft.customPages.find(p=>p.id===page.id).sectionIds.push(detail.id);
 const html=main(renderWebsiteHtml(draft,page.id,{standalone:true}));check.match(html,/class="inner-page-lead"/);check.equal(count(html,escape(lead)),1);check.equal(count(html,escape(detail.body)),1);check.ok(!html.includes('>A closer look</h2>'));
 const editHtml=main(renderWebsiteHtml(draft,page.id,{editablePreview:true}));check.match(editHtml,new RegExp('id="'+first.id+'"[^>]*data-busy-edit-section="'+first.id+'"'));check.match(editHtml,new RegExp('<h1 data-busy-edit-section="'+first.id+'" data-busy-edit-field="title"'));check.match(editHtml,new RegExp('inner-page-lead" data-busy-edit-section="'+first.id+'" data-busy-edit-field="body"'));check.match(editHtml,/>A closer look<\/h2>/,'Editable owner title is retained for direct selection');
 const options=websiteMovementOptions(draft,page.id,'current-source',editHtml);check.ok(resolveWebsiteMovement(draft,page.id,'current-source',{channel:options.channel,sourceKey:options.sourceKey,sectionId:detail.id,targetSectionId:first.id,position:'before'},editHtml));
});

test('owner formatting, approved custom headings and later locks remain original',()=>{
 const draft=prepared(2),about=draft.sections.find(s=>s.id==='about');about.title='What clarity means to us';about.ownerEditedFields=['title'];about.appearance={...about.appearance,titleFont:'sans',bodyFont:'sans'};draft.theme.typography='friendly';
 let html=main(renderWebsiteHtml(draft,'about',{standalone:true}));check.match(html,/>What clarity means to us<\/h2>/);check.match(html,/owner-text-titleFont-sans/);check.ok(!html.includes('purpose-default-serif'));
 const before=html;draft.theme.lockedSections=['about'];html=main(renderWebsiteHtml(draft,'about',{standalone:true}));check.equal(html,before,'Locking a reviewed new presentation must not visually revert it');
 const page=draft.pages.find(p=>p.sourceServiceId),section=draft.sections.find(s=>s.id===page.sectionIds[0]);section.appearance.titleFont='sans';section.appearance.bodyFont='sans';html=main(renderWebsiteHtml(draft,page.id,{standalone:true}));check.match(html,/owner-text-titleFont-sans/);check.match(html,new RegExp('<h2>'+escape(page.title)+'</h2>'));check.ok(!html.includes('purpose-default-serif'));
});

test('no hidden business-story duplication, invention or foreign source projection',()=>{
 const draft=prepared(2),page=draft.pages.find(p=>p.sourceServiceId),about=draft.sections.find(s=>s.id==='about');about.body=about.body.split(/\n\s*\n/)[0];let pair=context(draft,page.id),html=websitePurposefulInnerPageHtml(pair.raw,pair.ctx);check.ok(!html.includes('purpose-business-context'));
 about.body+='\n\n'+page.sourceServiceSnapshot.body.split(/\n\s*\n/)[1];pair=context(draft,page.id);html=websitePurposefulInnerPageHtml(pair.raw,pair.ctx);check.ok(!html.includes('purpose-business-context'));
 const original=prepared(2),p=original.pages.find(p=>p.sourceServiceId),current=context(original,p.id);original.sections.find(s=>s.id==='services').items[0].body+=' Changed current source.';check.equal(websitePurposefulInnerPageHtml(current.raw,current.ctx),null);
 for(const mutate of [d=>{d.business_id='foreign';},d=>{d.pages.find(p=>p.sourceServiceId).businessId='foreign';},d=>{d.sections.find(s=>s.id===d.pages.find(p=>p.sourceServiceId).sectionIds[0]).businessId='foreign';}]){const d=prepared(2);mutate(d);const x=context(d,d.pages.find(p=>p.sourceServiceId).id);check.equal(websitePurposefulInnerPageHtml(x.raw,x.ctx),null);}
 const copy=prepared(2),c=context(copy,copy.pages.find(p=>p.sourceServiceId).id);check.equal(websitePurposefulInnerPageHtml(c.raw,{...c.ctx,page:{...c.ctx.page,sourceServiceSnapshot:{...c.ctx.page.sourceServiceSnapshot,body:'Forged words.'}}}),null);
});

test('only exact original relative or same-deployment signed destinations are used',()=>{
 const draft=prepared(2),p=draft.pages.find(p=>p.sourceServiceId),pair=context(draft,p.id,{signed:true}),html=websitePurposefulInnerPageHtml(pair.raw,pair.ctx);check.match(html,/href="https:\/\/preview.example.invalid\/original-deployment\/contact\/index.html\?token=synthetic"/);
 for(const value of ['javascript:alert(1)','https://foreign.invalid/contact/index.html','//foreign.invalid/','https://preview.example.invalid/wrong-deployment/contact/index.html']){const c=context(draft,p.id);const h=websitePurposefulInnerPageHtml(c.raw,{...c.ctx,homeHref:value,pageHref:()=>value});check.ok(!h.includes('class="purpose-next"'));check.ok(!h.includes('href="'+value+'"'));}
 const missing=structuredClone(draft);missing.pages=missing.pages.filter(p=>p.id!=='contact');const m=context(missing,p.id);check.ok(!websitePurposefulInnerPageHtml(m.raw,m.ctx).includes('class="purpose-next"'));
});

test('approved photograph identities and crop/fit settings survive; withdrawn images do not',()=>{
 const draft=prepared(0),page=draft.pages.find(p=>p.sourceServiceId),section=draft.sections.find(s=>s.id===page.sectionIds[0]);check.equal(section.type,'photo-feature');section.appearance={...section.appearance,desktopPhotoSide:'right',mobilePhotoCrop:'bottom'};section.asset.appearance={photoFit:'contain',desktopPhotoCrop:'top'};
 const photoOptions={standalone:true,assetFiles:{[section.asset.storagePath]:'assets/licensed-garden.jpg'}};const html=main(renderWebsiteHtml(draft,page.id,photoOptions));check.match(html,/purpose-photo-layout/);check.match(html,/owner-desktop-photo-right/);check.match(html,/owner-mobile-photo-crop-bottom/);check.match(html,/owner-image-fit-contain/);check.match(html,/owner-image-desktop-crop-top/);check.equal((html.match(/<img\b/g)||[]).length,1);check.ok(html.includes('alt="'+escape(section.asset.alt)+'"'));
 const before=JSON.stringify(section.asset);renderWebsiteHtml(draft,page.id,photoOptions);check.equal(JSON.stringify(section.asset),before);
 const revoked=structuredClone(draft);revoked.sections.find(s=>s.id===section.id).asset.status='withdrawn';check.ok(!main(renderWebsiteHtml(revoked,page.id,{standalone:true})).includes('<img'));
});

test('source-bound Menu opening keeps exact products, prices, disclosure and approved enquiry',()=>{
 const draft=prepared(1),products=draft.sections.find(s=>s.id==='products'),before=JSON.stringify(draft),html=main(renderWebsiteHtml(draft,'products',{standalone:true}));
 check.match(html,/<h1>Menu<\/h1>/);check.match(html,/<li aria-current="page">Menu<\/li>/);check.match(html,/purpose-menu-opening purpose-default-serif/);check.ok(!html.includes('>Products</h1>'));check.ok(!html.includes('Continue exploring'));check.equal((html.match(/<h1\b/g)||[]).length,1);
 check.match(html,/>Food for the gathering<\/h2>/);for(const record of products.previewFeed.records){check.equal(count(html,escape(record.data.name)),1);check.equal(count(html,escape(record.data.description)),1);}
 check.match(html,/£9\.50/);check.match(html,/£18\.00/);check.match(html,/Private menu preview\. Ordering is unavailable\./);check.match(html,/<details/);check.match(html,/About this menu preview/);check.match(html,/href="\.\.\/contact\/index.html">Ask about catering/);check.equal(JSON.stringify(draft),before);
 const pair=context(draft,'products');check.equal(websitePageHeadingHierarchy(pair.raw,pair.ctx),html,'Actual original worker listing renderer and private preview keep identical menu details');const legacy=structuredClone(draft);delete legacy.sitePresentation;const old=main(renderWebsiteHtml(legacy,'products',{standalone:true}));check.match(old,/<h1>Products<\/h1>/);check.match(old,/Continue exploring/);
});

test('reviewed page labels and explicit menu typography survive; invalid feeds cannot establish Menu authority',()=>{
 const draft=prepared(1),page=draft.pages.find(p=>p.id==='products'),source=draft.sections.find(s=>s.id==='products');page.title='Our gathering selection';source.appearance={titleFont:'sans'};
 let html=main(renderWebsiteHtml(draft,'products',{standalone:true}));check.match(html,/<h1>Our gathering selection<\/h1>/);check.ok(!html.includes('purpose-default-serif'));check.match(html,/>Food for the gathering<\/h2>/);
 page.title='Products';page.ownerEditedFields=['title'];html=main(renderWebsiteHtml(draft,'products',{standalone:true}));check.match(html,/<h1>Products<\/h1>/,'Explicit owner page label is not replaced by navigation wording');
 for(const mutate of [d=>{d.sections.find(s=>s.id==='products').previewFeed.checkedAt='invalid';},d=>{d.sections.find(s=>s.id==='products').previewFeed.businessId='foreign';},d=>{d.sections.find(s=>s.id==='products').previewFeed.records=[];}]){const d=prepared(1);mutate(d);const c=context(d,'products');check.equal(websitePurposefulInnerPageHtml(c.raw,c.ctx),null);check.ok(!main(renderWebsiteHtml(d,'products',{standalone:true})).includes('£9.50'));}
});

for(let index=0;index<3;index++)test('intentional Contact conclusion retains exact owner channels '+index,()=>{
 const draft=prepared(index),source=draft.sections.find(s=>s.id==='contact');source.phone='+44 7700 900123';const before=JSON.stringify(draft),html=main(renderWebsiteHtml(draft,'contact',{standalone:true}));
 check.match(html,/purpose-contact-meta/);check.equal((html.match(/<h1\b/g)||[]).length,1);check.match(html,/<h1>Contact<\/h1>/);check.ok(!html.includes('inner-page-opening'));check.ok(!html.includes('Continue exploring'));check.ok(!html.includes('class="purpose-next"'));check.match(html,/>Get in touch<\/h2>/);
 check.ok(html.includes('mailto:'+source.email));check.match(html,/href="tel:\+447700900123"/);check.equal(count(html,escape(source.email)),2,'Email destination and visible address remain exact');check.equal(JSON.stringify(draft),before);
 const pair=context(draft,'contact');check.equal(websitePageHeadingHierarchy(pair.raw,pair.ctx),html,'Original worker and private preview keep identical actual contact channels');
 const editable=main(renderWebsiteHtml(draft,'contact',{editablePreview:true}));check.match(editable,/id="contact"[^>]*data-busy-edit-section="contact"/);check.match(editable,/>Get in touch<\/h2>/);for(const field of ['title','body','phone','email'])check.ok(editable.includes('data-busy-edit-field="'+field+'"'),'Original contact field remains selectable: '+field);const legacy=structuredClone(draft);delete legacy.sitePresentation;const old=main(renderWebsiteHtml(legacy,'contact',{standalone:true}));check.match(old,/inner-page-opening/);check.match(old,/Continue exploring/);
 source.title='Speak with our studio';source.ownerEditedFields=['title'];source.appearance={titleFont:'sans'};const revised=main(renderWebsiteHtml(draft,'contact',{standalone:true}));check.match(revised,/>Speak with our studio<\/h2>/);check.match(revised,/owner-text-titleFont-sans/);check.equal((revised.match(/<h1\b/g)||[]).length,1);
});

test('legacy and manually authored pages retain original renderer; finite CSS has mobile and focus support',()=>{
 const draft=prepared(2),page=draft.pages.find(p=>p.sourceServiceId),pair=context(draft,page.id);delete draft.sitePresentation;check.equal(websitePurposefulInnerPageHtml(pair.raw,pair.ctx),null);
 const legacy=main(renderWebsiteHtml(draft,page.id,{standalone:true}));check.match(legacy,/inner-page-opening/);check.ok(!legacy.includes('purpose-service-opening'));
 draft.sitePresentation='purposeful-v1';let custom=applyWebsitePageChange(draft,{action:'create-page',title:'Owner authored note',body:'Exact independent owner wording.'});check.equal(custom.applied,true);const cp=custom.draft.pages.find(p=>p.title==='Owner authored note'),cc=context(custom.draft,cp.id);check.equal(websitePurposefulInnerPageHtml(cc.raw,cc.ctx),null);
 for(const file of ['src/domain/websiteBuilder.js','supabase/functions/busy-website-worker/index.ts'])check.match(readFileSync(file,'utf8'),/websitePageHeadingHierarchy\(rawSectionHtml,\{draft,page,sections/);
 check.match(websitePagePurposeCss,/@media\(max-width:700px\)/);check.match(websitePagePurposeCss,/minmax\(0,1fr\)/);check.match(websitePagePurposeCss,/:focus-visible/);check.match(websitePagePurposeCss,/min-height:54px/);check.ok(!websitePagePurposeCss.includes('url('));
});

console.log('PASS '+cases+' Mission17 inner-page cases, '+assertions+' assertions. Exact approved words, source and route denials, original worker/private parity and editor markers. No hosted save, provider call, publication or aesthetic acceptance claimed.');
