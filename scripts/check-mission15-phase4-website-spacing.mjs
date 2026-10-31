import assert from 'node:assert/strict';
import fs from 'node:fs';
import {websiteBuilderTestHarnessV3222} from './lib/website-builder-test-harness-v3222.mjs';
import {planWebsitePageInstructions as plan,prepareWebsitePageInstructionPreview as preview} from '../src/core/websitePageInstructions.mjs';
import {prepareSelectedWebsiteTransaction as transact} from '../src/core/websiteContextPlan.mjs';
import {applyWebsiteLayoutOperation as layout} from '../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs';
import {sectionAppearanceClasses} from '../supabase/functions/busy-website-worker/websiteAppearanceClasses.mjs';
const {buildWebsiteDraft,applyWebsiteLayoutChange,applyStructuredWebsiteEdit,renderWebsiteHtml}=websiteBuilderTestHarnessV3222(['buildWebsiteDraft','applyWebsiteLayoutChange','applyStructuredWebsiteEdit','renderWebsiteHtml']);
const draft=buildWebsiteDraft({businessId:'00000000-0000-4000-8000-000000000001',brandBrain:{websiteReady:true,websiteBrief:{businessName:'Fictional studio',services:[{name:'Survey',description:'Discuss first'}],email:'hello@example.test'}}});
// Include the real shared-record section type, not a decorative text stand-in.
draft.sections.push({id:'products',type:'products',enabled:true,title:'Our collection',contentSource:'business_records_v1',contentLayout:'cards'});draft.pages.find(p=>p.id==='home').sectionIds.push('products');
const request=instruction=>({draftId:draft.id,pageId:'home',generation:draft.generation,instruction}),deps={layoutEdit:applyWebsiteLayoutChange,fieldEdit:applyStructuredWebsiteEdit,renderPage:renderWebsiteHtml};
const phrase='give the whole page less space on phones; give the whole page more space on desktop; change hero heading to "Owner heading"';
const p=plan(draft,request(phrase));assert.equal(p.ok,true,p.reason);const before=JSON.stringify(draft);const candidate=transact(draft,p,deps);assert.equal(candidate.applied,true,candidate.reason);assert.equal(JSON.stringify(draft),before);assert.deepEqual(candidate.draft.theme,draft.theme);
for(const section of candidate.draft.sections.filter(s=>s.enabled!==false&&draft.pages.find(p=>p.id==='home').sectionIds.includes(s.id))){assert.equal(section.appearance.mobileSectionSpacing,'compact');assert.equal(section.appearance.desktopSectionSpacing,'generous');assert.equal(section.appearance.sectionSpacing,undefined);}
const html=preview(draft,request(phrase),deps);assert.equal(html.ok,true,html.reason);assert.match(html.candidateHtml,/owner-mobile-space-compact/);assert.match(html.candidateHtml,/owner-desktop-space-generous/);assert.match(html.candidateHtml,/Owner heading/);
const locked={...draft,theme:{...draft.theme,lockedSections:['services']}};assert.equal(transact(locked,plan(locked,request(phrase)),deps).applied,false);assert.equal(layout(draft,{action:'page-spacing',pageId:'home',device:'tablet',value:'compact'}).applied,false);assert.equal(layout(draft,{action:'page-spacing',pageId:'home',device:'mobile',value:'900px'}).applied,false);
assert.equal(plan(draft,request('give page less space on phones; give page more space on phones')).ok,false);
const spaced=layout(draft,{action:'page-spacing',pageId:'home',device:'mobile',value:'compact'});assert.equal(spaced.applied,true);assert.equal(layout(spaced.draft,{action:'page-spacing',pageId:'home',device:'mobile',value:'compact'}).applied,false);
assert.doesNotMatch(sectionAppearanceClasses({appearance:{mobileSectionSpacing:'url(secret)'}}),/secret/);
const css=fs.readFileSync('supabase/functions/busy-website-worker/designSystem.mjs','utf8'),phone=css.slice(css.lastIndexOf('@media(max-width:600px)'),css.lastIndexOf('@media(min-width:960px)')),desktop=css.slice(css.lastIndexOf('@media(min-width:960px)'));
assert.match(phone,/owner-mobile-space-compact/);assert.doesNotMatch(phone,/owner-desktop-space/);assert.match(desktop,/owner-desktop-space-generous/);assert.doesNotMatch(desktop,/owner-mobile-space/);
console.log('PASS original coordinated page transaction/rendered HTML for phone/desktop spacing, scoped finite CSS, original branding, no mutation/partial lock bypass, duplicate/no-op guards. Source/HTML evidence, no browser layout measurement.');

assert.match(html.candidateHtml,/<section id="products" class="[^"]*owner-mobile-space-compact/);
assert.equal(fs.readFileSync('src/core/businessContentHtml.mjs','utf8'),fs.readFileSync('supabase/functions/_shared/businessContentHtml.mjs','utf8'));
