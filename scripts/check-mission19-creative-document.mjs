import assert from 'node:assert/strict';
import {mission16Fixture} from './lib/mission16-site-fixtures.mjs';
import {mission19MinimalCreativeDocument} from './lib/mission19-document-fixture.mjs';
import {prepareWholeWebsite} from '../src/core/wholeWebsitePlan.mjs';
import {applyWebsitePageChange,applyStructuredWebsiteEdit,renderWebsiteHtml} from '../src/domain/websiteBuilder.js';
import {validateWebsiteCreativeIntent,validateWebsiteCreativeDocument,compileWebsiteCreativeDocument,websiteCreativeDocumentPageModel,websiteCreativeDocumentSection,websiteCreativeDocumentAsset,websiteCreativeDocumentSchema,creativeDocumentColours,creativeDocumentContrast} from '../supabase/functions/busy-website-worker/websiteCreativeDocument.mjs';
import {websiteCreativeCopyCatalog} from '../supabase/functions/busy-website-worker/websiteCreativeCopy.mjs';
let cases=0,assertions=0;const check=new Proxy(assert,{get(target,key){return typeof target[key]==='function'?function(...args){assertions++;return target[key](...args);}:target[key];}});
async function test(name,run){await run();cases++;console.log('PASS '+name);}
const copy=value=>JSON.parse(JSON.stringify(value)),deps={pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml};
function fixture(index=2){const c=mission16Fixture(index);c.website=prepareWholeWebsite(c,deps).candidate;return {...c,...mission19MinimalCreativeDocument(c)};}
const compile=c=>compileWebsiteCreativeDocument(c.website,c.document,{approvedIntent:c.approvedIntent});
const validate=c=>validateWebsiteCreativeDocument(c.website,c.document,{approvedIntent:c.approvedIntent});
const validBrand={headingFont:'trebuchet',bodyFont:'verdana',palette:{ink:'#142E28',paper:'#FAFAF4',accent:'#315C49',muted:'#536157'},gradient:{from:'#183B31',to:'#315C49',angle:135}};

await test('three original businesses compile into canonical sections/custom pages without changing business facts or old family registry',()=>{
 for(let index=0;index<3;index++){const c=fixture(index),before=JSON.stringify(c.website),r=compile(c);check.equal(r.ok,true,r.reason);check.equal(JSON.stringify(c.website),before);check.equal(r.draft.theme,c.website.theme);check.equal(r.draft.businessId,c.businessId);check.equal(r.draft.theme.heroComposition,c.website.theme.heroComposition);for(const section of c.website.sections)check.deepEqual(r.draft.sections.find(current=>current.id===section.id),section);const model=websiteCreativeDocumentPageModel(r.draft);check.ok(model);check.equal(model.pages.length,c.website.pages.length);check.equal(model.brand,null);check.equal(r.summary.providerCalls,0);}
});

await test('strict recursive schema supports bounded composition primitives and excludes executable extensions',()=>{
 const schema=websiteCreativeDocumentSchema();check.equal(schema.additionalProperties,false);check.ok(schema.$defs.node);check.ok(schema.$defs.copy);check.ok(!JSON.stringify(schema).includes('html'));check.equal(schema.properties.pages.maxItems,10);check.equal(schema.$defs.node.anyOf.length,9);
 for(const mutate of [c=>{c.document.html='<script>bad()</script>';},c=>{c.document.pages[0].sections[0].layout.css='position:fixed';},c=>{c.document.pages[0].sections[0].nodes[0].onClick='send()';},c=>{c.document.pages[0].sections[0].nodes[0].type='iframe';},c=>{c.document.brand={...validBrand,fontUrl:'https://font.invalid/unsafe'};}]){const c=fixture();mutate(c);check.equal(validate(c).ok,false);}
});

await test('intent is separate from model output and all new creative authority is default denied',()=>{
 const c=fixture();check.equal(validateWebsiteCreativeIntent(c.website,null).ok,false);check.equal(validateWebsiteCreativeIntent(c.website,{...c.approvedIntent,providerEnabled:true}).ok,false);
 c.document.approvedIntent=c.approvedIntent;check.equal(validate(c).ok,false);delete c.document.approvedIntent;c.document.brand=validBrand;check.equal(validate(c).ok,false);c.approvedIntent.allowBrandChange=true;check.equal(validate(c).ok,true);
 c.approvedIntent.ownerRewriteSourceIds=['foreign:unknown'];check.equal(validate(c).ok,false);
});

