import assert from 'node:assert/strict';
import {prepareWholeWebsite} from '../src/core/wholeWebsitePlan.mjs';
import {applyWebsitePageChange,renderWebsiteHtml} from '../src/domain/websiteBuilder.js';
import {purposeServiceProjection,websiteServiceOverviewCss} from '../supabase/functions/busy-website-worker/websiteServiceOverview.mjs';
import {craftedServices} from '../supabase/functions/busy-website-worker/websiteCraftedPage.mjs';
import {mission16Fixture} from './lib/mission16-site-fixtures.mjs';
import {originalWebsiteSectionRuntime} from './lib/original-website-section-runtime.mjs';
const copy=value=>structuredClone(value),list=value=>Array.isArray(value)?value:[];
const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
function fixture(index=0){const c=mission16Fixture(index),r=prepareWholeWebsite(c,{pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml});assert.equal(r.ok,true,r.reason);r.candidate.sitePresentation='purposeful-v1';return r.candidate;}
const section=draft=>draft.sections.find(s=>s.id==='services');
const route=(draft,current='home')=>id=>{const page=draft.pages.find(p=>p.id===id),from=draft.pages.find(p=>p.id===current);return page&&from?'../'.repeat(from.outputPath.split('/').length-1)+page.outputPath:'';};
const project=(draft,options={})=>purposeServiceProjection(draft,section(draft),{pageId:'home',pageHref:route(draft),...options});
let passed=0;const test=(name,fn)=>{fn();passed++;console.log('PASS '+name);};

test('three approved businesses use exact concise source paragraphs and real detail routes',()=>{
 for(let index=0;index<3;index++){
  const draft=fixture(index),before=JSON.stringify(draft),s=section(draft),p=project(draft);assert.ok(p);assert.equal(p.summaries.length,s.items.length);assert.equal(p.linkedItemIds.length,s.items.length);
  for(const item of s.items){const summary=p.summaries.find(row=>row.serviceId===item.id),page=draft.pages.find(row=>row.sourceServiceId===item.id);assert.ok(summary);assert.equal(summary.summary,item.body.split(/\n\s*\n/)[0].trim());assert.equal(summary.sourceBody,item.body.trim());assert.equal(p.section.items.find(row=>row.id===item.id).body,summary.summary);assert.equal(p.detailHrefs[item.id],page.outputPath);assert.equal(summary.requiresOwnerReview,true);assert.equal(page.sourceServiceSnapshot.body,item.body.trim());}
  const html=craftedServices(p.section,draft.theme.heroComposition,{escapeHtml:escape,direction:draft.theme.heroVariation,overview:true,itemHeadingHref:item=>p.detailHrefs[item.id]||''});
  assert.match(html,/purposeful-service-overview/);assert.equal((html.match(/class="service-detail-link"/g)||[]).length,s.items.length);for(const row of p.summaries){assert.ok(html.includes(escape(row.summary)));const detail=draft.customPages.find(page=>page.sourceServiceId===row.serviceId).sectionIds.map(id=>draft.sections.find(section=>section.id===id).body).join('\n\n');assert.equal(detail,row.sourceBody);}
  assert.equal(JSON.stringify(draft),before,'Projection may not mutate the approved source or full detail pages');
 }
});

