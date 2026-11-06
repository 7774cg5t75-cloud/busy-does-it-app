import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {buildWebsiteDraft,applyWebsitePageChange,applyWebsiteLayoutChange,renderWebsiteHtml,rebuildPrivateWebsiteDraft} from '../src/domain/websiteBuilder.js';
import {buildWebsitePageModel} from '../src/domain/websiteManagement.js';
import {prepareWholeWebsite} from '../src/core/wholeWebsitePlan.mjs';
import {mission16Fixture} from './lib/mission16-site-fixtures.mjs';
import {websiteCreativeCopyCatalog} from '../supabase/functions/busy-website-worker/websiteCreativeCopy.mjs';
import {compileWebsiteCreativeDocument,websiteCreativeDocumentPageModel,creativeDocumentContrast} from '../supabase/functions/busy-website-worker/websiteCreativeDocument.mjs';
import {renderWebsiteCreativeDocument,websiteCreativeDocumentSite,websiteCreativeDocumentCss,websiteCreativeDocumentUnavailableHtml,WEBSITE_CREATIVE_FONT_PROVENANCE} from '../supabase/functions/busy-website-worker/websiteCreativeDocumentRendering.mjs';
import {creativeWebsiteClasses} from '../supabase/functions/busy-website-worker/websiteCreativeRendering.mjs';
import {deterministicWebsiteCreativeSpecification} from '../supabase/functions/busy-website-worker/websiteCreativeSpecification.mjs';
import {websiteOwnerTextPresentation} from '../supabase/functions/busy-website-worker/websiteTextTypography.mjs';
import {originalWebsiteSectionRuntime} from './lib/original-website-section-runtime.mjs';
import {editWebsiteDraftField} from '../src/core/websiteStructuredEditing.mjs';

let cases=0,assertions=0;
const check=new Proxy(assert,{get(target,key){return typeof target[key]==='function'?function(...args){assertions++;return target[key](...args);}:target[key];}});
const test=(name,fn)=>{fn();cases++;console.log('PASS '+name);};
const clone=value=>structuredClone(value),escape=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const main=html=>html.split('<main id="main">')[1].split('</main>')[0];
const brand={headingFont:'georgia',bodyFont:'system-sans',palette:{ink:'#182925',paper:'#F8F7EF',accent:'#365A49',muted:'#58645B'},gradient:{from:'#182925',to:'#365A49',angle:135}};
const intent={version:'busy.website-creative-intent.v1',allowCopySuggestions:true,allowBrandChange:true,allowNewPages:true,allowRetireAiPages:false,ownerRewriteSourceIds:[]};
function fixture(index=2,{inherit=false,photo=false,inner=false}={}){
 const context=mission16Fixture(index),draft=prepareWholeWebsite(context,{pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml}).candidate;
 const catalog=websiteCreativeCopyCatalog(draft),copy=id=>{const source=catalog.sources.find(source=>source.id===id);check.ok(source,id);return {text:source.text,classification:'verbatim',sourceRefs:[{id:source.id,revision:source.revision}]};};
 const nodes=[{id:'opening-grid',type:'grid',columns:[7,5],mobileColumns:1,mobileGap:24,gap:40,align:'end',children:[{id:'opening-title',type:'heading',copy:copy('section:hero:title'),level:1,size:88,mobileSize:44,align:'start'},{id:'opening-stack',type:'stack',gap:24,children:[{id:'opening-copy',type:'text',copy:copy('business:description'),size:20,measure:48},{id:'opening-link',type:'link',copy:copy('section:hero:cta'),target:{pageId:'contact',sectionId:'contact',contactField:null},presentation:'button'}]}]}];
 if(photo){const asset=draft.sections.find(section=>section.type==='hero').asset;nodes.push({id:'opening-image',type:'image',asset:{storagePath:asset.storagePath,revision:asset.revision,sha256:asset.sha256},alt:copy('photo:'+asset.sha256+':alt'),ratio:1.5,fit:'cover',focal:{x:45,y:65}});}
 const pages=[{pageId:'home',title:copy('business:name'),purpose:'home',description:copy('business:description'),sections:[{id:'custom-creative-opening',layout:{maxWidth:1180,paddingX:48,paddingY:64,mobilePaddingX:20,mobilePaddingY:36,gap:40,background:inherit?'paper':'gradient'},nodes}]}];
 if(inner){const page=draft.pages.find(page=>page.sourceServiceId);pages.push({pageId:page.id,title:copy('service:services:'+page.sourceServiceId+':title'),purpose:'service-detail',description:copy('business:description'),sections:[{id:'custom-creative-service',layout:{maxWidth:1040,paddingX:48,paddingY:64,mobilePaddingX:20,mobilePaddingY:36,gap:32,background:'paper'},nodes:[{id:'service-title',type:'heading',copy:copy('service:services:'+page.sourceServiceId+':title'),level:1,size:76,mobileSize:40,align:'start'},{id:'service-body',type:'text',copy:copy('service:services:'+page.sourceServiceId+':body'),size:21,measure:60},{id:'service-contact',type:'link',copy:copy('section:contact:email'),target:{pageId:null,sectionId:null,contactField:'email'},presentation:'button'}]}]});}
 const document={version:'busy.website-creative-document.v2',brand:inherit?null:clone(brand),pages,navigation:{placement:'rail',primaryPageId:'contact',items:draft.pages.map(page=>page.id)},removePageIds:[],imageBriefs:[]};
 const compiled=compileWebsiteCreativeDocument(draft,document,{approvedIntent:intent});check.equal(compiled.ok,true,compiled.reason);
 return {context,draft,document,compiled,candidate:rebuildPrivateWebsiteDraft(compiled.draft)};
}