await test('reviewed brands permit professional fonts, colours and gradients only with contrast and explicit permission',()=>{
 const c=fixture();c.approvedIntent.allowBrandChange=true;c.document.brand=copy(validBrand);c.document.pages[0].sections[0].layout.background='gradient';check.equal(validate(c).ok,true);check.ok(creativeDocumentContrast(validBrand.palette.ink,validBrand.palette.paper)>=4.5);check.ok(creativeDocumentColours(validBrand,'gradient'));
 check.match(creativeDocumentColours(validBrand,'gradient').background,/deg in srgb,/,'The contrast bound and actual browser interpolation use the same defined colour space');
 for(const mutate of [brand=>{brand.headingFont='external-font-url';},brand=>{brand.palette.ink='#FAFAF4';},brand=>{brand.palette.muted='#EEEEEE';},brand=>{brand.gradient.from='url(javascript:bad)';},brand=>{brand.gradient.angle=Infinity;}]){const next=fixture();next.approvedIntent.allowBrandChange=true;next.document.brand=copy(validBrand);mutate(next.document.brand);check.equal(validate(next).ok,false);}
 const inherited=fixture();inherited.document.pages[0].sections[0].layout.background='accent';check.equal(validate(inherited).ok,false,'Unchanged-brand colour contrast cannot be guessed');check.deepEqual(creativeDocumentColours(null,'ink'),{background:'var(--ink)',color:'var(--paper)',muted:'var(--paper)'});
});

await test('grid/stack/group/list grammar produces genuine compositional freedom within bounded readable geometry',()=>{
 const c=fixture(),section=c.document.pages[0].sections[0],description=c.copy('business:description');section.nodes.push({id:'flexible-grid',type:'grid',columns:[7,5],gap:40,mobileColumns:1,mobileGap:20,align:'start',children:[{id:'left-stack',type:'stack',gap:24,children:[{id:'left-rule',type:'divider',weight:2},{id:'left-copy',type:'text',copy:description,size:18,measure:45}]},{id:'right-group',type:'group',padding:32,background:'ink',children:[{id:'source-list',type:'list',items:[c.copy('service:services:service-0:title'),c.copy('service:services:service-1:title')],ordered:true}]}]});
 const r=compile(c);check.equal(r.ok,true,r.reason);const model=websiteCreativeDocumentSection(r.draft,r.draft.sections.find(section=>section.type==='creative-document'));check.ok(model);check.deepEqual(model.nodes.at(-1).columns,[7,5]);check.equal(model.nodes.at(-1).children[1].children[0].items[0].text,'Brand direction');
});

await test('deep, oversized, duplicate and malformed geometry is rejected without stack exhaustion',()=>{
 for(const mutate of [c=>{c.document.pages[0].sections[0].nodes[0].size=500;},c=>{c.document.pages[0].sections[0].nodes[1].size=12;},c=>{c.document.pages[0].sections[0].nodes[1].measure=300;},c=>{c.document.pages[0].sections[0].nodes.push(copy(c.document.pages[0].sections[0].nodes[0]));},c=>{c.document.pages[0].sections[0].layout.paddingX='1;position:fixed';}]){const c=fixture();mutate(c);check.equal(validate(c).ok,false);}
 const c=fixture();let node={id:'deep-leaf',type:'divider',weight:1};for(let i=0;i<1000;i++)node={id:'deep-'+i,type:'stack',gap:8,children:[node]};c.document.pages[0].sections[0].nodes.push(node);check.doesNotThrow(()=>validate(c));check.equal(validate(c).ok,false);
});

await test('each designed page needs exactly one H1 and useful factual depth; no empty page count padding',()=>{
 for(const mutate of [c=>{c.document.pages[0].sections[0].nodes[0].level=2;},c=>{c.document.pages[0].sections[0].nodes.push({...copy(c.document.pages[0].sections[0].nodes[0]),id:'second-h1'});},c=>{c.document.pages[0].sections[0].nodes=c.document.pages[0].sections[0].nodes.filter(node=>node.type!=='text');}]){const c=fixture();mutate(c);check.equal(validate(c).ok,false);}
});

