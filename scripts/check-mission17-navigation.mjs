import assert from 'node:assert/strict';
import {websiteSiteNavigationPlan,renderWebsiteSiteNavigation,siteNavigationCss} from '../supabase/functions/busy-website-worker/websiteSiteNavigation.mjs';
import {mission16Fixture} from './lib/mission16-site-fixtures.mjs';
import {prepareWholeWebsite} from '../src/core/wholeWebsitePlan.mjs';
import {applyWebsitePageChange,renderWebsiteHtml} from '../src/domain/websiteBuilder.js';
const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const clone=x=>JSON.parse(JSON.stringify(x));
function context(index=0,pageId='home'){
 const c=mission16Fixture(index),r=prepareWholeWebsite(c,{pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml});assert.equal(r.ok,true,r.reason);
 const draft=clone(r.candidate);draft.sitePresentation='purposeful-v1';const page=draft.pages.find(p=>p.id===pageId)||draft.pages.find(p=>p.sourceServiceId),prefix='../'.repeat(page.outputPath.split('/').length-1);
 return {draft,page,items:draft.navigation.map(item=>({id:item.id,label:item.label,href:prefix+draft.pages.find(p=>p.id===item.id).outputPath})),escapeHtml:escape};
}
let passed=0;
function check(label,fn){fn();passed++;console.log('PASS '+label);}
check('ten-route landscape navigation has five primary destinations and one exact service hierarchy',()=>{
 const c=context(),before=JSON.stringify(c),p=websiteSiteNavigationPlan(c),html=renderWebsiteSiteNavigation(c);
 assert.equal(p.primary.length,5);assert.equal(p.services.length,5);assert.deepEqual(p.primary.map(x=>x.id),c.items.filter(x=>!p.services.some(s=>s.id===x.id)).map(x=>x.id));
 assert.deepEqual(p.services.map(x=>x.label),c.items.filter(x=>p.services.some(s=>s.id===x.id)).map(x=>x.label));
 const ordered=clone(c);ordered.escapeHtml=escape;ordered.items=[...ordered.items.slice(0,5),...ordered.items.slice(5).reverse()];assert.deepEqual(websiteSiteNavigationPlan(ordered).services.map(x=>x.id),ordered.items.slice(5).map(x=>x.id));
 assert.equal(JSON.stringify(c),before);assert.match(html,/<details class="site-nav-group/);assert.match(html,/<details class="nav-mobile-details site-nav-mobile">/);assert.match(html,/site-nav-overview/);assert.ok(!/<script|\bon\w+=|javascript:/i.test(html));assert.ok(!/\bid=/.test(html));
 for(const item of c.items){assert.equal(html.split('href="'+escape(item.href)+'"').length-1,2,'Every original route remains available in desktop/mobile navigation');}
});
check('current nested page and exact owner navigation wording survive',()=>{
 const c=context(0,'page-garden-maintenance');c.items.find(x=>x.id==='services').label='Garden services';c.items.find(x=>x.id==='contact').label='Discuss our garden';const html=renderWebsiteSiteNavigation(c),p=websiteSiteNavigationPlan(c);
 assert.equal(p.groupCurrent,true);const studio=context(2,'page-brand-direction'),studioHtml=renderWebsiteSiteNavigation(studio);assert.equal((studioHtml.match(/site-nav-group-current\" open/g)||[]).length,1,'Current studio service opens only the desktop sidebar context');assert.match(html,/Garden services, current section/);assert.match(html,/Discuss our garden/);assert.equal((html.match(/aria-current="page"/g)||[]).length,2);assert.match(html,/href="\.\.\/\.\.\/pages\/garden-maintenance\/index.html"/);
});
check('different business families use the same current route authority without industry templates',()=>{
 for(const i of [1,2]){const c=context(i),p=websiteSiteNavigationPlan(c),html=renderWebsiteSiteNavigation(c);assert.equal(p.services.length,3);assert.ok(html);assert.equal(p.primary.find(x=>x.id==='services').label,c.items.find(x=>x.id==='services').label);}
 assert.ok(!/^\+/m.test(siteNavigationCss));assert.match(siteNavigationCss,/min-height:44px/);assert.match(siteNavigationCss,/min-height:48px/);assert.match(siteNavigationCss,/focus-visible/);assert.match(siteNavigationCss,/direction-studio-index/);assert.match(siteNavigationCss,/position:static/);
});
check('owner-authored extra pages are retained as primary routes, never guessed service children',()=>{
 const c=context(),r=applyWebsitePageChange(c.draft,{action:'create-page',title:'Our community notes',body:'Exact owner-authored source.'});assert.equal(r.applied,true);c.draft=r.draft;c.page=c.draft.pages.find(p=>p.id==='home');c.items=c.draft.navigation.map(x=>({id:x.id,label:x.label,href:c.draft.pages.find(p=>p.id===x.id).outputPath}));const p=websiteSiteNavigationPlan(c);
 assert.equal(p.services.length,5);assert.equal(p.primary.at(-1).label,'Our community notes');
});
check('legacy and insufficient service sources retain the existing renderer path',()=>{
 const c=context();delete c.draft.sitePresentation;assert.equal(renderWebsiteSiteNavigation(c),null);c.draft.sitePresentation='unreviewed-random';assert.equal(renderWebsiteSiteNavigation(c),null);
 const minimal=context();minimal.draft.customPages=[];assert.equal(renderWebsiteSiteNavigation(minimal),null);
});
check('foreign, stale, absent and ambiguous source identities cannot establish a service group',()=>{
 for(const change of [c=>{c.draft.business_id='foreign';},c=>{c.draft.pages.find(p=>p.sourceServiceId).sourceServiceSnapshot={title:'Wrong source',body:'Wrong source'};},c=>{const p=clone(c.draft.customPages[0]),view=clone(c.draft.pages.find(x=>x.id===p.id));p.id='page-duplicate';p.slug='duplicate';view.id=p.id;view.path='/pages/duplicate';view.outputPath='pages/duplicate/index.html';c.draft.customPages.push(p);c.draft.pages.push(view);c.items.push({id:p.id,label:view.title,href:view.outputPath});},c=>{c.draft.sections.find(s=>s.id==='services').items[0].body+=' New approved fact.';},c=>{delete c.draft.customPages[0].sourceServiceSnapshot;},c=>{c.draft.pages.push(clone(c.draft.pages[0]));},c=>{c.items.push(clone(c.items[0]));},c=>{c.items.pop();},c=>{c.draft.pages.find(p=>p.sourceServiceId).sourceServiceId='foreign';}]){const c=context();change(c);assert.equal(renderWebsiteSiteNavigation(c),null);}
});
check('unsafe, wrong-page, absolute and signed hrefs never receive invented replacements',()=>{
 for(const href of ['javascript:alert(1)','https://unreviewed.example.invalid/','https://preview.example.invalid/?signed=fixture','../other/index.html','/services','index.html#contact','%2e%2e/index.html']){const c=context();c.items[1].href=href;assert.equal(renderWebsiteSiteNavigation(c),null);}
 const c=context();c.items[1].label='<svg onload=alert(1)>';const html=renderWebsiteSiteNavigation(c);assert.match(html,/&lt;svg/);assert.ok(!html.includes('<svg'));
});
check('original signed preview resolver preserves exact scoped URLs without inventing authority',()=>{
 const c=context(),base='https://preview.example.invalid/storage/v1/object/sign/private/current-deployment/',urls=Object.fromEntries(c.draft.pages.map(p=>[p.id,base+p.outputPath+'?token=synthetic-'+p.id]));c.pageHref=id=>urls[id];c.items=c.items.map(item=>({...item,href:urls[item.id]}));const before=JSON.stringify(c.items),html=renderWebsiteSiteNavigation(c);assert.ok(html);assert.equal(JSON.stringify(c.items),before);for(const item of c.items)assert.ok(html.includes('href="'+escape(item.href)+'"'));
 for(const bad of ['https://foreign.example.invalid/storage/v1/object/sign/private/current-deployment/services/index.html?token=synthetic','https://preview.example.invalid/storage/v1/object/sign/private/foreign-deployment/services/index.html?token=synthetic','https://user:password@preview.example.invalid/storage/v1/object/sign/private/current-deployment/services/index.html?token=synthetic']){const changed={...c,items:c.items.map(item=>item.id==='services'?{...item,href:bad}:item),pageHref:id=>id==='services'?bad:urls[id]};assert.equal(renderWebsiteSiteNavigation(changed),null);}
 assert.equal(renderWebsiteSiteNavigation({...c,pageHref:()=>{throw Error('Changed resolver');}}),null);
});
check('original private renderer uses the reviewed hierarchy and retains its existing legacy and editable paths',()=>{
 const c=context(),html=renderWebsiteHtml(c.draft,'home',{standalone:true}),nested=renderWebsiteHtml(c.draft,c.draft.pages.find(p=>p.sourceServiceId).id,{standalone:true});
 assert.match(html,/<details class="site-nav-group/);assert.match(html,/<details class="nav-mobile-details site-nav-mobile">/);assert.match(nested,/href="\.\.\/\.\.\/services\/index.html"/);
 const legacy=clone(c.draft);delete legacy.sitePresentation;const flat=renderWebsiteHtml(legacy,'home',{standalone:true});assert.ok(!flat.includes('class="site-nav-group'));assert.match(flat,/<details class="nav-mobile-details"><summary>Menu/);
 const editable=renderWebsiteHtml(c.draft,'home',{editablePreview:true});assert.ok(!editable.includes('class="site-nav-group'));assert.ok(editable.includes('href="#services"'));
});
console.log('PASS '+passed+' current-source navigation cases; no route/data mutation, provider call, hosted change, publication or aesthetic acceptance claimed.');