test('declarative sections render through original website, canonical routes and single-H1 hierarchy',()=>{
 const {candidate,draft}=fixture(2,{inner:true}),before=JSON.stringify(candidate),model=buildWebsitePageModel(candidate);
 check.deepEqual(candidate.pages,model.pages);check.deepEqual(candidate.navigation,model.navigation);check.equal(candidate.pages.length,draft.pages.length);
 for(const id of ['home',candidate.pages.find(page=>page.creativeGenerated&&page.id!=='home').id]){
  const html=renderWebsiteHtml(candidate,id,{standalone:true}),body=main(html);check.match(html,/creative-document-site/);check.match(body,/creative-document-inner/);check.equal((body.match(/<h1\b/g)||[]).length,1);check.ok(!body.includes('inner-page-opening'));check.ok(!body.includes('purpose-service-opening'));check.match(html,/Skip to content/);check.match(html,/<meta name="description"/);
 }
 check.equal(JSON.stringify(candidate),before);check.equal(candidate.publicStatus,'Not published');check.equal(candidate.publish.enabled,false);
});
test('original worker section runtime and native original renderer share exact trusted document markup',()=>{
 const {candidate}=fixture(2),section=candidate.sections.find(section=>section.type==='creative-document'),page=candidate.pages.find(page=>page.id==='home');
 const pageHref=id=>candidate.pages.find(page=>page.id===id).outputPath;
 const native=renderWebsiteCreativeDocument(candidate,section,{pageId:page.id,pageHref}),worker=originalWebsiteSectionRuntime()(candidate,section,{},true,'',true,{pageId:page.id,pageHref});
 check.equal(worker,native);check.ok(main(renderWebsiteHtml(candidate,'home',{standalone:true})).includes(native));
 check.match(native,/--dc-columns:minmax\(0,7fr\) minmax\(0,5fr\)/);check.match(native,/linear-gradient\(135deg/);check.match(native,/href="contact\/index.html#contact"/);
});
test('a designed Menu opening reuses the exact original product authority without a duplicate page opening',()=>{
 const f=fixture(1),document=clone(f.document),catalog=websiteCreativeCopyCatalog(f.draft),copy=id=>{const source=catalog.sources.find(source=>source.id===id);return {text:source.text,classification:'verbatim',sourceRefs:[{id,revision:source.revision}]};};
 document.pages.push({pageId:'products',title:copy('section:products:title'),description:copy('business:description'),purpose:'menu',sections:[{id:'custom-creative-menu-opening',layout:{maxWidth:1160,paddingX:48,paddingY:64,mobilePaddingX:20,mobilePaddingY:32,gap:24,background:'paper'},nodes:[{id:'menu-opening-title',type:'heading',copy:copy('section:products:title'),level:1,size:72,mobileSize:40,align:'start'},{id:'menu-opening-introduction',type:'text',copy:copy('business:description'),size:20,measure:60}]},{sourceSectionId:'products'}]});
 const compiled=compileWebsiteCreativeDocument(f.draft,document,{approvedIntent:intent});check.equal(compiled.ok,true,compiled.reason);const candidate=rebuildPrivateWebsiteDraft(compiled.draft),html=main(renderWebsiteHtml(candidate,'products',{standalone:true}));
 check.equal((html.match(/<h1\b/g)||[]).length,1);check.match(html,/creative-document-inner/);check.ok(!html.includes('purpose-menu-opening'));check.ok(!html.includes('inner-page-opening'));check.match(html,/£9\.50/);check.match(html,/£18\.00/);check.match(html,/Private menu preview\. Ordering is unavailable\./);check.deepEqual(candidate.sections.find(section=>section.id==='products'),f.draft.sections.find(section=>section.id==='products'));
});
test('canonical copy rows remain editable in original Studio and refresh reads the corrected literal',()=>{
 const {candidate}=fixture(2),section=candidate.sections.find(section=>section.type==='creative-document'),row=section.items.find(row=>row.id==='opening-copy');
 const original=main(renderWebsiteHtml(candidate,'home',{editablePreview:true}));check.match(original,/data-busy-edit-section="custom-creative-opening" data-busy-edit-field="body" data-busy-edit-item="opening-copy"/);
 const edited=editWebsiteDraftField(candidate,{sectionId:section.id,itemId:row.id,field:'body',value:'An exact owner correction with <brackets> displayed as text.'});
 check.equal(edited.applied,true,edited.reason);const corrected=edited.draft.sections.find(current=>current.id===section.id)?.items?.find(item=>item.id===row.id);check.equal(corrected.body,'An exact owner correction with <brackets> displayed as text.');
 const html=main(renderWebsiteHtml(edited.draft,'home',{standalone:true}));check.match(html,/An exact owner correction with &lt;brackets&gt; displayed as text\./);check.ok(!html.includes('<brackets>'));
});
test('current original asset identity, owner crop and responsive derivatives are retained',()=>{
 const {candidate}=fixture(0,{photo:true}),section=candidate.sections.find(section=>section.type==='creative-document'),asset=candidate.sections.find(section=>section.type==='gallery').items.find(asset=>asset.sha256===candidate.sections.find(section=>section.type==='hero').asset.sha256);
 asset.appearance={photoFit:'contain',photoCrop:'top',mobilePhotoCrop:'bottom',desktopPhotoCrop:'center'};
 const variants={[asset.storagePath]:'https://assets.example.invalid/approved.jpg',[asset.storagePath+'#640']:'https://assets.example.invalid/approved-640.webp',[asset.storagePath+'#1280']:'https://assets.example.invalid/approved-1280.webp'};
 const html=main(renderWebsiteHtml(candidate,'home',{assetVariants:variants}));check.match(html,/object-fit:contain/);check.match(html,/object-position:center top/);check.match(html,/creative-doc-mobile-crop-bottom/);check.match(html,/creative-doc-desktop-crop-center/);check.match(html,/approved-640.webp 640w/);check.match(html,/loading="eager" fetchpriority="high"/);check.ok(html.includes('alt="'+escape(asset.alt)+'"'));check.equal((html.match(/<img\b/g)||[]).length,1);
 const withdrawn=clone(candidate);withdrawn.sections.find(section=>section.type==='gallery').items.find(item=>item.sha256===asset.sha256).status='withdrawn';check.equal(renderWebsiteCreativeDocument(withdrawn,withdrawn.sections.find(row=>row.id===section.id),{pageId:'home'}),'');
});
test('unknown executable nodes, forged colours and changed source identities fail closed after persistence',()=>{
 const {candidate}=fixture(2),sectionId=candidate.sections.find(section=>section.type==='creative-document').id;
 for(const mutate of [d=>{d.business_id='foreign';},d=>{d.creativeDocumentPageModel.scope.businessId='foreign';},d=>{d.creativeDocumentPageModel.brand.palette.ink='red;display:none';},d=>{d.sections.find(s=>s.id===sectionId).creativeDocument.scope.websiteId='foreign';},d=>{d.sections.find(s=>s.id===sectionId).items[0].creativeCopy.provenance.sources[0].text='Forged source';}]){
  const d=clone(candidate);mutate(d);check.equal(websiteCreativeDocumentSite(d),null);check.equal(renderWebsiteCreativeDocument(d,d.sections.find(s=>s.id===sectionId),{pageId:'home'}),'');
 }
 const tampered=clone(candidate);tampered.sections.find(s=>s.id===sectionId).creativeDocument.nodes[0].type='script';check.equal(renderWebsiteCreativeDocument(tampered,tampered.sections.find(s=>s.id===sectionId),{pageId:'home'}),'');
});
test('changed original wording or withdrawn photographs show a truthful review notice instead of a blank page',()=>{
 for(const [index,change] of [[2,draft=>{draft.sections.find(section=>section.id==='hero').title='Newer exact owner wording';}],[0,draft=>{draft.sections.find(section=>section.type==='gallery').items[0].status='withdrawn';}]]){
  const {candidate}=fixture(index);change(candidate);const before=JSON.stringify(candidate),html=renderWebsiteHtml(candidate,'home',{standalone:true}),body=main(html);
  check.equal(websiteCreativeDocumentSite(candidate),null);check.equal(body,websiteCreativeDocumentUnavailableHtml);check.equal((body.match(/<h1\b/g)||[]).length,1);check.match(body,/Review changed business information or photographs/);check.ok(!/<img\b|<a\b|<button\b|<script\b/.test(body));check.equal(JSON.stringify(candidate),before,'The source-review notice cannot rewrite owner content or save a replacement design');
 }
});
test('original approved typography and platform font provenance survive expressive composition',()=>{
 const {candidate}=fixture(2),hero=candidate.sections.find(section=>section.type==='hero');hero.appearance={titleFont:'mono',titleWeight:'heavy',titleAlign:'center',mobileHeadingScale:'compact',desktopHeadingScale:'large'};
 const html=main(renderWebsiteHtml(candidate,'home',{standalone:true}));check.match(html,/font-family:ui-monospace/);check.match(html,/font-weight:800/);check.match(html,/--dc-owner-mobile-size:clamp\(2.05rem,8vw,3rem\)/);check.match(html,/--dc-owner-desktop-size:clamp\(4.5rem,8vw,8rem\)/);
 const projection=websiteOwnerTextPresentation(hero,'title',1);check.equal(projection.base.fontWeight,800);check.equal(projection.base.textAlign,'center');
 check.equal(Object.keys(WEBSITE_CREATIVE_FONT_PROVENANCE).length,4);for(const record of Object.values(WEBSITE_CREATIVE_FONT_PROVENANCE)){check.ok(record.availability.includes('No ')||record.availability.includes('no '));check.ok(!/https?:|url\(/.test(record.stack));}
});
test('actual original owner appearance operations visibly change selected creative copy and section spacing',()=>{
 const {candidate}=fixture(2),section=candidate.sections.find(section=>section.type==='creative-document'),before=renderWebsiteHtml(candidate,'home',{standalone:true}),original=JSON.stringify(candidate);
 for(const [operation,expected] of [[{action:'item-style',sectionId:section.id,itemId:'opening-title',field:'titleFont',value:'mono'},/font-family:ui-monospace/],[{action:'item-style',sectionId:section.id,itemId:'opening-link',field:'bodyFont',value:'mono'},/creative-doc-link[\s\S]*?font-family:ui-monospace/],[{action:'section-style',sectionId:section.id,field:'sectionSpacing',value:'compact'},/--dc-owner-padding-y:clamp\(28px,4vw,58px\)/],[{action:'section-style',sectionId:section.id,field:'titleAlign',value:'center'},/text-align:center/]]){
  const changed=applyWebsiteLayoutChange(candidate,operation);check.equal(changed.applied,true,changed.reason);const html=renderWebsiteHtml(changed.draft,'home',{standalone:true});check.notEqual(html,before);check.match(main(html),expected);
 }
 check.equal(JSON.stringify(candidate),original);
});
test('list copy styling uses the same original item writer and current canonical owner row',()=>{
 const f=fixture(2),doc=clone(f.document),copy=clone(doc.pages[0].description);doc.pages[0].sections[0].nodes.push({id:'source-list',type:'list',items:[copy],ordered:true});
 const compiled=compileWebsiteCreativeDocument(f.draft,doc,{approvedIntent:intent});check.equal(compiled.ok,true,compiled.reason);const candidate=rebuildPrivateWebsiteDraft(compiled.draft),section=candidate.sections.find(s=>s.type==='creative-document');
 const changed=applyWebsiteLayoutChange(candidate,{action:'item-style',sectionId:section.id,itemId:'source-list-item-0',field:'bodyFont',value:'mono'});check.equal(changed.applied,true,changed.reason);check.match(main(renderWebsiteHtml(changed.draft,'home',{standalone:true})),/<li style="font-family:ui-monospace/);
});
test('model-selected mobile type, columns, gap and section padding reach trusted responsive CSS',()=>{
 const {candidate,document,draft}=fixture(2),original=main(renderWebsiteHtml(candidate,'home',{standalone:true}));check.match(original,/--dc-mobile-size:44px/);check.match(original,/--dc-mobile-columns:repeat\(1,minmax\(0,1fr\)\)/);check.match(original,/--dc-mobile-gap:24px/);check.match(original,/--dc-mobile-padding-x:20px/);check.match(original,/--dc-mobile-padding-y:36px/);
 const alternative=clone(document);alternative.pages[0].sections[0].nodes[0].mobileColumns=2;alternative.pages[0].sections[0].nodes[0].mobileGap=12;alternative.pages[0].sections[0].nodes[0].children[0].mobileSize=36;alternative.pages[0].sections[0].layout.mobilePaddingX=24;alternative.pages[0].sections[0].layout.mobilePaddingY=48;
 const compiled=compileWebsiteCreativeDocument(draft,alternative,{approvedIntent:intent});check.equal(compiled.ok,true,compiled.reason);const html=main(renderWebsiteHtml(rebuildPrivateWebsiteDraft(compiled.draft),'home',{standalone:true}));check.match(html,/--dc-mobile-size:36px/);check.match(html,/--dc-mobile-columns:repeat\(2,minmax\(0,1fr\)\)/);check.match(html,/--dc-mobile-gap:12px/);check.match(html,/--dc-mobile-padding-x:24px/);check.match(html,/--dc-mobile-padding-y:48px/);
});
test('null brand inherits original reviewed fonts and colours without an implicit brand rewrite',()=>{
 const {candidate}=fixture(2,{inherit:true}),site=websiteCreativeDocumentSite(candidate);check.ok(site);check.equal(site.css,'');const html=main(renderWebsiteHtml(candidate,'home',{standalone:true}));check.match(html,/background:var\(--paper\)/);check.match(html,/color:var\(--ink\)/);check.ok(!html.includes('--dc-heading-font:'));
});
test('reviewed navigation placement replaces legacy page-direction geometry and emphasises the exact original primary route',()=>{
 const {candidate}=fixture(2),html=renderWebsiteHtml(candidate,'home',{standalone:true});check.match(html,/creative-document-nav-rail/);check.match(html,/class="site-nav-primary"[^>]*href="contact\/index.html"/);check.match(websiteCreativeDocumentCss,/body\.creative-document-site\{display:block\}/);check.match(websiteCreativeDocumentCss,/body\.creative-document-site>nav\{position:relative/);check.match(websiteCreativeDocumentCss,/creative-document-nav-rail\{padding-left:220px\}/);
});
test('bright accent foregrounds and retained original-page soft surfaces keep readable colours',()=>{
 const f=fixture(2),doc=clone(f.document);doc.brand.palette.accent='#DEFF4F';doc.pages[0].sections[0].layout.background='accent';
 const compiled=compileWebsiteCreativeDocument(f.draft,doc,{approvedIntent:intent});check.equal(compiled.ok,true,compiled.reason);const candidate=rebuildPrivateWebsiteDraft(compiled.draft),site=websiteCreativeDocumentSite(candidate);check.ok(site.css.includes('--soft:'+doc.brand.palette.paper));check.ok(!site.css.includes('--soft:'+doc.brand.palette.muted));
 const html=main(renderWebsiteHtml(candidate,'home',{standalone:true}));check.ok(html.includes('background:#DEFF4F;color:'+doc.brand.palette.ink));const accent=html.match(/--owner-text-accent:(#[A-Fa-f0-9]{6})/)?.[1];check.ok(accent);check.ok(creativeDocumentContrast(accent,doc.brand.palette.accent)>=4.5);
});
test('unrelated original v1 geometry survives a reviewed v2 homepage replacement',()=>{
 const context=mission16Fixture(2),base=prepareWholeWebsite(context,{pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml}).candidate,proposal=deterministicWebsiteCreativeSpecification(base,'Keep my words but redesign the website');
 const reviewed=applyWebsitePageChange(base,{action:'apply-site-creative-specification',specification:proposal.specification,expectedWebsiteId:base.id,expectedGeneration:base.generation,expectedBusinessId:context.businessId,expectedProfileRevision:context.profileRevision});check.equal(reviewed.applied,true,reviewed.reason);
 const v1=reviewed.draft,untouched=v1.pages.find(page=>page.sourceServiceId),before=creativeWebsiteClasses(v1,untouched.id),f=fixture(2),doc=clone(f.document);
 const sourceMap=websiteCreativeCopyCatalog(v1);function rebind(node){for(const field of ['copy','alt'])if(node[field])node[field].sourceRefs=node[field].sourceRefs.map(ref=>({id:ref.id,revision:sourceMap.sources.find(source=>source.id===ref.id).revision}));for(const child of node.children||[])rebind(child);}
 for(const page of doc.pages){for(const field of ['title','description'])page[field].sourceRefs=page[field].sourceRefs.map(ref=>({id:ref.id,revision:sourceMap.sources.find(source=>source.id===ref.id).revision}));for(const section of page.sections)for(const node of section.nodes)rebind(node);}
 const result=compileWebsiteCreativeDocument(v1,doc,{approvedIntent:intent});check.equal(result.ok,true,result.reason);const next=rebuildPrivateWebsiteDraft(result.draft);check.ok(before);check.equal(creativeWebsiteClasses(next,untouched.id),before);check.ok(!next.creativeSpecification.pages.some(page=>page.pageId==='home'));
});
test('same-business factual refresh preserves reviewed sections and owner copy without foreign transfer',()=>{
 const {context,candidate}=fixture(2),refresh=buildWebsiteDraft({businessId:context.businessId,previousDraft:candidate,brandBrain:{websiteBrief:context.profile}});
 check.deepEqual(refresh.creativeDocumentPageModel,candidate.creativeDocumentPageModel);check.deepEqual(refresh.sections.filter(section=>section.type==='creative-document').map(section=>section.items),candidate.sections.filter(section=>section.type==='creative-document').map(section=>section.items));check.match(renderWebsiteHtml(refresh,'home'),/creative-document-inner/);
 const rejected=buildWebsiteDraft({businessId:'foreign',previousDraft:candidate,brandBrain:{websiteBrief:context.profile}});check.equal(Object.hasOwn(rejected,'creativeDocumentPageModel'),false);check.ok(!rejected.sections.some(section=>section.type==='creative-document'));
});
test('responsive, keyboard and contrast support remains explicit, without remote font or script dependencies',()=>{
 check.match(websiteCreativeDocumentCss,/@media\(max-width:720px\)/);check.match(websiteCreativeDocumentCss,/grid-template-columns:var\(--dc-mobile-columns\)/);check.match(websiteCreativeDocumentCss,/:focus-visible/);check.match(websiteCreativeDocumentCss,/min-height:54px/);check.ok(!/url\(|@import|animation:|javascript:/.test(websiteCreativeDocumentCss));check.ok(creativeDocumentContrast(brand.palette.ink,brand.palette.paper)>=4.5);check.ok(creativeDocumentContrast(brand.palette.muted,brand.palette.paper)>=4.5);
});

console.log('PASS '+cases+' Mission19 original creative-document renderer cases, '+assertions+' assertions; zero failures. Actual original native/worker rendering and editable canonical rows; no provider, hosted save, publication or aesthetic acceptance claimed.');