await test('new purposeful pages use canonical original routes and preserve unrelated owner pages',()=>{
 const c=fixture(),page=copy(c.document.pages[0]);page.pageId='page-creative-approach';page.purpose='information';page.sections[0].id='custom-creative-approach';for(const node of page.sections[0].nodes)node.id='approach-'+node.id;c.document.pages.push(page);c.document.navigation.items.push(page.pageId);
 c.approvedIntent.allowNewPages=false;check.equal(validate(c).ok,false);c.approvedIntent.allowNewPages=true;
 // Existing fixture has seven pages, so one new purposeful page stays below ten.
 let r=compile(c);check.equal(r.ok,true,r.reason);check.ok(r.draft.customPages.some(page=>page.id==='page-creative-approach'));check.equal(websiteCreativeDocumentPageModel(r.draft).pages.find(page=>page.id==='page-creative-approach').outputPath,'pages/creative-approach/index.html');
 const owner=copy(c.website.customPages[0]);owner.id='page-owner-notes';owner.slug='owner-notes';delete owner.sourceServiceId;delete owner.sourceServiceSnapshot;c.website.customPages.push(owner);c.website.pages.push({...owner,enabled:true,path:'/pages/owner-notes',outputPath:'pages/owner-notes/index.html'});c.document.navigation.items.push(owner.id);const reserved=copy(page);reserved.pageId=owner.id;c.document.pages.push(reserved);check.equal(validate(c).ok,false);
});

await test('only explicitly permitted, unedited engine pages may be retired and original data is retained',()=>{
 const c=fixture(),page=c.website.pages.find(page=>page.sourceServiceId);c.document.removePageIds=[page.id];c.document.navigation.items=c.document.navigation.items.filter(id=>id!==page.id);check.equal(validate(c).ok,false);c.approvedIntent.allowRetireAiPages=true;const r=compile(c);check.equal(r.ok,true,r.reason);check.ok(!websiteCreativeDocumentPageModel(r.draft).pages.some(current=>current.id===page.id));check.deepEqual(r.draft.sections.find(section=>section.id==='services'),c.website.sections.find(section=>section.id==='services'));
 c.website.sections.find(section=>section.id===page.sectionIds[0]).ownerEditedFields=['body'];check.equal(validate(c).ok,false);
});

await test('protected owner wording must remain visibly exact; source references, alt and SEO alone do not count',()=>{
 const c=fixture(),nodes=c.document.pages[0].sections[0].nodes;nodes.splice(nodes.findIndex(node=>node.type==='link'),1);check.equal(validate(c).ok,false);c.document.pages[0].description=c.copy('section:hero:cta');check.equal(validate(c).ok,false);
 c.approvedIntent.ownerRewriteSourceIds=['section:hero:cta'];check.equal(validate(c).ok,true);
 const wrong=fixture();wrong.document.pages[0].sections[0].nodes.find(node=>node.type==='link').target.pageId='services';check.equal(validate(wrong).ok,false,'Preserve an approved destination with its protected action label');
 const inert=fixture(),index=inert.document.pages[0].sections[0].nodes.findIndex(node=>node.type==='link');inert.document.pages[0].sections[0].nodes[index]={id:'inert-action',type:'text',copy:inert.copy('section:hero:cta'),size:18,measure:40};check.equal(validate(inert).ok,false,'A protected clickable owner action cannot become inert text');
});

await test('locked sections cannot be hidden behind a new page binding or globally rebranded',()=>{
 const c=fixture();c.website.theme.lockedSections=['hero'];check.equal(validate(c).ok,false);c.website.theme.lockedSections=['about'];c.approvedIntent.allowBrandChange=true;c.document.brand=copy(validBrand);check.equal(validate(c).ok,false);
});

await test('original menu sections retain exact record identities, prices and authority rather than becoming editable AI facts',()=>{
 const c=fixture(1),menu=copy(c.document.pages[0]);menu.pageId='products';menu.purpose='menu';menu.title=c.copy('section:products:title');menu.description=c.copy('section:hero:body');menu.sections[0].id='custom-creative-menu-opening';menu.sections[0].nodes.forEach(node=>node.id='menu-'+node.id);menu.sections.push({sourceSectionId:'products'});c.document.pages.push(menu);const r=compile(c);check.equal(r.ok,true,r.reason);check.deepEqual(r.draft.sections.find(section=>section.id==='products'),c.website.sections.find(section=>section.id==='products'));check.ok(websiteCreativeDocumentPageModel(r.draft).pages.find(page=>page.id==='products').sectionIds.includes('products'));
 c.document.pages.at(-1).sections.push({sourceSectionId:'products'});check.equal(validate(c).ok,false);
});