test('one-hero Home hides only photos with genuine current service-detail destinations',()=>{
 const draft=fixture(),before=JSON.stringify(draft),p=project(draft);assert.equal(p.hidePhotos,true);assert.deepEqual(p.hiddenPhotoIds,['service-0']);assert.ok(section(draft).items[0].photoBinding);const page=draft.customPages.find(p=>p.sourceServiceId==='service-0'),photo=draft.sections.find(s=>page.sectionIds.includes(s.id)&&s.type==='photo-feature');assert.ok(photo?.asset);assert.equal(photo.asset.storagePath,section(draft).items[0].photoBinding.storagePath);
 const overview=project(draft,{pageId:'services',pageHref:route(draft,'services')});assert.ok(overview);assert.equal(overview.hidePhotos,false);assert.deepEqual(overview.hiddenPhotoIds,[]);assert.match(overview.detailHrefs['service-0'],/^\.\.\/pages\//);assert.equal(JSON.stringify(draft),before);
});

test('legacy, edit mode and explicit owner index layout retain complete source',()=>{
 for(const value of [undefined,'legacy','purposeful-v2']){const draft=fixture();draft.sitePresentation=value;assert.equal(project(draft),null);}
 const draft=fixture(),before=JSON.stringify(draft);assert.equal(project(draft,{editablePreview:true}),null);assert.equal(JSON.stringify(draft),before);
 section(draft).appearance={...section(draft).appearance,serviceLayout:'index'};assert.equal(project(draft),null);
 const full=craftedServices(section(draft),draft.theme.heroComposition,{escapeHtml:escape,direction:draft.theme.heroVariation});assert.ok(full.includes(escape(section(draft).items[0].body)));assert.ok(!full.includes('service-detail-link'));
});

test('reviewed fonts, item appearance and later owner locks preserve the selected presentation',()=>{
 const draft=fixture(),s=section(draft);s.appearance={...s.appearance,serviceLayout:'cards',titleFont:'serif'};s.items[0].appearance={titleFont:'mono',bodyColour:'accent'};const p=project(draft);assert.ok(p);assert.deepEqual(p.section.appearance,s.appearance);assert.deepEqual(p.section.items[0].appearance,s.items[0].appearance);
 draft.theme.lockedSections=['services'];const locked=project(draft);assert.deepEqual(locked,p,'Locking an already-reviewed presentation cannot itself redesign it');
});

test('missing, ambiguous, foreign or stale service-page authority cannot shorten words or hide a photo',()=>{
 const original=fixture();
 for(const mutate of [d=>{section(d).items[0].body+=' New owner information.';},d=>{d.business_id='foreign';},d=>{d.customPages[0].sourceServiceSnapshot.body='Foreign source';}]){const d=copy(original);mutate(d);assert.equal(project(d),null);}
 const missing=copy(original),bound=missing.customPages.find(p=>p.sourceServiceId==='service-0');missing.customPages=missing.customPages.filter(p=>p.id!==bound.id);const p=project(missing);assert.ok(p);assert.equal(p.detailHrefs['service-0'],undefined);assert.equal(p.section.items[0].body,section(missing).items[0].body);assert.equal(p.hidePhotos,false);assert.deepEqual(p.hiddenPhotoIds,[]);
 const duplicate=copy(original);duplicate.pages.push(copy(duplicate.pages.find(p=>p.sourceServiceId==='service-0')));const q=project(duplicate);assert.ok(q);assert.equal(q.detailHrefs['service-0'],undefined);assert.equal(q.section.items[0].body,section(duplicate).items[0].body);
 const foreign=copy(original);foreign.pages.find(p=>p.sourceServiceId==='service-0').businessId='foreign';assert.equal(project(foreign).detailHrefs['service-0'],undefined);
});

test('only exact original internal route forms receive service links',()=>{
 const draft=fixture();for(const value of ['',undefined,'https://unapproved.example.invalid/','javascript:alert(1)','//foreign.invalid/','../pages/garden-maintenance/index.html','/pages/other-service'])assert.equal(project(draft,{pageHref:()=>value}),null);
 const renamed=copy(draft),own=renamed.customPages.find(p=>p.sourceServiceId==='service-0');own.title='My exact owner-selected page name';renamed.pages.find(p=>p.id===own.id).title=own.title;assert.ok(project(renamed).detailHrefs['service-0'],'Owner rename does not invalidate its stable current service relationship');
 const wrong=copy(draft),target=wrong.pages.find(p=>p.sourceServiceId==='service-0');target.path='/contact';target.outputPath='contact/index.html';assert.equal(project(wrong).detailHrefs['service-0'],undefined,'A forged derived path cannot masquerade as the service detail');
 const absent=copy(draft),missingPage=absent.customPages.find(p=>p.sourceServiceId==='service-0');absent.sections=absent.sections.filter(s=>!missingPage.sectionIds.includes(s.id));assert.equal(project(absent).detailHrefs['service-0'],undefined,'An empty/missing detail cannot justify eliding approved Home words');
 const changed=copy(draft),edited=changed.customPages.find(p=>p.sourceServiceId==='service-0');changed.sections.find(s=>s.id===edited.sectionIds[0]).body='Owner has changed this page and no longer displays the complete original service words.';assert.equal(project(changed).detailHrefs['service-0'],undefined,'Changed detail text cannot silently remove the full original words from every page');
 const root=project(draft,{pageHref:id=>draft.pages.find(p=>p.id===id).path});assert.ok(root);assert.match(root.detailHrefs['service-0'],/^\/pages\//);
 assert.equal(project(draft,{pageId:'contact'}),null);assert.equal(purposeServiceProjection(draft,copy(section(draft)),{pageId:'home',pageHref:route(draft)}),null);
 const one=project(draft,{pageHref:id=>draft.pages.find(p=>p.id===id).sourceServiceId==='service-0'?'https://foreign.invalid/':route(draft)(id)});assert.ok(one);assert.equal(one.detailHrefs['service-0'],undefined);assert.equal(one.section.items[0].body,section(draft).items[0].body);
});

test('thin or long source paragraphs are not arbitrarily truncated',()=>{
 for(const body of ['One complete approved paragraph stays together without invented detail or omitted conditions.','Long approved opening. '.repeat(24)+'\n\nA separately approved second paragraph.']){
  const draft=fixture(),item=section(draft).items[0],page=draft.customPages.find(p=>p.sourceServiceId===item.id),derived=draft.pages.find(p=>p.id===page.id);item.body=body;page.sourceServiceSnapshot={title:item.title,body};derived.sourceServiceSnapshot={title:item.title,body};const detailId=page.sectionIds[0];draft.sections.find(s=>s.id===detailId).body=body;page.sectionIds=[detailId];derived.sectionIds=[detailId];const p=project(draft);assert.ok(p);assert.equal(p.section.items[0].body,body);assert.ok(!p.summaries.some(s=>s.serviceId===item.id));assert.ok(p.detailHrefs[item.id]);
 }
});

test('optional original crafted heading links escape source names and reject executable destinations',()=>{
 const s={items:[{id:'source',title:'A & B <approved text>',body:'Exact source words.'}]};for(const href of ['javascript:alert(1)','data:text/html,boom','//foreign.invalid/','https://foreign.invalid/']){const html=craftedServices(s,'typography-first',{escapeHtml:escape,direction:'atelier',itemHeadingHref:()=>href,overview:true});assert.ok(!html.includes('<a '));assert.ok(html.includes('A &amp; B &lt;approved text&gt;'));}
 assert.match(websiteServiceOverviewCss,/min-height:44px/);assert.match(websiteServiceOverviewCss,/:focus-visible/);assert.ok(!websiteServiceOverviewCss.includes('url('));
});

test('original client and worker apply the reviewed summary only where real page navigation works',()=>{
 const draft=fixture(),s=section(draft),before=JSON.stringify(draft),projection=project(draft),source=s.items[0].body;
 const serviceBlock=html=>html.match(/<section id="services"[\s\S]*?<\/section>/)?.[0]||'';
 const client=serviceBlock(renderWebsiteHtml(draft,'home',{standalone:true,privatePagePreview:true}));
 const worker=originalWebsiteSectionRuntime(),deployed=worker(draft,s,{},false,'',true,{pageId:'home',pageHref:route(draft)});
 for(const html of [client,deployed]){assert.match(html,/purposeful-service-overview/);assert.ok(html.includes(escape(projection.summaries[0].summary)));assert.ok(!html.includes(escape(source)));assert.ok(html.includes('href="'+projection.detailHrefs[s.items[0].id]+'"'));}
 for(const html of [renderWebsiteHtml(draft,'home'),renderWebsiteHtml(draft,'home',{editablePreview:true}),worker(draft,s,{},false),worker(draft,s,{},false,'',true,{pageId:'home',pageHref:()=> 'https://signed.example.invalid/private-page'})]){const block=html.includes('<html')?serviceBlock(html):html;assert.ok(block.includes(escape(source)));assert.ok(!block.includes('purposeful-service-overview'));}
 assert.equal(JSON.stringify(draft),before);
});

test('signed original preview routes keep exact scoped tokens and reject foreign or malformed destinations',()=>{
 const draft=fixture(),s=section(draft),base='https://preview.example.invalid/storage/v1/object/sign/private/current-deployment/',urls=Object.fromEntries(draft.pages.map(page=>[page.id,base+page.outputPath+'?token=synthetic-'+page.id+'%2Bscope'])),pageHref=id=>urls[id],projection=project(draft,{pageHref});
 assert.ok(projection);assert.equal(projection.reviewedHeadingHrefs.length,s.items.length);for(const item of s.items)assert.equal(projection.detailHrefs[item.id],urls[draft.pages.find(page=>page.sourceServiceId===item.id).id]);
 const html=originalWebsiteSectionRuntime()(draft,s,{},false,'',true,{pageId:'home',pageHref});assert.match(html,/purposeful-service-overview/);for(const href of projection.reviewedHeadingHrefs)assert.ok(html.includes('href="'+escape(href)+'"'),'Original resolver token must remain byte-for-byte intact');
 const target=draft.pages.find(page=>page.sourceServiceId===s.items[0].id),path=target.outputPath;
 for(const bad of ['https://foreign.example.invalid/storage/v1/object/sign/private/current-deployment/'+path+'?token=synthetic',base.replace('current-deployment','sibling-deployment')+path+'?token=synthetic',base+'contact/index.html?token=synthetic',base+path+'?token=',base+path+'?token=one&token=two',base+path+'?token=synthetic&next=https://foreign.invalid',base+path+'?other=synthetic',base+path+'?token=synthetic#fragment',base.replace('https:','http:')+path+'?token=synthetic',base.replace('https://','https://user:password@')+path+'?token=synthetic']){
  const changed=id=>id===target.id?bad:urls[id],p=project(draft,{pageHref:changed});assert.ok(p);assert.equal(p.detailHrefs[s.items[0].id],undefined);assert.equal(p.section.items[0].body,s.items[0].body);assert.ok(!p.hiddenPhotoIds.includes(s.items[0].id));
 }
 assert.equal(project(draft,{pageHref:id=>id==='home'?base+'wrong/index.html?token=synthetic':urls[id]}),null);
});

console.log('PASS '+passed+' Mission17 service-overview cases. Exact approved source, original crafted renderer and real finite routes; no provider, hosted save, publication or aesthetic approval claimed.');