await test('photographs require exact original identity, current permission, honest alt text and no duplicated filler',()=>{
 const c=fixture(0),asset=c.website.sections.find(section=>section.type==='gallery').items[0],ref={storagePath:asset.storagePath,revision:asset.revision,sha256:asset.sha256},image={id:'source-photo',type:'image',asset:ref,alt:c.copy('photo:'+asset.sha256+':alt'),ratio:1.4,fit:'cover',focal:{x:35,y:65}};c.document.pages[0].sections[0].nodes.push(image);check.equal(validate(c).ok,true);check.equal(websiteCreativeDocumentAsset(c.website,ref),asset);
 for(const change of [a=>{a.revision++;},a=>{a.sha256='f'.repeat(64);},a=>{a.storagePath='foreign/photo';}]){const bad=copy(ref);change(bad);check.equal(websiteCreativeDocumentAsset(c.website,bad),null);}
 c.document.pages[0].sections[0].nodes.push({...copy(image),id:'duplicate-photo'});check.equal(validate(c).ok,false);c.document.pages[0].sections[0].nodes.pop();asset.status='withdrawn';check.equal(validate(c).ok,false);
});

await test('current source ownership/revisions remain authoritative against fabricated facts and foreign data',()=>{
 for(const mutate of [c=>{c.document.pages[0].sections[0].nodes[1].copy.text='We have won 15 awards and guarantee success.';},c=>{c.document.pages[0].sections[0].nodes[1].copy.sourceRefs[0].revision--;},c=>{c.document.pages[0].sections[0].nodes[1].copy.sourceRefs[0].id='foreign:source';},c=>{c.website.business_id='foreign';},c=>{c.website.sections.find(section=>section.id==='services').items[0].body+=' Changed source.';}]){const c=fixture();mutate(c);check.equal(validate(c).ok,false);}
});

await test('compiled rows are the original editable copy authority and later owner text is rendered without stale model wording',()=>{
 const c=fixture(),r=compile(c);check.equal(r.ok,true);const section=r.draft.sections.find(section=>section.type==='creative-document'),row=section.items.find(item=>item.id==='creative-introduction');check.equal(section.creativeDocument.nodes[1].copy,undefined);check.equal(section.creativeDocument.nodes[1].copyId,row.id);
 const edit=applyStructuredWebsiteEdit(r.draft,{sectionId:section.id,itemId:row.id,field:'body',value:'Our owner-approved words include a < b and a > c as literal text.'});check.equal(edit.applied,true,edit.reason);const displayed=websiteCreativeDocumentSection(edit.draft,edit.draft.sections.find(current=>current.id===section.id));check.ok(displayed);check.equal(displayed.nodes[1].copy.text,'Our owner-approved words include a < b and a > c as literal text.');check.equal(displayed.nodes[1].copy.classification,'owner-authored');const catalog=websiteCreativeCopyCatalog(edit.draft);check.ok(catalog.sources.some(source=>source.id==='owner-copy:'+section.id+':'+row.id+':body'&&source.ownerProtected));
});

await test('stored rendering metadata is independently revalidated before unsafe geometry, nodes or changed source can render',()=>{
 const c=fixture(),original=compile(c);check.equal(original.ok,true);
 for(const mutate of [d=>{d.sections.find(section=>section.type==='creative-document').creativeDocument.layout.paddingX='0;position:fixed';},d=>{d.sections.find(section=>section.type==='creative-document').creativeDocument.nodes[0].size=1000;},d=>{d.sections.find(section=>section.type==='creative-document').creativeDocument.nodes[0].type='script';},d=>{d.creativeDocumentPageModel.scope.businessId='foreign';},d=>{d.sections.find(section=>section.id==='hero').title='Changed approved source';},d=>{d.sections.find(section=>section.type==='creative-document').items[0].body='Mutated unreviewed callback text';}]){const d=copy(original.draft);mutate(d);check.equal(websiteCreativeDocumentSection(d,d.sections.find(section=>section.type==='creative-document')),null);}
});
await test('identical creative output with fresh source revisions is recorded as a no-op rather than a new design',()=>{
 const c=fixture(),r=applyWebsitePageChange(c.website,{action:'apply-site-creative-document',expectedWebsiteId:c.website.id,expectedBusinessId:c.businessId,expectedGeneration:c.website.generation,expectedProfileRevision:c.profileRevision,document:c.document,approvedIntent:c.approvedIntent});check.equal(r.applied,true,r.reason);
 const next={...c,website:r.draft,...mission19MinimalCreativeDocument({...c,website:r.draft})};const same=compile(next);check.equal(same.ok,false);check.match(same.reason,/unchanged|already present/);
});
await test('page title and search-description provenance remain current independently of visible section nodes',()=>{
 const c=fixture(),r=compile(c);check.equal(r.ok,true);check.ok(websiteCreativeDocumentPageModel(r.draft));
 r.draft.sections.find(section=>section.id==='hero').body='A newly approved business introduction.';check.equal(websiteCreativeDocumentPageModel(r.draft),null,'A stale page description cannot outlive its exact original source');
});
await test('paired mutable copy mirrors cannot manufacture approved claims under unchanged original provenance',()=>{
 const c=fixture(),compiled=compile(c);check.equal(compiled.ok,true);
 for(const change of [d=>{const row=d.sections.find(section=>section.type==='creative-document').items[0];row.body='Award-winning global experts since 1982';row.creativeCopy.sourceText=row.body;},d=>{const page=d.creativeDocumentPageModel.pages.find(page=>page.id==='home');page.title='Award-winning experts since 1982';page.copyMetadata.title.text=page.title;},d=>{const row=d.sections.find(section=>section.type==='creative-document').items[0];row.creativeCopy.classification='derived';row.creativeCopy.provenance.classification='derived';row.body='Award-winning global experts since 1982';row.creativeCopy.sourceText=row.body;}]){
  const d=copy(compiled.draft);change(d);check.equal(websiteCreativeDocumentPageModel(d),null,'Current source copy validation, not mutable text mirrors, controls display');
 }
 const fresh=copy(compiled.draft);fresh.generation++;check.ok(websiteCreativeDocumentPageModel(fresh),'A layout-only generation increment retains unchanged approved copy');
});
await test('list IDs reserve enough space for stable editable item suffixes before compilation',()=>{
 const c=fixture(),listNode={id:'l'.repeat(90),type:'list',items:[c.copy('service:services:service-0:title')],ordered:false};c.document.pages[0].sections[0].nodes.push(listNode);const r=compile(c);check.equal(r.ok,true,r.reason);const section=r.draft.sections.find(section=>section.type==='creative-document'),rendered=websiteCreativeDocumentSection(r.draft,section);check.ok(rendered);check.ok(rendered.nodes.at(-1).itemCopyIds[0].length<=100);
 listNode.id='l'.repeat(91);check.equal(validate(c).ok,false);check.equal(websiteCreativeDocumentSchema().$defs.node.anyOf.find(node=>node.properties.type.const==='list').properties.id.maxLength,90);
});
await test('replacing an existing service page retains its exact original service binding and avoids duplicate continuation',()=>{
 const c=fixture(),existing=c.website.pages.find(page=>page.sourceServiceId),service=copy(c.document.pages[0]);service.pageId=existing.id;service.purpose='service-detail';service.sections[0].id='custom-creative-service-detail';service.sections[0].nodes.forEach(node=>node.id='detail-'+node.id);c.document.pages.push(service);
 const edited=applyWebsitePageChange(c.website,{action:'apply-site-creative-document',expectedWebsiteId:c.website.id,expectedBusinessId:c.businessId,expectedGeneration:c.website.generation,expectedProfileRevision:c.profileRevision,document:c.document,approvedIntent:c.approvedIntent});check.equal(edited.applied,true,edited.reason);
 const original=edited.draft.customPages.find(page=>page.id===existing.id);check.equal(original.sourceServiceId,existing.sourceServiceId);check.deepEqual(original.sourceServiceSnapshot,existing.sourceServiceSnapshot);check.equal(edited.draft.pages.filter(page=>page.id===existing.id).length,1);
 const continued=prepareWholeWebsite({...c,website:edited.draft},deps);check.equal(continued.ok,false,'The already prepared original services cannot be recreated under duplicate routes');
});
await test('an original owner-edited or styled composition cannot be hidden by a later new-section proposal',()=>{
 const c=fixture(),r=compile(c);check.equal(r.ok,true);const next={...c,website:r.draft,...mission19MinimalCreativeDocument({...c,website:r.draft})};
 next.website.pages=websiteCreativeDocumentPageModel(next.website).pages;next.website.sections.find(section=>section.type==='creative-document').appearance={bodyFont:'serif'};next.document.pages[0].sections[0].id='custom-creative-replacement';check.equal(validate(next).ok,false);
});

await test('future image briefs are source-grounded nonexecuting metadata, never fake image assets or provider actions',()=>{
 const c=fixture();c.document.imageBriefs=[{id:'future-creative-image',role:'atmosphere',description:c.copy('business:description')}];const r=compile(c);check.equal(r.ok,true,r.reason);check.equal(r.draft.creativeDocumentPageModel.imageBriefs.length,1);check.ok(!r.draft.sections.find(section=>section.type==='creative-document').creativeDocument.nodes.some(node=>node.type==='image'));c.document.imageBriefs[0].providerEnabled=true;check.equal(validate(c).ok,false);
});
console.log('PASS '+cases+' Mission19 creative-document cases; '+assertions+' assertions; zero failures. Original draft compiler, synthetic facts/permissions only; no real model, hosted install, provider call, spend or publication.');
